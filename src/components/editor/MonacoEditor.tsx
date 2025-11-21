import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "../ui/NotificationToast";
import { SaveIcon, FileIcon, SearchIcon } from "lucide-react";
import FindReplace from "./FindReplace";
import { useAdvancedEditorFeatures } from "./AdvancedEditorFeatures";

interface MonacoEditorProps {
  filePath: string;
  language: string;
  onSave?: (content: string) => void;
}

export default function MonacoEditor({
  filePath,
  language,
  onSave,
}: MonacoEditorProps) {
  const [content, setContent] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Load file content
  useEffect(() => {
    loadFile();
  }, [filePath]);

  const loadFile = async () => {
    try {
      const fileContent = await invoke<string>("read_file", {
        path: filePath,
      });
      setContent(fileContent);
      setIsModified(false);
    } catch (error) {
      console.error("Failed to load file:", error);
      toast.error("Failed to load file", error as string);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      lineNumbers: "on",
      renderWhitespace: "selection",
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      automaticLayout: true,
    });

    // Add keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        saveFile();
      }
    );

    // Add Find & Replace shortcut (Ctrl+F)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
      () => {
        setShowFindReplace(true);
      }
    );

    // Add Find & Replace shortcut (Ctrl+H)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH,
      () => {
        setShowFindReplace(true);
      }
    );

    // Track modifications
    editor.onDidChangeModelContent(() => {
      setIsModified(true);
    });
  };

  // Initialize advanced editor features
  useAdvancedEditorFeatures({
    editor: editorRef.current,
    monaco: monacoRef.current,
  });

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };

  const saveFile = async () => {
    if (!isModified) return;

    setIsSaving(true);
    try {
      await invoke("write_file", {
        path: filePath,
        content: content,
      });
      
      setIsModified(false);
      toast.success("File saved", filePath.split("/").pop() || "");
      onSave?.(content);
    } catch (error) {
      console.error("Failed to save file:", error);
      toast.error("Failed to save file", error as string);
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguage = () => {
    // Map file extensions to Monaco languages
    const ext = filePath.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rs: "rust",
      go: "go",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      php: "php",
      rb: "ruby",
      sh: "shell",
      bash: "shell",
      json: "json",
      xml: "xml",
      html: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      less: "less",
      md: "markdown",
      sql: "sql",
      yaml: "yaml",
      yml: "yaml",
      toml: "toml",
      ini: "ini",
      txt: "plaintext",
    };

    return languageMap[ext || ""] || language || "plaintext";
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center space-x-2">
          <FileIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {filePath.split("/").pop()}
          </span>
          {isModified && (
            <span className="w-2 h-2 bg-primary rounded-full" title="Modified" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            className="flex items-center space-x-2 px-3 py-1 rounded transition-colors bg-secondary hover:bg-secondary/80"
            title="Find & Replace (Ctrl+F)"
          >
            <SearchIcon className="w-4 h-4" />
            <span className="text-sm">Find</span>
          </button>
          
          <button
            onClick={saveFile}
            disabled={!isModified || isSaving}
            className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
              isModified
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            <SaveIcon className="w-4 h-4" />
            <span className="text-sm">
              {isSaving ? "Saving..." : "Save"}
            </span>
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getLanguage()}
          value={content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly: false,
            domReadOnly: false,
          }}
        />
      </div>

      {/* Find & Replace Dialog */}
      {showFindReplace && editorRef.current && monacoRef.current && (
        <FindReplace
          editor={editorRef.current}
          monaco={monacoRef.current}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-secondary/50 text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Language: {getLanguage()}</span>
          <span>
            {content.split("\n").length} lines
          </span>
          <span>
            {content.length} characters
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {isModified && (
            <span className="text-primary">Modified</span>
          )}
          <span>UTF-8</span>
          <span className="text-muted-foreground">
            Ctrl+F: Find • Ctrl+H: Replace
          </span>
        </div>
      </div>
    </div>
  );
}
