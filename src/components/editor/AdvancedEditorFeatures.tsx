import { useEffect, useRef } from "react";

interface AdvancedEditorFeaturesProps {
  editor: any;
  monaco: any;
}

/**
 * Adds advanced features to Monaco Editor including:
 * - Multi-cursor editing
 * - Advanced code folding
 * - Bracket matching and navigation
 * - Smart selection
 * - Quick suggestions
 */
export function useAdvancedEditorFeatures({
  editor,
  monaco,
}: AdvancedEditorFeaturesProps) {
  const actionsRegistered = useRef(false);

  useEffect(() => {
    if (!editor || !monaco || actionsRegistered.current) return;
    actionsRegistered.current = true;

    // Register custom actions
    registerMultiCursorActions(editor, monaco);
    registerCodeFoldingActions(editor, monaco);
    registerNavigationActions(editor, monaco);
    registerSelectionActions(editor, monaco);

    // Configure advanced editor options
    editor.updateOptions({
      // Multi-cursor
      multiCursorModifier: "ctrlCmd",
      multiCursorPaste: "spread",
      
      // Code folding
      folding: true,
      foldingStrategy: "indentation",
      foldingHighlight: true,
      showFoldingControls: "always",
      
      // Bracket matching
      matchBrackets: "always",
      bracketPairColorization: {
        enabled: true,
      },
      
      // Smart features
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: "on",
      
      // Selection
      selectOnLineNumbers: true,
      selectionHighlight: true,
      occurrencesHighlight: true,
      
      // Minimap
      minimap: {
        enabled: true,
        showSlider: "mouseover",
        renderCharacters: true,
        maxColumn: 120,
      },
      
      // Scrolling
      smoothScrolling: true,
      mouseWheelZoom: true,
      
      // Formatting
      formatOnPaste: true,
      formatOnType: true,
      autoIndent: "full",
      
      // Other
      codeLens: true,
      contextmenu: true,
      copyWithSyntaxHighlighting: true,
      dragAndDrop: true,
      links: true,
      colorDecorators: true,
    });

    return () => {
      // Cleanup if needed
    };
  }, [editor, monaco]);

  return null;
}

function registerMultiCursorActions(editor: any, monaco: any) {
  // Add cursor above (Ctrl+Alt+Up)
  editor.addAction({
    id: "editor.action.insertCursorAbove",
    label: "Add Cursor Above",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.insertCursorAbove", {});
    },
  });

  // Add cursor below (Ctrl+Alt+Down)
  editor.addAction({
    id: "editor.action.insertCursorBelow",
    label: "Add Cursor Below",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.insertCursorBelow", {});
    },
  });

  // Select all occurrences (Ctrl+Shift+L)
  editor.addAction({
    id: "editor.action.selectHighlights",
    label: "Select All Occurrences",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.selectHighlights", {});
    },
  });

  // Add selection to next find match (Ctrl+D)
  editor.addAction({
    id: "editor.action.addSelectionToNextFindMatch",
    label: "Add Selection to Next Find Match",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.addSelectionToNextFindMatch", {});
    },
  });

  // Insert cursor at end of each line selected (Shift+Alt+I)
  editor.addAction({
    id: "editor.action.insertCursorAtEndOfEachLineSelected",
    label: "Add Cursors to Line Ends",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyI,
    ],
    run: (ed: any) => {
      const selections = ed.getSelections();
      if (!selections || selections.length === 0) return;

      const newSelections = [];
      for (const selection of selections) {
        const startLine = selection.startLineNumber;
        const endLine = selection.endLineNumber;

        for (let line = startLine; line <= endLine; line++) {
          const lineContent = ed.getModel().getLineContent(line);
          const endColumn = lineContent.length + 1;
          newSelections.push({
            selectionStartLineNumber: line,
            selectionStartColumn: endColumn,
            positionLineNumber: line,
            positionColumn: endColumn,
          });
        }
      }

      ed.setSelections(newSelections);
    },
  });
}

function registerCodeFoldingActions(editor: any, monaco: any) {
  // Fold all (Ctrl+K Ctrl+0)
  editor.addAction({
    id: "editor.foldAll",
    label: "Fold All",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0,
    ],
    run: (ed: any) => {
      ed.trigger("fold", "editor.foldAll", {});
    },
  });

  // Unfold all (Ctrl+K Ctrl+J)
  editor.addAction({
    id: "editor.unfoldAll",
    label: "Unfold All",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ,
    ],
    run: (ed: any) => {
      ed.trigger("fold", "editor.unfoldAll", {});
    },
  });

  // Fold recursively (Ctrl+K Ctrl+[)
  editor.addAction({
    id: "editor.foldRecursively",
    label: "Fold Recursively",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketLeft,
    ],
    run: (ed: any) => {
      ed.trigger("fold", "editor.foldRecursively", {});
    },
  });

  // Unfold recursively (Ctrl+K Ctrl+])
  editor.addAction({
    id: "editor.unfoldRecursively",
    label: "Unfold Recursively",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketRight,
    ],
    run: (ed: any) => {
      ed.trigger("fold", "editor.unfoldRecursively", {});
    },
  });
}

function registerNavigationActions(editor: any, monaco: any) {
  // Go to bracket (Ctrl+Shift+\)
  editor.addAction({
    id: "editor.action.jumpToBracket",
    label: "Go to Bracket",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Backslash,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.jumpToBracket", {});
    },
  });

  // Go to line (Ctrl+G)
  editor.addAction({
    id: "editor.action.gotoLine",
    label: "Go to Line",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.gotoLine", {});
    },
  });

  // Go to definition (F12)
  editor.addAction({
    id: "editor.action.revealDefinition",
    label: "Go to Definition",
    keybindings: [monaco.KeyCode.F12],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.revealDefinition", {});
    },
  });

  // Peek definition (Alt+F12)
  editor.addAction({
    id: "editor.action.peekDefinition",
    label: "Peek Definition",
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.F12],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.peekDefinition", {});
    },
  });
}

function registerSelectionActions(editor: any, monaco: any) {
  // Expand selection (Shift+Alt+Right)
  editor.addAction({
    id: "editor.action.smartSelect.expand",
    label: "Expand Selection",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.RightArrow,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.smartSelect.expand", {});
    },
  });

  // Shrink selection (Shift+Alt+Left)
  editor.addAction({
    id: "editor.action.smartSelect.shrink",
    label: "Shrink Selection",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.LeftArrow,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.smartSelect.shrink", {});
    },
  });

  // Select line (Ctrl+L)
  editor.addAction({
    id: "expandLineSelection",
    label: "Select Line",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL],
    run: (ed: any) => {
      ed.trigger("keyboard", "expandLineSelection", {});
    },
  });

  // Copy line up (Shift+Alt+Up)
  editor.addAction({
    id: "editor.action.copyLinesUpAction",
    label: "Copy Line Up",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.copyLinesUpAction", {});
    },
  });

  // Copy line down (Shift+Alt+Down)
  editor.addAction({
    id: "editor.action.copyLinesDownAction",
    label: "Copy Line Down",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.copyLinesDownAction", {});
    },
  });

  // Move line up (Alt+Up)
  editor.addAction({
    id: "editor.action.moveLinesUpAction",
    label: "Move Line Up",
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.UpArrow],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.moveLinesUpAction", {});
    },
  });

  // Move line down (Alt+Down)
  editor.addAction({
    id: "editor.action.moveLinesDownAction",
    label: "Move Line Down",
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.moveLinesDownAction", {});
    },
  });

  // Delete line (Ctrl+Shift+K)
  editor.addAction({
    id: "editor.action.deleteLines",
    label: "Delete Line",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.deleteLines", {});
    },
  });

  // Comment line (Ctrl+/)
  editor.addAction({
    id: "editor.action.commentLine",
    label: "Toggle Line Comment",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.commentLine", {});
    },
  });

  // Block comment (Shift+Alt+A)
  editor.addAction({
    id: "editor.action.blockComment",
    label: "Toggle Block Comment",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyA,
    ],
    run: (ed: any) => {
      ed.trigger("keyboard", "editor.action.blockComment", {});
    },
  });
}

export default useAdvancedEditorFeatures;
