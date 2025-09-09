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
  const [highlighted, setHighlighted] = useState("");

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
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative h-full">
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
  );
};

export default CodeEditor;