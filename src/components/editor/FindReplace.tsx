import { useState, useEffect } from "react";
import { SearchIcon, XIcon, ReplaceIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface FindReplaceProps {
  editor: any;
  monaco: any;
  onClose: () => void;
}

export default function FindReplace({ editor, monaco, onClose }: FindReplaceProps) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [showReplace, setShowReplace] = useState(false);

  useEffect(() => {
    if (findText) {
      updateMatches();
    } else {
      setTotalMatches(0);
      setCurrentMatch(0);
    }
  }, [findText, matchCase, wholeWord, useRegex]);

  const updateMatches = () => {
    if (!editor || !findText) return;

    const model = editor.getModel();
    if (!model) return;

    const matches = model.findMatches(
      findText,
      true,
      useRegex,
      matchCase,
      wholeWord ? "\\b" : null,
      true
    );

    setTotalMatches(matches.length);
    
    if (matches.length > 0) {
      const currentPos = editor.getPosition();
      let closestMatchIndex = 0;
      let minDistance = Infinity;

      matches.forEach((match: any, index: number) => {
        const distance = Math.abs(match.range.startLineNumber - currentPos.lineNumber);
        if (distance < minDistance) {
          minDistance = distance;
          closestMatchIndex = index;
        }
      });

      setCurrentMatch(closestMatchIndex + 1);
    } else {
      setCurrentMatch(0);
    }
  };

  const findNext = () => {
    if (!editor || !findText) return;

    const action = editor.getAction("actions.find");
    if (action) {
      editor.focus();
      
      // Set find options
      editor.updateOptions({
        find: {
          seedSearchStringFromSelection: false,
          autoFindInSelection: "never",
        },
      });

      // Trigger find with current settings
      const controller = editor.getContribution("editor.contrib.findController");
      if (controller) {
        controller.start({
          forceRevealReplace: false,
          seedSearchStringFromSelection: false,
          shouldFocus: 1,
          shouldAnimate: true,
        });

        const state = controller.getState();
        state.change({
          searchString: findText,
          isRegex: useRegex,
          matchCase: matchCase,
          wholeWord: wholeWord,
        }, false);

        controller.moveToNextMatch();
      }
    }

    setTimeout(updateMatches, 100);
  };

  const findPrevious = () => {
    if (!editor || !findText) return;

    const controller = editor.getContribution("editor.contrib.findController");
    if (controller) {
      controller.start({
        forceRevealReplace: false,
        seedSearchStringFromSelection: false,
        shouldFocus: 1,
        shouldAnimate: true,
      });

      const state = controller.getState();
      state.change({
        searchString: findText,
        isRegex: useRegex,
        matchCase: matchCase,
        wholeWord: wholeWord,
      }, false);

      controller.moveToPrevMatch();
    }

    setTimeout(updateMatches, 100);
  };

  const replaceOne = () => {
    if (!editor || !findText) return;

    const model = editor.getModel();
    if (!model) return;

    const selection = editor.getSelection();
    const selectedText = model.getValueInRange(selection);

    // Check if current selection matches the find text
    const matches = matchCase
      ? selectedText === findText
      : selectedText.toLowerCase() === findText.toLowerCase();

    if (matches || (useRegex && new RegExp(findText).test(selectedText))) {
      editor.executeEdits("replace", [
        {
          range: selection,
          text: replaceText,
        },
      ]);
      findNext();
    } else {
      findNext();
    }

    updateMatches();
  };

  const replaceAll = () => {
    if (!editor || !findText) return;

    const model = editor.getModel();
    if (!model) return;

    const matches = model.findMatches(
      findText,
      true,
      useRegex,
      matchCase,
      wholeWord ? "\\b" : null,
      true
    );

    if (matches.length === 0) return;

    const edits = matches.map((match: any) => ({
      range: match.range,
      text: replaceText,
    }));

    editor.executeEdits("replaceAll", edits);
    updateMatches();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        findPrevious();
      } else {
        findNext();
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      onClose();
      e.preventDefault();
    }
  };

  return (
    <div className="absolute top-0 right-0 z-50 w-96 bg-background border border-border rounded-lg shadow-2xl m-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <SearchIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Find and Replace</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-secondary rounded transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Find Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Find"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={findPrevious}
              disabled={!findText || totalMatches === 0}
              title="Previous match (Shift+Enter)"
            >
              <ChevronUpIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={findNext}
              disabled={!findText || totalMatches === 0}
              title="Next match (Enter)"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Match Counter */}
          {findText && (
            <div className="text-xs text-muted-foreground px-2">
              {totalMatches > 0
                ? `${currentMatch} of ${totalMatches} matches`
                : "No matches found"}
            </div>
          )}
        </div>

        {/* Replace Input */}
        {showReplace && (
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Replace"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={replaceOne}
              disabled={!findText || totalMatches === 0}
              title="Replace one"
            >
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={replaceAll}
              disabled={!findText || totalMatches === 0}
              title="Replace all"
            >
              All
            </Button>
          </div>
        )}

        {/* Options */}
        <div className="flex items-center space-x-4 pt-2 border-t border-border">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-xs">Match Case</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-xs">Whole Word</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-xs">Regex</span>
          </label>
        </div>

        {/* Toggle Replace */}
        <div className="pt-2">
          <button
            onClick={() => setShowReplace(!showReplace)}
            className="flex items-center space-x-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <ReplaceIcon className="w-3 h-3" />
            <span>{showReplace ? "Hide" : "Show"} Replace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
