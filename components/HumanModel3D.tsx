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
  color: string;
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
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
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
        color: '#FF6B6B',
      },
      {
        name: 'chest',
        position: { x: 0, y: proportions.height * 0.6, z: 0 },
        value: user?.currentMeasurements?.chest || 50,
        min: 20,
        max: 80,
        color: '#4ECDC4',
      },
      {
        name: 'arms',
        position: { x: proportions.shoulderWidth * 0.7, y: proportions.height * 0.6, z: 0 },
        value: user?.currentMeasurements?.arms || 50,
        min: 20,
        max: 80,
        color: '#45B7D1',
      },
      {
        name: 'waist',
        position: { x: 0, y: proportions.height * 0.4, z: 0 },
        value: user?.currentMeasurements?.waist || 50,
        min: 20,
        max: 80,
        color: '#F9CA24',
      },
      {
        name: 'legs',
        position: { x: 0, y: proportions.height * 0.2, z: 0 },
        value: user?.currentMeasurements?.legs || 50,
        min: 20,
        max: 80,
        color: '#6C5CE7',
      },
    ];
    setAnchorPoints(points);
  }, [user, proportions]);

  // Auto-rotation animation
  useEffect(() => {
    if (!selectedAnchor) {
      const animation = Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [selectedAnchor, rotationAnim]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => interactive,
    onMoveShouldSetPanResponder: () => interactive,
    onPanResponderGrant: (evt) => {
      if (!interactive) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      
      // Check if an anchor point was touched
      const touchedAnchor = anchorPoints.find(anchor => {
        const screenX = 200 + anchor.position.x * 100;
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
        rotationAnim.stopAnimation();
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

  // Create an enhanced 3D-like human model
  const renderHumanModel = () => {
    const scale = 1.2;
    const autoRotation = rotationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    
    const rotationStyle = {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotation.x * 57.3}deg` },
        { rotateY: selectedAnchor ? `${rotation.y * 57.3}deg` : autoRotation },
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
    
    // Enhanced skin tone based on user preferences
    const skinTone = user?.gender === 'female' ? '#FDBCB4' : '#E8B4A0';
    
    return (
      <Animated.View style={[styles.humanModel, rotationStyle]}>
        {/* Enhanced Head with facial features */}
        <View style={[
          styles.head,
          {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: skinTone,
          }
        ]}>
          <View style={styles.face}>
            <View style={[styles.eye, styles.leftEye]} />
            <View style={[styles.eye, styles.rightEye]} />
            <View style={styles.mouth} />
          </View>
        </View>
        
        {/* Hair */}
        <View style={[
          styles.hair,
          {
            backgroundColor: user?.gender === 'female' ? '#8B4513' : '#654321',
          }
        ]} />
        
        {/* Neck */}
        <View style={[
          styles.neck,
          {
            width: 14,
            height: 18,
            backgroundColor: skinTone,
          }
        ]} />
        
        {/* Enhanced Shoulders with muscle definition */}
        <View style={[
          styles.shoulders,
          {
            width: shoulderWidth,
            height: 14,
            backgroundColor: skinTone,
          }
        ]}>
          <View style={styles.shoulderMuscle} />
        </View>
        
        {/* Enhanced Arms with muscle definition */}
        <View style={[
          styles.leftArm,
          {
            width: armWidth,
            height: 75,
            left: -shoulderWidth/2 - armWidth/2,
            backgroundColor: skinTone,
          }
        ]}>
          <View style={styles.armMuscle} />
        </View>
        <View style={[
          styles.rightArm,
          {
            width: armWidth,
            height: 75,
            right: -shoulderWidth/2 - armWidth/2,
            backgroundColor: skinTone,
          }
        ]}>
          <View style={styles.armMuscle} />
        </View>
        
        {/* Enhanced Chest/Torso with abs */}
        <View style={[
          styles.chest,
          {
            width: chestWidth,
            height: 85,
            backgroundColor: skinTone,
          }
        ]}>
          <View style={styles.chestMuscle} />
          <View style={styles.abs} />
        </View>
        
        {/* Enhanced Waist */}
        <View style={[
          styles.waist,
          {
            width: waistWidth,
            height: 28,
            backgroundColor: skinTone,
          }
        ]} />
        
        {/* Enhanced Legs with muscle definition */}
        <View style={[
          styles.leftLeg,
          {
            width: legWidth,
            height: 95,
            left: -waistWidth/4,
            backgroundColor: skinTone,
          }
        ]}>
          <View style={styles.legMuscle} />
        </View>
        <View style={[
          styles.rightLeg,
          {
            width: legWidth,
            height: 95,
            right: -waistWidth/4,
            backgroundColor: skinTone,
          }
        ]}>
          <View style={styles.legMuscle} />
        </View>
        
        {/* Enhanced shadow for 3D effect */}
        <View style={styles.shadow} />
      </Animated.View>
    );
  };
  
  // Render enhanced anchor points
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
              backgroundColor: anchor.color,
              transform: [{ scale: isActive ? 1.3 : 1 }],
              shadowColor: anchor.color,
            }
          ]}
        >
          <Text style={styles.anchorLabel}>{anchor.name.charAt(0).toUpperCase()}</Text>
          {isActive && <View style={styles.anchorPulse} />}
        </Animated.View>
      );
    });
  };
  
  // Render enhanced slider for active anchor
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
          borderColor: anchor.color,
        }
      ]}>
        <Text style={styles.sliderLabel}>{anchor.name}</Text>
        <View style={styles.sliderTrack}>
          <View style={[
            styles.sliderProgress,
            { 
              width: `${progress * 100}%`,
              backgroundColor: anchor.color,
            }
          ]} />
          <View style={[
            styles.sliderThumb,
            { 
              left: `${progress * 100}%`,
              backgroundColor: anchor.color,
            }
          ]} />
        </View>
        <Text style={styles.sliderValue}>{Math.round(sliderValue)}</Text>
      </View>
    );
  };
  
  // Web fallback component
  if (Platform.OS === 'web') {
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 450,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    position: 'relative',
  },
  modelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 95, 227, 0.08)',
  },
  humanModel: {
    width: 200,
    height: 340,
    alignItems: 'center',
    position: 'relative',
  },
  head: {
    position: 'absolute',
    top: 0,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  face: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eye: {
    width: 4,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    position: 'absolute',
  },
  leftEye: {
    left: 12,
    top: 15,
  },
  rightEye: {
    right: 12,
    top: 15,
  },
  mouth: {
    width: 8,
    height: 2,
    backgroundColor: '#D2691E',
    borderRadius: 1,
    position: 'absolute',
    bottom: 12,
  },
  hair: {
    position: 'absolute',
    top: -5,
    width: 55,
    height: 25,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  neck: {
    position: 'absolute',
    top: 45,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shoulders: {
    position: 'absolute',
    top: 63,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  shoulderMuscle: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
  },
  chest: {
    position: 'absolute',
    top: 77,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  chestMuscle: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 6,
  },
  abs: {
    position: 'absolute',
    bottom: 8,
    left: '25%',
    right: '25%',
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 4,
  },
  leftArm: {
    position: 'absolute',
    top: 85,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  rightArm: {
    position: 'absolute',
    top: 85,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  armMuscle: {
    position: 'absolute',
    top: 8,
    left: 2,
    right: 2,
    height: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
  },
  waist: {
    position: 'absolute',
    top: 162,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  leftLeg: {
    position: 'absolute',
    top: 190,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  rightLeg: {
    position: 'absolute',
    top: 190,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  legMuscle: {
    position: 'absolute',
    top: 8,
    left: 2,
    right: 2,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 6,
  },
  shadow: {
    position: 'absolute',
    bottom: -8,
    left: 15,
    right: 15,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 50,
    opacity: 0.7,
  },
  anchorPoint: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  anchorLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  anchorPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    opacity: 0.7,
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 16,
    padding: 20,
    minWidth: 160,
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  sliderLabel: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  sliderTrack: {
    width: 130,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 16,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderValue: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  // Fallback styles for web
  fallbackContainer: {
    width: '100%',
    height: 450,
    borderRadius: 20,
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
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackTitle: {
    color: Colors.dark.accent,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fallbackSubtitle: {
    color: Colors.dark.text,
    fontSize: 18,
    marginBottom: 12,
  },
  fallbackNote: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  fallbackStats: {
    alignItems: 'center',
  },
  fallbackStat: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: 4,
  },
});