import React, { useState } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

// Mock anchor points for the body model
type AnchorPoint = {
  x: number;
  y: number;
  label: string;
  value: number;
};

type AnchorsType = {
  shoulders: AnchorPoint;
  chest: AnchorPoint;
  arms: AnchorPoint;
  waist: AnchorPoint;
  legs: AnchorPoint;
};

const initialAnchors: AnchorsType = {
  shoulders: { x: 150, y: 100, label: 'Shoulders', value: 50 },
  chest: { x: 150, y: 140, label: 'Chest', value: 50 },
  arms: { x: 220, y: 140, label: 'Arms', value: 50 },
  waist: { x: 150, y: 200, label: 'Waist', value: 50 },
  legs: { x: 150, y: 280, label: 'Legs', value: 50 },
};

interface BodyModelCanvasProps {
  onMeasurementsChange?: (measurements: Record<string, number>) => void;
  readOnly?: boolean;
}

export default function BodyModelCanvas({ 
  onMeasurementsChange,
  readOnly = false
}: BodyModelCanvasProps) {
  const [anchors, setAnchors] = useState<AnchorsType>(initialAnchors);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      // Find which anchor was touched
      const { x0, y0 } = gestureState;
      const touchedAnchor = Object.entries(anchors).find(([_, anchor]) => {
        const distance = Math.sqrt(
          Math.pow(anchor.x - x0, 2) + Math.pow(anchor.y - y0, 2)
        );
        return distance < 30; // Touch radius
      });
      
      if (touchedAnchor) {
        setActiveAnchor(touchedAnchor[0]);
      }
    },
    onPanResponderMove: (_, gestureState) => {
      if (activeAnchor && !readOnly) {
        const { dx } = gestureState;
        
        setAnchors(prev => {
          const anchor = prev[activeAnchor as keyof AnchorsType];
          // Calculate new value based on drag (constrain between 0-100)
          const newValue = Math.min(Math.max(anchor.value + dx / 3, 0), 100);
          
          const updated = {
            ...prev,
            [activeAnchor]: {
              ...anchor,
              value: newValue,
            },
          };
          
          // Notify parent component of changes
          if (onMeasurementsChange) {
            const measurements = Object.entries(updated).reduce((acc, [key, anchor]) => {
              acc[key] = anchor.value;
              return acc;
            }, {} as Record<string, number>);
            
            onMeasurementsChange(measurements);
          }
          
          return updated;
        });
      }
    },
    onPanResponderRelease: () => {
      setActiveAnchor(null);
    },
  });

  // Draw the body model
  const renderBodyModel = () => {
    // This is a simplified representation
    return (
      <View style={styles.bodyModel}>
        {/* Head */}
        <View style={styles.head} />
        
        {/* Torso */}
        <View style={[
          styles.torso,
          {
            width: 80 + (anchors.chest.value - 50) * 1.2,
            height: 120 + (anchors.waist.value - 50) * 0.8,
          }
        ]} />
        
        {/* Arms */}
        <View style={[
          styles.leftArm,
          {
            width: 20 + (anchors.arms.value - 50) * 0.4,
            left: 40 - (anchors.chest.value - 50) * 0.6,
          }
        ]} />
        <View style={[
          styles.rightArm,
          {
            width: 20 + (anchors.arms.value - 50) * 0.4,
            right: 40 - (anchors.chest.value - 50) * 0.6,
          }
        ]} />
        
        {/* Legs */}
        <View style={[
          styles.leftLeg,
          {
            width: 30 + (anchors.legs.value - 50) * 0.5,
            left: 50 - (anchors.legs.value - 50) * 0.25,
          }
        ]} />
        <View style={[
          styles.rightLeg,
          {
            width: 30 + (anchors.legs.value - 50) * 0.5,
            right: 50 - (anchors.legs.value - 50) * 0.25,
          }
        ]} />
        
        {/* Grid overlay for the 3D effect */}
        <View style={styles.grid} />
      </View>
    );
  };

  // Render anchor points
  const renderAnchors = () => {
    return Object.entries(anchors).map(([key, anchor]) => (
      <View 
        key={key}
        style={[
          styles.anchor,
          {
            left: anchor.x,
            top: anchor.y,
            backgroundColor: activeAnchor === key ? Colors.dark.gradient.primary : Colors.dark.accent,
          }
        ]}
      >
        <Text style={styles.anchorLabel}>{anchor.label}</Text>
        <Text style={styles.anchorValue}>{Math.round(anchor.value)}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <LinearGradient
        colors={['rgba(59, 95, 227, 0.1)', 'rgba(123, 44, 191, 0.1)']}
        style={styles.gradient}
      >
        {renderBodyModel()}
        {!readOnly && renderAnchors()}
        
        {readOnly && (
          <View style={styles.readOnlyOverlay}>
            <Text style={styles.readOnlyText}>Model Preview</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyModel: {
    position: 'relative',
    width: 200,
    height: 350,
    alignItems: 'center',
  },
  head: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: 0,
  },
  torso: {
    width: 80,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: 50,
    borderRadius: 10,
  },
  leftArm: {
    width: 20,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: 60,
    left: 40,
    borderRadius: 10,
  },
  rightArm: {
    width: 20,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: 60,
    right: 40,
    borderRadius: 10,
  },
  leftLeg: {
    width: 30,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: 170,
    left: 50,
    borderRadius: 10,
  },
  rightLeg: {
    width: 30,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: 170,
    right: 50,
    borderRadius: 10,
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(59, 95, 227, 0.3)',
    borderRadius: 10,
  },
  anchor: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    opacity: 0.8,
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  anchorLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  anchorValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  readOnlyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readOnlyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});