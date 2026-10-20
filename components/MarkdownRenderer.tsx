"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
  isStreaming?: boolean;
  className?: string;
}

export function MarkdownRenderer({
  content,
  isUser = false,
  isStreaming = false,
  className = "",
}: MarkdownRendererProps) {
  if (!content) {
    return isStreaming ? (
      <span className="inline-block w-1.5 h-3.5 ml-1 bg-rose-400 animate-pulse align-middle shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
    ) : null;
  }

  return (
    <div
      className={`text-sm leading-relaxed ${
        isUser ? "text-white" : "text-zinc-200"
      } ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => (
            <p
              className={`mb-2 last:mb-0 leading-relaxed font-normal ${
                isStreaming ? "last:inline" : ""
              }`}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong
              className={`font-semibold ${
                isUser ? "text-white drop-shadow-sm" : "text-zinc-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              }`}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em
              className={`italic font-serif tracking-wide ${
                isUser ? "text-pink-100" : "text-rose-200/90"
              }`}
            >
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-2 pl-3 my-2 italic py-1 rounded-r ${
                isUser
                  ? "border-white/80 text-pink-100 bg-white/10"
                  : "border-rose-500/70 text-zinc-300 bg-rose-950/20"
              }`}
            >
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClassName, ...props }: any) => {
            const isCodeBlock = !props.inline && typeof children === "string" && children.includes("\n");
            if (isCodeBlock) {
              return (
                <code className="text-xs font-mono text-zinc-200" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`px-1.5 py-0.5 rounded text-xs font-mono border ${
                  isUser
                    ? "bg-black/30 text-pink-100 border-white/20"
                    : "bg-black/60 text-rose-300 border-white/10"
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-black/80 border border-white/15 p-3 rounded-xl my-2 overflow-x-auto text-xs font-mono text-zinc-200 shadow-inner">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-1.5 text-zinc-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-1.5 text-zinc-200">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-rose-300 mt-2 mb-1 border-b border-white/10 pb-0.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-rose-300 mt-2 mb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mt-1.5 mb-1">
              {children}
            </h3>
          ),
          hr: () => <hr className="border-white/10 my-2.5" />,
          del: ({ children }) => (
            <del className="line-through opacity-65">{children}</del>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 underline underline-offset-2 hover:text-rose-300 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 ml-1 bg-rose-400 animate-pulse align-middle shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
      )}
    </div>
  );
}

export default MarkdownRenderer;
