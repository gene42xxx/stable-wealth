'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUp, ArrowDown, TrendingUp, Sparkles, Zap, Star, Activity, BarChart3, Eye, MousePointer } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

const StatCard = ({
  icon,
  title,
  value,
  change,
  changePositive,
  gradient = "from-slate-900/90 via-slate-800/80 to-slate-900/90",
  accentColor = "cyan",
  subtitle = "",
  trend = [],
  premium = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Advanced motion values for 3D effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), { stiffness: 100, damping: 30 });

  const accentColors = {
    cyan: {
      primary: "from-cyan-400 to-blue-500",
      glow: "shadow-cyan-500/30",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      particle: "bg-cyan-400"
    },
    purple: {
      primary: "from-purple-400 to-pink-500",
      glow: "shadow-purple-500/30",
      text: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      particle: "bg-purple-400"
    },
    emerald: {
      primary: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/30",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      particle: "bg-emerald-400"
    },
    amber: {
      primary: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/30",
      text: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      particle: "bg-amber-400"
    },
    rose: {
      primary: "from-rose-400 to-red-500",
      glow: "shadow-rose-500/30",
      text: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      particle: "bg-rose-400"
    }
  };

  const currentAccent = accentColors[accentColor] || accentColors.cyan;

  // Mouse tracking for 3D effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);

    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // Floating particles animation
  const ParticleField = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 ${currentAccent.particle} rounded-full opacity-0`}
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            opacity: 0
          }}
          animate={isHovered ? {
            y: [null, "-20px", "-40px"],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5]
          } : {}}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: isHovered ? Infinity : 0,
            repeatDelay: 1
          }}
        />
      ))}
    </div>
  );

  // Enhanced trend line
  const TrendVisualization = () => {
    const trendData = trend.length ? trend : [3, 7, 4, 8, 6, 9, 5, 12, 8, 15];
    const max = Math.max(...trendData);

    return (
      <div className="flex items-end space-x-1 h-8">
        {trendData.map((height, i) => (
          <motion.div
            key={i}
            className={`w-1.5 bg-gradient-to-t ${currentAccent.primary} rounded-full`}
            style={{ height: `${(height / max) * 100}%` }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: isHovered ? 1 : 0.6,
              opacity: isHovered ? 1 : 0.4
            }}
            transition={{
              delay: i * 0.05,
              duration: 0.4,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ scaleY: 1.2 }}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        type: "spring",
        stiffness: 100
      }}
      className="relative group perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d"
      }}
    >
      {/* Dynamic background beams */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`absolute h-px w-full bg-gradient-to-r from-transparent via-${accentColor}-500 to-transparent`}
          style={{
            top: `${mousePosition.y}%`,
            transform: 'translateY(-50%)',
            opacity: isHovered ? 0.3 : 0
          }}
        />
        <div
          className={`absolute w-px h-full bg-gradient-to-b from-transparent via-${accentColor}-500 to-transparent`}
          style={{
            left: `${mousePosition.x}%`,
            transform: 'translateX(-50%)',
            opacity: isHovered ? 0.3 : 0
          }}
        />
      </motion.div>

      {/* Multi-layer glow effects */}
      <motion.div
        className={`absolute -inset-1 bg-gradient-to-r ${currentAccent.primary} rounded-2xl blur-lg`}
        animate={{
          opacity: isHovered ? 0.15 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        className={`absolute -inset-0.5 bg-gradient-to-r ${currentAccent.primary} rounded-2xl blur-sm`}
        animate={{
          opacity: isHovered ? 0.25 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Main card with 3D transform */}
      <motion.div
        className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden cursor-pointer"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          background: `
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(255,255,255,0.1) 0%, 
              transparent 50%),
            linear-gradient(135deg, 
              rgba(15, 23, 42, 0.95) 0%, 
              rgba(30, 41, 59, 0.9) 50%, 
              rgba(15, 23, 42, 0.95) 100%)
          `
        }}
        whileHover={{
          y: -4,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.98 }}
      >
        <ParticleField />

        {/* Premium badge */}
        {premium && (
          <motion.div
            className="absolute top-4 right-4 px-2 py-1 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400 font-medium"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <Star size={10} className="inline mr-1" />
            PRO
          </motion.div>
        )}

        {/* Animated corner decorations */}
        <div className="absolute top-0 left-0 w-20 h-20 opacity-10">
          <motion.div
            className={`w-full h-full bg-gradient-radial from-${accentColor}-400/30 to-transparent rounded-full`}
            animate={{
              scale: isHovered ? [1, 1.2, 1] : 1,
              opacity: isHovered ? [0.1, 0.3, 0.1] : 0.1
            }}
            transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
          />
        </div>

        {/* Header with enhanced icon */}
        <div className="flex items-start justify-between mb-3">
          <motion.div
            className={`relative p-4 rounded-xl ${currentAccent.bg} ${currentAccent.border} border backdrop-blur-sm overflow-hidden`}
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
            style={{ transform: "translateZ(20px)" }}
          >
            {/* Icon glow effect */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${currentAccent.primary} opacity-0 rounded-xl`}
              animate={{ opacity: isHovered ? 0.2 : 0 }}
              transition={{ duration: 0.3 }}
            />
            <div className={`relative ${currentAccent.text} z-10`}>
              {icon}
            </div>
          </motion.div>

          {/* Activity indicators */}
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              animate={{
                scale: isHovered ? [1, 1.2, 1] : 1,
                rotate: isHovered ? 360 : 0
              }}
              transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
            >
              <Activity size={14} className={`${currentAccent.text} opacity-60`} />
            </motion.div>
            <motion.div
              animate={{
                y: isHovered ? [0, -2, 0] : 0
              }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
            >
              <Eye size={14} className={`${currentAccent.text} opacity-60`} />
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced content section */}
        <div className="space-y-2">
          <div>
            <motion.h3
              className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center"
              animate={{
                opacity: isHovered ? 0.9 : 0.7,
                letterSpacing: isHovered ? "0.12em" : "0.1em"
              }}
              style={{ transform: "translateZ(10px)" }}
            >
              {title}
            </motion.h3>

            <motion.div
              style={{ transform: "translateZ(30px)" }}
              animate={{
                scale: isHovered ? 1.02 : 1,
                y: isHovered ? -1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                className="text-2xl font-bold text-white leading-tight tracking-tight"
                animate={{
                  color: isHovered ? "#f8fafc" : "#ffffff"
                }}
                transition={{ duration: 0.3 }}
              >
                {value}
              </motion.p>
              {subtitle && (
                <motion.p
                  className="text-xs text-slate-400 mt-1 font-normal"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {subtitle}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Enhanced metrics section */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ transform: "translateZ(20px)" }}
          >
            {/* Change indicator with pulse effect */}
            <motion.div
              className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border overflow-hidden ${changePositive
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              whileHover={{ scale: 1.02 }}
              animate={{
                boxShadow: isHovered
                  ? `0 0 12px ${changePositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  : "0 0 0px transparent"
              }}
            >
              {/* Animated background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${changePositive ? 'from-emerald-500/20 to-green-500/20' : 'from-red-500/20 to-rose-500/20'
                  } opacity-0`}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              <motion.div
                animate={{
                  rotate: changePositive ? [0, 180] : [0, -180],
                  scale: isHovered ? 1.1 : 1
                }}
                transition={{
                  duration: 1.5,
                  repeat: isHovered ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                {changePositive ? <TrendingUp size={12} /> : <ArrowDown size={12} />}
              </motion.div>
              <span className="relative z-10">{change}</span>
            </motion.div>

            {/* Enhanced trend visualization */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isHovered ? 1.1 : 1,
                opacity: isHovered ? 1 : 0.6
              }}
              transition={{ duration: 0.4 }}
              style={{ transform: "translateZ(15px)" }}
            >
              <TrendVisualization />
            </motion.div>
          </motion.div>
        </div>

        {/* Animated bottom accent */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${currentAccent.primary} rounded-full`}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Corner shine effect */}
        <motion.div
          className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
};
export default StatCard;