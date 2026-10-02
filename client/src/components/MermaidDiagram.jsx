import { useEffect, useRef, useState } from 'react';

let diagramCounter = 0;
let mermaidPromise = null;

// Downloads the Mermaid library only the first time a diagram is needed.
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid')
      .then((module) => {
        const mermaid = module.default;
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        return mermaid;
      })
      .catch((err) => {
        mermaidPromise = null; // allow a retry if the download failed
        throw err;
      });
  }
  return mermaidPromise;
}

function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chart) return;

    let cancelled = false;
    const id = `mermaid-diagram-${diagramCounter++}`;

    setError('');
    setLoading(true);

    loadMermaid()
      .then((mermaid) => mermaid.render(id, chart))
      .then(({ svg }) => {
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Mermaid render error:', err);
        setLoading(false);
        setError('Could not render diagram for this answer.');
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      {loading && <p className="diagram-loading">Loading diagram…</p>}
      <div className="mermaid-diagram" ref={containerRef} />
      {!loading && (
        <p className="diagram-hint">Swipe sideways to see the full diagram →</p>
      )}
    </>
  );
}

export default MermaidDiagram;