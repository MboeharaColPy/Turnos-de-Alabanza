import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  AlertCircle,
  Download,
  ExternalLink,
  Layers,
  Scroll,
} from 'lucide-react';

// Configurar el worker de PDF.js para Vite y producción
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  // Fallback a CDN oficial con la versión exacta si falla la resolución local
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  url: string;
  title?: string;
  onClose?: () => void;
  className?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  title = 'Partitura PDF',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [mode, setMode] = useState<'continuous' | 'single'>('continuous');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carga del documento PDF
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

        if (url.startsWith('data:')) {
          const base64Index = url.indexOf('base64,');
          if (base64Index !== -1) {
            const base64Data = url.substring(base64Index + 7);
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            loadingTask = pdfjsLib.getDocument({ data: bytes });
          } else {
            loadingTask = pdfjsLib.getDocument(url);
          }
        } else {
          loadingTask = pdfjsLib.getDocument(url);
        }

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Error al cargar PDF:', err);
        setError('No se pudo procesar el archivo PDF. Puedes descargarlo o abrirlo en una pestaña externa.');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Ajustar escala al ancho de la pantalla en dispositivos móviles
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth < 500) {
        // En teléfonos móviles, ajustar escala para que ocupe todo el ancho cómodamente
        setScale(Math.max(0.75, Math.min(1.05, (containerWidth - 24) / 595)));
      } else if (containerWidth < 768) {
        setScale(1.1);
      } else {
        setScale(1.3);
      }
    }
  }, [numPages]);

  const handleZoomIn = () => setScale(prev => Math.min(3.0, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, +(prev - 0.15).toFixed(2)));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleFitWidth = () => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth - 32;
      setScale(Math.max(0.6, +(w / 595).toFixed(2)));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-[#141418] rounded-2xl border border-[#232328] overflow-hidden select-none ${className}`}
    >
      {/* BARRA SUPERIOR DE HERRAMIENTAS DEL VISOR PDF */}
      <div className="p-2 sm:p-2.5 bg-[#18181c] border-b border-[#232328] flex flex-wrap items-center justify-between gap-2 z-10">
        {/* Info & Título */}
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText size={15} className="text-[#c5a059] flex-shrink-0" />
          <span className="text-xs font-mono font-bold text-white truncate max-w-[140px] sm:max-w-xs">
            {title}
          </span>
          {numPages > 0 && (
            <span className="text-[10px] font-mono text-[#8e8e99] bg-[#0c0c0e] px-1.5 py-0.5 rounded border border-[#26262b]">
              {numPages} {numPages === 1 ? 'pág' : 'págs'}
            </span>
          )}
        </div>

        {/* Controles Principales */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Modo Continuo vs Paginado (si hay más de 1 página) */}
          {numPages > 1 && (
            <div className="flex items-center bg-[#0a0a0b] p-0.5 rounded-lg border border-[#232328]">
              <button
                type="button"
                onClick={() => setMode('continuous')}
                className={`p-1 sm:px-1.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors ${
                  mode === 'continuous'
                    ? 'bg-[#c5a059] text-black font-bold'
                    : 'text-[#8e8e99] hover:text-white'
                }`}
                title="Desplazamiento continuo (todas las páginas hacia abajo)"
              >
                <Scroll size={12} />
                <span className="hidden sm:inline">Continuo</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`p-1 sm:px-1.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors ${
                  mode === 'single'
                    ? 'bg-[#c5a059] text-black font-bold'
                    : 'text-[#8e8e99] hover:text-white'
                }`}
                title="Página por página"
              >
                <Layers size={12} />
                <span className="hidden sm:inline">Página</span>
              </button>
            </div>
          )}

          {/* Navegación por páginas en modo Single */}
          {mode === 'single' && numPages > 1 && (
            <div className="flex items-center gap-1 bg-[#0a0a0b] px-1.5 py-0.5 rounded-lg border border-[#232328]">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 text-[#8e8e99] hover:text-white disabled:opacity-30 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] font-mono text-white">
                {currentPage}/{numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                className="p-1 text-[#8e8e99] hover:text-white disabled:opacity-30 cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 bg-[#0a0a0b] hover:bg-[#25252a] text-[#c5a059] rounded-lg border border-[#232328] transition-colors cursor-pointer"
            title="Reducir zoom"
          >
            <ZoomOut size={13} />
          </button>

          {/* Nivel de Zoom / Ajustar ancho */}
          <button
            type="button"
            onClick={handleFitWidth}
            className="px-1.5 py-0.5 bg-[#0a0a0b] hover:bg-[#25252a] text-[10px] font-mono text-[#c5a059] font-bold rounded-lg border border-[#232328] transition-colors cursor-pointer"
            title="Clic para ajustar al ancho"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 bg-[#0a0a0b] hover:bg-[#25252a] text-[#c5a059] rounded-lg border border-[#232328] transition-colors cursor-pointer"
            title="Aumentar zoom"
          >
            <ZoomIn size={13} />
          </button>

          {/* Rotar */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 bg-[#0a0a0b] hover:bg-[#25252a] text-[#8e8e99] hover:text-white rounded-lg border border-[#232328] transition-colors cursor-pointer"
            title="Girar 90°"
          >
            <RotateCw size={13} />
          </button>

          {/* Abrir externamente */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-[#0a0a0b] hover:bg-[#25252a] text-[#8e8e99] hover:text-white rounded-lg border border-[#232328] transition-colors cursor-pointer"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink size={13} />
          </a>

          {/* Descargar */}
          <a
            href={url}
            download={`${title || 'partitura'}.pdf`}
            className="p-1.5 bg-[#0a0a0b] hover:bg-[#25252a] text-[#8e8e99] hover:text-white rounded-lg border border-[#232328] transition-colors cursor-pointer"
            title="Descargar archivo PDF"
          >
            <Download size={13} />
          </a>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO / RENDERIZADO DEL PDF */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 bg-[#0d0d10] flex flex-col items-center select-text">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center my-auto">
            <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[#8e8e99]">Cargando partitura PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 max-w-sm text-center my-auto p-4 bg-[#18181c] rounded-xl border border-red-500/30">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-xs text-[#8e8e99] leading-relaxed">{error}</p>
            <div className="flex items-center gap-2 pt-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#25252a] hover:bg-[#303036] text-white rounded-lg text-xs font-mono flex items-center gap-1.5"
              >
                <ExternalLink size={12} />
                <span>Pestaña nueva</span>
              </a>
              <a
                href={url}
                download={`${title}.pdf`}
                className="px-3 py-1.5 bg-[#c5a059] text-black font-bold rounded-lg text-xs font-mono flex items-center gap-1.5"
              >
                <Download size={12} />
                <span>Descargar</span>
              </a>
            </div>
          </div>
        )}

        {!loading && !error && pdfDoc && (
          <div className="flex flex-col items-center gap-4 w-full">
            {mode === 'continuous' ? (
              Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <PdfPageCanvas
                  key={`page-${pageNum}-${scale}-${rotation}`}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  scale={scale}
                  rotation={rotation}
                />
              ))
            ) : (
              <PdfPageCanvas
                key={`page-${currentPage}-${scale}-${rotation}`}
                pdfDoc={pdfDoc}
                pageNumber={currentPage}
                scale={scale}
                rotation={rotation}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-componente que renderiza una página específica en un HTML5 Canvas
interface PdfPageCanvasProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderStatus, setRenderStatus] = useState<'rendering' | 'ready' | 'error'>('rendering');

  useEffect(() => {
    let isCancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      setRenderStatus('rendering');
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Soporte High-DPI (pantallas Retina / móviles) limitado a 2x para fluidez
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.save();
        context.scale(pixelRatio, pixelRatio);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        context.restore();
        if (!isCancelled) {
          setRenderStatus('ready');
        }
      } catch (err: unknown) {
        // Ignorar si fue cancelado debido a re-renderizado por cambio de zoom o rotación
        if ((err as { name?: string })?.name === 'RenderingCancelledException') {
          return;
        }
        console.error(`Error renderizando página ${pageNumber}:`, err);
        if (!isCancelled) {
          setRenderStatus('error');
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation]);

  return (
    <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white max-w-full flex justify-center border border-[#26262b]">
      <canvas ref={canvasRef} className="block max-w-full h-auto" />
      {renderStatus === 'rendering' && (
        <div className="absolute inset-0 bg-[#121215]/30 backdrop-blur-[1px] flex items-center justify-center">
          <span className="text-[10px] font-mono text-[#c5a059] bg-[#141418]/90 px-2 py-1 rounded shadow">
            Pág. {pageNumber}
          </span>
        </div>
      )}
    </div>
  );
};
