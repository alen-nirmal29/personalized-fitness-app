import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Svg, Ellipse, Line, Circle, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

// Conditional imports for gesture handling (not available on web)
let PanGestureHandler: any;
let Animated: any;
let useSharedValue: any;
let useAnimatedGestureHandler: any;
let useAnimatedStyle: any;
let runOnJS: any;

if (Platform.OS !== 'web') {
  try {
    const gestureHandler = require('react-native-gesture-handler');
    const reanimated = require('react-native-reanimated');
    PanGestureHandler = gestureHandler.PanGestureHandler;
    Animated = reanimated.default;
    useSharedValue = reanimated.useSharedValue;
    useAnimatedGestureHandler = reanimated.useAnimatedGestureHandler;
    useAnimatedStyle = reanimated.useAnimatedStyle;
    runOnJS = reanimated.runOnJS;
  } catch (error) {
    console.log('Gesture handler not available:', error);
  }
}

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

const AnimatedSvg = Platform.OS !== 'web' && Animated ? Animated.createAnimatedComponent(Svg) : Svg;

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
  const [rotationAngle, setRotationAngle] = useState(0);
  
  const rotation = Platform.OS !== 'web' && useSharedValue ? useSharedValue(0) : { value: 0 };
  const scale = Platform.OS !== 'web' && useSharedValue ? useSharedValue(1) : { value: 1 };
  
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
  
  // Gesture handlers for rotation (mobile only)
  const gestureHandler = Platform.OS !== 'web' && useAnimatedGestureHandler ? useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startRotation = rotation.value;
    },
    onActive: (event, context) => {
      const deltaX = event.translationX;
      rotation.value = context.startRotation + deltaX * 0.01;
    },
    onEnd: () => {
      runOnJS && runOnJS(setRotationAngle)(rotation.value * (180 / Math.PI));
    },
  }) : null;

  const animatedStyle = Platform.OS !== 'web' && useAnimatedStyle ? useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${rotation.value}rad` },
        { scale: scale.value },
      ],
    };
  }) : {};
  
  // Web rotation handler
  const handleWebRotation = useCallback(() => {
    if (Platform.OS === 'web') {
      setRotationAngle(prev => (prev + 45) % 360);
    }
  }, []);

  const anchorPoints: AnchorPoint[] = useMemo(() => {
    // Calculate dynamic positions based on body proportions
    const shoulderEdgeX = centerX + bodyProps.shoulderW - 15;
    const chestEdgeX = centerX + bodyProps.chestW - 10;
    const armX = centerX + bodyProps.shoulderW + bodyProps.armW + 10;
    const waistEdgeX = centerX + bodyProps.waistW - 10;
    const legX = centerX + bodyProps.legW + 5;
    
    return [
      {
        name: 'shoulders',
        x: shoulderEdgeX, // Position on the actual shoulder edge
        y: 85,
        value: measurements.shoulders,
        min: 20,
        max: 80,
        color: '#FF6B6B',
      },
      {
        name: 'chest',
        x: chestEdgeX, // Position on the chest edge
        y: 110,
        value: measurements.chest,
        min: 20,
        max: 80,
        color: '#4ECDC4',
      },
      {
        name: 'arms',
        x: armX, // Position on the actual arm
        y: 130,
        value: measurements.arms,
        min: 20,
        max: 80,
        color: '#45B7D1',
      },
      {
        name: 'waist',
        x: waistEdgeX, // Position on the waist edge
        y: 160,
        value: measurements.waist,
        min: 20,
        max: 80,
        color: '#F9CA24',
      },
      {
        name: 'legs',
        x: legX, // Position on the actual leg
        y: 210,
        value: measurements.legs,
        min: 20,
        max: 80,
        color: '#6C5CE7',
      },
    ];
  }, [measurements, centerX, bodyProps]);

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
  
  // Render comparison model (goal measurements)
  const renderComparisonModel = () => {
    if (!showComparison || !goalMeasurements) return null;
    
    const goalProps = {
      shoulderW: (goalMeasurements.shoulders / 50) * (isFemale ? 35 : 45),
      chestW: (goalMeasurements.chest / 50) * (isFemale ? 32 : 40),
      waistW: (goalMeasurements.waist / 50) * (isFemale ? 28 : 35),
      armW: (goalMeasurements.arms / 50) * (isFemale ? 8 : 12),
      legW: (goalMeasurements.legs / 50) * (isFemale ? 15 : 20),
    };
    
    const goalCenterX = centerX + 100; // Position goal body to the right
    
    return (
      <G opacity={0.6}>
        {/* Goal body outline - simplified but complete */}
        
        {/* Head */}
        <Ellipse
          cx={goalCenterX}
          cy={45}
          rx={18}
          ry={22}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        
        {/* Shoulders */}
        <Ellipse
          cx={goalCenterX}
          cy={85}
          rx={goalProps.shoulderW}
          ry={6}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        
        {/* Chest */}
        <Ellipse
          cx={goalCenterX}
          cy={110}
          rx={goalProps.chestW}
          ry={25}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        
        {/* Waist */}
        <Ellipse
          cx={goalCenterX}
          cy={160}
          rx={goalProps.waistW}
          ry={20}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        
        {/* Arms */}
        <Ellipse
          cx={goalCenterX - goalProps.shoulderW - 8}
          cy={130}
          rx={goalProps.armW / 2}
          ry={20}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        <Ellipse
          cx={goalCenterX + goalProps.shoulderW + 8}
          cy={130}
          rx={goalProps.armW / 2}
          ry={20}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        
        {/* Legs */}
        <Ellipse
          cx={goalCenterX - 12}
          cy={210}
          rx={goalProps.legW / 2}
          ry={30}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        <Ellipse
          cx={goalCenterX + 12}
          cy={210}
          rx={goalProps.legW / 2}
          ry={30}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth="2"
          strokeDasharray="3,3"
        />
        
        <Text x={goalCenterX} y={280} textAnchor="middle" fill={Colors.dark.accent} fontSize="12" fontWeight="bold">
          Goal Body
        </Text>
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.modelContainer}>
        {Platform.OS !== 'web' && PanGestureHandler ? (
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.svgContainer, animatedStyle]}>
              <AnimatedSvg width="300" height="320" viewBox="0 0 300 320" style={{ transform: [{ rotateY: `${rotationAngle}deg` }] }}>
                <Defs>
                  <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={isFemale ? '#FFE4E1' : '#E6F3FF'} />
                    <Stop offset="100%" stopColor={isFemale ? '#FFCCCB' : '#B0E0E6'} />
                  </LinearGradient>
                  <LinearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={isFemale ? '#8B4513' : '#654321'} />
                    <Stop offset="100%" stopColor={isFemale ? '#654321' : '#4A2C17'} />
                  </LinearGradient>
                </Defs>
              
              {/* Head with more realistic shape */}
              <Ellipse
                cx={centerX}
                cy={45}
                rx={20}
                ry={24}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
          
              {/* More realistic hair */}
              <Path
                d={`M ${centerX - 20} 28 Q ${centerX} 18 ${centerX + 20} 28 Q ${centerX + 18} 35 ${centerX + 10} 30 Q ${centerX} 22 ${centerX - 10} 30 Q ${centerX - 18} 35 ${centerX - 20} 28`}
                fill="url(#hairGradient)"
                stroke={isFemale ? '#654321' : '#4A2C17'}
                strokeWidth="1"
              />
              
              {/* Hair details for female */}
              {isFemale && (
                <Path
                  d={`M ${centerX - 15} 32 Q ${centerX - 25} 45 ${centerX - 20} 60 Q ${centerX - 15} 65 ${centerX - 10} 60 Q ${centerX - 5} 55 ${centerX - 10} 50`}
                  fill="url(#hairGradient)"
                  stroke={isFemale ? '#654321' : '#4A2C17'}
                  strokeWidth="1"
                />
              )}
              {isFemale && (
                <Path
                  d={`M ${centerX + 15} 32 Q ${centerX + 25} 45 ${centerX + 20} 60 Q ${centerX + 15} 65 ${centerX + 10} 60 Q ${centerX + 5} 55 ${centerX + 10} 50`}
                  fill="url(#hairGradient)"
                  stroke={isFemale ? '#654321' : '#4A2C17'}
                  strokeWidth="1"
                />
              )}
          
              {/* More realistic neck */}
              <Ellipse
                cx={centerX}
                cy={73}
                rx={6}
                ry={10}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1"
              />
          
              {/* More realistic shoulders */}
              <Ellipse
                cx={centerX}
                cy={85}
                rx={bodyProps.shoulderW}
                ry={8}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
          
              {/* More realistic chest/torso */}
              <Ellipse
                cx={centerX}
                cy={110}
                rx={bodyProps.chestW}
                ry={28}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
              
              {/* Chest definition for male */}
              {!isFemale && (
                <G>
                  <Ellipse
                    cx={centerX - 12}
                    cy={105}
                    rx={8}
                    ry={6}
                    fill="none"
                    stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                    strokeWidth="1"
                    opacity={0.6}
                  />
                  <Ellipse
                    cx={centerX + 12}
                    cy={105}
                    rx={8}
                    ry={6}
                    fill="none"
                    stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                    strokeWidth="1"
                    opacity={0.6}
                  />
                </G>
              )}
              
              {/* Breast definition for female */}
              {isFemale && (
                <G>
                  <Ellipse
                    cx={centerX - 10}
                    cy={108}
                    rx={8}
                    ry={10}
                    fill="rgba(255, 182, 193, 0.3)"
                    stroke="#FFB6C1"
                    strokeWidth="1"
                  />
                  <Ellipse
                    cx={centerX + 10}
                    cy={108}
                    rx={8}
                    ry={10}
                    fill="rgba(255, 182, 193, 0.3)"
                    stroke="#FFB6C1"
                    strokeWidth="1"
                  />
                </G>
              )}
          
              {/* More realistic waist */}
              <Ellipse
                cx={centerX}
                cy={160}
                rx={bodyProps.waistW}
                ry={22}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
              
              {/* Abs definition for male */}
              {!isFemale && (
                <G opacity={0.4}>
                  <Line x1={centerX} y1={140} x2={centerX} y2={180} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={145} x2={centerX + 8} y2={145} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={155} x2={centerX + 8} y2={155} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={165} x2={centerX + 8} y2={165} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={175} x2={centerX + 8} y2={175} stroke="#87CEEB" strokeWidth="1" />
                </G>
              )}
          
              {/* Enhanced female hips */}
              {isFemale && (
                <Ellipse
                  cx={centerX}
                  cy={175}
                  rx={bodyProps.waistW + 10}
                  ry={18}
                  fill="url(#skinGradient)"
                  stroke="#FFB6C1"
                  strokeWidth="1.5"
                />
              )}
          
              {/* More realistic arms */}
              <G>
                {/* Left arm */}
                <Ellipse
                  cx={centerX - bodyProps.shoulderW - 8}
                  cy={107}
                  rx={bodyProps.armW / 2}
                  ry={25}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - bodyProps.shoulderW - 8}
                  cy={150}
                  rx={bodyProps.armW / 2 - 1}
                  ry={22}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - bodyProps.shoulderW - 8}
                  cy={175}
                  rx={7}
                  ry={5}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
                
                {/* Right arm */}
                <Ellipse
                  cx={centerX + bodyProps.shoulderW + 8}
                  cy={107}
                  rx={bodyProps.armW / 2}
                  ry={25}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + bodyProps.shoulderW + 8}
                  cy={150}
                  rx={bodyProps.armW / 2 - 1}
                  ry={22}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + bodyProps.shoulderW + 8}
                  cy={175}
                  rx={7}
                  ry={5}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
              </G>
          
              {/* More realistic legs */}
              <G>
                {/* Left leg */}
                <Ellipse
                  cx={centerX - 12}
                  cy={210}
                  rx={bodyProps.legW / 2}
                  ry={35}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - 10}
                  cy={270}
                  rx={bodyProps.legW / 2 - 2}
                  ry={32}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - 10}
                  cy={305}
                  rx={14}
                  ry={7}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
                
                {/* Right leg */}
                <Ellipse
                  cx={centerX + 12}
                  cy={210}
                  rx={bodyProps.legW / 2}
                  ry={35}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + 10}
                  cy={270}
                  rx={bodyProps.legW / 2 - 2}
                  ry={32}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + 10}
                  cy={305}
                  rx={14}
                  ry={7}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
              </G>
          
              {/* Enhanced face features */}
              <G>
                {/* Eyes with more detail */}
                <Ellipse cx={centerX - 7} cy={40} rx={3} ry={2} fill="white" />
                <Circle cx={centerX - 7} cy={40} r={2} fill="#4A90E2" />
                <Circle cx={centerX - 7} cy={40} r={1} fill="#333" />
                <Ellipse cx={centerX + 7} cy={40} rx={3} ry={2} fill="white" />
                <Circle cx={centerX + 7} cy={40} r={2} fill="#4A90E2" />
                <Circle cx={centerX + 7} cy={40} r={1} fill="#333" />
                
                {/* Eyebrows */}
                <Path d={`M ${centerX - 10} 36 Q ${centerX - 7} 35 ${centerX - 4} 36`} stroke="#333" strokeWidth="1.5" fill="none" />
                <Path d={`M ${centerX + 4} 36 Q ${centerX + 7} 35 ${centerX + 10} 36`} stroke="#333" strokeWidth="1.5" fill="none" />
                
                {/* Nose with more detail */}
                <Path d={`M ${centerX} 45 L ${centerX - 1} 48 L ${centerX} 50 L ${centerX + 1} 48 Z`} fill="rgba(0,0,0,0.1)" />
                <Circle cx={centerX - 2} cy={49} r={1} fill="rgba(0,0,0,0.2)" />
                <Circle cx={centerX + 2} cy={49} r={1} fill="rgba(0,0,0,0.2)" />
                
                {/* Mouth with more detail */}
                <Path d={`M ${centerX - 5} 52 Q ${centerX} 55 ${centerX + 5} 52`} stroke="#D2691E" strokeWidth="2" fill="none" />
                <Path d={`M ${centerX - 3} 53 Q ${centerX} 54 ${centerX + 3} 53`} stroke="#FFB6C1" strokeWidth="1" fill="none" />
              </G>
              
                {/* Current vs Goal comparison */}
                {renderComparisonModel()}
              </AnimatedSvg>
            </Animated.View>
          </PanGestureHandler>
        ) : (
          <TouchableOpacity onPress={handleWebRotation} style={styles.svgContainer}>
            <AnimatedSvg width="300" height="320" viewBox="0 0 300 320" style={{ transform: [{ rotateY: `${rotationAngle}deg` }] }}>
              <Defs>
                <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={isFemale ? '#FFE4E1' : '#E6F3FF'} />
                  <Stop offset="100%" stopColor={isFemale ? '#FFCCCB' : '#B0E0E6'} />
                </LinearGradient>
                <LinearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={isFemale ? '#8B4513' : '#654321'} />
                  <Stop offset="100%" stopColor={isFemale ? '#654321' : '#4A2C17'} />
                </LinearGradient>
              </Defs>
              
              {/* Head with more realistic shape */}
              <Ellipse
                cx={centerX}
                cy={45}
                rx={20}
                ry={24}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
          
              {/* More realistic hair */}
              <Path
                d={`M ${centerX - 20} 28 Q ${centerX} 18 ${centerX + 20} 28 Q ${centerX + 18} 35 ${centerX + 10} 30 Q ${centerX} 22 ${centerX - 10} 30 Q ${centerX - 18} 35 ${centerX - 20} 28`}
                fill="url(#hairGradient)"
                stroke={isFemale ? '#654321' : '#4A2C17'}
                strokeWidth="1"
              />
              
              {/* Hair details for female */}
              {isFemale && (
                <Path
                  d={`M ${centerX - 15} 32 Q ${centerX - 25} 45 ${centerX - 20} 60 Q ${centerX - 15} 65 ${centerX - 10} 60 Q ${centerX - 5} 55 ${centerX - 10} 50`}
                  fill="url(#hairGradient)"
                  stroke={isFemale ? '#654321' : '#4A2C17'}
                  strokeWidth="1"
                />
              )}
              {isFemale && (
                <Path
                  d={`M ${centerX + 15} 32 Q ${centerX + 25} 45 ${centerX + 20} 60 Q ${centerX + 15} 65 ${centerX + 10} 60 Q ${centerX + 5} 55 ${centerX + 10} 50`}
                  fill="url(#hairGradient)"
                  stroke={isFemale ? '#654321' : '#4A2C17'}
                  strokeWidth="1"
                />
              )}
          
              {/* More realistic neck */}
              <Ellipse
                cx={centerX}
                cy={73}
                rx={6}
                ry={10}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1"
              />
          
              {/* More realistic shoulders */}
              <Ellipse
                cx={centerX}
                cy={85}
                rx={bodyProps.shoulderW}
                ry={8}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
          
              {/* More realistic chest/torso */}
              <Ellipse
                cx={centerX}
                cy={110}
                rx={bodyProps.chestW}
                ry={28}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
              
              {/* Chest definition for male */}
              {!isFemale && (
                <G>
                  <Ellipse
                    cx={centerX - 12}
                    cy={105}
                    rx={8}
                    ry={6}
                    fill="none"
                    stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                    strokeWidth="1"
                    opacity={0.6}
                  />
                  <Ellipse
                    cx={centerX + 12}
                    cy={105}
                    rx={8}
                    ry={6}
                    fill="none"
                    stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                    strokeWidth="1"
                    opacity={0.6}
                  />
                </G>
              )}
              
              {/* Breast definition for female */}
              {isFemale && (
                <G>
                  <Ellipse
                    cx={centerX - 10}
                    cy={108}
                    rx={8}
                    ry={10}
                    fill="rgba(255, 182, 193, 0.3)"
                    stroke="#FFB6C1"
                    strokeWidth="1"
                  />
                  <Ellipse
                    cx={centerX + 10}
                    cy={108}
                    rx={8}
                    ry={10}
                    fill="rgba(255, 182, 193, 0.3)"
                    stroke="#FFB6C1"
                    strokeWidth="1"
                  />
                </G>
              )}
          
              {/* More realistic waist */}
              <Ellipse
                cx={centerX}
                cy={160}
                rx={bodyProps.waistW}
                ry={22}
                fill="url(#skinGradient)"
                stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                strokeWidth="1.5"
              />
              
              {/* Abs definition for male */}
              {!isFemale && (
                <G opacity={0.4}>
                  <Line x1={centerX} y1={140} x2={centerX} y2={180} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={145} x2={centerX + 8} y2={145} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={155} x2={centerX + 8} y2={155} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={165} x2={centerX + 8} y2={165} stroke="#87CEEB" strokeWidth="1" />
                  <Line x1={centerX - 8} y1={175} x2={centerX + 8} y2={175} stroke="#87CEEB" strokeWidth="1" />
                </G>
              )}
          
              {/* Enhanced female hips */}
              {isFemale && (
                <Ellipse
                  cx={centerX}
                  cy={175}
                  rx={bodyProps.waistW + 10}
                  ry={18}
                  fill="url(#skinGradient)"
                  stroke="#FFB6C1"
                  strokeWidth="1.5"
                />
              )}
          
              {/* More realistic arms */}
              <G>
                {/* Left arm */}
                <Ellipse
                  cx={centerX - bodyProps.shoulderW - 8}
                  cy={107}
                  rx={bodyProps.armW / 2}
                  ry={25}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - bodyProps.shoulderW - 8}
                  cy={150}
                  rx={bodyProps.armW / 2 - 1}
                  ry={22}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - bodyProps.shoulderW - 8}
                  cy={175}
                  rx={7}
                  ry={5}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
                
                {/* Right arm */}
                <Ellipse
                  cx={centerX + bodyProps.shoulderW + 8}
                  cy={107}
                  rx={bodyProps.armW / 2}
                  ry={25}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + bodyProps.shoulderW + 8}
                  cy={150}
                  rx={bodyProps.armW / 2 - 1}
                  ry={22}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + bodyProps.shoulderW + 8}
                  cy={175}
                  rx={7}
                  ry={5}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
              </G>
          
              {/* More realistic legs */}
              <G>
                {/* Left leg */}
                <Ellipse
                  cx={centerX - 12}
                  cy={210}
                  rx={bodyProps.legW / 2}
                  ry={35}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - 10}
                  cy={270}
                  rx={bodyProps.legW / 2 - 2}
                  ry={32}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX - 10}
                  cy={305}
                  rx={14}
                  ry={7}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
                
                {/* Right leg */}
                <Ellipse
                  cx={centerX + 12}
                  cy={210}
                  rx={bodyProps.legW / 2}
                  ry={35}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + 10}
                  cy={270}
                  rx={bodyProps.legW / 2 - 2}
                  ry={32}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx={centerX + 10}
                  cy={305}
                  rx={14}
                  ry={7}
                  fill="url(#skinGradient)"
                  stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
                  strokeWidth="1"
                />
              </G>
          
              {/* Enhanced face features */}
              <G>
                {/* Eyes with more detail */}
                <Ellipse cx={centerX - 7} cy={40} rx={3} ry={2} fill="white" />
                <Circle cx={centerX - 7} cy={40} r={2} fill="#4A90E2" />
                <Circle cx={centerX - 7} cy={40} r={1} fill="#333" />
                <Ellipse cx={centerX + 7} cy={40} rx={3} ry={2} fill="white" />
                <Circle cx={centerX + 7} cy={40} r={2} fill="#4A90E2" />
                <Circle cx={centerX + 7} cy={40} r={1} fill="#333" />
                
                {/* Eyebrows */}
                <Path d={`M ${centerX - 10} 36 Q ${centerX - 7} 35 ${centerX - 4} 36`} stroke="#333" strokeWidth="1.5" fill="none" />
                <Path d={`M ${centerX + 4} 36 Q ${centerX + 7} 35 ${centerX + 10} 36`} stroke="#333" strokeWidth="1.5" fill="none" />
                
                {/* Nose with more detail */}
                <Path d={`M ${centerX} 45 L ${centerX - 1} 48 L ${centerX} 50 L ${centerX + 1} 48 Z`} fill="rgba(0,0,0,0.1)" />
                <Circle cx={centerX - 2} cy={49} r={1} fill="rgba(0,0,0,0.2)" />
                <Circle cx={centerX + 2} cy={49} r={1} fill="rgba(0,0,0,0.2)" />
                
                {/* Mouth with more detail */}
                <Path d={`M ${centerX - 5} 52 Q ${centerX} 55 ${centerX + 5} 52`} stroke="#D2691E" strokeWidth="2" fill="none" />
                <Path d={`M ${centerX - 3} 53 Q ${centerX} 54 ${centerX + 3} 53`} stroke="#FFB6C1" strokeWidth="1" fill="none" />
              </G>
              
              {/* Current vs Goal comparison */}
              {renderComparisonModel()}
              
              {/* Current body label when showing comparison */}
              {showComparison && (
                <Text x={centerX} y={280} textAnchor="middle" fill={isFemale ? '#FFB6C1' : '#87CEEB'} fontSize="12" fontWeight="bold">
                  Current Body
                </Text>
              )}
            </AnimatedSvg>
          </TouchableOpacity>
        )}
        
        {renderAnchorPoints()}
        {renderSlider()}
        
        <View style={styles.rotationHint}>
          <Text style={styles.rotationText}>
            {Platform.OS === 'web' ? '👆 Tap to rotate • 🎯 Tap points to adjust' : '👆 Drag to rotate • 🎯 Tap points to adjust'}
          </Text>
        </View>
        
        {showComparison && (
          <View style={styles.comparisonLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: isFemale ? '#FFB6C1' : '#87CEEB' }]} />
              <Text style={styles.legendText}>Current Body</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.dark.accent, opacity: 0.6 }]} />
              <Text style={styles.legendText}>Goal Body</Text>
            </View>
          </View>
        )}
        
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>• Realistic human anatomy with gender-specific features</Text>
          <Text style={styles.instructionText}>• Drag horizontally to rotate the model 360°</Text>
          <Text style={styles.instructionText}>• Tap colored anchor points to adjust body measurements</Text>
          <Text style={styles.instructionText}>• Enhanced muscle definition and body proportions</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 500,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.dark.background,
    position: 'relative',
  },
  modelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 25, 40, 0.9)',
    position: 'relative',
  },
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotationHint: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
    zIndex: 5,
  },
  rotationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  comparisonLegend: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    zIndex: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '500',
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '400',
    lineHeight: 16,
  },
});