import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function WorkoutsScreen() {
  const handlePreviousWeek = () => {
    console.log('Previous week');
  };

  const handleNextWeek = () => {
    console.log('Next week');
  };

  const handleStartWorkout = () => {
    console.log('Starting workout...');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Schedule</Text>
        <Text style={styles.subtitle}>Your weekly workout plan</Text>
      </View>

      <View style={styles.calendarHeader}>
        <Button
          title=""
          onPress={handlePreviousWeek}
          variant="outline"
          size="small"
          style={styles.calendarButton}
          leftIcon={<ChevronLeft size={20} color={Colors.dark.accent} />}
        />
        
        <View style={styles.calendarTitleContainer}>
          <CalendarIcon size={20} color={Colors.dark.text} />
          <Text style={styles.calendarTitle}>July 7 - July 13, 2025</Text>
        </View>
        
        <Button
          title=""
          onPress={handleNextWeek}
          variant="outline"
          size="small"
          style={styles.calendarButton}
          leftIcon={<ChevronRight size={20} color={Colors.dark.accent} />}
        />
      </View>

      <View style={styles.daysContainer}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <View 
            key={day} 
            style={[
              styles.dayItem, 
              index === 0 && styles.activeDayItem
            ]}
          >
            <Text style={[styles.dayText, index === 0 && styles.activeDayText]}>
              {day}
            </Text>
            <Text style={[styles.dateText, index === 0 && styles.activeDateText]}>
              {7 + index}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Today's Workouts</Text>

      <Card style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutTitleContainer}>
            <Dumbbell size={20} color={Colors.dark.accent} />
            <Text style={styles.workoutTitle}>Upper Body Strength</Text>
          </View>
          <View style={styles.workoutBadge}>
            <Text style={styles.workoutBadgeText}>45 min</Text>
          </View>
        </View>
        
        <View style={styles.workoutDetails}>
          <Text style={styles.workoutTime}>9:00 AM</Text>
          <Text style={styles.workoutDescription}>
            Focus on chest, shoulders, and triceps with compound movements
          </Text>
        </View>
        
        <Button
          title="Start Workout"
          onPress={handleStartWorkout}
          variant="primary"
          style={styles.startButton}
        />
      </Card>

      <Card style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutTitleContainer}>
            <Dumbbell size={20} color={Colors.dark.accent} />
            <Text style={styles.workoutTitle}>Core Conditioning</Text>
          </View>
          <View style={styles.workoutBadge}>
            <Text style={styles.workoutBadgeText}>30 min</Text>
          </View>
        </View>
        
        <View style={styles.workoutDetails}>
          <Text style={styles.workoutTime}>5:00 PM</Text>
          <Text style={styles.workoutDescription}>
            Strengthen your core with a series of targeted exercises
          </Text>
        </View>
        
        <Button
          title="Start Workout"
          onPress={handleStartWorkout}
          variant="primary"
          style={styles.startButton}
        />
      </Card>

      <Text style={styles.sectionTitle}>Upcoming Workouts</Text>

      <Card style={styles.upcomingCard}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingDay}>Tuesday</Text>
          <Text style={styles.upcomingDate}>July 8</Text>
        </View>
        
        <View style={styles.upcomingWorkout}>
          <View style={styles.upcomingWorkoutHeader}>
            <Text style={styles.upcomingWorkoutTitle}>Lower Body Strength</Text>
            <Text style={styles.upcomingWorkoutTime}>10:00 AM</Text>
          </View>
          <Text style={styles.upcomingWorkoutDescription}>
            Focus on legs and glutes with compound movements
          </Text>
        </View>
      </Card>

      <Card style={styles.upcomingCard}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingDay}>Wednesday</Text>
          <Text style={styles.upcomingDate}>July 9</Text>
        </View>
        
        <View style={styles.upcomingWorkout}>
          <View style={styles.upcomingWorkoutHeader}>
            <Text style={styles.upcomingWorkoutTitle}>Rest Day</Text>
            <Text style={styles.upcomingWorkoutTime}>All Day</Text>
          </View>
          <Text style={styles.upcomingWorkoutDescription}>
            Take a day off to recover and let your muscles rebuild
          </Text>
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarButton: {
    width: 40,
    height: 40,
    padding: 0,
  },
  calendarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    width: 40,
  },
  activeDayItem: {
    backgroundColor: Colors.dark.accent,
  },
  dayText: {
    fontSize: 12,
    color: Colors.dark.subtext,
    marginBottom: 4,
  },
  activeDayText: {
    color: '#fff',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  activeDateText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  workoutCard: {
    marginBottom: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
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
  workoutDetails: {
    marginBottom: 16,
  },
  workoutTime: {
    fontSize: 14,
    color: Colors.dark.accent,
    marginBottom: 4,
    fontWeight: '500',
  },
  workoutDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  startButton: {
    marginTop: 8,
  },
  upcomingCard: {
    marginBottom: 16,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  upcomingDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  upcomingDate: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  upcomingWorkout: {
    marginBottom: 8,
  },
  upcomingWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingWorkoutTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  upcomingWorkoutTime: {
    fontSize: 14,
    color: Colors.dark.accent,
  },
  upcomingWorkoutDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
});