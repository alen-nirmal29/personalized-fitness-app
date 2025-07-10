import React, { useRef, useState, useEffect, useMemo } from 'react';
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

type WireframePoint = {
  x: number;
  y: number;
  z: number;
};

type WireframeLine = {
  start: WireframePoint;
  end: WireframePoint;
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
  
  const proportions = useMemo(() => calculateProportions(user), [user]);
  
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

  // Generate wireframe points for human body
  const generateWireframePoints = () => {
    // Get measurements from anchor points
    const measurements = anchorPoints.reduce((acc, point) => {
      acc[point.name] = point.value;
      return acc;
    }, {} as Record<string, number>);
    
    const shoulderWidth = 0.8 * (measurements.shoulders / 50);
    const chestWidth = 0.7 * (measurements.chest / 50);
    const armWidth = 0.15 * (measurements.arms / 50);
    const waistWidth = 0.6 * (measurements.waist / 50);
    const legWidth = 0.2 * (measurements.legs / 50);
    
    const isFemale = user?.gender === 'female';
    
    // Define key body points for wireframe
    const points: Record<string, WireframePoint> = {
      // Head
      headTop: { x: 0, y: 1.8, z: 0 },
      headFront: { x: 0, y: 1.65, z: 0.1 },
      headBack: { x: 0, y: 1.65, z: -0.1 },
      headLeft: { x: -0.1, y: 1.65, z: 0 },
      headRight: { x: 0.1, y: 1.65, z: 0 },
      headBottom: { x: 0, y: 1.5, z: 0 },
      
      // Neck
      neckTop: { x: 0, y: 1.5, z: 0 },
      neckBottom: { x: 0, y: 1.4, z: 0 },
      
      // Shoulders
      shoulderLeft: { x: -shoulderWidth, y: 1.4, z: 0 },
      shoulderRight: { x: shoulderWidth, y: 1.4, z: 0 },
      shoulderCenter: { x: 0, y: 1.4, z: 0 },
      
      // Arms
      elbowLeft: { x: -shoulderWidth - 0.1, y: 1.1, z: 0 },
      elbowRight: { x: shoulderWidth + 0.1, y: 1.1, z: 0 },
      wristLeft: { x: -shoulderWidth - 0.1, y: 0.8, z: 0 },
      wristRight: { x: shoulderWidth + 0.1, y: 0.8, z: 0 },
      
      // Chest/Torso
      chestLeft: { x: -chestWidth, y: 1.2, z: 0 },
      chestRight: { x: chestWidth, y: 1.2, z: 0 },
      chestCenter: { x: 0, y: 1.2, z: 0 },
      chestFront: { x: 0, y: 1.2, z: isFemale ? 0.15 : 0.1 },
      
      // Waist
      waistLeft: { x: -waistWidth, y: 0.9, z: 0 },
      waistRight: { x: waistWidth, y: 0.9, z: 0 },
      waistCenter: { x: 0, y: 0.9, z: 0 },
      
      // Hips
      hipLeft: { x: -waistWidth * 1.2, y: 0.7, z: 0 },
      hipRight: { x: waistWidth * 1.2, y: 0.7, z: 0 },
      hipCenter: { x: 0, y: 0.7, z: 0 },
      
      // Legs
      kneeLeft: { x: -legWidth, y: 0.4, z: 0 },
      kneeRight: { x: legWidth, y: 0.4, z: 0 },
      ankleLeft: { x: -legWidth, y: 0.1, z: 0 },
      ankleRight: { x: legWidth, y: 0.1, z: 0 },
      footLeft: { x: -legWidth, y: 0, z: 0.1 },
      footRight: { x: legWidth, y: 0, z: 0.1 },
    };
    
    return points;
  };
  
  // Generate wireframe lines connecting the points
  const generateWireframeLines = (points: Record<string, WireframePoint>): WireframeLine[] => {
    return [
      // Head wireframe
      { start: points.headTop, end: points.headFront },
      { start: points.headTop, end: points.headBack },
      { start: points.headTop, end: points.headLeft },
      { start: points.headTop, end: points.headRight },
      { start: points.headFront, end: points.headLeft },
      { start: points.headLeft, end: points.headBack },
      { start: points.headBack, end: points.headRight },
      { start: points.headRight, end: points.headFront },
      { start: points.headBottom, end: points.headFront },
      { start: points.headBottom, end: points.headBack },
      { start: points.headBottom, end: points.headLeft },
      { start: points.headBottom, end: points.headRight },
      
      // Neck
      { start: points.headBottom, end: points.neckTop },
      { start: points.neckTop, end: points.neckBottom },
      
      // Shoulders
      { start: points.neckBottom, end: points.shoulderCenter },
      { start: points.shoulderLeft, end: points.shoulderRight },
      { start: points.shoulderLeft, end: points.shoulderCenter },
      { start: points.shoulderRight, end: points.shoulderCenter },
      
      // Arms
      { start: points.shoulderLeft, end: points.elbowLeft },
      { start: points.shoulderRight, end: points.elbowRight },
      { start: points.elbowLeft, end: points.wristLeft },
      { start: points.elbowRight, end: points.wristRight },
      
      // Chest/Torso
      { start: points.shoulderLeft, end: points.chestLeft },
      { start: points.shoulderRight, end: points.chestRight },
      { start: points.chestLeft, end: points.chestRight },
      { start: points.chestCenter, end: points.chestFront },
      { start: points.chestLeft, end: points.chestCenter },
      { start: points.chestRight, end: points.chestCenter },
      
      // Torso to waist
      { start: points.chestLeft, end: points.waistLeft },
      { start: points.chestRight, end: points.waistRight },
      { start: points.chestCenter, end: points.waistCenter },
      { start: points.waistLeft, end: points.waistRight },
      { start: points.waistLeft, end: points.waistCenter },
      { start: points.waistRight, end: points.waistCenter },
      
      // Waist to hips
      { start: points.waistLeft, end: points.hipLeft },
      { start: points.waistRight, end: points.hipRight },
      { start: points.waistCenter, end: points.hipCenter },
      { start: points.hipLeft, end: points.hipRight },
      { start: points.hipLeft, end: points.hipCenter },
      { start: points.hipRight, end: points.hipCenter },
      
      // Legs
      { start: points.hipLeft, end: points.kneeLeft },
      { start: points.hipRight, end: points.kneeRight },
      { start: points.kneeLeft, end: points.ankleLeft },
      { start: points.kneeRight, end: points.ankleRight },
      { start: points.ankleLeft, end: points.footLeft },
      { start: points.ankleRight, end: points.footRight },
      
      // Cross connections for 3D effect
      { start: points.chestFront, end: points.chestLeft },
      { start: points.chestFront, end: points.chestRight },
    ];
  };
  
  // Project 3D point to 2D screen coordinates
  const project3DTo2D = (point: WireframePoint, rotX: number, rotY: number): { x: number; y: number } => {
    // Apply rotation transformations
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    
    // Rotate around Y axis (horizontal rotation)
    let x = point.x * cosY - point.z * sinY;
    let z = point.x * sinY + point.z * cosY;
    let y = point.y;
    
    // Rotate around X axis (vertical rotation)
    const newY = y * cosX - z * sinX;
    z = y * sinX + z * cosX;
    y = newY;
    
    // Project to 2D with perspective
    const distance = 3;
    const scale = distance / (distance + z);
    
    return {
      x: x * scale * 120 + 200, // Scale and center
      y: -y * scale * 120 + 220, // Flip Y and center
    };
  };
  
  // Render wireframe human model
  const renderWireframeModel = () => {
    const autoRotation = rotationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.PI * 2],
    });
    
    const points = generateWireframePoints();
    const lines = generateWireframeLines(points);
    
    const animatedStyle = {
      transform: [
        {
          rotateY: selectedAnchor ? '0deg' : rotationAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
      ],
    };
    
    return (
      <Animated.View style={[styles.wireframeContainer, animatedStyle]}>
        {lines.map((line, index) => {
          // Use static rotation values for wireframe calculation
          const rotY = selectedAnchor ? 0 : 0; // Simplified for now
          const rotX = 0;
          
          const start2D = project3DTo2D(line.start, rotX, rotY);
          const end2D = project3DTo2D(line.end, rotX, rotY);
          
          const length = Math.sqrt(
            Math.pow(end2D.x - start2D.x, 2) + Math.pow(end2D.y - start2D.y, 2)
          );
          const angle = Math.atan2(end2D.y - start2D.y, end2D.x - start2D.x) * 180 / Math.PI;
          
          return (
            <View
              key={index}
              style={[
                styles.wireframeLine,
                {
                  left: start2D.x,
                  top: start2D.y,
                  width: length,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}
        
        {/* Render grid pattern overlay */}
        {renderGridPattern(points)}
      </Animated.View>
    );
  };
  
  // Render grid pattern on the model
  const renderGridPattern = (points: Record<string, WireframePoint>) => {
    const gridLines = [];
    const rotY = selectedAnchor ? rotation.y : 0;
    const rotX = rotation.x;
    
    // Horizontal grid lines
    for (let i = 0; i < 20; i++) {
      const y = 0.1 + (i * 0.09);
      const startPoint = { x: -0.8, y, z: 0 };
      const endPoint = { x: 0.8, y, z: 0 };
      
      const start2D = project3DTo2D(startPoint, rotX, rotY);
      const end2D = project3DTo2D(endPoint, rotX, rotY);
      
      const length = Math.sqrt(
        Math.pow(end2D.x - start2D.x, 2) + Math.pow(end2D.y - start2D.y, 2)
      );
      const angle = Math.atan2(end2D.y - start2D.y, end2D.x - start2D.x) * 180 / Math.PI;
      
      gridLines.push(
        <View
          key={`h-${i}`}
          style={[
            styles.gridLine,
            {
              left: start2D.x,
              top: start2D.y,
              width: length,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      );
    }
    
    // Vertical grid lines
    for (let i = 0; i < 16; i++) {
      const x = -0.8 + (i * 0.1);
      const startPoint = { x, y: 0, z: 0 };
      const endPoint = { x, y: 1.8, z: 0 };
      
      const start2D = project3DTo2D(startPoint, rotX, rotY);
      const end2D = project3DTo2D(endPoint, rotX, rotY);
      
      const length = Math.sqrt(
        Math.pow(end2D.x - start2D.x, 2) + Math.pow(end2D.y - start2D.y, 2)
      );
      const angle = Math.atan2(end2D.y - start2D.y, end2D.x - start2D.x) * 180 / Math.PI;
      
      gridLines.push(
        <View
          key={`v-${i}`}
          style={[
            styles.gridLine,
            {
              left: start2D.x,
              top: start2D.y,
              width: length,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      );
    }
    
    return gridLines;
  };
  
  // Render enhanced anchor points
  const renderAnchorPoints = () => {
    if (!interactive) return null;
    
    return anchorPoints.map((anchor, index) => {
      const isActive = selectedAnchor === anchor.name;
      const rotY = selectedAnchor ? rotation.y : 0;
      const rotX = rotation.x;
      
      // Project anchor position to 2D
      const anchor2D = project3DTo2D(anchor.position, rotX, rotY);
      
      return (
        <Animated.View
          key={anchor.name}
          style={[
            styles.anchorPoint,
            {
              left: anchor2D.x - 20,
              top: anchor2D.y - 20,
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
        {renderWireframeModel()}
        {renderAnchorPoints()}
        {renderSlider()}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>• Drag to rotate 360°</Text>
        <Text style={styles.instructionText}>• Tap cyan points to adjust measurements</Text>
        <Text style={styles.instructionText}>• Drag sliders to customize body proportions</Text>
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
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  modelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  wireframeContainer: {
    width: 400,
    height: 400,
    position: 'relative',
  },
  wireframeLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },

  anchorPoint: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  anchorLabel: {
    color: '#00ffff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  anchorPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00ffff',
    opacity: 0.6,
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 20, 40, 0.95)',
    borderRadius: 16,
    padding: 20,
    minWidth: 160,
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  sliderLabel: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  sliderTrack: {
    width: 130,
    height: 8,
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.4)',
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
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderValue: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  instructions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 20, 40, 0.9)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  instructionText: {
    color: 'rgba(0, 255, 255, 0.8)',
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
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackModel: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 20, 40, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  fallbackTitle: {
    color: '#00ffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  fallbackSubtitle: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 12,
  },
  fallbackNote: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  fallbackStats: {
    alignItems: 'center',
  },
  fallbackStat: {
    color: 'rgba(0, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
});