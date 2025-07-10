import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Dumbbell, Calendar, TrendingUp, Award } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import HumanModel3D from '@/components/HumanModel3D';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { useWorkoutSessionStore } from '@/store/workout-session-store';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { currentPlan } = useWorkoutStore();
  const { workoutStats, getTodayWorkouts } = useWorkoutSessionStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGoalText = () => {
    if (!user?.specificGoal) return 'Set your fitness goals';
    
    switch (user.specificGoal) {
      case 'increase_strength':
        return 'Increase Strength';
      case 'build_muscle':
        return 'Build Muscle';
      case 'weight_loss':
        return 'Weight Loss';
      case 'weight_gain':
        return 'Weight Gain';
      case 'personal_training':
        return 'Personal Training';
      default:
        return 'Your Fitness Journey';
    }
  };

  const handleStartWorkout = () => {
    router.push('/workout/session');
  };

  const handleCreateWorkoutPlan = () => {
    router.push('/workout/plan-selection');
  };

  const handleViewComparison = () => {
    router.push('/(tabs)/progress');
  };

  // Calculate weekly progress based on real data
  const weeklyProgress = workoutStats.weeklyWorkouts / 7; // Assuming 7 workouts per week goal
  const todayWorkouts = getTodayWorkouts();

  // Mock goal measurements for demonstration
  const goalMeasurements = {
    chest: 55,
    waist: 45,
    hips: 50,
    arms: 55,
    legs: 55,
    shoulders: 55,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Current Goal</Text>
          <View style={styles.goalBadge}>
            <Text style={styles.goalText}>{getGoalText()}</Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Weekly Progress</Text>
          <ProgressBar progress={Math.min(weeklyProgress, 1)} showPercentage />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>{workoutStats.weeklyWorkouts}/7</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          
          <View style={styles.statItem}>
            <Dumbbell size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>{workoutStats.totalExercises}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          
          <View style={styles.statItem}>
            <TrendingUp size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>+{workoutStats.strengthIncrease}%</Text>
            <Text style={styles.statLabel}>Strength</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Today's Workout</Text>
      
      {currentPlan && currentPlan.schedule.length > 0 ? (
        <Card style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>{currentPlan.schedule[0].name}</Text>
            <View style={styles.workoutBadge}>
              <Text style={styles.workoutBadgeText}>45 min</Text>
            </View>
          </View>
          
          <Text style={styles.workoutDescription}>
            {currentPlan.schedule[0].restDay 
              ? 'Take a well-deserved rest day to recover'
              : `${currentPlan.schedule[0].exercises.length} exercises planned for today`
            }
          </Text>
          
          {!currentPlan.schedule[0].restDay && (
            <>
              <View style={styles.exerciseList}>
                {currentPlan.schedule[0].exercises.slice(0, 3).map((exercise, index) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <Dumbbell size={16} color={Colors.dark.accent} />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>{exercise.sets} × {exercise.reps}</Text>
                  </View>
                ))}
                {currentPlan.schedule[0].exercises.length > 3 && (
                  <Text style={styles.moreExercises}>
                    +{currentPlan.schedule[0].exercises.length - 3} more exercises
                  </Text>
                )}
              </View>
              
              <Button
                title={todayWorkouts.length > 0 ? "Start Another Workout" : "Start Workout"}
                onPress={handleStartWorkout}
                variant="primary"
                style={styles.startButton}
              />
            </>
          )}
          
          {todayWorkouts.length > 0 && (
            <View style={styles.todayStats}>
              <Text style={styles.todayStatsTitle}>Today's Progress</Text>
              <Text style={styles.todayStatsText}>
                ✅ {todayWorkouts.length} workout{todayWorkouts.length > 1 ? 's' : ''} completed
              </Text>
              <Text style={styles.todayStatsText}>
                🔥 {todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0)} calories burned
              </Text>
            </View>
          )}
        </Card>
      ) : (
        <Card style={styles.emptyWorkoutCard}>
          <Award size={40} color={Colors.dark.accent} />
          <Text style={styles.emptyWorkoutTitle}>No Workout Scheduled</Text>
          <Text style={styles.emptyWorkoutText}>
            You don't have any workouts scheduled for today. Take a rest or create a new workout plan.
          </Text>
          <Button
            title="Create Workout Plan"
            onPress={handleCreateWorkoutPlan}
            variant="outline"
            style={styles.createButton}
          />
        </Card>
      )}

      <Text style={styles.sectionTitle}>Body Transformation</Text>
      
      <Card style={styles.transformationCard}>
        <Text style={styles.transformationText}>
          Track your progress and see how your body transforms over time
        </Text>
        
        <HumanModel3D 
          user={user}
          goalMeasurements={goalMeasurements}
          showComparison={true}
          interactive={false}
        />
        
        <Button
          title="View Full Comparison"
          onPress={handleViewComparison}
          variant="outline"
          style={styles.viewButton}
        />
      </Card>
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
  greeting: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  goalBadge: {
    backgroundColor: 'rgba(59, 95, 227, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
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
  workoutCard: {
    marginBottom: 24,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  workoutBadge: {
    backgroundColor: 'rgba(255, 77, 109, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutBadgeText: {
    color: Colors.dark.gradient.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  exerciseList: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: 8,
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  moreExercises: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontStyle: 'italic',
    marginTop: 4,
  },
  startButton: {
    marginTop: 8,
  },
  todayStats: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  todayStatsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.success,
    marginBottom: 4,
  },
  todayStatsText: {
    fontSize: 12,
    color: Colors.dark.success,
    marginBottom: 2,
  },
  emptyWorkoutCard: {
    marginBottom: 24,
    alignItems: 'center',
    padding: 24,
  },
  emptyWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyWorkoutText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  createButton: {
    marginTop: 8,
  },
  transformationCard: {
    marginBottom: 24,
  },
  transformationText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  viewButton: {
    marginTop: 16,
  },
});