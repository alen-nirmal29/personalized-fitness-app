import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

interface HumanModel3DProps {
  user?: UserProfile | null;
  goalMeasurements?: Record<string, number>;
  showComparison?: boolean;
  interactive?: boolean;
  onMeasurementChange?: (measurements: Record<string, number>) => void;
}

interface BodyPartProps {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity?: number;
}

// Head component
function Head({ position, scale, color, opacity = 1 }: BodyPartProps) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5 * scale[0], 16, 16]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

// Torso component
function Torso({ position, scale, color, opacity = 1 }: BodyPartProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1 * scale[0], 2 * scale[1], 0.6 * scale[2]]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

// Arm component
function Arm({ position, scale, color, opacity = 1 }: BodyPartProps) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.15 * scale[0], 0.15 * scale[0], 1.5 * scale[1], 8]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

// Leg component
function Leg({ position, scale, color, opacity = 1 }: BodyPartProps) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.2 * scale[0], 0.2 * scale[0], 2 * scale[1], 8]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

// Simple text label component (without troika-worker-utils)
function SimpleLabel({ 
  position, 
  text, 
  color 
}: { 
  position: [number, number, number]; 
  text: string; 
  color: string; 
}) {
  return (
    <mesh position={position}>
      <planeGeometry args={[1, 0.3]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Main human model component
function HumanModel({ 
  user, 
  goalMeasurements, 
  showComparison = false,
  isGoal = false 
}: {
  user?: UserProfile | null;
  goalMeasurements?: Record<string, number>;
  showComparison?: boolean;
  isGoal?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate scale factors based on user data
  const getScaleFactors = () => {
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
  };
  
  const scales = getScaleFactors();
  const modelColor = isGoal ? Colors.dark.gradient.secondary : Colors.dark.accent;
  const opacity = showComparison && isGoal ? 0.6 : 1;
  
  // Animate the model slightly
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={showComparison && isGoal ? [1, 0, 0] : [0, 0, 0]}>
      {/* Head */}
      <Head 
        position={[0, 2.5, 0]} 
        scale={[1, 1, 1]} 
        color={modelColor}
        opacity={opacity}
      />
      
      {/* Torso */}
      <Torso 
        position={[0, 1, 0]} 
        scale={[scales.chest, 1, scales.waist]} 
        color={modelColor}
        opacity={opacity}
      />
      
      {/* Left Arm */}
      <Arm 
        position={[-1.2 * scales.shoulders, 1.5, 0]} 
        scale={[scales.arms, 1, 1]} 
        color={modelColor}
        opacity={opacity}
      />
      
      {/* Right Arm */}
      <Arm 
        position={[1.2 * scales.shoulders, 1.5, 0]} 
        scale={[scales.arms, 1, 1]} 
        color={modelColor}
        opacity={opacity}
      />
      
      {/* Left Leg */}
      <Leg 
        position={[-0.4, -1, 0]} 
        scale={[scales.legs, 1, 1]} 
        color={modelColor}
        opacity={opacity}
      />
      
      {/* Right Leg */}
      <Leg 
        position={[0.4, -1, 0]} 
        scale={[scales.legs, 1, 1]} 
        color={modelColor}
        opacity={opacity}
      />
      
      {/* Simple labels for comparison */}
      {showComparison && (
        <SimpleLabel
          position={[0, -2.5, 0]}
          text={isGoal ? 'Goal' : 'Current'}
          color={modelColor}
        />
      )}
    </group>
  );
}

// Camera controller
function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);
  }, [camera]);
  
  return null;
}

export default function HumanModel3D({
  user,
  goalMeasurements,
  showComparison = false,
  interactive = true,
  onMeasurementChange,
}: HumanModel3DProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if 3D is supported
    if (Platform.OS === 'web') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setIsSupported(!!gl);
      } catch (error) {
        setIsSupported(false);
        setError('WebGL not supported');
      }
    }
  }, []);
  
  // For React Native, always show fallback to avoid worker issues
  if (Platform.OS !== 'web' || !isSupported || error) {
    return (
      <View style={styles.fallbackContainer}>
        <View style={styles.fallbackModel}>
          <Text style={styles.fallbackTitle}>3D Model Preview</Text>
          <Text style={styles.fallbackSubtitle}>
            {user?.gender === 'female' ? 'Female' : user?.gender === 'male' ? 'Male' : 'Human'} Model
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
          {showComparison && (
            <Text style={styles.fallbackComparison}>
              Current vs Goal Comparison
            </Text>
          )}
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={styles.canvas}
        gl={{ antialias: true, alpha: true }}
        onCreated={(state) => {
          console.log('3D Canvas created successfully');
        }}
        onError={(error) => {
          console.error('3D Canvas error:', error);
          setError('3D rendering error');
        }}
      >
        <CameraController />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Current model */}
        <HumanModel 
          user={user} 
          goalMeasurements={goalMeasurements}
          showComparison={showComparison}
          isGoal={false}
        />
        
        {/* Goal model (if showing comparison) */}
        {showComparison && goalMeasurements && (
          <HumanModel 
            user={user} 
            goalMeasurements={goalMeasurements}
            showComparison={showComparison}
            isGoal={true}
          />
        )}
        
        {/* Controls */}
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 6}
            maxDistance={10}
            minDistance={3}
          />
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
  },
  canvas: {
    flex: 1,
  },
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
    maxWidth: 280,
    height: 320,
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
  fallbackStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  fallbackStat: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: 4,
  },
  fallbackComparison: {
    color: Colors.dark.accent,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});