import React, { useRef, useState } from 'react';
import { X, Moon, Sun, Upload, Play, Pause, Volume2, Instagram, Globe, Type } from 'lucide-react';
import { DEFAULT_NOTIFICATION_SOUND, TRANSLATIONS } from '../constants';
import { Language, TextSize } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  customSound: string | null;
  setCustomSound: (sound: string | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  toggleTheme,
  customSound,
  setCustomSound,
  language,
  setLanguage,
  textSize,
  setTextSize
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Limit to 4.5MB to be safe for LocalStorage
      if (file.size > 4.5 * 1024 * 1024) { 
        alert(t.soundLimit);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Sound = reader.result as string;
        try {
          setCustomSound(base64Sound);
          // Stop any currently playing audio when new file is loaded
          if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            setIsPlaying(false);
          }
        } catch (e) {
          alert(t.storageFull);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePreview = () => {
    // If playing, pause it
    if (isPlaying && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If not playing, start playing
    const soundSrc = customSound || DEFAULT_NOTIFICATION_SOUND;
    
    // Always create a new instance or reset current to ensure fresh playback
    if (!audioPreviewRef.current || audioPreviewRef.current.src !== soundSrc) {
       audioPreviewRef.current = new Audio(soundSrc);
    }

    setIsPlaying(true);
    audioPreviewRef.current.currentTime = 0; // Start from beginning
    audioPreviewRef.current.play().then(() => {
      // Reset state when audio finishes naturally
      if (audioPreviewRef.current) {
        audioPreviewRef.current.onended = () => setIsPlaying(false);
      }
    }).catch(err => {
      console.error("Playback failed", err);
      setIsPlaying(false);
    });
  };

  const resetSound = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlaying(false);
    }
    setCustomSound(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t.settingsTitle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t.appearance}</h3>
            
            {/* Dark/Light Mode */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="text-indigo-500" /> : <Sun className="text-amber-500" />}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {isDarkMode ? t.darkMode : t.lightMode}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-3">
                <Globe className="text-blue-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.language}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setLanguage('uz')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${language === 'uz' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  O'zbek
                </button>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Text Size */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Type className="text-emerald-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.textSize}</span>
              </div>
              <div className="flex bg-white dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600">
                {(['small', 'normal', 'large'] as TextSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTextSize(size)}
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                      textSize === size 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {size === 'small' ? 'A' : size === 'normal' ? 'A+' : 'A++'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t.sound}</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {customSound ? t.customSound : t.defaultSound}
                    </span>
                    <span className="text-xs text-slate-500">
                      {customSound ? 'Yuklangan fayl' : 'DailyFocus Classic'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={togglePreview}
                  className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm hover:text-indigo-600 transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={18} className="text-indigo-500" fill="currentColor" />
                  ) : (
                    <Play size={18} className="text-slate-700 dark:text-slate-200" fill="currentColor" />
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Upload size={16} />
                  {t.uploadSound}
                </button>
                {customSound && (
                  <button
                    onClick={resetSound}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    {t.reset}
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*"
                className="hidden"
              />
              <p className="text-xs text-slate-400 text-center">
                MP3, WAV, OGG (Max 4.5MB)
              </p>
            </div>
          </div>

          {/* Admin / Developer Info */}
          <div>
             <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t.about}</h3>
             <a 
               href="https://www.instagram.com/avazxanov_701/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
             >
                <div className="flex items-center gap-3">
                  <Instagram size={24} />
                  <div className="flex flex-col">
                    <span className="font-bold">{t.contactAdmin}</span>
                    <span className="text-xs text-purple-100">@avazxanov_701</span>
                  </div>
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{t.visit}</span>
             </a>
             <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                  {t.developer} <span className="font-semibold text-indigo-500">avazxanov_701</span>
                </p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Version 1.0.0 (Free)</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};