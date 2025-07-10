import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import HumanModel3D from '@/components/HumanModel3D';
import { useAuthStore } from '@/store/auth-store';
import { BodyMeasurements } from '@/types/user';

export default function BodyModelScreen() {
  const { updateProfile, user, setInOnboarding } = useAuthStore();
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    chest: 50,
    waist: 50,
    hips: 50,
    arms: 50,
    legs: 50,
    shoulders: 50,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Set onboarding flag when component mounts
  useEffect(() => {
    console.log('Body model screen mounted, setting onboarding flag');
    setInOnboarding(true);
  }, [setInOnboarding]);

  const handleMeasurementsChange = (newMeasurements: Record<string, number>) => {
    setMeasurements(prev => ({
      ...prev,
      ...newMeasurements,
    }));
  };

  const handleNext = async () => {
    console.log('Body model handleNext called');
    console.log('Current user:', user);
    console.log('Measurements:', measurements);
    
    setIsLoading(true);
    
    try {
      // Ensure onboarding flag is set
      setInOnboarding(true);
      
      console.log('Updating current measurements...');
      
      updateProfile({
        currentMeasurements: measurements,
      });
      
      console.log('Current measurements updated, navigating to specific-goals...');
      
      // Navigate to specific goals page using replace to prevent navigation stack issues
      router.replace('/onboarding/specific-goals');
      
    } catch (error) {
      console.error('Error updating measurements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    console.log('Body model back button pressed');
    // Use replace to go back to body composition page
    router.replace('/onboarding/body-composition');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your 3D Body Model</Text>
          <Text style={styles.subtitle}>
            This model is generated based on your height, weight, and gender
          </Text>
        </View>

        <HumanModel3D 
          user={user}
          interactive={true}
          onMeasurementChange={handleMeasurementsChange}
        />

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Your Personalized Model</Text>
          <Text style={styles.instructionsText}>
            • This 3D model is created based on your physical characteristics
          </Text>
          <Text style={styles.instructionsText}>
            • It will be used to track your progress throughout your fitness journey
          </Text>
          <Text style={styles.instructionsText}>
            • You can rotate and zoom to view from different angles
          </Text>
          <Text style={styles.instructionsText}>
            • The model will update as you progress with your workouts
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            size="large"
            style={styles.button}
            disabled={isLoading}
          />
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="large"
            style={styles.button}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
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
  },
  header: {
    marginTop: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  instructionsContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingVertical: 24,
    gap: 16,
  },
  button: {
    flex: 1,
  },
});