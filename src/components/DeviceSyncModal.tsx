import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Upload,
  Copy,
  Check,
  Cloud,
  AlertTriangle,
  ExternalLink,
  Save,
  Smartphone,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { AppState } from '../types';
import { saveStoredState, saveCloudState } from '../services/storage';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onStateImported: (newState: AppState) => void;
  isCloudQuotaExceeded: boolean;
  isAdmin: boolean;
  onManualCloudSave?: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  state,
  onStateImported,
  isCloudQuotaExceeded,
  isAdmin,
  onManualCloudSave,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportTextArea, setShowImportTextArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentAssignmentsCount = Object.keys(state.assignments || {}).reduce(
    (acc, k) => acc + Object.keys(state.assignments[k] || {}).length,
    0
  );
  const currentShiftsCount = Object.keys(state.shiftSongs || {}).length;

  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const dateTag = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('download', `turnos_alabanza_sincronizacion_${dateTag}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('¡Archivo de sincronización descargado con éxito!');
    } catch (err) {
      console.error(err);
      showToast('Error al exportar archivo.');
    }
  };

  const handleCopyJson = () => {
    try {
      const jsonStr = JSON.stringify(state);
      navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      showToast('¡Datos copiados al portapapeles! Puedes pegarlos en otro dispositivo.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Error al copiar al portapapeles.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Formato inválido');
        }
        onStateImported(parsed);
        saveStoredState(parsed);
        if (isAdmin) {
          saveCloudState(parsed);
        }
        showToast('¡Datos importados y sincronizados correctamente en este dispositivo!');
        onClose();
      } catch (err) {
        console.error(err);
        showToast('Error: El archivo no contiene un formato de turnos válido.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualImportText = () => {
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText.trim());
      onStateImported(parsed);
      saveStoredState(parsed);
      if (isAdmin) {
        saveCloudState(parsed);
      }
      showToast('¡Datos aplicados con éxito en este dispositivo!');
      setShowImportTextArea(false);
      setImportText('');
      onClose();
    } catch {
      showToast('Error: El texto pegado no es un JSON válido.');
    }
  };

  const handleTriggerCloudSave = async () => {
    if (isSavingCloud) return;
    setIsSavingCloud(true);
    try {
      if (onManualCloudSave) {
        await onManualCloudSave();
      } else {
        const ok = await saveCloudState(state);
        if (ok) {
          showToast('¡Guardado exitoso en Firebase Cloud!');
        } else {
          showToast('Error al guardar en la nube de Firebase.');
        }
      }
    } finally {
      setIsSavingCloud(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative text-slate-200 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-[#202026] hover:bg-[#2c2c34] text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
            <Smartphone size={22} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-white tracking-tight">
              Sincronización entre Dispositivos
            </h3>
            <p className="text-xs text-gray-400 font-sans">
              Comparte turnos, repertorios y roles en vivo con los celulares y tablets del equipo
            </p>
          </div>
        </div>

        {/* Cloud Status Notice */}
        <div
          className={`p-3.5 rounded-xl border mb-5 ${
            isCloudQuotaExceeded
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {isCloudQuotaExceeded ? (
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Cloud size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              {isCloudQuotaExceeded ? (
                <>
                  <p className="font-bold text-amber-300 mb-1">
                    Cuota diaria gratuita de Firebase completada temporalmente
                  </p>
                  <p className="text-amber-200/90 mb-2">
                    El límite gratuito del proyecto en Firebase se completó por hoy (se reinicia automáticamente a medianoche UTC). Todos tus cambios están guardados de forma segura en este dispositivo. Puedes usar las opciones abajo para transferir la programación completa a otros celulares ahora mismo con 1 solo clic.
                  </p>
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0279952464/firestore/databases/ai-studio-gestordeturnosyr-54c0fa82-be3b-49ad-ac1e-e9aac492cbc2/data?openUpgradeDialog=true"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] underline text-amber-300 hover:text-amber-100 font-semibold"
                  >
                    <span>Abrir consola Firebase para actualizar plan</span>
                    <ExternalLink size={11} />
                  </a>
                </>
              ) : (
                <>
                  <p className="font-semibold text-emerald-300 mb-0.5">
                    Base de Datos en la Nube Conectada
                  </p>
                  <p className="text-emerald-200/80">
                    Los cambios del administrador se envían a Firebase y se sincronizan automáticamente con todos los dispositivos que tengan conexión a internet.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resumen actual */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#0c0c0e] rounded-xl border border-[#202026] mb-5 text-center text-xs font-mono">
          <div>
            <div className="text-gray-500 text-[10px] uppercase">Músicos</div>
            <div className="text-white font-bold text-sm">{state.musicians?.length || 0}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase">Asignaciones</div>
            <div className="text-[#c5a059] font-bold text-sm">{currentAssignmentsCount}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase">Setlists Turnos</div>
            <div className="text-white font-bold text-sm">{currentShiftsCount}</div>
          </div>
        </div>

        {/* Acciones de Sincronización Directa */}
        <div className="space-y-3">
          {/* Opción 1: Exportar / Descargar archivo */}
          <div className="p-3.5 bg-[#1a1a20] border border-[#272730] rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Download size={15} className="text-[#c5a059]" />
                <span>Exportar Respaldo (.json)</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Descarga un archivo con toda la programación para enviarlo por WhatsApp al equipo.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3 py-2 bg-[#c5a059] hover:bg-[#d8b56f] text-black font-bold text-xs rounded-xl font-mono uppercase tracking-wider flex-shrink-0 transition cursor-pointer shadow"
            >
              Descargar
            </button>
          </div>

          {/* Opción 2: Importar archivo */}
          <div className="p-3.5 bg-[#1a1a20] border border-[#272730] rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Upload size={15} className="text-emerald-400" />
                <span>Importar Respaldo (.json)</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Carga un archivo recibido para actualizar este celular o navegador inmediatamente.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-[#262630] hover:bg-[#32323e] text-white border border-[#3c3c4a] font-bold text-xs rounded-xl font-mono uppercase tracking-wider flex-shrink-0 transition cursor-pointer"
            >
              Seleccionar
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Opción 3: Copiar texto al portapapeles */}
          <div className="p-3.5 bg-[#1a1a20] border border-[#272730] rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Copy size={15} className="text-indigo-400" />
                <span>Copiar Datos al Portapapeles</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Copia el código completo para pegarlo en otro celular sin descargar archivos.
              </p>
            </div>
            <button
              onClick={handleCopyJson}
              className="px-3 py-2 bg-[#262630] hover:bg-[#32323e] text-indigo-300 border border-indigo-900/50 font-bold text-xs rounded-xl font-mono uppercase tracking-wider flex-shrink-0 transition cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Pegar manualmente */}
          <div className="pt-1">
            <button
              onClick={() => setShowImportTextArea(prev => !prev)}
              className="text-xs text-gray-400 hover:text-white underline font-mono cursor-pointer"
            >
              {showImportTextArea ? 'Ocultar caja de texto' : '¿Prefieres pegar el código copiado? Haz clic aquí'}
            </button>
            {showImportTextArea && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Pega aquí el JSON o código copiado..."
                  rows={4}
                  className="w-full bg-[#0a0a0c] border border-[#2c2c34] rounded-xl p-2.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#c5a059]"
                />
                <button
                  onClick={handleManualImportText}
                  disabled={!importText.trim()}
                  className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d8b56f] text-black font-bold text-xs rounded-xl font-mono uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
                >
                  Aplicar Código
                </button>
              </div>
            )}
          </div>

          {/* Admin Cloud Re-save Button */}
          {isAdmin && (
            <div className="pt-2 border-t border-[#222228] flex justify-end">
              <button
                onClick={handleTriggerCloudSave}
                disabled={isSavingCloud}
                className="px-4 py-2 bg-[#202026] hover:bg-[#282830] text-[#c5a059] border border-[#c5a059]/40 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
              >
                <Save size={14} className={isSavingCloud ? 'animate-spin' : ''} />
                <span>{isSavingCloud ? 'Guardando en Firebase...' : 'Reintentar Guardado en la Nube'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
