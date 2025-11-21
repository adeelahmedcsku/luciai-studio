import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SendIcon, BotIcon, UserIcon, LoaderIcon, CodeIcon, CheckCircleIcon } from "lucide-react";
import { AgentActionParser, AgentAction } from "../../utils/AgentActionParser";
import { toast } from "../ui/NotificationToast";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  actions?: AgentAction[];
  actionsExecuted?: boolean;
}

interface AgentChatProps {
  projectId: string;
  projectType: string;
  techStack: string[];
}

export default function AgentChat({ projectId, projectType, techStack }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: `Hello! I'm your AI development agent. I'm here to help you build your ${projectType} project using ${techStack.join(", ")}. What would you like to create?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Call the agent
      const response = await invoke("send_prompt", {
        prompt: {
          project_id: projectId,
          user_message: input,
          context: {
            project_type: projectType,
            tech_stack: techStack,
            existing_files: [],
            previous_prompts: messages
              .filter((m) => m.role === "user")
              .map((m) => m.content)
              .slice(-5), // Last 5 prompts for context
          },
        },
      });

      const responseContent = (response as any).message || "I've processed your request.";
      
      // Parse actions from the response
      const actions = AgentActionParser.parseActions(responseContent);

      const agentMessage: Message = {
        id: Date.now().toString() + "-agent",
        role: "agent",
        content: responseContent,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
        actionsExecuted: false,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Agent error:", error);
      
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        role: "agent",
        content: `I encountered an error: ${error}. Please make sure Ollama is running with a coding model installed.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const executeActions = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.actions || message.actionsExecuted) return;

    toast.info("Executing actions", `${message.actions.length} action(s)`);

    const result = await AgentActionParser.executeActions(
      message.actions,
      projectId,
      (current, total, msg) => {
        // Progress callback
        console.log(`[${current}/${total}] ${msg}`);
      }
    );

    // Update message to mark actions as executed
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, actionsExecuted: true } : m
      )
    );

    // Show summary
    if (result.successCount > 0) {
      toast.success(
        "Actions completed",
        `${result.successCount} succeeded, ${result.failCount} failed`
      );
    } else {
      toast.error("All actions failed", `${result.failCount} failed`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center space-x-2">
          <BotIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Agent</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Describe what you want to build or modify
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex space-x-2 max-w-[80%] ${
                message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {message.role === "user" ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <BotIcon className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex-1">
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Action Buttons */}
                {message.role === "agent" && message.actions && message.actions.length > 0 && (
                  <div className="mt-2 px-1">
                    <div className="flex items-center space-x-2">
                      <CodeIcon className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {message.actions.length} action(s) detected
                      </span>
                    </div>
                    {!message.actionsExecuted ? (
                      <button
                        onClick={() => executeActions(message.id)}
                        className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
                      >
                        Execute Actions
                      </button>
                    ) : (
                      <div className="mt-2 flex items-center space-x-2 text-green-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="text-xs">Actions executed</span>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <BotIcon className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div className="px-4 py-2 rounded-lg bg-secondary">
                <div className="flex items-center space-x-2">
                  <LoaderIcon className="w-4 h-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to build..."
            rows={3}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
