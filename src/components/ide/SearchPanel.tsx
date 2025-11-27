import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SearchIcon, XIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";

interface SearchResult {
    file_path: string;
    line_number: number;
    line_content: string;
    match_start: number;
    match_end: number;
}

interface GroupedResults {
    [filePath: string]: SearchResult[];
}

export default function SearchPanel() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [includePattern, setIncludePattern] = useState("");
    const [excludePattern, setExcludePattern] = useState("**/node_modules/**, **/.git/**");
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const searchResults = await invoke<SearchResult[]>("search_in_project", {
                projectPath: ".", // TODO: Get from context
                query,
                caseSensitive,
                wholeWord,
                useRegex,
                includePattern: includePattern || undefined,
                excludePattern: excludePattern || undefined,
            });
            setResults(searchResults);
            // Auto-expand all files
            setExpandedFiles(new Set(searchResults.map(r => r.file_path)));
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const groupedResults: GroupedResults = results.reduce((acc, result) => {
        if (!acc[result.file_path]) {
            acc[result.file_path] = [];
        }
        acc[result.file_path].push(result);
        return acc;
    }, {} as GroupedResults);

    const toggleFileExpansion = (filePath: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(filePath)) {
            newExpanded.delete(filePath);
        } else {
            newExpanded.add(filePath);
        }
        setExpandedFiles(newExpanded);
    };

    const getFileName = (path: string) => {
        return path.split("/").pop() || path;
    };

    const highlightMatch = (text: string, start: number, end: number) => {
        return (
            <>
                {text.substring(0, start)}
                <span className="bg-yellow-500/30 text-yellow-200">{text.substring(start, end)}</span>
                {text.substring(end)}
            </>
        );
    };

    return (
        <div className="flex flex-col h-full p-3 text-foreground">
            {/* Search Input */}
            <div className="mb-3">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search"
                        className="w-full bg-input border border-border rounded px-3 py-2 text-sm pr-8 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                    <SearchIcon className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>

                {/* Search Options */}
                <div className="flex gap-1 mt-2">
                    <ToggleButton
                        active={caseSensitive}
                        onClick={() => setCaseSensitive(!caseSensitive)}
                        title="Match Case"
                        label="Aa"
                    />
                    <ToggleButton
                        active={wholeWord}
                        onClick={() => setWholeWord(!wholeWord)}
                        title="Match Whole Word"
                        label="Ab"
                    />
                    <ToggleButton
                        active={useRegex}
                        onClick={() => setUseRegex(!useRegex)}
                        title="Use Regular Expression"
                        label=".*"
                    />
                </div>

                {/* Include/Exclude Patterns */}
                <div className="mt-2 space-y-1">
                    <input
                        type="text"
                        value={includePattern}
                        onChange={(e) => setIncludePattern(e.target.value)}
                        placeholder="files to include"
                        className="w-full bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                        type="text"
                        value={excludePattern}
                        onChange={(e) => setExcludePattern(e.target.value)}
                        placeholder="files to exclude"
                        className="w-full bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                </div>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                    {isSearching ? "Searching..." : "Search"}
                </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto text-sm">
                {results.length > 0 && (
                    <div className="mb-2 text-xs text-muted-foreground">
                        {results.length} result{results.length !== 1 ? "s" : ""} in {Object.keys(groupedResults).length} file{Object.keys(groupedResults).length !== 1 ? "s" : ""}
                    </div>
                )}

                {Object.entries(groupedResults).map(([filePath, fileResults]) => (
                    <div key={filePath} className="mb-2">
                        {/* File Header */}
                        <button
                            onClick={() => toggleFileExpansion(filePath)}
                            className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent rounded text-left text-foreground"
                        >
                            {expandedFiles.has(filePath) ? (
                                <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{getFileName(filePath)}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{fileResults.length}</span>
                        </button>

                        {/* File Results */}
                        {expandedFiles.has(filePath) && (
                            <div className="ml-5 mt-1">
                                {fileResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className="px-2 py-1 hover:bg-accent rounded cursor-pointer text-xs"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground flex-shrink-0">{result.line_number}:</span>
                                            <span className="flex-1 font-mono text-foreground">
                                                {highlightMatch(
                                                    result.line_content.trim(),
                                                    result.match_start,
                                                    result.match_end
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {results.length === 0 && query && !isSearching && (
                    <div className="text-center text-muted-foreground mt-8">
                        <p>No results found</p>
                    </div>
                )}

                {!query && (
                    <div className="text-center text-muted-foreground mt-8">
                        <SearchIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Enter search term to find in files</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ToggleButton({
    active,
    onClick,
    title,
    label,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
        px-2 py-1 text-xs font-mono rounded border transition-colors
        ${active
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-input border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }
      `}
        >
            {label}
        </button>
    );
}
