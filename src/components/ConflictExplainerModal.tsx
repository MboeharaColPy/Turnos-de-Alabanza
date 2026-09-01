import React from 'react';
import { 
  AlertTriangle, 
  Heart, 
  Sliders, 
  CheckCircle2, 
  Users, 
  Mic2, 
  X, 
  Sparkles, 
  HelpCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ConflictExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConflictExplainerModal: React.FC<ConflictExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="conflict-explainer-modal"
        className="bg-[#141418] border border-[#2a2a2e] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#1a1a1d] border-b border-[#242429] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-medium text-white">
                Guía de Advertencias y Reglas de Turno
              </h3>
              <p className="text-[11px] text-[#8e8e99]">
                Explicación visual para entender y resolver alertas en el cuadrante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0a0a0b] hover:bg-[#25252a] text-[#8e8e99] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            id="close-explainer-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#d4d4dc]">
          
          {/* 1. Regla de Parejas */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Heart size={16} className="fill-rose-500/20" />
              <span>1. Alerta de Parejas y Descanso Familiar (Amarillo / Rojo)</span>
            </div>
            <p className="text-xs text-[#a0a0ab] leading-relaxed">
              <strong className="text-white">¿Qué significa?</strong> Cuando dos integrantes están vinculados como pareja, se busca que <strong>sirvan juntos</strong> o <strong>descansen juntos</strong> el mismo fin de semana para proteger su tiempo familiar.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0a0a0b] border border-rose-900/30 text-xs space-y-1.5">
              <div className="flex items-start gap-1.5 text-rose-300">
                <span className="font-semibold text-white">Ejemplo:</span>
                <span>"Carlos está convocado pero su esposa María descansa en este turno".</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium pt-1 border-t border-rose-950/60">
                <CheckCircle2 size={13} />
                <span><strong>¿Cómo resolverlo?</strong> Puedes convocar a la pareja en una vacante disponible de su rol con el botón <em>"Reunir Pareja"</em>, o desconvocarlo para que descansen juntos.</span>
              </div>
            </div>
          </div>

          {/* 2. Rol Exclusivo de Sonido */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/40 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Sliders size={16} />
              <span>2. Exclusividad de Sonido & Multimedia (Rojo)</span>
            </div>
            <p className="text-xs text-[#a0a0ab] leading-relaxed">
              <strong className="text-white">¿Qué significa?</strong> La persona asignada a <em>Sonido Multimedia</em> debe estar 100% concentrada en la consola de audio y proyección. No puede cantar ni tocar instrumentos en ese mismo horario.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0a0a0b] border border-cyan-900/30 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                <span><strong>¿Cómo resolverlo?</strong> Selecciona a otro integrante en el sonido o retira a la persona del rol musical.</span>
              </div>
            </div>
          </div>

          {/* 3. Duplicidad de Categoría */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle size={16} />
              <span>3. Conflicto de Doble Asignación Similar (Rojo)</span>
            </div>
            <p className="text-xs text-[#a0a0ab] leading-relaxed">
              <strong className="text-white">¿Qué significa?</strong> Un integrante está puesto en dos instrumentos a la vez (ej: Piano y Batería) o en dos voces a la vez (ej: Voz 1 y Voz 2).
            </p>
            <div className="p-2.5 rounded-lg bg-[#0a0a0b] border border-amber-900/30 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                <span><strong>¿Cómo resolverlo?</strong> Deja a la persona en un solo instrumento o voz y libera la otra vacante.</span>
              </div>
            </div>
          </div>

          {/* 4. Doble Rol Válido */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={16} />
              <span>4. Doble Rol Permitido y Válido (Verde)</span>
            </div>
            <p className="text-xs text-[#a0a0ab] leading-relaxed">
              <strong className="text-white">¿Qué significa?</strong> Un integrante puede tocar un instrumento <strong>y a la vez cantar</strong> (ej: Guitarra Acústica + Voz 1, o Director + Piano). Esto es totalmente permitido y muestra un distintivo verde.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-[#1a1a1d] border-t border-[#242429] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
