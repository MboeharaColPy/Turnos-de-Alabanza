import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';

interface PWAInstallButtonProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
  variant = 'compact',
}) => {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed, show nothing or installed badge
  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>App instalada en este dispositivo</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      const res = await onInstall();
      if (res) {
        setInstalledSuccess(true);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059]/10 hover:bg-[#c5a059]/20 border border-[#c5a059]/30 text-[#c5a059] hover:text-white text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          title="Instalar como App en tu teléfono o PC"
        >
          <Download size={13} />
          <span>Instalar App</span>
        </button>
      )}

      {variant === 'full' && (
        <div className="bg-gradient-to-r from-[#18181d] to-[#121215] border border-[#2a2a30] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] flex-shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="font-serif text-sm text-white font-medium">
                Instalar Aplicación en tu Dispositivo
              </h4>
              <p className="text-xs text-[#8e8e99] mt-0.5">
                Acceso directo desde tu pantalla de inicio, modo sin conexión y actualizaciones automáticas.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer font-mono shadow-md shadow-[#c5a059]/20 flex-shrink-0"
          >
            <Download size={15} />
            <span>Instalar Aplicación</span>
          </button>
        </div>
      )}

      {/* Guía de instalación para iPhone / iPad y navegadores */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-[#2a2a2e] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleIn text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#232328]">
              <div className="flex items-center gap-2 text-[#c5a059]">
                <Smartphone size={20} />
                <h3 className="font-serif text-lg font-medium">Instalar en Pantalla de Inicio</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-[#6b6b75] hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#a0a0ab] leading-relaxed">
              <p>
                Puedes añadir esta app a tu pantalla de inicio como una aplicación nativa:
              </p>

              <div className="bg-[#0a0a0b] p-3.5 rounded-2xl border border-[#232328] space-y-2.5 font-mono text-[11px]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                  <span>En Safari o Chrome, toca el botón de <strong>Compartir <Share size={12} className="inline ml-1" /></strong> o el menú de 3 puntos.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                  <span>Selecciona la opción <strong>"Agregar al inicio"</strong> o <strong>"Instalar aplicación"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center flex-shrink-0 font-bold">3</span>
                  <span>¡Listo! Se creará el icono oficial con actualización continua.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-[#1e1e24] hover:bg-[#282830] text-white rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
