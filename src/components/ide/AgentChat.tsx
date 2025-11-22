import React, { useState, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, StopCircle } from 'lucide-react';
import { useNotificationStore } from '../ui/NotificationToast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotificationStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from project info
      const context = {
        projectId,
        projectType,
        techStack: techStack?.join(', ') || 'Unknown',
      };

      // Simulate API call with context
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const assistantId = generateId();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: `I understand you want: "${input}". Let me help you with that in your ${context.projectType} project.`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Message processed successfully',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to process message',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}>
      {/* Header with Project Info */}
      {projectId && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-400">
            Project: <span className="text-gray-200 font-semibold">{projectType}</span>
          </p>
          {techStack && techStack.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Stack: <span className="text-gray-200">{techStack.join(', ')}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <Bot className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Chat Assistant</h2>
            <p className="text-gray-400">Start a conversation to get help</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-xs lg:max-w-md ${
                msg.role === 'user'
                  ? 'bg-blue-600 rounded-l-lg rounded-tr-lg'
                  : 'bg-gray-700 rounded-r-lg rounded-tl-lg'
              } p-3`}
            >
              {msg.role === 'assistant' && <Bot className="w-5 h-5 flex-shrink-0 mt-1" />}
              <p className="text-sm">{msg.content}</p>
              {msg.role === 'user' && <User className="w-5 h-5 flex-shrink-0 mt-1" />}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-r-lg rounded-tl-lg p-3 flex gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <Send className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}