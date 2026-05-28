import { useState } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";

// Register only the languages we expect to see. Each `import` is one
// language definition — this is much smaller than the default `Prism`
// import that pulls in every language Prism supports.
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import jsx        from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import tsx        from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import python     from "react-syntax-highlighter/dist/esm/languages/prism/python";
import bash       from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json       from "react-syntax-highlighter/dist/esm/languages/prism/json";
import css        from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup     from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import sql        from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import go         from "react-syntax-highlighter/dist/esm/languages/prism/go";
import rust       from "react-syntax-highlighter/dist/esm/languages/prism/rust";

SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js",         javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts",         typescript);
SyntaxHighlighter.registerLanguage("jsx",        jsx);
SyntaxHighlighter.registerLanguage("tsx",        tsx);
SyntaxHighlighter.registerLanguage("python",     python);
SyntaxHighlighter.registerLanguage("py",         python);
SyntaxHighlighter.registerLanguage("bash",       bash);
SyntaxHighlighter.registerLanguage("sh",         bash);
SyntaxHighlighter.registerLanguage("shell",      bash);
SyntaxHighlighter.registerLanguage("json",       json);
SyntaxHighlighter.registerLanguage("css",        css);
SyntaxHighlighter.registerLanguage("html",       markup);
SyntaxHighlighter.registerLanguage("xml",        markup);
SyntaxHighlighter.registerLanguage("sql",        sql);
SyntaxHighlighter.registerLanguage("go",         go);
SyntaxHighlighter.registerLanguage("rust",       rust);
SyntaxHighlighter.registerLanguage("rs",         rust);

/**
 * Theme — keyed to our app palette (electric lime / mint / coral). Prism
 * applies these via classnames like `.token.keyword` etc., so we define a
 * style object that react-syntax-highlighter consumes.
 */
const theme = {
  'pre[class*="language-"]': {
    margin: 0,
    background: "transparent",
    fontSize: "0.83rem",
    fontFamily: "var(--font-mono)",
    lineHeight: 1.6,
    color: "#ecebf3",
  },
  'code[class*="language-"]': {
    fontFamily: "var(--font-mono)",
    background: "transparent",
    color: "#ecebf3",
  },
  comment:            { color: "#6a6988", fontStyle: "italic" },
  prolog:             { color: "#6a6988" },
  doctype:            { color: "#6a6988" },
  cdata:              { color: "#6a6988" },
  punctuation:        { color: "#9897b6" },
  property:           { color: "#6ed7ff" },
  tag:                { color: "#ff6e7f" },
  boolean:            { color: "#ff6e7f" },
  number:             { color: "#a78bfa" },
  constant:           { color: "#a78bfa" },
  symbol:             { color: "#a78bfa" },
  selector:           { color: "#5eecb4" },
  "attr-name":        { color: "#5eecb4" },
  string:             { color: "#c6f76d" },
  char:               { color: "#c6f76d" },
  builtin:            { color: "#6ed7ff" },
  operator:           { color: "#9897b6" },
  entity:             { color: "#ff6e7f", cursor: "help" },
  url:                { color: "#5eecb4" },
  variable:           { color: "#ecebf3" },
  "attr-value":       { color: "#c6f76d" },
  keyword:            { color: "#ff6e7f", fontStyle: "italic" },
  "atrule":           { color: "#a78bfa" },
  "attr-equals":      { color: "#9897b6" },
  function:           { color: "#6ed7ff" },
  "class-name":       { color: "#5eecb4" },
  regex:              { color: "#c6f76d" },
  important:          { color: "#ff6e7f", fontWeight: "bold" },
  bold:               { fontWeight: "bold" },
  italic:             { fontStyle: "italic" },
};

/**
 * Renders one fenced ```lang code block. Used as the `code` component
 * override for react-markdown.
 *
 * - Headers show the detected language + a copy button
 * - Inline code (no `lang`, no newline) falls back to a simple <code>
 */
export default function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  const lang  = match?.[1];
  const raw   = String(children).replace(/\n$/, "");

  if (inline || !match) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-base-soft/70 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      <CodeHeader lang={lang} raw={raw} />
      <div className="px-4 py-3 overflow-x-auto">
        <SyntaxHighlighter
          language={lang}
          style={theme}
          PreTag="pre"
          wrapLongLines={false}
          customStyle={{ background: "transparent", padding: 0, margin: 0 }}
        >
          {raw}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function CodeHeader({ lang, raw }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {/* clipboard might be blocked — fail silently */}
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface/60">
      <span className="kicker !text-fg-dim">
        <span className="text-lime">▸</span> {lang ?? "code"}
      </span>
      <button
        type="button"
        onClick={copy}
        className="font-mono text-[0.66rem] uppercase tracking-[0.18em]
                   text-fg-dim hover:text-lime transition-colors duration-150
                   border border-border hover:border-lime/60 rounded-md
                   px-2 py-0.5"
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
