export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // 24h format HH:mm
  isCompleted: boolean;
  isPinned: boolean;
  createdAt: number;
  subTasks: SubTask[];
  notificationSent?: boolean;
}

export type FilterType = 'all' | 'today' | 'upcoming' | 'pinned' | 'completed';
export type Language = 'uz' | 'en';
export type TextSize = 'small' | 'normal' | 'large';

export interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'subTasks'> & { subTasks?: SubTask[] }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  toggleTaskPin: (id: string) => void;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}