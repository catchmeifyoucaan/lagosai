import React from 'react';
import { ThemeColors } from '../types';

interface CanvasPanelProps {
  theme: ThemeColors;
  initialCode?: string;
  onClose: () => void;
}

const defaultHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Canvas</title><style>body{font-family:sans-serif;padding:16px}</style></head><body><h1>Hello Canvas</h1><p>Edit the code to see live preview.</p><script>console.log('Canvas ready')</script></body></html>`;

const CanvasPanel: React.FC<CanvasPanelProps> = ({ theme, initialCode, onClose }) => {
  const [code, setCode] = React.useState<string>(initialCode || defaultHtml);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(code);
    doc.close();
  }, [code]);

  const copyAll = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false), 1500); } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-6xl h-[90vh] ${theme.card} rounded-xl shadow-2xl overflow-hidden flex flex-col`} onClick={e=>e.stopPropagation()}>
        <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold">Code Canvas</h2>
          <div className="flex items-center gap-2">
            <button onClick={copyAll} className="px-2 py-1 rounded-md text-sm bg-cyan-600 text-white hover:bg-cyan-700">{copied ? 'Copied!' : 'Copy full code'}</button>
            <button onClick={onClose} className={`px-2 py-1 rounded-md text-sm ${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>Close</button>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
          <textarea value={code} onChange={e=>setCode(e.target.value)} className={`w-full h-full p-3 text-sm border-r dark:border-gray-700 ${theme.input}`} />
          <iframe ref={iframeRef} title="Canvas Preview" className="w-full h-full bg-white" />
        </div>
      </div>
    </div>
  );
};

export default CanvasPanel;