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

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { currentPlan } = useWorkoutStore();

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
    // Navigate to workout session
    console.log('Starting workout...');
  };

  const handleCreateWorkoutPlan = () => {
    router.push('/workout/plan-selection');
  };

  const handleViewComparison = () => {
    // Navigate to body comparison screen
    router.push('/(tabs)/progress');
  };

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
          <ProgressBar progress={0.6} showPercentage />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>4/7</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          
          <View style={styles.statItem}>
            <Dumbbell size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          
          <View style={styles.statItem}>
            <TrendingUp size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>+5%</Text>
            <Text style={styles.statLabel}>Strength</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Today's Workout</Text>
      
      {currentPlan ? (
        <Card style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>Upper Body Strength</Text>
            <View style={styles.workoutBadge}>
              <Text style={styles.workoutBadgeText}>45 min</Text>
            </View>
          </View>
          
          <Text style={styles.workoutDescription}>
            Focus on chest, shoulders, and triceps with compound movements
          </Text>
          
          <View style={styles.exerciseList}>
            <View style={styles.exerciseItem}>
              <Dumbbell size={16} color={Colors.dark.accent} />
              <Text style={styles.exerciseName}>Bench Press</Text>
              <Text style={styles.exerciseDetails}>3 × 10</Text>
            </View>
            
            <View style={styles.exerciseItem}>
              <Dumbbell size={16} color={Colors.dark.accent} />
              <Text style={styles.exerciseName}>Shoulder Press</Text>
              <Text style={styles.exerciseDetails}>3 × 12</Text>
            </View>
            
            <View style={styles.exerciseItem}>
              <Dumbbell size={16} color={Colors.dark.accent} />
              <Text style={styles.exerciseName}>Tricep Extensions</Text>
              <Text style={styles.exerciseDetails}>3 × 15</Text>
            </View>
          </View>
          
          <Button
            title="Start Workout"
            onPress={handleStartWorkout}
            variant="primary"
            style={styles.startButton}
          />
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
  startButton: {
    marginTop: 8,
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