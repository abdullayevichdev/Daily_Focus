import React, { useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isToday, isFuture } from 'date-fns';
import { Menu, Plus, Search, Bell, Settings, BellOff, Moon, Sun, AlertTriangle } from 'lucide-react';
import { Task, FilterType, SubTask, Language, TextSize } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNotifications } from './hooks/useNotifications';
import { Sidebar } from './components/Sidebar';
import { TaskItem } from './components/TaskItem';
import { TaskForm } from './components/TaskForm';
import { SettingsModal } from './components/SettingsModal';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useLocalStorage<Task[]>('dailyfocus-tasks', []);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Delete Modal State
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Settings State
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('dailyfocus-theme', false);
  const [customSound, setCustomSound] = useLocalStorage<string | null>('dailyfocus-sound', null);
  const [language, setLanguage] = useLocalStorage<Language>('dailyfocus-lang', 'uz');
  const [textSize, setTextSize] = useLocalStorage<TextSize>('dailyfocus-text', 'normal');
  const [isSilent, setIsSilent] = useState(false);

  const t = TRANSLATIONS[language];

  // --- Hooks ---
  // If Silent mode is active, pass null to useNotifications to mute it
  // Now destructuring stopAudio from the hook
  const { stopAudio } = useNotifications(tasks, (id, updates) => updateTask(id, updates), isSilent ? null : customSound);

  // --- Persistent Storage Request (20 Year requirement) ---
  useEffect(() => {
    const requestPersistence = async () => {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          await navigator.storage.persist();
          console.log("Storage persistence requested");
        }
      }
    };
    requestPersistence();
  }, []);

  // --- Theme & Text Size Effect ---
  useEffect(() => {
    // We use 'class' strategy in Tailwind config (index.html)
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Actions ---
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'subTasks'> & { subTasks?: SubTask[] }) => {
    const newTask: Task = {
      id: uuidv4(),
      createdAt: Date.now(),
      isCompleted: false,
      isPinned: taskData.isPinned || false,
      subTasks: taskData.subTasks || [],
      ...taskData,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Step 1: Initiate Delete (Open Modal)
  const initiateDelete = (id: string) => {
    setTaskToDelete(id);
  };

  // Step 2: Confirm Delete (Actual Removal)
  const confirmDelete = () => {
    if (taskToDelete) {
      stopAudio(); // STOP SOUND IMMEDIATELY
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    }
  };

  const toggleTaskCompletion = (id: string) => {
    stopAudio(); // STOP SOUND IMMEDIATELY
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isCompleted: !t.isCompleted };
      }
      return t;
    }));
  };

  const toggleTaskPin = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
  };

  // --- Filtering Logic ---
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }

    // Category Filter
    switch (filter) {
      case 'today':
        result = result.filter(t => isToday(new Date(t.date)));
        break;
      case 'upcoming':
        result = result.filter(t => isFuture(new Date(t.date)));
        break;
      case 'pinned':
        result = result.filter(t => t.isPinned);
        break;
      case 'completed':
        result = result.filter(t => t.isCompleted);
        break;
      case 'all':
      default:
        // No filter
        break;
    }

    // Sort: Pinned first, then by date/time
    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });
  }, [tasks, filter, searchQuery]);

  // Counts for sidebar
  const taskCounts = useMemo(() => ({
    all: tasks.length,
    today: tasks.filter(t => isToday(new Date(t.date))).length,
    upcoming: tasks.filter(t => isFuture(new Date(t.date))).length,
    pinned: tasks.filter(t => t.isPinned).length,
    completed: tasks.filter(t => t.isCompleted).length,
  }), [tasks]);

  // --- Handlers ---
  const openNewTaskModal = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = (taskData: any) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  const toggleSilentMode = () => {
    setIsSilent(!isSilent);
    if (isSilent && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Resolve Label for Header
  const getHeaderLabel = () => {
    switch (filter) {
      case 'all': return t.all;
      case 'today': return t.today;
      case 'upcoming': return t.upcoming;
      case 'pinned': return t.pinned;
      case 'completed': return t.completed;
      default: return filter;
    }
  };

  // Get Text Size Class
  const getTextSizeClass = () => {
    switch(textSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans ${getTextSizeClass()}`}>
      
      {/* Sidebar */}
      <Sidebar 
        currentFilter={filter} 
        setFilter={setFilter} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        taskCounts={taskCounts}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        language={language}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu />
            </button>
            <h1 className="text-xl font-bold capitalize hidden md:block">{getHeaderLabel()}</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-1 md:flex-none justify-end w-full md:w-auto">
            <div className="relative w-full max-w-[200px] md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
            
            {/* Sound Toggle */}
            <button 
              onClick={toggleSilentMode}
              className={`p-2 rounded-lg transition-colors ${isSilent ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={isSilent ? 'Unmute' : 'Mute'}
            >
              {isSilent ? <BellOff size={20} /> : <Bell size={20} />}
            </button>

            {/* Dark/Light Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isDarkMode ? t.lightMode : t.darkMode}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Settings Button */}
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={t.settings}
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Task List Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Greeting (Only on All or Today) */}
            {(filter === 'all' || filter === 'today') && !searchQuery && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  {new Date().getHours() < 12 ? t.goodMorning : new Date().getHours() < 18 ? t.goodAfternoon : t.goodEvening}!
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  {t.tasksScheduled} {taskCounts.today}
                </p>
              </div>
            )}

            {/* Empty State */}
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <div className="w-12 h-12 text-indigo-300 dark:text-indigo-500">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </div>
                </div>
                {/* Specific Empty Message for Today */}
                {filter === 'today' && !searchQuery ? (
                  <>
                    <h3 className="text-lg font-semibold mb-2">{t.noTasksToday}</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                      {t.noTasksTodayDesc}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-2">{t.noTasks}</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                      {t.noTasksDesc}
                    </p>
                  </>
                )}
                
                {!searchQuery && (
                   <button 
                    onClick={openNewTaskModal}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                   >
                     {t.createTask}
                   </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTaskCompletion}
                    onDelete={initiateDelete} 
                    onEdit={openEditTaskModal}
                    onPin={toggleTaskPin}
                  />
                ))}
              </div>
            )}
            
            {/* Bottom spacer for FAB */}
            <div className="h-24 md:hidden"></div>
          </div>
        </div>

        {/* Floating Action Button (Mobile) */}
        <button
          onClick={openNewTaskModal}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
        >
          <Plus size={28} />
        </button>
      </main>

      {/* Desktop Floating Action Button (Alternative placement) */}
      <div className="hidden md:block fixed bottom-8 right-8 z-20">
         <button
          onClick={openNewTaskModal}
          className="group flex items-center gap-3 px-5 py-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-300"
        >
          <Plus size={24} />
          <span className="font-semibold text-base pr-1">{t.newTask}</span>
        </button>
      </div>

      {/* Task Modal */}
      <TaskForm 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSubmit={handleTaskSubmit}
        initialTask={editingTask}
        language={language}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        customSound={customSound}
        setCustomSound={setCustomSound}
        language={language}
        setLanguage={setLanguage}
        textSize={textSize}
        setTextSize={setTextSize}
      />

      {/* Delete Confirmation Modal (Custom Professional) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertTriangle size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                   {language === 'uz' ? 'Vazifani o\'chirish' : 'Delete Task'}
                 </h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                   {t.deleteConfirm}
                 </p>
                 <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setTaskToDelete(null)}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
                    >
                      {language === 'uz' ? 'O\'chirish' : 'Delete'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;