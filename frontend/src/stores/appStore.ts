import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore, UserPreferences, Notification } from '@/types';

interface AppState extends AppStore {
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setApiStatus: (status: 'online' | 'offline' | 'checking') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
}

const useAppStore = create<AppState>()()
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      apiStatus: 'checking',
      notifications: [],
      user: null,

      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      setApiStatus: (status) => set({ apiStatus: status }),

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      updateUserPreferences: (preferences) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                preferences: {
                  ...state.user.preferences,
                  ...preferences,
                },
              }
            : null,
        }));
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
      }),
    }
  );

export default useAppStore;