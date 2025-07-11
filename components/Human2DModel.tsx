import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Svg, Ellipse, Line, Circle, G, Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

interface Human2DModelProps {
  user?: UserProfile | null;
  goalMeasurements?: Record<string, number>;
  showComparison?: boolean;
  interactive?: boolean;
  onMeasurementChange?: (measurements: Record<string, number>) => void;
  progressMeasurements?: Record<string, number>; // New prop for post-workout measurements
  showProgress?: boolean; // New prop to show progress comparison
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
  progressMeasurements,
  showProgress = false,
}: Human2DModelProps) {
  const initialMeasurements = useMemo(() => ({
    shoulders: user?.currentMeasurements?.shoulders || 50,
    chest: user?.currentMeasurements?.chest || 50,
    arms: user?.currentMeasurements?.arms || 50,
    waist: user?.currentMeasurements?.waist || 50,
    legs: user?.currentMeasurements?.legs || 50,
  }), [user?.currentMeasurements]);
  
  // Use progress measurements if showing progress, otherwise use current measurements
  const displayMeasurements = useMemo(() => {
    if (showProgress && progressMeasurements) {
      return {
        shoulders: progressMeasurements.shoulders || initialMeasurements.shoulders,
        chest: progressMeasurements.chest || initialMeasurements.chest,
        arms: progressMeasurements.arms || initialMeasurements.arms,
        waist: progressMeasurements.waist || initialMeasurements.waist,
        legs: progressMeasurements.legs || initialMeasurements.legs,
      };
    }
    return initialMeasurements;
  }, [showProgress, progressMeasurements, initialMeasurements]);
  
  const [measurements, setMeasurements] = useState(displayMeasurements);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
  
  const isFemale = user?.gender === 'female';
  const centerX = (showComparison || showProgress) ? 100 : 150;
  
  // Calculate body proportions based on measurements
  const bodyProps = useMemo(() => {
    const shoulderW = (measurements.shoulders / 50) * (isFemale ? 35 : 45);
    const chestW = (measurements.chest / 50) * (isFemale ? 32 : 40);
    const waistW = (measurements.waist / 50) * (isFemale ? 28 : 35);
    const armW = (measurements.arms / 50) * (isFemale ? 8 : 12);
    const legW = (measurements.legs / 50) * (isFemale ? 15 : 20);
    
    return { shoulderW, chestW, waistW, armW, legW };
  }, [measurements, isFemale]);
  
  // View toggle handler
  const toggleView = useCallback(() => {
    setViewMode(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  const anchorPoints: AnchorPoint[] = useMemo(() => {
    // Calculate dynamic positions based on body proportions and view mode
    const shoulderEdgeX = centerX + (viewMode === 'front' ? bodyProps.shoulderW - 15 : -bodyProps.shoulderW + 15);
    const chestEdgeX = centerX + (viewMode === 'front' ? bodyProps.chestW - 10 : -bodyProps.chestW + 10);
    const armX = centerX + (viewMode === 'front' ? bodyProps.shoulderW + bodyProps.armW + 10 : -bodyProps.shoulderW - bodyProps.armW - 10);
    const waistEdgeX = centerX + (viewMode === 'front' ? bodyProps.waistW - 10 : -bodyProps.waistW + 10);
    const legX = centerX + (viewMode === 'front' ? bodyProps.legW + 5 : -bodyProps.legW - 5);
    
    return [
      {
        name: 'shoulders',
        x: shoulderEdgeX,
        y: 85,
        value: measurements.shoulders,
        min: 20,
        max: 100,
        color: '#FF7675',
      },
      {
        name: 'chest',
        x: chestEdgeX,
        y: 110,
        value: measurements.chest,
        min: 20,
        max: 100,
        color: '#00CEC9',
      },
      {
        name: 'arms',
        x: armX,
        y: 130,
        value: measurements.arms,
        min: 20,
        max: 100,
        color: '#74B9FF',
      },
      {
        name: 'waist',
        x: waistEdgeX,
        y: 160,
        value: measurements.waist,
        min: 20,
        max: 100,
        color: '#FDCB6E',
      },
      {
        name: 'legs',
        x: legX,
        y: 210,
        value: measurements.legs,
        min: 20,
        max: 100,
        color: '#A29BFE',
      },
    ];
  }, [measurements, centerX, bodyProps, viewMode]);

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

  // Render human body based on view mode
  const renderHumanBody = () => {
    const isBackView = viewMode === 'back';
    
    return (
      <G>
        {/* Head */}
        <Ellipse
          cx={centerX}
          cy={45}
          rx={20}
          ry={24}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
          strokeWidth="1.5"
        />
    
        {/* Hair - different for front/back view */}
        {!isBackView ? (
          <Path
            d={`M ${centerX - 20} 28 Q ${centerX} 18 ${centerX + 20} 28 Q ${centerX + 18} 35 ${centerX + 10} 30 Q ${centerX} 22 ${centerX - 10} 30 Q ${centerX - 18} 35 ${centerX - 20} 28`}
            fill="url(#hairGradient)"
            stroke={isFemale ? '#8B4513' : '#654321'}
            strokeWidth="1.5"
          />
        ) : (
          <Ellipse
            cx={centerX}
            cy={30}
            rx={22}
            ry={18}
            fill="url(#hairGradient)"
            stroke={isFemale ? '#8B4513' : '#654321'}
            strokeWidth="1.5"
          />
        )}
        
        {/* Hair details for female front view */}
        {isFemale && !isBackView && (
          <>
            <Path
              d={`M ${centerX - 15} 32 Q ${centerX - 25} 45 ${centerX - 20} 60 Q ${centerX - 15} 65 ${centerX - 10} 60 Q ${centerX - 5} 55 ${centerX - 10} 50`}
              fill="url(#hairGradient)"
              stroke="#8B4513"
              strokeWidth="1.2"
              opacity={0.9}
            />
            <Path
              d={`M ${centerX + 15} 32 Q ${centerX + 25} 45 ${centerX + 20} 60 Q ${centerX + 15} 65 ${centerX + 10} 60 Q ${centerX + 5} 55 ${centerX + 10} 50`}
              fill="url(#hairGradient)"
              stroke="#8B4513"
              strokeWidth="1.2"
              opacity={0.9}
            />
          </>
        )}
    
        {/* Neck */}
        <Ellipse
          cx={centerX}
          cy={73}
          rx={6}
          ry={10}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
          strokeWidth="1"
        />
    
        {/* Shoulders */}
        <Ellipse
          cx={centerX}
          cy={85}
          rx={bodyProps.shoulderW}
          ry={8}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
          strokeWidth="1.5"
        />
    
        {/* Chest/torso */}
        <Ellipse
          cx={centerX}
          cy={110}
          rx={bodyProps.chestW}
          ry={28}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
          strokeWidth="1.5"
        />
        
        {/* Chest/breast definition based on gender and view */}
        {!isFemale && !isBackView && (
          <G opacity={0.4}>
            <Ellipse
              cx={centerX - 12}
              cy={105}
              rx={8}
              ry={6}
              fill="none"
              stroke="#87CEEB"
              strokeWidth="1.5"
            />
            <Ellipse
              cx={centerX + 12}
              cy={105}
              rx={8}
              ry={6}
              fill="none"
              stroke="#87CEEB"
              strokeWidth="1.5"
            />
          </G>
        )}
        
        {isFemale && !isBackView && (
          <G>
            <Ellipse
              cx={centerX - 10}
              cy={108}
              rx={8}
              ry={10}
              fill="rgba(255, 182, 193, 0.2)"
              stroke="#FFB6C1"
              strokeWidth="1.5"
            />
            <Ellipse
              cx={centerX + 10}
              cy={108}
              rx={8}
              ry={10}
              fill="rgba(255, 182, 193, 0.2)"
              stroke="#FFB6C1"
              strokeWidth="1.5"
            />
          </G>
        )}
    
        {/* Waist */}
        <Ellipse
          cx={centerX}
          cy={160}
          rx={bodyProps.waistW}
          ry={22}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#FFB6C1' : '#87CEEB'}
          strokeWidth="1.5"
        />
        
        {/* Abs definition for male front view */}
        {!isFemale && !isBackView && (
          <G opacity={0.3}>
            <Line x1={centerX} y1={140} x2={centerX} y2={180} stroke="#87CEEB" strokeWidth="1.5" />
            <Line x1={centerX - 10} y1={148} x2={centerX + 10} y2={148} stroke="#87CEEB" strokeWidth="1" />
            <Line x1={centerX - 10} y1={158} x2={centerX + 10} y2={158} stroke="#87CEEB" strokeWidth="1" />
            <Line x1={centerX - 10} y1={168} x2={centerX + 10} y2={168} stroke="#87CEEB" strokeWidth="1" />
          </G>
        )}
        
        {/* Back muscles for back view */}
        {isBackView && (
          <G opacity={0.3}>
            <Line x1={centerX} y1={90} x2={centerX} y2={170} stroke={isFemale ? '#FFB6C1' : '#87CEEB'} strokeWidth="1.5" />
            <Path d={`M ${centerX - 18} 105 Q ${centerX} 100 ${centerX + 18} 105`} stroke={isFemale ? '#FFB6C1' : '#87CEEB'} strokeWidth="1.2" fill="none" />
            <Path d={`M ${centerX - 22} 125 Q ${centerX} 120 ${centerX + 22} 125`} stroke={isFemale ? '#FFB6C1' : '#87CEEB'} strokeWidth="1.2" fill="none" />
            <Path d={`M ${centerX - 20} 145 Q ${centerX} 140 ${centerX + 20} 145`} stroke={isFemale ? '#FFB6C1' : '#87CEEB'} strokeWidth="1.2" fill="none" />
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
    
        {/* Arms */}
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
    
        {/* Legs */}
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
    
        {/* Face features - only for front view */}
        {!isBackView && (
          <G opacity={0.8}>
            {/* Eyes */}
            <Ellipse cx={centerX - 6} cy={42} rx={2.5} ry={1.8} fill="white" opacity={0.9} />
            <Circle cx={centerX - 6} cy={42} r={1.5} fill="#4A90E2" />
            <Circle cx={centerX - 6} cy={42} r={0.8} fill="#333" />
            <Ellipse cx={centerX + 6} cy={42} rx={2.5} ry={1.8} fill="white" opacity={0.9} />
            <Circle cx={centerX + 6} cy={42} r={1.5} fill="#4A90E2" />
            <Circle cx={centerX + 6} cy={42} r={0.8} fill="#333" />
            
            {/* Eyebrows */}
            <Path d={`M ${centerX - 9} 38 Q ${centerX - 6} 37 ${centerX - 3} 38`} stroke="#555" strokeWidth="1.2" fill="none" opacity={0.7} />
            <Path d={`M ${centerX + 3} 38 Q ${centerX + 6} 37 ${centerX + 9} 38`} stroke="#555" strokeWidth="1.2" fill="none" opacity={0.7} />
            
            {/* Nose */}
            <Path d={`M ${centerX} 47 L ${centerX - 0.8} 50 L ${centerX} 52 L ${centerX + 0.8} 50 Z`} fill="rgba(0,0,0,0.08)" />
            <Circle cx={centerX - 1.5} cy={50.5} r={0.8} fill="rgba(0,0,0,0.15)" />
            <Circle cx={centerX + 1.5} cy={50.5} r={0.8} fill="rgba(0,0,0,0.15)" />
            
            {/* Mouth */}
            <Path d={`M ${centerX - 4} 54 Q ${centerX} 56 ${centerX + 4} 54`} stroke="#CD5C5C" strokeWidth="1.5" fill="none" opacity={0.8} />
          </G>
        )}
      </G>
    );
  };

  // Render comparison with divider line (for goals or progress)
  const renderComparisonWithDivider = () => {
    if (showProgress && progressMeasurements) {
      return renderProgressComparison();
    }
    if (!showComparison || !goalMeasurements) return null;
    
    const goalProps = {
      shoulderW: (goalMeasurements.shoulders / 50) * (isFemale ? 35 : 45),
      chestW: (goalMeasurements.chest / 50) * (isFemale ? 32 : 40),
      waistW: (goalMeasurements.waist / 50) * (isFemale ? 28 : 35),
      armW: (goalMeasurements.arms / 50) * (isFemale ? 8 : 12),
      legW: (goalMeasurements.legs / 50) * (isFemale ? 15 : 20),
    };
    
    const goalCenterX = centerX + 140;
    const dividerX = centerX + 70;
    
    return (
      <G>
        {/* Thick divider line */}
        <Line 
          x1={dividerX} 
          y1={20} 
          x2={dividerX} 
          y2={320} 
          stroke={Colors.dark.accent} 
          strokeWidth="4" 
          strokeDasharray="8,4"
        />
        
        {/* VS text */}
        <SvgText 
          x={dividerX} 
          y={170} 
          textAnchor="middle" 
          fill={Colors.dark.accent} 
          fontSize="16" 
          fontWeight="bold"
        >
          VS
        </SvgText>
        
        {/* Goal body - same structure as current body but with goal measurements */}
        <G transform={`translate(${goalCenterX - centerX}, 0)`}>
          {/* Head */}
          <Ellipse
            cx={centerX}
            cy={45}
            rx={20}
            ry={24}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Hair */}
          {viewMode === 'front' ? (
            <Path
              d={`M ${centerX - 20} 28 Q ${centerX} 18 ${centerX + 20} 28 Q ${centerX + 18} 35 ${centerX + 10} 30 Q ${centerX} 22 ${centerX - 10} 30 Q ${centerX - 18} 35 ${centerX - 20} 28`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
          ) : (
            <Ellipse
              cx={centerX}
              cy={30}
              rx={22}
              ry={18}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
          )}
          
          {/* Neck */}
          <Ellipse
            cx={centerX}
            cy={73}
            rx={6}
            ry={10}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Shoulders */}
          <Ellipse
            cx={centerX}
            cy={85}
            rx={goalProps.shoulderW}
            ry={8}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Chest */}
          <Ellipse
            cx={centerX}
            cy={110}
            rx={goalProps.chestW}
            ry={28}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Waist */}
          <Ellipse
            cx={centerX}
            cy={160}
            rx={goalProps.waistW}
            ry={22}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Arms */}
          <Ellipse
            cx={centerX - goalProps.shoulderW - 8}
            cy={130}
            rx={goalProps.armW / 2}
            ry={20}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <Ellipse
            cx={centerX + goalProps.shoulderW + 8}
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
            cx={centerX - 12}
            cy={210}
            rx={goalProps.legW / 2}
            ry={30}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <Ellipse
            cx={centerX + 12}
            cy={210}
            rx={goalProps.legW / 2}
            ry={30}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
        </G>
        
        {/* Labels */}
        <SvgText x={centerX} y={325} textAnchor="middle" fill={isFemale ? '#FFB6C1' : '#87CEEB'} fontSize="13" fontWeight="bold">
          {showProgress ? 'Before' : 'Current'}
        </SvgText>
        <SvgText x={goalCenterX} y={325} textAnchor="middle" fill={Colors.dark.accent} fontSize="13" fontWeight="bold">
          {showProgress ? 'After' : 'Goal'}
        </SvgText>
      </G>
    );
  };

  // Render progress comparison (before vs after workout completion)
  const renderProgressComparison = () => {
    if (!showProgress || !progressMeasurements) return null;
    
    const progressProps = {
      shoulderW: (progressMeasurements.shoulders / 50) * (isFemale ? 35 : 45),
      chestW: (progressMeasurements.chest / 50) * (isFemale ? 32 : 40),
      waistW: (progressMeasurements.waist / 50) * (isFemale ? 28 : 35),
      armW: (progressMeasurements.arms / 50) * (isFemale ? 8 : 12),
      legW: (progressMeasurements.legs / 50) * (isFemale ? 15 : 20),
    };
    
    const afterCenterX = centerX + 140;
    const dividerX = centerX + 70;
    
    return (
      <G>
        {/* Thick divider line */}
        <Line 
          x1={dividerX} 
          y1={20} 
          x2={dividerX} 
          y2={320} 
          stroke={Colors.dark.accent} 
          strokeWidth="4" 
          strokeDasharray="8,4"
        />
        
        {/* Progress indicator */}
        <SvgText 
          x={dividerX} 
          y={170} 
          textAnchor="middle" 
          fill={Colors.dark.accent} 
          fontSize="16" 
          fontWeight="bold"
        >
          ➜
        </SvgText>
        
        {/* After workout body - with enhanced/improved proportions */}
        <G transform={`translate(${afterCenterX - centerX}, 0)`}>
          {/* Head */}
          <Ellipse
            cx={centerX}
            cy={45}
            rx={20}
            ry={24}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          
          {/* Hair */}
          {viewMode === 'front' ? (
            <Path
              d={`M ${centerX - 20} 28 Q ${centerX} 18 ${centerX + 20} 28 Q ${centerX + 18} 35 ${centerX + 10} 30 Q ${centerX} 22 ${centerX - 10} 30 Q ${centerX - 18} 35 ${centerX - 20} 28`}
              fill="url(#hairGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.5"
            />
          ) : (
            <Ellipse
              cx={centerX}
              cy={30}
              rx={22}
              ry={18}
              fill="url(#hairGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.5"
            />
          )}
          
          {/* Neck */}
          <Ellipse
            cx={centerX}
            cy={73}
            rx={6}
            ry={10}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.5"
          />
          
          {/* Shoulders - enhanced */}
          <Ellipse
            cx={centerX}
            cy={85}
            rx={progressProps.shoulderW}
            ry={8}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          
          {/* Chest - enhanced */}
          <Ellipse
            cx={centerX}
            cy={110}
            rx={progressProps.chestW}
            ry={28}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          
          {/* Enhanced muscle definition for progress */}
          {!isFemale && viewMode === 'front' && (
            <G opacity={0.6}>
              <Line x1={centerX} y1={95} x2={centerX} y2={125} stroke={Colors.dark.accent} strokeWidth="2" />
              <Line x1={centerX - 12} y1={102} x2={centerX + 12} y2={102} stroke={Colors.dark.accent} strokeWidth="1.5" />
              <Line x1={centerX - 12} y1={112} x2={centerX + 12} y2={112} stroke={Colors.dark.accent} strokeWidth="1.5" />
              <Line x1={centerX - 12} y1={122} x2={centerX + 12} y2={122} stroke={Colors.dark.accent} strokeWidth="1.5" />
            </G>
          )}
          
          {/* Waist - improved */}
          <Ellipse
            cx={centerX}
            cy={160}
            rx={progressProps.waistW}
            ry={22}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          
          {/* Arms - enhanced */}
          <Ellipse
            cx={centerX - progressProps.shoulderW - 8}
            cy={130}
            rx={progressProps.armW / 2}
            ry={20}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          <Ellipse
            cx={centerX + progressProps.shoulderW + 8}
            cy={130}
            rx={progressProps.armW / 2}
            ry={20}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          
          {/* Legs - enhanced */}
          <Ellipse
            cx={centerX - 12}
            cy={210}
            rx={progressProps.legW / 2}
            ry={30}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          <Ellipse
            cx={centerX + 12}
            cy={210}
            rx={progressProps.legW / 2}
            ry={30}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="2"
          />
          
          {/* Progress glow effect */}
          <Circle
            cx={centerX}
            cy={160}
            r={80}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="1"
            opacity={0.2}
            strokeDasharray="4,8"
          />
        </G>
        
        {/* Labels */}
        <SvgText x={centerX} y={325} textAnchor="middle" fill={isFemale ? '#FFB6C1' : '#87CEEB'} fontSize="13" fontWeight="bold">
          Before
        </SvgText>
        <SvgText x={afterCenterX} y={325} textAnchor="middle" fill={Colors.dark.accent} fontSize="13" fontWeight="bold">
          After Workout
        </SvgText>
      </G>
    );
  };

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
              left: anchor.x - 16,
              top: anchor.y - 16,
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
    const sliderWidth = 100; // Further reduced size
    
    // Calculate position to keep slider on screen and close to anchor
    let sliderLeft = anchor.x - (sliderWidth / 2);
    let sliderTop = anchor.y - 40; // Even closer to anchor point
    
    // Ensure slider stays within screen bounds with better margins
    if (sliderLeft < 15) sliderLeft = 15;
    if (sliderLeft + sliderWidth > screenWidth - 15) sliderLeft = screenWidth - sliderWidth - 15;
    if (sliderTop < 15) sliderTop = anchor.y + 25; // Move below if too high
    
    return (
      <View style={[
        styles.sliderContainer,
        {
          left: sliderLeft,
          top: sliderTop,
          borderColor: anchor.color,
          width: sliderWidth,
        }
      ]}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{anchor.name.charAt(0).toUpperCase()}</Text>
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
        {/* Header with view toggle */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {showProgress ? 'Progress Comparison' : (viewMode === 'front' ? 'Front View' : 'Back View')}
          </Text>
          <TouchableOpacity onPress={toggleView} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>
              {viewMode === 'front' ? '🔄 Back' : '🔄 Front'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Main SVG container */}
        <View style={styles.svgWrapper}>
          <TouchableOpacity onPress={toggleView} style={styles.svgContainer}>
            <Svg width={(showComparison || showProgress) ? "360" : "260"} height="320" viewBox={(showComparison || showProgress) ? "0 0 360 320" : "0 0 260 320"}>
              <Defs>
                <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={isFemale ? '#FFF0F0' : '#F0F8FF'} />
                  <Stop offset="50%" stopColor={isFemale ? '#FFE4E1' : '#E6F3FF'} />
                  <Stop offset="100%" stopColor={isFemale ? '#FFCCCB' : '#B0E0E6'} />
                </LinearGradient>
                <LinearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={isFemale ? '#A0522D' : '#8B4513'} />
                  <Stop offset="50%" stopColor={isFemale ? '#8B4513' : '#654321'} />
                  <Stop offset="100%" stopColor={isFemale ? '#654321' : '#4A2C17'} />
                </LinearGradient>
                <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={Colors.dark.accent} opacity={0.3} />
                  <Stop offset="50%" stopColor={Colors.dark.accent} opacity={0.2} />
                  <Stop offset="100%" stopColor={Colors.dark.accent} opacity={0.1} />
                </LinearGradient>
              </Defs>
              
              {/* Render the human body */}
              {renderHumanBody()}
              
              {/* Render comparison if enabled */}
              {showComparison ? renderComparisonWithDivider() : null}
            </Svg>
          </TouchableOpacity>
          
          {renderAnchorPoints()}
          {renderSlider()}
        </View>
        
        {/* Comparison legend */}
        {(showComparison || showProgress) && (
          <View style={styles.comparisonLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: isFemale ? '#FFB6C1' : '#87CEEB' }]} />
              <Text style={styles.legendText}>{showProgress ? 'Before' : 'Current'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.dark.accent, opacity: 0.6 }]} />
              <Text style={styles.legendText}>{showProgress ? 'After Workout' : 'Goal'}</Text>
            </View>
          </View>
        )}
        
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {showProgress 
              ? '🏆 Your transformation progress after completing the workout plan'
              : '🎯 Tap colored points to adjust • 🔄 Tap model to switch views'
            }
          </Text>
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
    backgroundColor: '#0F1419',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modelContainer: {
    flex: 1,
    backgroundColor: '#0F1419',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  svgWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 10,
  },
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 12,
    padding: 8,
  },
  comparisonLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  anchorPoint: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  anchorLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  anchorPulse: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.3,
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    padding: 10,
    zIndex: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    minWidth: 100,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 2,
  },
  sliderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sliderButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sliderButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sliderValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
});