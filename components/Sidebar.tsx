import React from 'react';
import { FilterType, Language } from '../types';
import { NAVIGATION_ITEMS, TRANSLATIONS } from '../constants';
import { CheckSquare, Menu, X, Settings, Instagram } from 'lucide-react';

interface SidebarProps {
  currentFilter: FilterType;
  setFilter: (filter: FilterType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  taskCounts: Record<FilterType, number>;
  onOpenSettings: () => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentFilter, 
  setFilter, 
  isOpen, 
  setIsOpen,
  taskCounts,
  onOpenSettings,
  language
}) => {
  const t = TRANSLATIONS[language];

  const getLabel = (id: string) => {
    switch (id) {
      case 'all': return t.all;
      case 'today': return t.today;
      case 'upcoming': return t.upcoming;
      case 'pinned': return t.pinned;
      case 'completed': return t.completed;
      default: return id;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-30 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <CheckSquare className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">DailyFocus</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 mt-4 flex-1 overflow-y-auto">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFilter(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                currentFilter === item.id 
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-5 h-5 ${currentFilter === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{getLabel(item.id)}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                 currentFilter === item.id 
                 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                 : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
              }`}>
                {taskCounts[item.id]}
              </span>
            </button>
          ))}

          {/* Settings Button */}
          <button
            onClick={() => {
              onOpenSettings();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-200 group mt-4 border-t border-slate-100 dark:border-slate-800/50"
          >
             <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span>{t.settings}</span>
              </div>
          </button>
        </nav>

        {/* Footer with Developer & Admin Info */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shrink-0">
           <a 
             href="https://www.instagram.com/avazxanov_701/" 
             target="_blank" 
             rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm"
           >
             <Instagram size={14} />
             <span>{t.contactAdmin}</span>
           </a>
           
           <div className="mt-4 text-center">
             <p className="text-[10px] uppercase tracking-widest text-slate-400">{t.developer}</p>
             <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">avazxanov_701</p>
           </div>
        </div>
      </aside>
    </>
  );
};