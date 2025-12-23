import React, { useState, useEffect } from 'react';
import { Task, SubTask, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { X, Sparkles, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { generateSubtasks } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'subTasks'> & { subTasks?: SubTask[] }) => void;
  initialTask?: Task;
  language: Language;
}

export const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, onSubmit, initialTask, language }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [isPinned, setIsPinned] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setDate(initialTask.date);
      setTime(initialTask.time);
      setIsPinned(initialTask.isPinned);
      setSubTasks(initialTask.subTasks || []);
    } else {
      resetForm();
    }
  }, [initialTask, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('09:00');
    setIsPinned(false);
    setSubTasks([]);
    setNewSubTask('');
  };

  const handleGenerateSubtasks = async () => {
    if (!title) return;
    setIsGenerating(true);
    const suggestions = await generateSubtasks(title);
    
    const newItems: SubTask[] = suggestions.map(s => ({
      id: uuidv4(),
      title: s,
      isCompleted: false
    }));
    
    setSubTasks(prev => [...prev, ...newItems]);
    setIsGenerating(false);
  };

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    setSubTasks([...subTasks, { id: uuidv4(), title: newSubTask, isCompleted: false }]);
    setNewSubTask('');
  };

  const handleDeleteSubTask = (id: string) => {
    setSubTasks(subTasks.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      date,
      time,
      isPinned,
      subTasks
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {initialTask ? t.editTask : t.newTask}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title Input with AI Button */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.whatToDo}</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.placeholderTask}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleGenerateSubtasks}
                  disabled={isGenerating || !title}
                  title="Generate subtasks with AI"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                >
                  <Sparkles size={20} className={isGenerating ? "animate-pulse" : ""} />
                </button>
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.date}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.time}</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.description}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`${t.description}...`}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            {/* Subtasks */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.subtasks}</label>
              <div className="space-y-2 mb-3">
                {subTasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <div className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                      {st.title}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubTask(st.id)}
                      className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubTask())}
                  placeholder={t.addSubtask}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddSubTask}
                  className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Pin Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  isPinned 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400' 
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isPinned ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <span className="text-sm font-medium">{isPinned ? t.pinnedToTop : t.pinTask}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            form="task-form"
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            {initialTask ? t.save : t.create}
          </button>
        </div>
      </div>
    </div>
  );
};