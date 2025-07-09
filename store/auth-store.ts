import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, UserProfile } from '@/types/user';

interface AuthStore extends AuthState {
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      user: null,
      error: null,

      initialize: () => {
        set({ isInitialized: true });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // Simulating API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful login
          const user: UserProfile = {
            id: '1',
            email,
            name: 'User',
            hasCompletedOnboarding: false,
          };
          
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: 'Invalid email or password',
            isLoading: false,
          });
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // Simulating API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful signup
          const user: UserProfile = {
            id: '1',
            email,
            name,
            hasCompletedOnboarding: false,
          };
          
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: 'Failed to create account',
            isLoading: false,
          });
        }
      },

      logout: async () => {
        try {
          // Clear all auth state first
          set({
            isAuthenticated: false,
            user: null,
            error: null,
            isLoading: false,
          });
          
          // Clear persisted storage
          await AsyncStorage.removeItem('auth-storage');
        } catch (error) {
          console.error('Logout error:', error);
          // Force clear state even if storage clear fails
          set({
            isAuthenticated: false,
            user: null,
            error: null,
            isLoading: false,
          });
        }
      },

      updateProfile: (profile: Partial<UserProfile>) => {
        const { user } = get();
        if (user) {
          const updatedUser = {
            ...user,
            ...profile,
          };
          
          set({
            user: updatedUser,
          });
          
          console.log('Profile updated:', updatedUser);
        }
      },

      completeOnboarding: () => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              hasCompletedOnboarding: true,
            },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Called when the persisted state is loaded
        if (state) {
          state.initialize();
        }
      },
    }
  )
);