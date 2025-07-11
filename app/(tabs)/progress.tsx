import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, Calendar, Scale, Ruler } from 'lucide-react-native';
import { SpecificGoal } from '@/types/user';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import Human2DModel from '@/components/Human2DModel';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutSessionStore } from '@/store/workout-session-store';
import { useWorkoutStore } from '@/store/workout-store';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const { workoutStats, completedWorkouts } = useWorkoutSessionStore();
  const { currentPlan, workoutProgress, progressMeasurements, generateProgressMeasurements } = useWorkoutStore();

  // Mock goal measurements for demonstration
  const goalMeasurements = {
    chest: 55,
    waist: 45,
    hips: 50,
    arms: 55,
    legs: 55,
    shoulders: 55,
  };

  // Calculate real progress based on completed workouts
  const getWeightProgress = () => {
    // Mock weight loss based on workouts completed
    const initialWeight = user?.weight || 80;
    const weightLoss = workoutStats.totalWorkouts * 0.2; // 0.2kg per workout
    const currentWeight = Math.max(initialWeight - weightLoss, initialWeight * 0.85);
    const goalWeight = initialWeight * 0.9; // 10% weight loss goal
    
    return {
      current: Math.round(currentWeight * 10) / 10,
      goal: Math.round(goalWeight * 10) / 10,
      progress: Math.min((initialWeight - currentWeight) / (initialWeight - goalWeight), 1),
    };
  };

  const getBodyFatProgress = () => {
    const initialBodyFat = user?.bodyComposition?.bodyFat || 20;
    const bodyFatReduction = workoutStats.totalWorkouts * 0.1; // 0.1% per workout
    const currentBodyFat = Math.max(initialBodyFat - bodyFatReduction, initialBodyFat * 0.75);
    const goalBodyFat = initialBodyFat * 0.8; // 20% reduction goal
    
    return {
      current: Math.round(currentBodyFat * 10) / 10,
      goal: Math.round(goalBodyFat * 10) / 10,
      progress: Math.min((initialBodyFat - currentBodyFat) / (initialBodyFat - goalBodyFat), 1),
    };
  };

  const getMeasurementProgress = (measurement: string, initialValue: number, goalValue: number) => {
    const workoutEffect = workoutStats.totalWorkouts * 0.1; // 0.1cm per workout
    const currentValue = measurement === 'waist' 
      ? Math.max(initialValue - workoutEffect, goalValue)
      : Math.min(initialValue + workoutEffect, goalValue);
    
    const progress = measurement === 'waist'
      ? (initialValue - currentValue) / (initialValue - goalValue)
      : (currentValue - initialValue) / (goalValue - initialValue);
    
    return {
      current: Math.round(currentValue * 10) / 10,
      goal: goalValue,
      progress: Math.min(Math.max(progress, 0), 1),
    };
  };

  const weightProgress = getWeightProgress();
  const bodyFatProgress = getBodyFatProgress();
  
  // Calculate overall workout plan progress
  const planProgress = currentPlan ? (workoutProgress[currentPlan.id] || 0) : 0;
  
  // Generate progress measurements if we have a current plan and progress
  React.useEffect(() => {
    if (currentPlan && planProgress > 0 && user?.currentMeasurements && !progressMeasurements) {
      const currentMeasurements = {
        shoulders: user.currentMeasurements.shoulders,
        chest: user.currentMeasurements.chest,
        arms: user.currentMeasurements.arms,
        waist: user.currentMeasurements.waist,
        legs: user.currentMeasurements.legs,
      };
      generateProgressMeasurements(currentMeasurements, currentPlan.specificGoal as SpecificGoal, planProgress);
    }
  }, [currentPlan, planProgress, user?.currentMeasurements, progressMeasurements, generateProgressMeasurements]);
  
  // Mock measurement progress
  const chestProgress = getMeasurementProgress('chest', 90, 100);
  const waistProgress = getMeasurementProgress('waist', 90, 80);
  const armsProgress = getMeasurementProgress('arms', 30, 38);

  // Calculate strength progress for specific exercises
  const getExerciseProgress = (exerciseName: string, initialWeight: number) => {
    const strengthGain = workoutStats.totalWorkouts * 2.5; // 2.5kg per workout
    const currentWeight = initialWeight + strengthGain;
    const progress = strengthGain / (initialWeight * 0.5); // 50% increase goal
    
    return {
      initial: initialWeight,
      current: Math.round(currentWeight),
      progress: Math.min(progress, 1),
    };
  };

  const benchProgress = getExerciseProgress('Bench Press', 60);
  const squatProgress = getExerciseProgress('Squat', 80);
  const deadliftProgress = getExerciseProgress('Deadlift', 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Weekly Summary</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>{workoutStats.weeklyWorkouts}/7</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          
          <View style={styles.statItem}>
            <TrendingUp size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>+{workoutStats.strengthIncrease}%</Text>
            <Text style={styles.statLabel}>Strength</Text>
          </View>
          
          <View style={styles.statItem}>
            <Scale size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>-{Math.round((user?.weight || 80) - weightProgress.current)}kg</Text>
            <Text style={styles.statLabel}>Weight</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Body Transformation</Text>
      
      {/* Show progress comparison if we have progress measurements */}
      {progressMeasurements && planProgress > 0 ? (
        <View style={styles.modelContainer}>
          <View style={styles.modelHeader}>
            <Text style={styles.modelTitle}>Your Progress ({Math.round(planProgress)}% Complete)</Text>
            <Text style={styles.modelSubtitle}>
              See how your body has transformed after completing {Math.round(planProgress)}% of your workout plan
            </Text>
          </View>
          
          <Human2DModel 
            user={user}
            progressMeasurements={progressMeasurements}
            showProgress={true}
            interactive={false}
          />
        </View>
      ) : (
        <View style={styles.modelContainer}>
          <View style={styles.modelHeader}>
            <Text style={styles.modelTitle}>Current vs. Goal</Text>
            <Text style={styles.modelSubtitle}>
              Compare your current body model with your goal
            </Text>
          </View>
          
          <Human2DModel 
            user={user}
            goalMeasurements={goalMeasurements}
            showComparison={true}
            interactive={false}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Measurements Progress</Text>
      
      <Card style={styles.measurementsCard}>
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Weight</Text>
            </View>
            <Text style={styles.measurementValue}>{weightProgress.current}kg / {weightProgress.goal}kg Goal</Text>
          </View>
          <ProgressBar progress={weightProgress.progress} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Body Fat</Text>
            </View>
            <Text style={styles.measurementValue}>{bodyFatProgress.current}% / {bodyFatProgress.goal}% Goal</Text>
          </View>
          <ProgressBar progress={bodyFatProgress.progress} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Chest</Text>
            </View>
            <Text style={styles.measurementValue}>{chestProgress.current}cm / {chestProgress.goal}cm Goal</Text>
          </View>
          <ProgressBar progress={chestProgress.progress} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Waist</Text>
            </View>
            <Text style={styles.measurementValue}>{waistProgress.current}cm / {waistProgress.goal}cm Goal</Text>
          </View>
          <ProgressBar progress={waistProgress.progress} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Arms</Text>
            </View>
            <Text style={styles.measurementValue}>{armsProgress.current}cm / {armsProgress.goal}cm Goal</Text>
          </View>
          <ProgressBar progress={armsProgress.progress} height={6} />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Workout Performance</Text>
      
      <Card style={styles.performanceCard}>
        <Text style={styles.performanceTitle}>Strength Progress</Text>
        <Text style={styles.performanceSubtitle}>
          Your strength has increased by {workoutStats.strengthIncrease}% based on {workoutStats.totalWorkouts} completed workouts
        </Text>
        
        <View style={styles.exerciseProgressContainer}>
          <View style={styles.exerciseProgress}>
            <Text style={styles.exerciseName}>Bench Press</Text>
            <View style={styles.exerciseValues}>
              <Text style={styles.exerciseStartValue}>{benchProgress.initial}kg</Text>
              <View style={styles.exerciseProgressBar}>
                <View style={[styles.exerciseProgressFill, { width: `${benchProgress.progress * 100}%` }]} />
              </View>
              <Text style={styles.exerciseCurrentValue}>{benchProgress.current}kg</Text>
            </View>
          </View>
          
          <View style={styles.exerciseProgress}>
            <Text style={styles.exerciseName}>Squat</Text>
            <View style={styles.exerciseValues}>
              <Text style={styles.exerciseStartValue}>{squatProgress.initial}kg</Text>
              <View style={styles.exerciseProgressBar}>
                <View style={[styles.exerciseProgressFill, { width: `${squatProgress.progress * 100}%` }]} />
              </View>
              <Text style={styles.exerciseCurrentValue}>{squatProgress.current}kg</Text>
            </View>
          </View>
          
          <View style={styles.exerciseProgress}>
            <Text style={styles.exerciseName}>Deadlift</Text>
            <View style={styles.exerciseValues}>
              <Text style={styles.exerciseStartValue}>{deadliftProgress.initial}kg</Text>
              <View style={styles.exerciseProgressBar}>
                <View style={[styles.exerciseProgressFill, { width: `${deadliftProgress.progress * 100}%` }]} />
              </View>
              <Text style={styles.exerciseCurrentValue}>{deadliftProgress.current}kg</Text>
            </View>
          </View>
        </View>
      </Card>

      {completedWorkouts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <Card style={styles.recentWorkoutsCard}>
            {completedWorkouts.slice(0, 5).map((workout) => (
              <View key={workout.id} style={styles.recentWorkoutItem}>
                <View style={styles.recentWorkoutHeader}>
                  <Text style={styles.recentWorkoutName}>{workout.workoutName}</Text>
                  <Text style={styles.recentWorkoutDate}>
                    {new Date(workout.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.recentWorkoutStats}>
                  {workout.duration} min • {workout.exercisesCompleted} exercises • {workout.caloriesBurned} cal
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  summaryCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.subtext,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  modelContainer: {
    marginBottom: 24,
  },
  modelHeader: {
    marginBottom: 16,
  },
  modelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  modelSubtitle: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  measurementsCard: {
    marginBottom: 24,
  },
  measurementItem: {
    marginBottom: 16,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  measurementTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurementTitle: {
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: 8,
  },
  measurementValue: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  performanceCard: {
    marginBottom: 24,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  performanceSubtitle: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  exerciseProgressContainer: {
    marginTop: 8,
  },
  exerciseProgress: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  exerciseValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseStartValue: {
    fontSize: 14,
    color: Colors.dark.subtext,
    width: 40,
  },
  exerciseProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.ui.border,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  exerciseProgressFill: {
    height: 8,
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
  exerciseCurrentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.text,
    width: 40,
    textAlign: 'right',
  },
  recentWorkoutsCard: {
    marginBottom: 24,
  },
  recentWorkoutItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  recentWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentWorkoutName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  recentWorkoutDate: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  recentWorkoutStats: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
});