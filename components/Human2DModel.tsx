import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Svg, Ellipse, Line, Circle, G, Path } from 'react-native-svg';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

interface Human2DModelProps {
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

export default function Human2DModel({
  user,
  goalMeasurements,
  showComparison = false,
  interactive = true,
  onMeasurementChange,
}: Human2DModelProps) {
  const initialMeasurements = useMemo(() => ({
    shoulders: user?.currentMeasurements?.shoulders || 50,
    chest: user?.currentMeasurements?.chest || 50,
    arms: user?.currentMeasurements?.arms || 50,
    waist: user?.currentMeasurements?.waist || 50,
    legs: user?.currentMeasurements?.legs || 50,
  }), [user?.currentMeasurements]);
  
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  
  const isFemale = user?.gender === 'female';
  const centerX = 150;
  
  // Calculate body proportions based on measurements
  const bodyProps = useMemo(() => {
    const shoulderW = (measurements.shoulders / 50) * (isFemale ? 35 : 45);
    const chestW = (measurements.chest / 50) * (isFemale ? 32 : 40);
    const waistW = (measurements.waist / 50) * (isFemale ? 28 : 35);
    const armW = (measurements.arms / 50) * (isFemale ? 8 : 12);
    const legW = (measurements.legs / 50) * (isFemale ? 15 : 20);
    
    return { shoulderW, chestW, waistW, armW, legW };
  }, [measurements, isFemale]);
  
  const anchorPoints: AnchorPoint[] = useMemo(() => [
    {
      name: 'shoulders',
      x: centerX,
      y: 85,
      value: measurements.shoulders,
      min: 20,
      max: 80,
      color: '#FF6B6B',
    },
    {
      name: 'chest',
      x: centerX,
      y: 120,
      value: measurements.chest,
      min: 20,
      max: 80,
      color: '#4ECDC4',
    },
    {
      name: 'arms',
      x: centerX + 60,
      y: 120,
      value: measurements.arms,
      min: 20,
      max: 80,
      color: '#45B7D1',
    },
    {
      name: 'waist',
      x: centerX,
      y: 160,
      value: measurements.waist,
      min: 20,
      max: 80,
      color: '#F9CA24',
    },
    {
      name: 'legs',
      x: centerX,
      y: 220,
      value: measurements.legs,
      min: 20,
      max: 80,
      color: '#6C5CE7',
    },
  ], [measurements, centerX]);

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
    const newMeasurements = { ...measurements, [selectedAnchor]: value };
    setMeasurements(newMeasurements);
    
    if (onMeasurementChange) {
      onMeasurementChange(newMeasurements);
    }
  }, [selectedAnchor, onMeasurementChange, measurements]);
  
  const closeSlider = useCallback(() => {
    setSelectedAnchor(null);
  }, []);

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
          {/* Head */}
          <Ellipse
            cx={centerX}
            cy={45}
            rx={18}
            ry={22}
            fill={isFemale ? '#FFE4E1' : '#E6F3FF'}
            stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
            strokeWidth="2"
          />
          
          {/* Hair */}
          <Path
            d={`M ${centerX - 18} 30 Q ${centerX} 20 ${centerX + 18} 30 Q ${centerX + 15} 35 ${centerX} 25 Q ${centerX - 15} 35 ${centerX - 18} 30`}
            fill={isFemale ? '#8B4513' : '#654321'}
            stroke={isFemale ? '#654321' : '#4A2C17'}
            strokeWidth="1"
          />
          
          {/* Neck */}
          <Line
            x1={centerX}
            y1={67}
            x2={centerX}
            y2={80}
            stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Shoulders */}
          <Line
            x1={centerX - bodyProps.shoulderW}
            y1={85}
            x2={centerX + bodyProps.shoulderW}
            y2={85}
            stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Torso - Chest */}
          <Ellipse
            cx={centerX}
            cy={110}
            rx={bodyProps.chestW}
            ry={25}
            fill={isFemale ? 'rgba(255, 182, 193, 0.4)' : 'rgba(135, 206, 235, 0.4)'}
            stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
            strokeWidth="2"
          />
          
          {/* Torso - Waist */}
          <Ellipse
            cx={centerX}
            cy={160}
            rx={bodyProps.waistW}
            ry={20}
            fill={isFemale ? 'rgba(255, 182, 193, 0.3)' : 'rgba(135, 206, 235, 0.3)'}
            stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
            strokeWidth="2"
          />
          
          {/* Female hips */}
          {isFemale && (
            <Ellipse
              cx={centerX}
              cy={175}
              rx={bodyProps.waistW + 8}
              ry={15}
              fill="rgba(255, 182, 193, 0.3)"
              stroke="#FFB6C1"
              strokeWidth="2"
            />
          )}
          
          {/* Arms */}
          <G>
            {/* Left arm */}
            <Line
              x1={centerX - bodyProps.shoulderW}
              y1={85}
              x2={centerX - bodyProps.shoulderW - 15}
              y2={130}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.armW}
              strokeLinecap="round"
            />
            <Line
              x1={centerX - bodyProps.shoulderW - 15}
              y1={130}
              x2={centerX - bodyProps.shoulderW - 10}
              y2={170}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.armW - 2}
              strokeLinecap="round"
            />
            <Circle
              cx={centerX - bodyProps.shoulderW - 10}
              cy={175}
              r={6}
              fill={isFemale ? '#FFE4E1' : '#E6F3FF'}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="1"
            />
            
            {/* Right arm */}
            <Line
              x1={centerX + bodyProps.shoulderW}
              y1={85}
              x2={centerX + bodyProps.shoulderW + 15}
              y2={130}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.armW}
              strokeLinecap="round"
            />
            <Line
              x1={centerX + bodyProps.shoulderW + 15}
              y1={130}
              x2={centerX + bodyProps.shoulderW + 10}
              y2={170}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.armW - 2}
              strokeLinecap="round"
            />
            <Circle
              cx={centerX + bodyProps.shoulderW + 10}
              cy={175}
              r={6}
              fill={isFemale ? '#FFE4E1' : '#E6F3FF'}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="1"
            />
          </G>
          
          {/* Legs */}
          <G>
            {/* Left leg */}
            <Line
              x1={centerX - 15}
              y1={180}
              x2={centerX - bodyProps.legW}
              y2={240}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.legW}
              strokeLinecap="round"
            />
            <Line
              x1={centerX - bodyProps.legW}
              y1={240}
              x2={centerX - bodyProps.legW + 5}
              y2={300}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.legW - 2}
              strokeLinecap="round"
            />
            <Ellipse
              cx={centerX - bodyProps.legW + 5}
              cy={305}
              rx={12}
              ry={6}
              fill={isFemale ? '#FFE4E1' : '#E6F3FF'}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="1"
            />
            
            {/* Right leg */}
            <Line
              x1={centerX + 15}
              y1={180}
              x2={centerX + bodyProps.legW}
              y2={240}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.legW}
              strokeLinecap="round"
            />
            <Line
              x1={centerX + bodyProps.legW}
              y1={240}
              x2={centerX + bodyProps.legW - 5}
              y2={300}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth={bodyProps.legW - 2}
              strokeLinecap="round"
            />
            <Ellipse
              cx={centerX + bodyProps.legW - 5}
              cy={305}
              rx={12}
              ry={6}
              fill={isFemale ? '#FFE4E1' : '#E6F3FF'}
              stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="1"
            />
          </G>
          
          {/* Face features */}
          <G>
            {/* Eyes */}
            <Circle cx={centerX - 6} cy={40} r={2} fill="#333" />
            <Circle cx={centerX + 6} cy={40} r={2} fill="#333" />
            {/* Nose */}
            <Line x1={centerX} y1={45} x2={centerX} y2={50} stroke="#333" strokeWidth="1" />
            {/* Mouth */}
            <Path d={`M ${centerX - 4} 52 Q ${centerX} 55 ${centerX + 4} 52`} stroke="#333" strokeWidth="1" fill="none" />
          </G>
        </Svg>
        
        {renderAnchorPoints()}
        {renderSlider()}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>• Tap colored points to adjust measurements</Text>
        <Text style={styles.instructionText}>• Use +/- buttons to customize body proportions</Text>
        <Text style={styles.instructionText}>• Model adapts to your gender and measurements</Text>
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