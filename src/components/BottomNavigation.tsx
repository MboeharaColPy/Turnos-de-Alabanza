import React from 'react';
import { 
  CalendarDays, 
  Calendar, 
  Music, 
  Users, 
  BarChart3, 
  Sliders,
  Lock
} from 'lucide-react';
import { ActiveTab } from './Header';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAdmin: boolean;
  onToggleAdminModal: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  onToggleAdminModal,
}) => {
  const navItems = [
    { id: 'mes' as ActiveTab, label: 'Mes', icon: CalendarDays, requiresAdmin: false },
    { id: 'semana' as ActiveTab, label: 'Semana', icon: Calendar, requiresAdmin: false },
    { id: 'cancionero' as ActiveTab, label: 'Canciones', icon: Music, requiresAdmin: false },
    { id: 'musicos' as ActiveTab, label: 'Músicos', icon: Users, requiresAdmin: true },
    { id: 'estadisticas' as ActiveTab, label: 'Reportes', icon: BarChart3, requiresAdmin: true },
    { id: 'config' as ActiveTab, label: 'Ajustes', icon: Sliders, requiresAdmin: true },
  ];

  return (
    <nav 
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121215]/95 backdrop-blur-lg border-t border-[#26262e] px-1 py-1 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
    >
      <div className="grid grid-cols-6 items-center justify-around gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = item.requiresAdmin && !isAdmin;

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => {
                if (isLocked) {
                  onToggleAdminModal();
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 relative min-h-[48px] ${
                isActive
                  ? 'text-amber-400 font-bold scale-105 bg-amber-500/10'
                  : 'text-[#888894] hover:text-[#e0e0e0] font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 stroke-[2.5]' : 'text-[#8e8e99]'}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#121215] animate-pulse" />
                )}
                {isLocked && (
                  <span className="absolute -top-1 -right-1.5 p-0.5 rounded-full bg-[#1e1e24] text-amber-400 border border-amber-500/30">
                    <Lock size={8} />
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none mt-1 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
