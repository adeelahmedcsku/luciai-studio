import React, { useState, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, StopCircle, Copy, Check } from 'lucide-react';
import { useAppStore, Message } from '../../store/useAppStore';
import { useNotificationStore } from '../ui/NotificationToast';
import { AIPairProgrammer } from '../ai/AIPairProgrammer';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { invoke } from '@tauri-apps/api/core';

interface AgentChatProps {
  className?: string;
  projectId?: string;
  projectType?: string;
  techStack?: string[];
}

// Utility function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default function AgentChat({
  className = '',
  projectId,
  projectType,
  techStack
}: AgentChatProps) {
  const { agentMessages, addAgentMessage, pendingAiPrompt, setPendingAiPrompt } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotificationStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [agentMessages]);

  const [programmer] = useState(() => new AIPairProgrammer());

  const processAIResponse = async (response: string) => {
    // 1. Handle File Writes
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
    let match;
    const writeOperations = [];

    while ((match = fileRegex.exec(response)) !== null) {
      writeOperations.push({
        path: match[1],
        content: match[2].trim()
      });
    }

    if (writeOperations.length > 0 && projectId) {
      addNotification({
        type: 'info',
        title: 'Applying Changes',
        message: `Creating/updating ${writeOperations.length} file(s)...`,
        duration: 3000,
      });

      for (const op of writeOperations) {
        try {
          // Construct full path: projectId is the root path
          const fullPath = `${projectId}/${op.path}`;
          await invoke('write_file', {
            path: fullPath,
            content: op.content,
          });
          console.log(`[AgentChat] Wrote file: ${fullPath}`);
        } catch (error) {
          console.error(`[AgentChat] Failed to write file ${op.path}:`, error);
          addNotification({
            type: 'error',
            title: 'File Operation Failed',
            message: `Could not write ${op.path}`,
            duration: 5000,
          });
        }
      }
    }

    // 2. Handle File Reads
    const readRegex = /<read_file path="([^"]+)"\s*\/>/g;
    let readMatch;
    const readOperations = [];

    while ((readMatch = readRegex.exec(response)) !== null) {
      readOperations.push(readMatch[1]);
    }

    if (readOperations.length > 0 && projectId) {
      addNotification({
        type: 'info',
        title: 'Reading Files',
        message: `Reading ${readOperations.length} file(s)...`,
        duration: 2000,
      });

      let fileContext = "";
      for (const path of readOperations) {
        try {
          const fullPath = `${projectId}/${path}`;
          const content = await invoke<string>('read_file', { path: fullPath });
          fileContext += `File content of ${path}:\n\`\`\`\n${content}\n\`\`\`\n\n`;
        } catch (error) {
          console.error(`[AgentChat] Failed to read file ${path}:`, error);
          fileContext += `Failed to read file ${path}: ${error}\n\n`;
        }
      }

      if (fileContext) {
        // Send the file content back to the AI
        const followUpMessage = `I have read the files. Here is the content:\n${fileContext}\n\nPlease proceed with the previous request based on this content.`;

        // Add a visual indicator that we are feeding data back
        const systemMsgId = generateId();
        addAgentMessage({
          id: systemMsgId,
          role: 'user',
          content: `*System: Read ${readOperations.join(', ')} and fed to AI*`,
          timestamp: Date.now()
        });

        setIsLoading(true);
        try {
          const nextResponse = await programmer.sendMessage(followUpMessage, {
            language: projectType,
          });

          // Recursively process the new response (it might write files now)
          await processAIResponse(nextResponse.content);

          const assistantMessage: Message = {
            id: nextResponse.id,
            role: 'assistant',
            content: nextResponse.content,
            timestamp: nextResponse.timestamp.getTime(),
          };
          addAgentMessage(assistantMessage);

        } catch (error) {
          console.error("Failed to send file context to AI:", error);
        }
      }
    }
  };

  // Handle pending AI prompt on mount
  React.useEffect(() => {
    if (pendingAiPrompt) {
      const prompt = pendingAiPrompt;
      setPendingAiPrompt(null); // Clear immediately to prevent double-send

      // Add user message
      const messageId = generateId();
      const userMessage: Message = {
        id: messageId,
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      };

      addAgentMessage(userMessage);
      setIsLoading(true);

      // Trigger AI response
      const fetchResponse = async () => {
        try {
          if (!programmer.getActiveSession()) {
            programmer.startSession();
          }

          const response = await programmer.sendMessage(prompt, {
            language: projectType,
          });

          // Process file operations
          await processAIResponse(response.content);

          const assistantMessage: Message = {
            id: response.id,
            role: 'assistant',
            content: response.content,
            timestamp: response.timestamp.getTime(),
          };

          addAgentMessage(assistantMessage);
        } catch (error) {
          console.error('Error processing initial prompt:', error);
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to process initial project instructions',
            duration: 3000,
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchResponse();
    }
  }, [pendingAiPrompt, projectType, programmer, setPendingAiPrompt, addNotification, projectId, addAgentMessage]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageId = generateId();
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    addAgentMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // Ensure session exists
      if (!programmer.getActiveSession()) {
        programmer.startSession();
      }

      // Call LLM via AIPairProgrammer
      const response = await programmer.sendMessage(input, {
        language: projectType,
      });

      // Process file operations
      await processAIResponse(response.content);

      const assistantMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp.getTime(),
      };

      addAgentMessage(assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to get response from AI',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedModel, setSelectedModel] = useState('local');

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedModel(value);
    if (value === 'local') {
      programmer.setProvider('ollama', 'gemma2:2b');
    } else if (value === 'cloud') {
      programmer.setProvider('gemini', 'gemini-1.5-pro');
    }
  };

  // Custom renderer for code blocks
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return !inline && match ? (
      <div className="relative group rounded-md overflow-hidden my-2">
        <div className="flex justify-between items-center bg-gray-800 px-3 py-1 text-xs text-gray-400 border-b border-gray-700">
          <span>{match[1]}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: '0 0 0.375rem 0.375rem' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={`${className} bg-gray-800 px-1 py-0.5 rounded text-sm`} {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Header with Project Info and Model Selector */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center shrink-0">
        <div>
          {projectId && (
            <>
              <p className="text-xs text-gray-400">
                Project: <span className="text-gray-200 font-semibold">{projectType}</span>
              </p>
              {techStack && techStack.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Stack: <span className="text-gray-200">{techStack.join(', ')}</span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Model:</span>
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="local">Local (Ollama)</option>
            <option value="cloud">Gemini 3 Pro (High)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {agentMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <Bot className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Chat Assistant</h2>
            <p className="text-gray-400">Start a conversation to get help</p>
          </div>
        )}

        {agentMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user'
                ? 'flex-row-reverse'
                : 'flex-row'
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div className={`flex-1 min-w-0 ${msg.role === 'user'
                ? 'bg-blue-600/20 border border-blue-600/30 rounded-2xl rounded-tr-sm px-4 py-3'
                : 'bg-gray-800/50 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3'
                }`}>
                <div className="prose prose-invert prose-sm max-w-none break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: CodeBlock,
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-md font-bold mb-1 mt-2">{children}</h3>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-600 pl-4 italic my-2 text-gray-400">{children}</blockquote>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-gray-400 text-sm animate-pulse">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-700 p-4 bg-gray-900">
        <div className="flex gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-700 resize-none min-h-[50px] max-h-[200px]"
            rows={1}
            style={{ height: 'auto', minHeight: '50px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-all duration-200"
          >
            {isLoading ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-500">AI can make mistakes. Please review generated code.</p>
        </div>
      </div>
    </div>
  );
}