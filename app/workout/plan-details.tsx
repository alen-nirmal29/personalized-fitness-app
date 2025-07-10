import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Calendar, Clock, ArrowRight, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import HumanModel3D from '@/components/HumanModel3D';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';

export default function PlanDetailsScreen() {
  const { currentPlan } = useWorkoutStore();
  const { user } = useAuthStore();

  if (!currentPlan) {
    router.replace('/workout/plan-selection');
    return null;
  }

  const getDurationText = (duration: string) => {
    switch (duration) {
      case '1_month':
        return '1 Month';
      case '3_month':
        return '3 Months';
      case '6_month':
        return '6 Months';
      case '1_year':
        return '1 Year';
      default:
        return duration;
    }
  };

  const handleStartPlan = () => {
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.replace('/workout/plan-selection');
  };

  // Mock goal measurements based on the workout plan
  const getGoalMeasurements = () => {
    const current = user?.currentMeasurements || {
      chest: 50, waist: 50, hips: 50, arms: 50, legs: 50, shoulders: 50
    };

    switch (currentPlan.specificGoal) {
      case 'build_muscle':
        return {
          chest: current.chest + 5,
          waist: current.waist,
          hips: current.hips,
          arms: current.arms + 5,
          legs: current.legs + 5,
          shoulders: current.shoulders + 5,
        };
      case 'weight_loss':
        return {
          chest: current.chest - 2,
          waist: current.waist - 5,
          hips: current.hips - 3,
          arms: current.arms,
          legs: current.legs,
          shoulders: current.shoulders,
        };
      case 'increase_strength':
        return {
          chest: current.chest + 3,
          waist: current.waist - 2,
          hips: current.hips,
          arms: current.arms + 3,
          legs: current.legs + 3,
          shoulders: current.shoulders + 3,
        };
      default:
        return current;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentPlan.name}</Text>
          <Text style={styles.subtitle}>{currentPlan.description}</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Calendar size={16} color={Colors.dark.subtext} />
              <Text style={styles.infoText}>{getDurationText(currentPlan.duration)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Clock size={16} color={Colors.dark.subtext} />
              <Text style={styles.infoText}>
                {currentPlan.schedule.length} {currentPlan.schedule.length === 1 ? 'Day' : 'Days'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.scheduleContainer}>
          <Text style={styles.sectionTitle}>Workout Schedule</Text>
          
          {currentPlan.schedule.map((day, index) => (
            <Card key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day.name}</Text>
                {day.restDay && (
                  <View style={styles.restBadge}>
                    <Text style={styles.restText}>Rest Day</Text>
                  </View>
                )}
              </View>
              
              {!day.restDay && (
                <View style={styles.exercisesList}>
                  {day.exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseItem}>
                      <CheckCircle size={16} color={Colors.dark.accent} />
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseInfo}>
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {index < currentPlan.schedule.length - 1 && (
                <TouchableOpacity style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>View Details</Text>
                  <ArrowRight size={16} color={Colors.dark.accent} />
                </TouchableOpacity>
              )}
            </Card>
          ))}
        </View>

        <View style={styles.modelContainer}>
          <Text style={styles.sectionTitle}>Expected Body Transformation</Text>
          <Card style={styles.modelCard}>
            <Text style={styles.modelText}>
              Based on your goals and this workout plan, here's how your body could transform over time.
            </Text>
            
            <HumanModel3D 
              user={user}
              goalMeasurements={getGoalMeasurements()}
              showComparison={true}
              interactive={true}
            />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Back"
          onPress={handleBack}
          variant="outline"
          size="large"
          style={styles.button}
        />
        <Button
          title="Start Plan"
          onPress={handleStartPlan}
          variant="primary"
          size="large"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginLeft: 4,
  },
  scheduleContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  dayCard: {
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  restBadge: {
    backgroundColor: 'rgba(59, 95, 227, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  exercisesList: {
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseDetails: {
    marginLeft: 8,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  exerciseInfo: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewMoreText: {
    color: Colors.dark.accent,
    marginRight: 4,
    fontWeight: '500',
  },
  modelContainer: {
    marginBottom: 24,
  },
  modelCard: {
    padding: 16,
  },
  modelText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
  },
});