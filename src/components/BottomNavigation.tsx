import React from 'react';
import { 
  Home,
  Music, 
  CalendarDays, 
  Users, 
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
    { id: 'inicio' as ActiveTab, label: 'Inicio', icon: Home, requiresAdmin: false },
    { id: 'canciones' as ActiveTab, label: 'Canciones', icon: Music, requiresAdmin: false },
    { id: 'calendario' as ActiveTab, label: 'Calendario', icon: CalendarDays, requiresAdmin: false },
    { id: 'musicos' as ActiveTab, label: 'Integrantes', icon: Users, requiresAdmin: false },
    { id: 'config' as ActiveTab, label: 'Ajustes', icon: Sliders, requiresAdmin: true },
  ];

  const isItemActive = (id: string) => {
    if (id === 'inicio' && activeTab === 'inicio') return true;
    if (id === 'canciones' && (activeTab === 'canciones' || activeTab === 'cancionero')) return true;
    if (id === 'calendario' && (activeTab === 'calendario' || activeTab === 'eventos' || activeTab === 'mes' || activeTab === 'semana')) return true;
    if (id === 'musicos' && activeTab === 'musicos') return true;
    if (id === 'config' && (activeTab === 'config' || activeTab === 'estadisticas')) return true;
    return activeTab === id;
  };

  return (
    <nav 
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121215]/95 backdrop-blur-lg border-t border-[#26262e] px-1 py-1 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
    >
      <div className="grid grid-cols-5 items-center justify-around gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.id);
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
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 relative min-h-[48px] cursor-pointer ${
                isActive
                  ? 'text-[#c5a059] font-bold scale-105 bg-[#c5a059]/10'
                  : 'text-[#888894] hover:text-[#e0e0e0] font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#c5a059] stroke-[2.5]' : 'text-[#8e8e99]'}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#c5a059] ring-2 ring-[#121215] animate-pulse" />
                )}
                {isLocked && (
                  <span className="absolute -top-1 -right-1.5 p-0.5 rounded-full bg-[#1e1e24] text-[#c5a059] border border-[#c5a059]/30">
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
