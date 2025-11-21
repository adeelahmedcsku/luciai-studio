import { useState } from "react";
import { XIcon, SettingsIcon, CodeIcon, BotIcon, PaletteIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<"editor" | "ai" | "appearance">("editor");

  if (!isOpen) return null;

  const handleSave = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-2">
            <button
              onClick={() => setActiveTab("editor")}
              className={`w-full px-4 py-2 rounded-lg text-left flex items-center space-x-2 transition-colors ${
                activeTab === "editor"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              <CodeIcon className="w-4 h-4" />
              <span className="text-sm">Editor</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`w-full px-4 py-2 rounded-lg text-left flex items-center space-x-2 transition-colors ${
                activeTab === "ai"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              <BotIcon className="w-4 h-4" />
              <span className="text-sm">AI Agent</span>
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full px-4 py-2 rounded-lg text-left flex items-center space-x-2 transition-colors ${
                activeTab === "appearance"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              <PaletteIcon className="w-4 h-4" />
              <span className="text-sm">Appearance</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "editor" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Editor Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Font Size
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="10"
                          max="24"
                          value={settings.editorFontSize}
                          onChange={(e) =>
                            updateSettings({ editorFontSize: parseInt(e.target.value) })
                          }
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {settings.editorFontSize}px
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tab Size
                      </label>
                      <select
                        value={settings.editorTabSize}
                        onChange={(e) =>
                          updateSettings({ editorTabSize: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={8}>8 spaces</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium">Auto Save</label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Automatically save files after changes
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({ autoSave: !settings.autoSave })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.autoSave ? "bg-primary" : "bg-secondary"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.autoSave ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {settings.autoSave && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Auto Save Delay (ms)
                        </label>
                        <input
                          type="number"
                          min="500"
                          max="5000"
                          step="500"
                          value={settings.autoSaveDelay}
                          onChange={(e) =>
                            updateSettings({ autoSaveDelay: parseInt(e.target.value) })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">AI Agent Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        LLM Model
                      </label>
                      <select
                        value={settings.llmModel}
                        onChange={(e) =>
                          updateSettings({ llmModel: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="deepseek-coder-v2:33b">
                          DeepSeek Coder V2 33B (Recommended)
                        </option>
                        <option value="qwen2.5-coder:32b">
                          Qwen 2.5 Coder 32B
                        </option>
                        <option value="starcoder2:15b">
                          StarCoder2 15B (Lightweight)
                        </option>
                        <option value="codellama:34b">
                          CodeLlama 34B
                        </option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-2">
                        You need to pull this model in Ollama first
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Temperature
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.llmTemperature}
                          onChange={(e) =>
                            updateSettings({ llmTemperature: parseFloat(e.target.value) })
                          }
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {settings.llmTemperature.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower = more focused, Higher = more creative
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="512"
                        max="8192"
                        step="512"
                        value={settings.llmMaxTokens}
                        onChange={(e) =>
                          updateSettings({ llmMaxTokens: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum length of generated responses
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-300">
                        💡 <strong>Tip:</strong> Use DeepSeek Coder V2 for best results.
                        Lower temperature (0.3-0.5) for production code, higher (0.7-0.9)
                        for exploration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => updateSettings({ theme: "light" })}
                          className={`p-4 border-2 rounded-lg transition-colors ${
                            settings.theme === "light"
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm font-medium">Light</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => updateSettings({ theme: "dark" })}
                          className={`p-4 border-2 rounded-lg transition-colors ${
                            settings.theme === "dark"
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm font-medium">Dark</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => updateSettings({ theme: "system" })}
                          className={`p-4 border-2 rounded-lg transition-colors ${
                            settings.theme === "system"
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-900 border border-gray-300 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm font-medium">System</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Theme changes will be applied after restart.
                      </p>
                    </div>
                  </div>
                </div>
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
