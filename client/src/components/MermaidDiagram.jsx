import { useEffect, useState } from 'react';
import './MermaidDiagram.css';

let diagramCounter = 0;
let mermaidPromise = null;

// Downloads the Mermaid library only the first time a diagram is needed.
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid')
      .then((module) => {
        const mermaid = module.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          htmlLabels: false,
          theme: 'base',
          themeVariables: {
            fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
            fontSize: '15px',
            primaryColor: '#eef2ff',
            primaryBorderColor: '#6366f1',
            primaryTextColor: '#1e1b4b',
            secondaryColor: '#e0e7ff',
            tertiaryColor: '#f8fafc',
            lineColor: '#475569',
            textColor: '#1e293b',
            clusterBkg: '#f5f7ff',
            clusterBorder: '#a5b4fc',
            noteBkgColor: '#fef9c3',
            noteBorderColor: '#facc15',
            noteTextColor: '#422006',
            actorBkg: '#6366f1',
            actorBorder: '#4338ca',
            actorTextColor: '#ffffff',
            actorLineColor: '#a5b4fc',
            signalColor: '#334155',
            signalTextColor: '#1e293b',
          },
          flowchart: {
            htmlLabels: false,
            curve: 'basis',
            nodeSpacing: 40,
            rankSpacing: 45,
            padding: 14,
            useMaxWidth: true,
          },
          sequence: {
            mirrorActors: false,
            actorMargin: 70,
            messageMargin: 40,
            wrap: true,
            useMaxWidth: true,
          },
        });
        return mermaid;
      })
      .catch((err) => {
        mermaidPromise = null; // allow a retry if the download failed
        throw err;
      });
  }
  return mermaidPromise;
}

// Removes hidden blank lines or stray line breaks at the start/end of node labels,
// which make some boxes taller than the others.
function cleanChart(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\[([^\]]*)\]/g, (match, inner) => {
      const trimmed = inner
        .replace(/^(\\n|<br\s*\/?>|\s)+/gi, '')
        .replace(/(\\n|<br\s*\/?>|\s)+$/gi, '');
      return `[${trimmed}]`;
    })
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n');
}

// Turns the question into a file name, e.g. "Explain the layers of the OSI model"
// becomes "the-layers-of-the-osi-model-diagram.png"
function makeFileName(title) {
  const base = (title || '')
    .toLowerCase()
    .replace(
      /^\s*(please\s+)?(explain|describe|discuss|define|draw|what is|what are|write a note on)\s+/i,
      ''
    )
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
  return (base || 'study') + '-diagram.png';
}

function MermaidDiagram({ chart, title }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!chart) return;

    let cancelled = false;
    const id = `mermaid-diagram-${diagramCounter++}`;

    setError('');
    setLoading(true);
    setSvg('');

    loadMermaid()
      .then((mermaid) => mermaid.render(id, cleanChart(chart)))
      .then(({ svg: rendered }) => {
        if (cancelled) return;
        setSvg(rendered);
        setLoading(false);
      })
      .catch((err) => {
        // Mermaid can leave a broken temporary element in the page - remove it
        document.getElementById('d' + id)?.remove();
        if (cancelled) return;
        console.error('Mermaid render error:', err);
        setLoading(false);
        setError('Could not draw the diagram for this answer.');
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  // Close the full-screen view with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function openModal() {
    setZoom(1);
    setOpen(true);
  }

  function downloadPng() {
    try {
      // <br> must be written <br/> or the picture will not load as an image
      const fixed = svg.replace(/<br\s*>/gi, '<br/>');
      const doc = new DOMParser().parseFromString(fixed, 'image/svg+xml');
      const el = doc.documentElement;
      if (el.nodeName.toLowerCase() === 'parsererror' || el.querySelector('parsererror')) {
        throw new Error('Diagram SVG could not be read');
      }

      const vb = (el.getAttribute('viewBox') || '')
        .split(/[\s,]+/)
        .map(Number);
      const w = Math.ceil(vb[2]) || 800;
      const h = Math.ceil(vb[3]) || 600;
      el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      el.setAttribute('width', w);
      el.setAttribute('height', h);
      el.removeAttribute('style');
      const xml = new XMLSerializer().serializeToString(el);

      const img = new Image();
      img.onload = () => {
        try {
          const scale = 2; // sharper picture
          const canvas = document.createElement('canvas');
          canvas.width = w * scale;
          canvas.height = h * scale;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) {
              alert('Could not create the image. Please try again.');
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = makeFileName(title);
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }, 'image/png');
        } catch (err) {
          console.error('PNG download error:', err);
          alert('Could not download the diagram. Please try again.');
        }
      };
      img.onerror = () => {
        console.error('PNG download error: the diagram image failed to load');
        alert('Could not download the diagram. Please try again.');
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    } catch (err) {
      console.error('PNG download error:', err);
      alert('Could not download the diagram. Please try again.');
    }
  }

  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      {loading && <p className="diagram-loading">Drawing diagram…</p>}

      {!loading && svg && (
        <div className="md-card">
          <div className="md-toolbar">
            <span className="md-title">📊 Diagram</span>
            <div className="md-actions">
              <button type="button" className="md-btn" onClick={openModal}>
                ⤢ Expand
              </button>
              <button type="button" className="md-btn" onClick={downloadPng}>
                ⬇ Download
              </button>
            </div>
          </div>
          <div
            className="md-canvas"
            onClick={openModal}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      )}

      {open && (
        <div className="md-overlay" onClick={() => setOpen(false)}>
          <div className="md-modal" onClick={(e) => e.stopPropagation()}>
            <div className="md-modal-bar">
              <span className="md-title">📊 Diagram</span>
              <div className="md-actions">
                <button
                  type="button"
                  className="md-btn"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  −
                </button>
                <span className="md-zoom">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  className="md-btn"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  +
                </button>
                <button type="button" className="md-btn" onClick={downloadPng}>
                  ⬇ Download
                </button>
                <button
                  type="button"
                  className="md-btn md-close"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="md-modal-body">
              <div
                className="md-modal-inner"
                style={{ width: `${zoom * 100}%` }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MermaidDiagram;