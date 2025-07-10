import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

interface HumanModel3DProps {
  user?: UserProfile | null;
  goalMeasurements?: Record<string, number>;
  showComparison?: boolean;
  interactive?: boolean;
  onMeasurementChange?: (measurements: Record<string, number>) => void;
}

// Calculate scale factors based on user data
function getScaleFactors(user?: UserProfile | null, goalMeasurements?: Record<string, number>, isGoal = false) {
  if (!user) return { chest: 1, waist: 1, arms: 1, legs: 1, shoulders: 1 };
  
  const baseHeight = 170; // cm
  const baseWeight = 70; // kg
  
  const heightFactor = (user.height || baseHeight) / baseHeight;
  const weightFactor = Math.sqrt((user.weight || baseWeight) / baseWeight);
  
  // Use goal measurements if this is a goal model
  const measurements = isGoal ? goalMeasurements : user.currentMeasurements;
  
  // Apply gender-based adjustments
  const genderMultiplier = user.gender === 'female' ? 0.9 : user.gender === 'male' ? 1.1 : 1.0;
  
  // Apply body composition effects
  const bodyFat = user.bodyComposition?.bodyFat || 20;
  const muscleMass = user.bodyComposition?.muscleMass || 40;
  
  const bodyFatFactor = 1 - (bodyFat - 15) / 100; // Less body fat = more defined
  const muscleFactor = 1 + (muscleMass - 40) / 100; // More muscle = bigger
  
  return {
    chest: (measurements?.chest || 50) / 50 * weightFactor * genderMultiplier * muscleFactor,
    waist: (measurements?.waist || 50) / 50 * weightFactor * bodyFatFactor,
    arms: (measurements?.arms || 50) / 50 * weightFactor * genderMultiplier * muscleFactor,
    legs: (measurements?.legs || 50) / 50 * weightFactor * muscleFactor,
    shoulders: (measurements?.shoulders || 50) / 50 * heightFactor * genderMultiplier,
  };
}

export default function HumanModel3D({
  user,
  goalMeasurements,
  showComparison = false,
  interactive = true,
  onMeasurementChange,
}: HumanModel3DProps) {
  // Always show fallback to avoid 3D dependency issues
  const scales = getScaleFactors(user, goalMeasurements, false);
  const goalScales = showComparison ? getScaleFactors(user, goalMeasurements, true) : null;
  
  return (
    <View style={styles.fallbackContainer}>
      <View style={styles.fallbackModel}>
        <Text style={styles.fallbackTitle}>Body Model Preview</Text>
        <Text style={styles.fallbackSubtitle}>
          {user?.gender === 'female' ? 'Female' : user?.gender === 'male' ? 'Male' : 'Human'} Model
        </Text>
        
        <View style={styles.modelVisualization}>
          {/* Current Model */}
          <View style={styles.modelColumn}>
            <Text style={styles.modelLabel}>Current</Text>
            <View style={styles.bodyParts}>
              <View style={[styles.bodyPart, styles.head]} />
              <View style={[styles.bodyPart, styles.torso, { 
                width: 60 * scales.chest, 
                height: 80 * scales.waist 
              }]} />
              <View style={styles.armsContainer}>
                <View style={[styles.bodyPart, styles.arm, { width: 8 * scales.arms }]} />
                <View style={[styles.bodyPart, styles.arm, { width: 8 * scales.arms }]} />
              </View>
              <View style={styles.legsContainer}>
                <View style={[styles.bodyPart, styles.leg, { width: 12 * scales.legs }]} />
                <View style={[styles.bodyPart, styles.leg, { width: 12 * scales.legs }]} />
              </View>
            </View>
          </View>
          
          {/* Goal Model (if comparison) */}
          {showComparison && goalScales && (
            <View style={styles.modelColumn}>
              <Text style={styles.modelLabel}>Goal</Text>
              <View style={styles.bodyParts}>
                <View style={[styles.bodyPart, styles.head, styles.goalModel]} />
                <View style={[styles.bodyPart, styles.torso, styles.goalModel, { 
                  width: 60 * goalScales.chest, 
                  height: 80 * goalScales.waist 
                }]} />
                <View style={styles.armsContainer}>
                  <View style={[styles.bodyPart, styles.arm, styles.goalModel, { width: 8 * goalScales.arms }]} />
                  <View style={[styles.bodyPart, styles.arm, styles.goalModel, { width: 8 * goalScales.arms }]} />
                </View>
                <View style={styles.legsContainer}>
                  <View style={[styles.bodyPart, styles.leg, styles.goalModel, { width: 12 * goalScales.legs }]} />
                  <View style={[styles.bodyPart, styles.leg, styles.goalModel, { width: 12 * goalScales.legs }]} />
                </View>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.fallbackStats}>
          <Text style={styles.fallbackStat}>Height: {user?.height || '--'} cm</Text>
          <Text style={styles.fallbackStat}>Weight: {user?.weight || '--'} kg</Text>
          {user?.bodyComposition?.bodyFat && (
            <Text style={styles.fallbackStat}>Body Fat: {user.bodyComposition.bodyFat}%</Text>
          )}
          {user?.bodyComposition?.muscleMass && (
            <Text style={styles.fallbackStat}>Muscle Mass: {user.bodyComposition.muscleMass}%</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackModel: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(59, 95, 227, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackTitle: {
    color: Colors.dark.accent,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    color: Colors.dark.text,
    fontSize: 16,
    marginBottom: 16,
  },
  modelVisualization: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modelColumn: {
    alignItems: 'center',
    flex: 1,
  },
  modelLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bodyParts: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'space-between',
  },
  bodyPart: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
  goalModel: {
    backgroundColor: Colors.dark.gradient.secondary,
    opacity: 0.8,
  },
  head: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  torso: {
    width: 60,
    height: 40,
    borderRadius: 8,
  },
  armsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
  },
  arm: {
    width: 8,
    height: 30,
    borderRadius: 4,
  },
  legsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 40,
  },
  leg: {
    width: 12,
    height: 35,
    borderRadius: 6,
  },
  fallbackStats: {
    alignItems: 'center',
  },
  fallbackStat: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginBottom: 2,
  },
});