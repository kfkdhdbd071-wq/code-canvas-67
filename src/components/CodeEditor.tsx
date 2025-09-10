import { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // VS Code dark theme
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "html" | "css" | "javascript";
  placeholder?: string;
}

const CodeEditor = ({ value, onChange, language, placeholder }: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState("");
  const [currentLine, setCurrentLine] = useState(1);

  useEffect(() => {
    const grammar = language === "html" ? Prism.languages.markup : 
                   language === "css" ? Prism.languages.css : 
                   Prism.languages.javascript;
    
    if (grammar) {
      const highlightedCode = Prism.highlight(value, grammar, language);
      setHighlighted(highlightedCode);
    }
  }, [value, language]);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current && lineNumbersRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    // Update current line based on cursor position
    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const lineNumber = textBeforeCursor.split('\n').length;
    setCurrentLine(lineNumber);
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = textareaRef.current.value.substring(0, cursorPosition);
      const lineNumber = textBeforeCursor.split('\n').length;
      setCurrentLine(lineNumber);
    }
  };

  const getLineNumbers = () => {
    const lines = value.split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1);
  };

  return (
    <div className="relative h-full flex">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-12 bg-gray-800 border-r border-gray-600 overflow-hidden"
        style={{ lineHeight: "1.5" }}
      >
        <div className="p-4 pr-2 font-mono text-sm text-gray-400">
          {getLineNumbers().map((lineNum) => (
            <div
              key={lineNum}
              className={`text-right ${lineNum === currentLine ? 'text-white bg-gray-700' : ''}`}
              style={{ height: "1.5em" }}
            >
              {lineNum}
            </div>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative flex-1">
        <pre
          ref={preRef}
          className="absolute inset-0 p-4 m-0 font-mono text-sm pointer-events-none overflow-auto whitespace-pre-wrap break-words"
          style={{
            background: "rgb(45, 45, 45)",
            color: "rgb(212, 212, 212)",
            lineHeight: "1.5",
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onScroll={handleScroll}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          className="absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none border-0 bg-transparent text-transparent caret-white focus:outline-none selection:bg-blue-500/30"
          style={{
            lineHeight: "1.5",
            background: "transparent",
          }}
          dir="ltr"
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 right-0 bg-gray-800 text-gray-300 px-2 py-1 text-xs font-mono border-l border-t border-gray-600">
        السطر {currentLine}
      </div>
    </div>
  );
};

export default CodeEditor;