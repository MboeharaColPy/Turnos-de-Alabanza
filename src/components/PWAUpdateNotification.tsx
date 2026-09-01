import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react';

interface PWAUpdateNotificationProps {
  needRefresh: boolean;
  onUpdate: () => Promise<void>;
  onDismiss: () => void;
}

export const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  needRefresh,
  onUpdate,
  onDismiss,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!needRefresh) return null;

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    try {
      await onUpdate();
    } catch (err) {
      console.error('Error aplicando actualización:', err);
      window.location.reload();
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-slideDown shadow-2xl">
      <div className="bg-gradient-to-r from-[#18181d] via-[#141418] to-[#1a1812] border-2 border-[#c5a059] rounded-2xl p-4 shadow-xl text-white backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 border border-[#c5a059]/50 flex items-center justify-center text-[#c5a059] flex-shrink-0 mt-0.5">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#c5a059]">
                  Actualización en Vivo
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h4 className="font-serif text-base text-white font-medium mt-0.5">
                ¡Nueva versión disponible!
              </h4>
              <p className="text-xs text-[#a0a0ab] leading-relaxed mt-1">
                Se detectaron cambios en el repositorio. Toca el botón para cargar la última versión del cancionero y turnos.
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-[#6b6b75] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-3.5 pt-3 border-t border-[#2a2a30]">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs text-[#8e8e99] hover:text-white font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            Más tarde
          </button>
          <button
            onClick={handleUpdateClick}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-[#c5a059]/20 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <ArrowUpCircle size={15} />
                <span>Actualizar Ahora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
