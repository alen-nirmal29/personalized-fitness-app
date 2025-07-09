import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, Calendar, Scale, Ruler } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import HumanModel3D from '@/components/HumanModel3D';
import { useAuthStore } from '@/store/auth-store';

export default function ProgressScreen() {
  const { user } = useAuthStore();

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
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Weekly Summary</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>5/7</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          
          <View style={styles.statItem}>
            <TrendingUp size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>+8%</Text>
            <Text style={styles.statLabel}>Strength</Text>
          </View>
          
          <View style={styles.statItem}>
            <Scale size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>-2kg</Text>
            <Text style={styles.statLabel}>Weight</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Body Transformation</Text>
      
      <View style={styles.modelContainer}>
        <View style={styles.modelHeader}>
          <Text style={styles.modelTitle}>Current vs. Goal</Text>
          <Text style={styles.modelSubtitle}>
            Compare your current body model with your goal
          </Text>
        </View>
        
        <HumanModel3D 
          user={user}
          goalMeasurements={goalMeasurements}
          showComparison={true}
          interactive={true}
        />
      </View>

      <Text style={styles.sectionTitle}>Measurements Progress</Text>
      
      <Card style={styles.measurementsCard}>
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Weight</Text>
            </View>
            <Text style={styles.measurementValue}>78kg / 75kg Goal</Text>
          </View>
          <ProgressBar progress={0.7} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Body Fat</Text>
            </View>
            <Text style={styles.measurementValue}>18% / 15% Goal</Text>
          </View>
          <ProgressBar progress={0.6} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Chest</Text>
            </View>
            <Text style={styles.measurementValue}>95cm / 100cm Goal</Text>
          </View>
          <ProgressBar progress={0.8} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Waist</Text>
            </View>
            <Text style={styles.measurementValue}>85cm / 80cm Goal</Text>
          </View>
          <ProgressBar progress={0.5} height={6} />
        </View>
        
        <View style={styles.measurementItem}>
          <View style={styles.measurementHeader}>
            <View style={styles.measurementTitleContainer}>
              <Ruler size={16} color={Colors.dark.accent} />
              <Text style={styles.measurementTitle}>Arms</Text>
            </View>
            <Text style={styles.measurementValue}>35cm / 38cm Goal</Text>
          </View>
          <ProgressBar progress={0.65} height={6} />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Workout Performance</Text>
      
      <Card style={styles.performanceCard}>
        <Text style={styles.performanceTitle}>Strength Progress</Text>
        <Text style={styles.performanceSubtitle}>
          Your strength has increased by 8% in the last 30 days
        </Text>
        
        <View style={styles.exerciseProgressContainer}>
          <View style={styles.exerciseProgress}>
            <Text style={styles.exerciseName}>Bench Press</Text>
            <View style={styles.exerciseValues}>
              <Text style={styles.exerciseStartValue}>60kg</Text>
              <View style={styles.exerciseProgressBar}>
                <View style={[styles.exerciseProgressFill, { width: '80%' }]} />
              </View>
              <Text style={styles.exerciseCurrentValue}>75kg</Text>
            </View>
          </View>
          
          <View style={styles.exerciseProgress}>
            <Text style={styles.exerciseName}>Squat</Text>
            <View style={styles.exerciseValues}>
              <Text style={styles.exerciseStartValue}>80kg</Text>
              <View style={styles.exerciseProgressBar}>
                <View style={[styles.exerciseProgressFill, { width: '70%' }]} />
              </View>
              <Text style={styles.exerciseCurrentValue}>95kg</Text>
            </View>
          </View>
          
          <View style={styles.exerciseProgress}>
            <Text style={styles.exerciseName}>Deadlift</Text>
            <View style={styles.exerciseValues}>
              <Text style={styles.exerciseStartValue}>100kg</Text>
              <View style={styles.exerciseProgressBar}>
                <View style={[styles.exerciseProgressFill, { width: '60%' }]} />
              </View>
              <Text style={styles.exerciseCurrentValue}>115kg</Text>
            </View>
          </View>
        </View>
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
});