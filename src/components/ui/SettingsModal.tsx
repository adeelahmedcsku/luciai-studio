import { useState } from "react";
import { XIcon, CheckIcon } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
}

interface AISettings {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  autoExecuteActions: boolean;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"appearance" | "editor" | "ai">("appearance");
  const { theme, setTheme } = useThemeStore();

  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    autoSave: true,
    formatOnSave: true,
  });

  const [aiSettings, setAISettings] = useState<AISettings>({
    provider: "ollama",
    model: "codellama",
    temperature: 0.7,
    maxTokens: 2048,
    autoExecuteActions: false,
  });

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem("editor-settings", JSON.stringify(editorSettings));
    localStorage.setItem("ai-settings", JSON.stringify(aiSettings));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-4 space-y-1">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "appearance"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-secondary"
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "editor"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-secondary"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "ai"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-secondary"
              }`}
            >
              AI Agent
            </button>
          </div>

          {/* Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["light", "dark", "system"].map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption as any)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          theme === themeOption
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">
                            {themeOption}
                          </span>
                          {theme === themeOption && (
                            <CheckIcon className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {themeOption === "system"
                            ? "Match system theme"
                            : `Use ${themeOption} theme`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Color Scheme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border-2 border-primary bg-primary/5 rounded-lg">
                      <div className="font-medium mb-2">Blue (Default)</div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded"></div>
                        <div className="w-8 h-8 bg-blue-600 rounded"></div>
                        <div className="w-8 h-8 bg-blue-700 rounded"></div>
                      </div>
                    </div>
                    <div className="p-4 border-2 border-border hover:border-primary/50 rounded-lg cursor-pointer">
                      <div className="font-medium mb-2">Purple</div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-purple-500 rounded"></div>
                        <div className="w-8 h-8 bg-purple-600 rounded"></div>
                        <div className="w-8 h-8 bg-purple-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Editor Tab */}
            {activeTab === "editor" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Font Size
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={editorSettings.fontSize}
                    onChange={(e) =>
                      setEditorSettings({
                        ...editorSettings,
                        fontSize: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>10px</span>
                    <span>{editorSettings.fontSize}px</span>
                    <span>24px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tab Size
                  </label>
                  <div className="flex space-x-3">
                    {[2, 4, 8].map((size) => (
                      <button
                        key={size}
                        onClick={() =>
                          setEditorSettings({ ...editorSettings, tabSize: size })
                        }
                        className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                          editorSettings.tabSize === size
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {size} spaces
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "wordWrap", label: "Word Wrap", description: "Wrap long lines" },
                    { key: "minimap", label: "Minimap", description: "Show code minimap" },
                    { key: "lineNumbers", label: "Line Numbers", description: "Show line numbers" },
                    { key: "autoSave", label: "Auto Save", description: "Save files automatically" },
                    { key: "formatOnSave", label: "Format On Save", description: "Auto-format when saving" },
                  ].map((setting) => (
                    <label
                      key={setting.key}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/30 cursor-pointer"
                    >
                      <div>
                        <div className="font-medium">{setting.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {setting.description}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editorSettings[setting.key as keyof EditorSettings] as boolean}
                        onChange={(e) =>
                          setEditorSettings({
                            ...editorSettings,
                            [setting.key]: e.target.checked,
                          })
                        }
                        className="w-5 h-5"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tab */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    AI Provider
                  </label>
                  <select
                    value={aiSettings.provider}
                    onChange={(e) =>
                      setAISettings({ ...aiSettings, provider: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="ollama">Ollama (Local)</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model
                  </label>
                  <select
                    value={aiSettings.model}
                    onChange={(e) =>
                      setAISettings({ ...aiSettings, model: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="codellama">CodeLlama</option>
                    <option value="deepseek-coder">DeepSeek Coder</option>
                    <option value="llama3">Llama 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Temperature: {aiSettings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiSettings.temperature}
                    onChange={(e) =>
                      setAISettings({
                        ...aiSettings,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) =>
                      setAISettings({
                        ...aiSettings,
                        maxTokens: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    min="256"
                    max="8192"
                  />
                </div>

                <label className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/30 cursor-pointer">
                  <div>
                    <div className="font-medium">Auto-Execute Actions</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically execute file creation and commands
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiSettings.autoExecuteActions}
                    onChange={(e) =>
                      setAISettings({
                        ...aiSettings,
                        autoExecuteActions: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
