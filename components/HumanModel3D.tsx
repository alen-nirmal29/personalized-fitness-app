import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Svg, Path, Circle, G } from 'react-native-svg';
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
  x: number;
  y: number;
  value: number;
  min: number;
  max: number;
  color: string;
};

// Calculate realistic proportions based on user data
function calculateProportions(user?: UserProfile | null) {
  if (!user) {
    return {
      shoulderWidth: 45,
      chestWidth: 40,
      waistWidth: 35,
      armWidth: 15,
      legWidth: 20,
      height: 300,
    };
  }

  const weight = user.weight || 70;
  const height = user.height || 170;
  const bmi = weight / ((height / 100) * (height / 100));
  
  // Gender-based proportions
  const isFemale = user.gender === 'female';
  
  // Base proportions
  let shoulderWidth = isFemale ? 40 : 50;
  let chestWidth = isFemale ? 35 : 45;
  let waistWidth = isFemale ? 30 : 35;
  let armWidth = isFemale ? 12 : 18;
  let legWidth = isFemale ? 18 : 22;
  
  // Adjust for BMI
  const bmiAdjustment = Math.max(0.7, Math.min(1.4, bmi / 22));
  shoulderWidth *= bmiAdjustment;
  chestWidth *= bmiAdjustment;
  waistWidth *= bmiAdjustment;
  armWidth *= bmiAdjustment;
  legWidth *= bmiAdjustment;
  
  // Apply body composition if available
  if (user.bodyComposition) {
    const muscleFactor = 1 + ((user.bodyComposition.muscleMass || 40) - 40) / 200;
    const fatFactor = 1 + ((user.bodyComposition.bodyFat || 20) - 20) / 100;
    
    shoulderWidth *= muscleFactor;
    chestWidth *= muscleFactor;
    armWidth *= muscleFactor;
    legWidth *= muscleFactor;
    waistWidth *= fatFactor;
  }
  
  return {
    shoulderWidth: Math.round(shoulderWidth),
    chestWidth: Math.round(chestWidth),
    waistWidth: Math.round(waistWidth),
    armWidth: Math.round(armWidth),
    legWidth: Math.round(legWidth),
    height: 300,
  };
}

export default function HumanModel3D({
  user,
  goalMeasurements,
  showComparison = false,
  interactive = true,
  onMeasurementChange,
}: HumanModel3DProps) {
  const [measurements, setMeasurements] = useState({
    shoulders: user?.currentMeasurements?.shoulders || 50,
    chest: user?.currentMeasurements?.chest || 50,
    arms: user?.currentMeasurements?.arms || 50,
    waist: user?.currentMeasurements?.waist || 50,
    legs: user?.currentMeasurements?.legs || 50,
  });
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  
  const proportions = useMemo(() => calculateProportions(user), [user]);
  
  const anchorPoints: AnchorPoint[] = useMemo(() => [
    {
      name: 'shoulders',
      x: 150,
      y: 80,
      value: measurements.shoulders,
      min: 20,
      max: 80,
      color: '#FF6B6B',
    },
    {
      name: 'chest',
      x: 150,
      y: 120,
      value: measurements.chest,
      min: 20,
      max: 80,
      color: '#4ECDC4',
    },
    {
      name: 'arms',
      x: 200,
      y: 120,
      value: measurements.arms,
      min: 20,
      max: 80,
      color: '#45B7D1',
    },
    {
      name: 'waist',
      x: 150,
      y: 180,
      value: measurements.waist,
      min: 20,
      max: 80,
      color: '#F9CA24',
    },
    {
      name: 'legs',
      x: 150,
      y: 240,
      value: measurements.legs,
      min: 20,
      max: 80,
      color: '#6C5CE7',
    },
  ], [measurements]);

  const handleAnchorPress = useCallback((anchorName: string) => {
    if (!interactive) return;
    
    const anchor = anchorPoints.find(a => a.name === anchorName);
    if (anchor) {
      setSelectedAnchor(anchorName);
      setSliderValue(anchor.value);
    }
  }, [anchorPoints, interactive]);
  
  const handleSliderChange = useCallback((value: number) => {
    if (!selectedAnchor) return;
    
    setSliderValue(value);
    setMeasurements(prev => {
      const newMeasurements = { ...prev, [selectedAnchor]: value };
      
      // Notify parent
      if (onMeasurementChange) {
        onMeasurementChange(newMeasurements);
      }
      
      return newMeasurements;
    });
  }, [selectedAnchor, onMeasurementChange]);
  
  const closeSlider = useCallback(() => {
    setSelectedAnchor(null);
  }, []);

  // Generate human body path based on measurements
  const generateBodyPath = useMemo(() => {
    const isFemale = user?.gender === 'female';
    const centerX = 150;
    
    // Calculate widths based on measurements
    const shoulderW = (measurements.shoulders / 50) * proportions.shoulderWidth;
    const chestW = (measurements.chest / 50) * proportions.chestWidth;
    const waistW = (measurements.waist / 50) * proportions.waistWidth;
    const armW = (measurements.arms / 50) * proportions.armWidth;
    const legW = (measurements.legs / 50) * proportions.legWidth;
    
    // Head
    const headPath = `
      M ${centerX} 20
      C ${centerX - 15} 20, ${centerX - 20} 30, ${centerX - 20} 45
      C ${centerX - 20} 60, ${centerX - 15} 70, ${centerX} 70
      C ${centerX + 15} 70, ${centerX + 20} 60, ${centerX + 20} 45
      C ${centerX + 20} 30, ${centerX + 15} 20, ${centerX} 20 Z
    `;
    
    // Body outline
    const bodyPath = `
      M ${centerX} 70
      L ${centerX - shoulderW/2} 80
      L ${centerX - shoulderW/2 - armW} 85
      L ${centerX - shoulderW/2 - armW} 140
      L ${centerX - shoulderW/2 - armW + 5} 160
      L ${centerX - shoulderW/2} 155
      L ${centerX - chestW/2} 120
      ${isFemale ? `C ${centerX - chestW/2 - 8} 125, ${centerX - chestW/2 - 8} 135, ${centerX - chestW/2} 140` : ''}
      L ${centerX - waistW/2} 180
      L ${centerX - waistW/2 - 5} 200
      L ${centerX - legW} 205
      L ${centerX - legW} 280
      L ${centerX - legW + 8} 300
      L ${centerX + legW - 8} 300
      L ${centerX + legW} 280
      L ${centerX + legW} 205
      L ${centerX + waistW/2 + 5} 200
      L ${centerX + waistW/2} 180
      ${isFemale ? `L ${centerX + chestW/2} 140 C ${centerX + chestW/2 + 8} 135, ${centerX + chestW/2 + 8} 125, ${centerX + chestW/2} 120` : 'L ${centerX + chestW/2} 120'}
      L ${centerX + shoulderW/2} 155
      L ${centerX + shoulderW/2 + armW - 5} 160
      L ${centerX + shoulderW/2 + armW} 140
      L ${centerX + shoulderW/2 + armW} 85
      L ${centerX + shoulderW/2} 80
      Z
    `;
    
    return { headPath, bodyPath };
  }, [measurements, proportions, user?.gender]);
  
  // Render anchor points
  const renderAnchorPoints = () => {
    if (!interactive) return null;
    
    return anchorPoints.map((anchor) => {
      const isActive = selectedAnchor === anchor.name;
      
      return (
        <TouchableOpacity
          key={anchor.name}
          style={[
            styles.anchorPoint,
            {
              left: anchor.x - 20,
              top: anchor.y - 20,
              backgroundColor: anchor.color,
              transform: [{ scale: isActive ? 1.2 : 1 }],
              shadowColor: anchor.color,
            }
          ]}
          onPress={() => handleAnchorPress(anchor.name)}
          activeOpacity={0.8}
        >
          <Text style={styles.anchorLabel}>{anchor.name.charAt(0).toUpperCase()}</Text>
          {isActive && <View style={styles.anchorPulse} />}
        </TouchableOpacity>
      );
    });
  };
  
  // Render slider for active anchor
  const renderSlider = () => {
    if (!selectedAnchor) return null;
    
    const anchor = anchorPoints.find(a => a.name === selectedAnchor);
    if (!anchor) return null;
    
    const progress = (sliderValue - anchor.min) / (anchor.max - anchor.min);
    const screenWidth = Dimensions.get('window').width;
    
    return (
      <View style={[
        styles.sliderContainer,
        {
          left: Math.max(20, Math.min(screenWidth - 200, anchor.x - 90)),
          top: anchor.y - 80,
          borderColor: anchor.color,
        }
      ]}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{anchor.name}</Text>
          <TouchableOpacity onPress={closeSlider} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sliderTrack}>
          <View style={[
            styles.sliderProgress,
            { 
              width: `${progress * 100}%`,
              backgroundColor: anchor.color,
            }
          ]} />
        </View>
        
        <View style={styles.sliderControls}>
          <TouchableOpacity 
            onPress={() => handleSliderChange(Math.max(anchor.min, sliderValue - 5))}
            style={styles.sliderButton}
          >
            <Text style={styles.sliderButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.sliderValue}>{Math.round(sliderValue)}</Text>
          
          <TouchableOpacity 
            onPress={() => handleSliderChange(Math.min(anchor.max, sliderValue + 5))}
            style={styles.sliderButton}
          >
            <Text style={styles.sliderButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.modelContainer}>
        <Svg width="300" height="320" viewBox="0 0 300 320">
          {/* Body shadow/outline */}
          <Path
            d={generateBodyPath.bodyPath}
            fill="rgba(100, 200, 255, 0.1)"
            stroke="#64C8FF"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Head shadow/outline */}
          <Path
            d={generateBodyPath.headPath}
            fill="rgba(100, 200, 255, 0.1)"
            stroke="#64C8FF"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Body fill */}
          <Path
            d={generateBodyPath.bodyPath}
            fill={user?.gender === 'female' ? 'rgba(255, 182, 193, 0.3)' : 'rgba(135, 206, 235, 0.3)'}
            stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'}
            strokeWidth="1.5"
          />
          
          {/* Head fill */}
          <Path
            d={generateBodyPath.headPath}
            fill={user?.gender === 'female' ? 'rgba(255, 182, 193, 0.4)' : 'rgba(135, 206, 235, 0.4)'}
            stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'}
            strokeWidth="1.5"
          />
          
          {/* Measurement lines */}
          {anchorPoints.map((anchor, index) => {
            const nextAnchor = anchorPoints[index + 1];
            if (!nextAnchor) return null;
            
            return (
              <G key={`line-${anchor.name}`}>
                <Path
                  d={`M ${anchor.x} ${anchor.y} L ${nextAnchor.x} ${nextAnchor.y}`}
                  stroke="rgba(100, 200, 255, 0.5)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              </G>
            );
          })}
        </Svg>
        
        {renderAnchorPoints()}
        {renderSlider()}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>• Tap colored points to adjust measurements</Text>
        <Text style={styles.instructionText}>• Use +/- buttons to customize body proportions</Text>
        <Text style={styles.instructionText}>• Model adapts to your gender and body composition</Text>
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
    backgroundColor: Colors.dark.background,
    position: 'relative',
  },
  modelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 25, 40, 0.8)',
    position: 'relative',
  },
  anchorPoint: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  anchorLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  anchorPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.4,
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 16,
    minWidth: 180,
    zIndex: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 12,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 3,
  },
  sliderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '400',
  },
});