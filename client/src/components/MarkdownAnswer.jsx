import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from './MermaidDiagram';
import './MarkdownAnswer.css';

// Shows an AI answer written in Markdown, like ChatGPT does.
// A ```mermaid block becomes the diagram card.
function MarkdownAnswer({ text, question }) {
  return (
    <div className="md-answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const language = /language-(\w+)/.exec(className || '')?.[1];
            const content = String(children).replace(/\n$/, '');

            if (language === 'mermaid') {
              return <MermaidDiagram chart={content} title={question} />;
            }
            if (language || content.includes('\n')) {
              return (
                <pre className="md-code">
                  <code>{content}</code>
                </pre>
              );
            }
            return <code className="md-inline-code">{children}</code>;
          },
          table: ({ children }) => (
            <div className="md-table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownAnswer;