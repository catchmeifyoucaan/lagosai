import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight, themes } from 'prism-react-renderer';

interface MarkdownRendererProps {
  content: string;
  darkMode: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, darkMode }) => {
  return (
    <ReactMarkdown
      className="prose prose-sm dark:prose-invert max-w-none"
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          const codeText = String(children).replace(/\n$/, '');

          if (!match) {
            return (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          }

          return (
            <Highlight
              theme={darkMode ? themes.vsDark : themes.vsLight}
              code={codeText}
              language={match[1]}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={className} style={style}>
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;