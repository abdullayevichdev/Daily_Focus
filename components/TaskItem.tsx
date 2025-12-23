import React from 'react';
import { Task } from '../types';
import { Check, Pin, Clock, Trash, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onPin: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit, onPin }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const taskDate = parseISO(`${task.date}T${task.time}`);
  const isOverdue = !task.isCompleted && isPast(taskDate) && !isToday(taskDate);
  const isDueToday = isToday(taskDate);

  // Localization for Today/Date format would ideally use date-fns locales, 
  // but for simplicity we keep English date formats with Translated label
  
  return (
    <div className={`group relative bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-300 ${
      task.isCompleted 
        ? 'opacity-60 border-slate-100 dark:border-slate-800' 
        : isOverdue 
          ? 'border-red-200 dark:border-red-900/30 shadow-sm' 
          : 'border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-md'
    }`}>
      
      <div className="p-4 flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400'
          }`}
        >
          {task.isCompleted && <Check size={14} strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold truncate ${
              task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'
            }`}>
              {task.title}
            </h3>
            {task.isPinned && (
              <Pin size={14} className="text-amber-500 flex-shrink-0 fill-current" />
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className={`flex items-center gap-1 ${
              isOverdue ? 'text-red-500 font-medium' : isDueToday ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''
            }`}>
              <Clock size={12} />
              <span>
                {format(taskDate, 'MMM d')} - {format(taskDate, 'HH:mm')}
              </span>
            </div>
            
            {task.subTasks.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                {task.subTasks.filter(st => st.isCompleted).length}/{task.subTasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
            onClick={() => onPin(task.id)}
            className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 ${task.isPinned ? 'text-amber-500' : 'text-slate-400'}`}
          >
            <Pin size={18} />
          </button>
          <button 
            onClick={() => onEdit(task)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash size={18} />
          </button>
          {(task.description || task.subTasks.length > 0) && (
             <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg md:hidden"
             >
               {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
             </button>
          )}
        </div>
      </div>

      {/* Expanded Details (Description + Subtasks) */}
      {(task.description || task.subTasks.length > 0) && (
        <div className={`px-4 pb-4 pl-14 space-y-3 ${isExpanded ? 'block' : 'hidden md:block'}`}>
          {task.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {task.description}
            </p>
          )}
          
          {task.subTasks.length > 0 && (
            <div className="space-y-1">
              {task.subTasks.map(st => (
                <div key={st.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className={`w-1.5 h-1.5 rounded-full ${st.isCompleted ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span className={st.isCompleted ? 'line-through opacity-70' : ''}>{st.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};