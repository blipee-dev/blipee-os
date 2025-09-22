'use client';

import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Line, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { DynamicChart } from '@/lib/visualization/charts/DynamicChart';
import {
  Zap, Globe2, Droplet, Leaf, Wind, Sun, Cloud,
  TrendingUp, Activity, Award, Target, Sparkles
} from 'lucide-react';

// 3D Globe Component
const Globe3D: React.FC<{ emissions: number[] }> = ({ emissions }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group>
      <Sphere
        ref={meshRef}
        args={[2, 64, 64]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <MeshDistortMaterial
          color={hovered ? "#9333ea" : "#3b82f6"}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {/* Emission points on globe */}
      {emissions.map((value, i) => {
        const phi = Math.acos(-1 + (2 * i) / emissions.length);
        const theta = Math.sqrt(emissions.length * Math.PI) * phi;
        const x = Math.cos(theta) * Math.sin(phi) * 2.2;
        const y = Math.sin(theta) * Math.sin(phi) * 2.2;
        const z = Math.cos(phi) * 2.2;
        const scale = value / 100;

        return (
          <Sphere key={i} position={[x, y, z]} args={[0.05 * scale, 16, 16]}>
            <meshStandardMaterial
              color={value > 50 ? "#ef4444" : "#22c55e"}
              emissive={value > 50 ? "#ef4444" : "#22c55e"}
              emissiveIntensity={0.5}
            />
          </Sphere>
        );
      })}

      <Text
        position={[0, -3, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Global Emissions Map
      </Text>
    </group>
  );
};

// 3D Building Component
const Building3D: React.FC<{ energy: number; efficiency: number }> = ({ energy, efficiency }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  const efficiencyColor = efficiency > 75 ? "#22c55e" : efficiency > 50 ? "#f59e0b" : "#ef4444";

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <Box ref={meshRef} args={[1.5, 3, 1.5]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={efficiencyColor}
            metalness={0.6}
            roughness={0.2}
            transparent
            opacity={0.8}
          />
        </Box>

        {/* Windows */}
        {Array.from({ length: 6 }).map((_, floor) =>
          Array.from({ length: 3 }).map((_, window) => (
            <Box
              key={`${floor}-${window}`}
              args={[0.3, 0.3, 0.1]}
              position={[-0.5 + window * 0.5, 1 - floor * 0.5, 0.76]}
            >
              <meshStandardMaterial
                color={energy > 50 ? "#fbbf24" : "#1e40af"}
                emissive={energy > 50 ? "#fbbf24" : "#1e40af"}
                emissiveIntensity={0.5}
              />
            </Box>
          ))
        )}
      </Float>

      <Text
        position={[0, -2, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
      >
        Building Efficiency: {efficiency}%
      </Text>
    </group>
  );
};

// Energy Flow Visualization
const EnergyFlow: React.FC<{ sources: { name: string; value: number; color: string }[] }> = ({ sources }) => {
  return (
    <group>
      {sources.map((source, i) => {
        const angle = (i / sources.length) * Math.PI * 2;
        const x = Math.cos(angle) * 2;
        const z = Math.sin(angle) * 2;

        return (
          <group key={source.name}>
            <Float speed={2} floatIntensity={0.5}>
              <Sphere position={[x, 0, z]} args={[source.value / 50, 32, 32]}>
                <meshStandardMaterial
                  color={source.color}
                  emissive={source.color}
                  emissiveIntensity={0.3}
                  metalness={0.8}
                  roughness={0.2}
                />
              </Sphere>
            </Float>

            <Line
              points={[[0, 0, 0], [x, 0, z]]}
              color={source.color}
              lineWidth={2}
              transparent
              opacity={0.5}
            />

            <Text
              position={[x, -0.8, z]}
              fontSize={0.15}
              color="white"
              anchorX="center"
            >
              {source.name}
            </Text>
          </group>
        );
      })}

      <Sphere position={[0, 0, 0]} args={[0.3, 32, 32]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </Sphere>
    </group>
  );
};

export const InnovativeDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'globe' | 'building' | 'energy'>('globe');
  const [realTimeData, setRealTimeData] = useState({
    emissions: Array.from({ length: 50 }, () => Math.random() * 100),
    energy: 65,
    efficiency: 78,
    sources: [
      { name: 'Solar', value: 35, color: '#fbbf24' },
      { name: 'Wind', value: 28, color: '#0ea5e9' },
      { name: 'Grid', value: 25, color: '#6b7280' },
      { name: 'Battery', value: 12, color: '#22c55e' }
    ]
  });

  // Animated metrics
  const animatedMetrics = [
    {
      icon: <Zap className="w-6 h-6" />,
      label: 'Energy Flow',
      value: '2.4 MW',
      trend: '+12%',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Globe2 className="w-6 h-6" />,
      label: 'Carbon Saved',
      value: '847 tons',
      trend: '+23%',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Droplet className="w-6 h-6" />,
      label: 'Water Recycled',
      value: '95%',
      trend: '+5%',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      label: 'Eco Score',
      value: '92/100',
      trend: '+8',
      color: 'from-emerald-500 to-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 border-b border-white/10"
      >
        <div className="px-6 py-4 backdrop-blur-xl bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Innovative Dashboard</h1>
                <p className="text-white/60 text-sm">Interactive 3D sustainability visualization</p>
              </div>
            </div>

            {/* View Selector */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 backdrop-blur-xl">
              <button
                onClick={() => setActiveView('globe')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeView === 'globe'
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Globe View
              </button>
              <button
                onClick={() => setActiveView('building')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeView === 'building'
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Building View
              </button>
              <button
                onClick={() => setActiveView('energy')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeView === 'energy'
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Energy Flow
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Animated Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {animatedMetrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10`} />
              <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${metric.color} bg-opacity-20 mb-3`}>
                  {metric.icon}
                </div>
                <p className="text-white/60 text-sm mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-white">{metric.value}</h3>
                  <span className="text-green-400 text-sm font-medium">{metric.trend}</span>
                </div>
              </div>

              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 3 }).map((_, j) => (
                  <motion.div
                    key={j}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    initial={{ x: -10, y: Math.random() * 100 }}
                    animate={{ x: 300, y: Math.random() * 100 }}
                    transition={{
                      duration: 5 + j * 2,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: j * 1
                    }}
                    style={{ opacity: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3D Visualization Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 3D View */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 h-[500px] rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.03] border border-white/10"
          >
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={0.5} />

              <Suspense fallback={null}>
                <AnimatePresence mode="wait">
                  {activeView === 'globe' && <Globe3D emissions={realTimeData.emissions} />}
                  {activeView === 'building' && (
                    <Building3D
                      energy={realTimeData.energy}
                      efficiency={realTimeData.efficiency}
                    />
                  )}
                  {activeView === 'energy' && <EnergyFlow sources={realTimeData.sources} />}
                </AnimatePresence>
              </Suspense>

              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={3}
                maxDistance={10}
                autoRotate={activeView === 'energy'}
                autoRotateSpeed={0.5}
              />

              <Environment preset="city" />
            </Canvas>
          </motion.div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Real-time Stream */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Live Stream</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white/60 text-sm">Live</span>
                </div>
              </div>

              <div className="space-y-3">
                {['Solar Output: 2.4 MW', 'Wind Speed: 12 m/s', 'Grid Load: 78%', 'Battery: 92%'].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <span className="text-white/80 text-sm">{item}</span>
                    <Activity className="w-4 h-4 text-green-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Achievement Badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6"
            >
              <h3 className="text-white font-semibold mb-4">Achievements</h3>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Award />, color: 'from-yellow-500 to-orange-500' },
                  { icon: <Target />, color: 'from-green-500 to-emerald-500' },
                  { icon: <Wind />, color: 'from-blue-500 to-cyan-500' },
                  { icon: <Sun />, color: 'from-orange-500 to-red-500' },
                  { icon: <Leaf />, color: 'from-green-500 to-lime-500' },
                  { icon: <Cloud />, color: 'from-purple-500 to-pink-500' }
                ].map((badge, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`aspect-square rounded-xl bg-gradient-to-br ${badge.color} p-3 flex items-center justify-center`}
                  >
                    {React.cloneElement(badge.icon, { className: 'w-6 h-6 text-white' })}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Interactive Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DynamicChart
              type="radar"
              title="Sustainability Score"
              data={[
                {
                  subject: 'Energy',
                  A: 85,
                  B: 65,
                  fullMark: 100
                },
                {
                  subject: 'Water',
                  A: 92,
                  B: 70,
                  fullMark: 100
                },
                {
                  subject: 'Waste',
                  A: 78,
                  B: 60,
                  fullMark: 100
                },
                {
                  subject: 'Carbon',
                  A: 88,
                  B: 75,
                  fullMark: 100
                },
                {
                  subject: 'Social',
                  A: 95,
                  B: 80,
                  fullMark: 100
                }
              ]}
              options={{ dataKeys: ['A', 'B'] }}
              height={300}
              theme="glass"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DynamicChart
              type="bubble"
              title="Impact vs Effort Analysis"
              data={Array.from({ length: 20 }, (_, i) => ({
                x: Math.random() * 100,
                y: Math.random() * 100,
                z: Math.random() * 50 + 10
              }))}
              height={300}
              theme="glass"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InnovativeDashboard;