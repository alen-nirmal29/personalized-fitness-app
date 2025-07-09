import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutPlan, WorkoutDifficulty, WorkoutDuration } from '@/types/workout';
import { SpecificGoal } from '@/types/user';

interface WorkoutStore {
  currentPlan: WorkoutPlan | null;
  recommendedPlans: WorkoutPlan[];
  isLoading: boolean;
  error: string | null;
  
  setCurrentPlan: (plan: WorkoutPlan) => void;
  generateWorkoutPlan: (specificGoal: SpecificGoal, duration: string, userDetails?: any) => Promise<void>;
  getRecommendedPlans: (specificGoal: SpecificGoal, userDetails?: any) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      currentPlan: null,
      recommendedPlans: [],
      isLoading: false,
      error: null,
      
      setCurrentPlan: (plan: WorkoutPlan) => {
        set({ currentPlan: plan });
      },
      
      generateWorkoutPlan: async (specificGoal: SpecificGoal, duration: string, userDetails?: any) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would call an AI service with user details
          // Simulating API delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Generate plan based on user details (height, weight, composition, etc.)
          const mockPlan: WorkoutPlan = {
            id: 'ai-generated-1',
            name: `Custom ${specificGoal.replace('_', ' ')} Plan`,
            description: `AI-generated workout plan for ${specificGoal.replace('_', ' ')} based on your body composition and goals`,
            difficulty: 'intermediate' as WorkoutDifficulty,
            duration: duration as WorkoutDuration,
            specificGoal,
            isAIGenerated: true,
            schedule: [
              {
                id: 'day-1',
                name: 'Day 1: Upper Body',
                exercises: [
                  {
                    id: 'ex-1',
                    name: 'Bench Press',
                    description: 'Lie on bench and press barbell upward',
                    muscleGroup: 'chest',
                    sets: 3,
                    reps: 10,
                    restTime: 90,
                  },
                  {
                    id: 'ex-2',
                    name: 'Pull-ups',
                    description: 'Pull your body up to the bar',
                    muscleGroup: 'back',
                    sets: 3,
                    reps: 8,
                    restTime: 90,
                  }
                ],
                restDay: false,
              },
              {
                id: 'day-2',
                name: 'Day 2: Lower Body',
                exercises: [
                  {
                    id: 'ex-3',
                    name: 'Squats',
                    description: 'Bend knees and lower body, then rise',
                    muscleGroup: 'legs',
                    sets: 4,
                    reps: 10,
                    restTime: 120,
                  },
                  {
                    id: 'ex-4',
                    name: 'Deadlifts',
                    description: 'Lift barbell from ground to hip level',
                    muscleGroup: 'back',
                    sets: 3,
                    reps: 8,
                    restTime: 120,
                  }
                ],
                restDay: false,
              },
              {
                id: 'day-3',
                name: 'Day 3: Rest',
                exercises: [],
                restDay: true,
              }
            ],
          };
          
          set({ 
            currentPlan: mockPlan,
            isLoading: false 
          });
        } catch (error) {
          set({
            error: 'Failed to generate workout plan',
            isLoading: false,
          });
        }
      },
      
      getRecommendedPlans: async (specificGoal: SpecificGoal, userDetails?: any) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call with user details
          // Simulating API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Generate recommendations based on user's height, weight, composition, etc.
          const mockPlans: WorkoutPlan[] = [
            {
              id: 'plan-1',
              name: '30-Day Strength Builder',
              description: 'Perfect for beginners looking to build strength based on your body composition',
              difficulty: 'beginner' as WorkoutDifficulty,
              duration: '1_month' as WorkoutDuration,
              specificGoal: 'increase_strength',
              isAIGenerated: false,
              schedule: [],
            },
            {
              id: 'plan-2',
              name: '90-Day Muscle Gain',
              description: 'Comprehensive plan for muscle growth tailored to your measurements',
              difficulty: 'intermediate' as WorkoutDifficulty,
              duration: '3_month' as WorkoutDuration,
              specificGoal: 'build_muscle',
              isAIGenerated: false,
              schedule: [],
            },
            {
              id: 'plan-3',
              name: '6-Month Body Transformation',
              description: 'Complete body transformation program based on your current physique',
              difficulty: 'advanced' as WorkoutDifficulty,
              duration: '6_month' as WorkoutDuration,
              specificGoal: 'weight_loss',
              isAIGenerated: false,
              schedule: [],
            },
          ].filter(plan => 
            plan.specificGoal === specificGoal || 
            specificGoal === 'personal_training'
          );
          
          set({ 
            recommendedPlans: mockPlans,
            isLoading: false 
          });
        } catch (error) {
          set({
            error: 'Failed to fetch recommended plans',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);