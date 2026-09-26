import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

let diagramCounter = 0;

function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!chart) return;

    const id = `mermaid-diagram-${diagramCounter++}`;

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
        setError('');
      })
      .catch((err) => {
        console.error('Mermaid render error:', err);
        setError('Could not render diagram for this answer.');
      });
  }, [chart]);

  if (error) return <p className="error-text">{error}</p>;

  return <div className="mermaid-diagram" ref={containerRef} />;
}

export default MermaidDiagram;