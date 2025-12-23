import { useEffect, useRef, useState } from 'react';
import { Task } from '../types';
import { DEFAULT_NOTIFICATION_SOUND } from '../constants';

export const useNotifications = (
  tasks: Task[], 
  updateTask: (id: string, updates: Partial<Task>) => void,
  customSoundUrl?: string | null
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // 1. Initialize Audio Object
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true; // Loop audio like an alarm
    audioRef.current = audio;
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 2. Update Audio Source
  useEffect(() => {
    if (audioRef.current) {
      const src = customSoundUrl || DEFAULT_NOTIFICATION_SOUND;
      // Only update if src changed to prevent reloading mid-play
      if (audioRef.current.src !== src) {
        const wasPlaying = !audioRef.current.paused;
        audioRef.current.src = src;
        audioRef.current.load();
        if (wasPlaying) audioRef.current.play().catch(() => {});
      }
    }
  }, [customSoundUrl]);

  // 3. Helper to STOP audio immediately
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // 4. "Unlock" Audio for Mobile
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current && !isAudioUnlocked) {
        const originalVolume = audioRef.current.volume;
        audioRef.current.volume = 0;
        
        audioRef.current.play().then(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.volume = originalVolume || 1;
            setIsAudioUnlocked(true);
            
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            console.log("Audio engine unlocked for notifications");
          }
        }).catch(error => {
          console.log("Audio unlock failed (waiting for interaction):", error);
        });
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [isAudioUnlocked, customSoundUrl]);

  // 5. Check Interval Logic
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      
      tasks.forEach(task => {
        if (task.isCompleted || task.notificationSent) return;

        const taskDateTime = new Date(`${task.date}T${task.time}`);
        const diff = now.getTime() - taskDateTime.getTime();

        // Trigger window: if time matches or passed within last 5 mins
        if (taskDateTime <= now && diff < 300000) { 
           sendNotification(task);
           updateTask(task.id, { notificationSent: true });
        }
      });
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [tasks, updateTask]);

  const sendNotification = (task: Task) => {
    // 1. Service Worker / System Notification
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          // Use Service Worker for more robust notification
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(`⏰ ${task.title}`, {
              body: task.description || 'Vazifani bajarish vaqti keldi!',
              icon: '/vite.svg',
              vibrate: [500, 200, 500],
              requireInteraction: true,
              data: { url: window.location.href } // Click opens app
            } as any);
          });
        } else {
          // Fallback to standard API
          new Notification(`⏰ ${task.title}`, {
            body: task.description || 'Vazifani bajarish vaqti keldi!',
            icon: '/vite.svg',
            requireInteraction: true
          });
        }
      } catch (e) {
        console.error("Notification error:", e);
      }
    }

    // 2. Play Sound (Looping until stopped)
    if (audioRef.current) {
      audioRef.current.volume = 1;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio blocked:", error);
          if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
        });
      }
    }
    
    // 3. Vibrate
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 1000]);
    }
  };

  return { stopAudio };
};