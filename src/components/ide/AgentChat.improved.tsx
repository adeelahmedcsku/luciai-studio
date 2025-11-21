import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Code, Sparkles, StopCircle } from 'lucide-react';
import { useLLM } from '../../hooks/useLLM';
import { detectTask, getSystemPrompt } from '../../utils/SystemPrompts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  projectId?: string;
  className?: string;
}

export default function AgentChat({ projectId, className = '' }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Hi! I'm your AI coding assistant. I can help you:\n\n" +
        "• Generate complete code projects\n" +
        "• Write functions and components\n" +
        "• Fix bugs and errors\n" +
        "• Review and improve code\n" +
        "• Explain complex code\n" +
        "• Add new features\n\n" +
        "What would you like to build today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-coder-v2:16b');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const { isGenerating, availableModels, isConnected, checkStatus, generateStream } = useLLM();

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  useEffect(() => {
    // Check connection on mount
    checkStatus();
  }, [checkStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    if (!isConnected) {
      alert('Ollama is not running. Please start Ollama and try again.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setCurrentResponse('');

    // Detect task type and get appropriate system prompt
    const task = detectTask(input);
    const systemPrompt = getSystemPrompt(task);

    try {
      const cleanup = await generateStream(
        {
          model: selectedModel,
          prompt: input.trim(),
          system_prompt: systemPrompt,
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          onStart: () => {
            setCurrentResponse('');
          },
          onChunk: (chunk) => {
            setCurrentResponse((prev) => prev + chunk);
          },
          onDone: (fullText) => {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: fullText,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setCurrentResponse('');
          },
          onError: (error) => {
            console.error('Generation error:', error);
            const errorMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `❌ Error: ${error}\n\nPlease make sure Ollama is running and try again.`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setCurrentResponse('');
          },
        }
      );

      cleanupRef.current = cleanup;
    } catch (error) {
      console.error('Failed to start generation:', error);
    }
  };

  const handleStop = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (currentResponse) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: currentResponse + '\n\n[Generation stopped]',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentResponse('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">AI Agent</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          >
            {availableModels.length > 0 ? (
              availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({model.size})
                </option>
              ))
            ) : (
              <option value="deepseek-coder-v2:16b">deepseek-coder-v2:16b</option>
            )}
          </select>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={isConnected ? 'Connected to Ollama' : 'Ollama disconnected'}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100 border border-gray-700'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {message.content}
              </pre>
              <div className="mt-2 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming Response */}
        {currentResponse && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-[80%] rounded-lg p-4 bg-gray-800 text-gray-100 border border-gray-700">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {currentResponse}
              </pre>
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        {!isConnected && (
          <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-300 text-sm">
            ⚠️ Ollama is not running. Start Ollama with: <code>ollama serve</code>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? 'Describe what you want to build... (Shift+Enter for new line)'
                : 'Please start Ollama first...'
            }
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
            disabled={isGenerating || !isConnected}
          />
          <div className="flex flex-col gap-2">
            {isGenerating ? (
              <button
                onClick={handleStop}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors h-full"
              >
                <StopCircle className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !isConnected}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors h-full"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'Create a todo app',
            'Explain this code',
            'Fix this bug',
            'Add authentication',
            'Optimize performance',
          ].map((tip) => (
            <button
              key={tip}
              onClick={() => setInput(tip)}
              className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
              disabled={isGenerating}
            >
              {tip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
