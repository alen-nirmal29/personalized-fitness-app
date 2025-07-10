import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, PanResponder, Dimensions, Animated } from 'react-native';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

interface HumanModel3DProps {
  user?: UserProfile | null;
  goalMeasurements?: Record<string, number>;
  showComparison?: boolean;
  interactive?: boolean;
  onMeasurementChange?: (measurements: Record<string, number>) => void;
}

type AnchorPoint = {
  name: string;
  position: { x: number; y: number; z: number };
  value: number;
  min: number;
  max: number;
};

// Calculate realistic proportions based on user data
function calculateProportions(user?: UserProfile | null) {
  if (!user) {
    return {
      height: 1.7,
      shoulderWidth: 0.45,
      chestDepth: 0.25,
      waistWidth: 0.35,
      armLength: 0.6,
      legLength: 0.9,
      headSize: 0.22,
    };
  }

  const heightM = (user.height || 170) / 100;
  const weight = user.weight || 70;
  const bmi = weight / (heightM * heightM);
  
  // Gender-based proportions
  const isFemale = user.gender === 'female';
  const isMale = user.gender === 'male';
  
  // Base proportions (relative to height)
  let shoulderWidthRatio = isFemale ? 0.24 : isMale ? 0.28 : 0.26;
  let waistWidthRatio = isFemale ? 0.22 : isMale ? 0.24 : 0.23;
  let chestDepthRatio = isFemale ? 0.12 : isMale ? 0.16 : 0.14;
  
  // Adjust for BMI
  const bmiAdjustment = Math.max(0.8, Math.min(1.3, bmi / 22));
  shoulderWidthRatio *= bmiAdjustment;
  waistWidthRatio *= bmiAdjustment;
  chestDepthRatio *= bmiAdjustment;
  
  // Apply body composition if available
  if (user.bodyComposition) {
    const muscleFactor = 1 + ((user.bodyComposition.muscleMass || 40) - 40) / 200;
    const fatFactor = 1 + ((user.bodyComposition.bodyFat || 20) - 20) / 100;
    
    shoulderWidthRatio *= muscleFactor;
    chestDepthRatio *= muscleFactor;
    waistWidthRatio *= fatFactor;
  }
  
  return {
    height: heightM,
    shoulderWidth: heightM * shoulderWidthRatio,
    chestDepth: heightM * chestDepthRatio,
    waistWidth: heightM * waistWidthRatio,
    armLength: heightM * 0.35,
    legLength: heightM * 0.52,
    headSize: heightM * 0.13,
  };
}

export default function HumanModel3D({
  user,
  goalMeasurements,
  showComparison = false,
  interactive = true,
  onMeasurementChange,
}: HumanModel3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [anchorPoints, setAnchorPoints] = useState<AnchorPoint[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [sliderPosition, setSliderPosition] = useState({ x: 0, y: 0 });
  
  // Refs for 3D scene (not used in 2D implementation)
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const humanMeshRef = useRef<any>(null);
  const anchorMeshesRef = useRef<any[]>([]);
  
  const proportions = calculateProportions(user);
  
  // Initialize anchor points based on user proportions
  useEffect(() => {
    const points: AnchorPoint[] = [
      {
        name: 'shoulders',
        position: { x: 0, y: proportions.height * 0.75, z: 0 },
        value: user?.currentMeasurements?.shoulders || 50,
        min: 20,
        max: 80,
      },
      {
        name: 'chest',
        position: { x: 0, y: proportions.height * 0.6, z: 0 },
        value: user?.currentMeasurements?.chest || 50,
        min: 20,
        max: 80,
      },
      {
        name: 'arms',
        position: { x: proportions.shoulderWidth * 0.7, y: proportions.height * 0.6, z: 0 },
        value: user?.currentMeasurements?.arms || 50,
        min: 20,
        max: 80,
      },
      {
        name: 'waist',
        position: { x: 0, y: proportions.height * 0.4, z: 0 },
        value: user?.currentMeasurements?.waist || 50,
        min: 20,
        max: 80,
      },
      {
        name: 'legs',
        position: { x: 0, y: proportions.height * 0.2, z: 0 },
        value: user?.currentMeasurements?.legs || 50,
        min: 20,
        max: 80,
      },
    ];
    setAnchorPoints(points);
  }, [user]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => interactive,
    onMoveShouldSetPanResponder: () => interactive,
    onPanResponderGrant: (evt) => {
      if (!interactive) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      
      // Check if an anchor point was touched (simplified 2D approach)
      const touchedAnchor = anchorPoints.find(anchor => {
        const screenX = 200 + anchor.position.x * 100; // Convert to screen coordinates
        const screenY = 200 - anchor.position.y * 100;
        const distance = Math.sqrt(
          Math.pow(screenX - locationX, 2) + Math.pow(screenY - locationY, 2)
        );
        return distance < 40;
      });
      
      if (touchedAnchor) {
        setSelectedAnchor(touchedAnchor.name);
        setSliderValue(touchedAnchor.value);
        setSliderPosition({ x: locationX, y: locationY - 60 });
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!interactive) return;
      
      if (selectedAnchor) {
        // Handle slider adjustment
        const { dx } = gestureState;
        const anchor = anchorPoints.find(a => a.name === selectedAnchor);
        if (anchor) {
          const newValue = Math.max(anchor.min, Math.min(anchor.max, anchor.value + dx * 0.2));
          setSliderValue(newValue);
          
          // Update anchor point
          setAnchorPoints(prev => prev.map(a => 
            a.name === selectedAnchor ? { ...a, value: newValue } : a
          ));
          
          // Notify parent
          if (onMeasurementChange) {
            const measurements = anchorPoints.reduce((acc, point) => {
              acc[point.name] = point.name === selectedAnchor ? newValue : point.value;
              return acc;
            }, {} as Record<string, number>);
            onMeasurementChange(measurements);
          }
        }
      } else {
        // Handle rotation
        const { dx, dy } = gestureState;
        setRotation(prev => ({
          x: Math.max(-Math.PI/3, Math.min(Math.PI/3, prev.x + dy * 0.01)),
          y: prev.y + dx * 0.01,
        }));
      }
    },
    onPanResponderRelease: () => {
      setTimeout(() => setSelectedAnchor(null), 100);
    },
  });

  // Create a 3D-like human model using 2D transforms
  const renderHumanModel = () => {
    const scale = 1.2;
    const rotationStyle = {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotation.x * 57.3}deg` },
        { rotateY: `${rotation.y * 57.3}deg` },
        { scale },
      ],
    };
    
    // Get measurements from anchor points
    const measurements = anchorPoints.reduce((acc, point) => {
      acc[point.name] = point.value;
      return acc;
    }, {} as Record<string, number>);
    
    const shoulderWidth = 80 * (measurements.shoulders / 50);
    const chestWidth = 70 * (measurements.chest / 50);
    const armWidth = 18 * (measurements.arms / 50);
    const waistWidth = 60 * (measurements.waist / 50);
    const legWidth = 25 * (measurements.legs / 50);
    
    return (
      <Animated.View style={[styles.humanModel, rotationStyle]}>
        {/* Head */}
        <View style={[
          styles.head,
          {
            width: 45,
            height: 45,
            borderRadius: 22.5,
          }
        ]} />
        
        {/* Neck */}
        <View style={[
          styles.neck,
          {
            width: 12,
            height: 15,
          }
        ]} />
        
        {/* Shoulders */}
        <View style={[
          styles.shoulders,
          {
            width: shoulderWidth,
            height: 12,
          }
        ]} />
        
        {/* Arms */}
        <View style={[
          styles.leftArm,
          {
            width: armWidth,
            height: 70,
            left: -shoulderWidth/2 - armWidth/2,
          }
        ]} />
        <View style={[
          styles.rightArm,
          {
            width: armWidth,
            height: 70,
            right: -shoulderWidth/2 - armWidth/2,
          }
        ]} />
        
        {/* Chest/Torso */}
        <View style={[
          styles.chest,
          {
            width: chestWidth,
            height: 80,
          }
        ]} />
        
        {/* Waist */}
        <View style={[
          styles.waist,
          {
            width: waistWidth,
            height: 25,
          }
        ]} />
        
        {/* Legs */}
        <View style={[
          styles.leftLeg,
          {
            width: legWidth,
            height: 90,
            left: -waistWidth/4,
          }
        ]} />
        <View style={[
          styles.rightLeg,
          {
            width: legWidth,
            height: 90,
            right: -waistWidth/4,
          }
        ]} />
        
        {/* Shadow for 3D effect */}
        <View style={styles.shadow} />
      </Animated.View>
    );
  };
  
  // Render anchor points
  const renderAnchorPoints = () => {
    if (!interactive) return null;
    
    return anchorPoints.map((anchor, index) => {
      const isActive = selectedAnchor === anchor.name;
      const screenX = 200 + anchor.position.x * 100;
      const screenY = 200 - anchor.position.y * 100;
      
      return (
        <Animated.View
          key={anchor.name}
          style={[
            styles.anchorPoint,
            {
              left: screenX - 20,
              top: screenY - 20,
              backgroundColor: isActive ? Colors.dark.gradient.primary : Colors.dark.accent,
              transform: [{ scale: isActive ? 1.2 : 1 }],
            }
          ]}
        >
          <Text style={styles.anchorLabel}>{anchor.name.charAt(0).toUpperCase()}</Text>
        </Animated.View>
      );
    });
  };
  
  // Render slider for active anchor
  const renderSlider = () => {
    if (!selectedAnchor) return null;
    
    const anchor = anchorPoints.find(a => a.name === selectedAnchor);
    if (!anchor) return null;
    
    const progress = (sliderValue - anchor.min) / (anchor.max - anchor.min);
    
    return (
      <View style={[
        styles.sliderContainer,
        {
          left: Math.max(20, Math.min(Dimensions.get('window').width - 170, sliderPosition.x - 75)),
          top: Math.max(20, sliderPosition.y),
        }
      ]}>
        <Text style={styles.sliderLabel}>{anchor.name}</Text>
        <View style={styles.sliderTrack}>
          <View style={[
            styles.sliderProgress,
            { width: `${progress * 100}%` }
          ]} />
        </View>
        <Text style={styles.sliderValue}>{Math.round(sliderValue)}</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.modelContainer}>
        {renderHumanModel()}
        {renderAnchorPoints()}
        {renderSlider()}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>• Drag to rotate 360°</Text>
        <Text style={styles.instructionText}>• Tap colored points to adjust size</Text>
        <Text style={styles.instructionText}>• Drag sliders to customize proportions</Text>
      </View>
    </View>
  );
}

// Web and fallback component
export function WebFallback({ user }: { user?: UserProfile | null }) {
  return (
    <View style={styles.fallbackContainer}>
      <View style={styles.fallbackModel}>
        <Text style={styles.fallbackTitle}>3D Body Model</Text>
        <Text style={styles.fallbackSubtitle}>
          {user?.gender === 'female' ? 'Female' : user?.gender === 'male' ? 'Male' : 'Human'} Model
        </Text>
        <Text style={styles.fallbackNote}>
          Interactive 3D model available on mobile devices
        </Text>
        
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
  container: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    position: 'relative',
  },
  modelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 95, 227, 0.05)',
  },
  humanModel: {
    width: 200,
    height: 320,
    alignItems: 'center',
    position: 'relative',
  },
  head: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 0,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  neck: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 40,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  shoulders: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 55,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chest: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 67,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  leftArm: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 75,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rightArm: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 75,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  waist: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 147,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  leftLeg: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 172,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rightLeg: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 172,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shadow: {
    position: 'absolute',
    bottom: -5,
    left: 20,
    right: 20,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 50,
    opacity: 0.6,
  },
  anchorPoint: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  anchorLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    minWidth: 150,
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  sliderTrack: {
    width: 120,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  sliderValue: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginBottom: 4,
  },
  // Fallback styles for web
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
    marginBottom: 8,
  },
  fallbackNote: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
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