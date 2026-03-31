import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanningAnimationProps {
  isSearching: boolean;
  isEmpty: boolean;
  onSearchComplete: () => void;
}

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({ isSearching, isEmpty, onSearchComplete }) => {
  const [signalDots, setSignalDots] = useState<{id: number, x: number, y: number}[]>([]);

  // Animate signal dots on radar
  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setSignalDots((prev) => {
        const next = [
          ...prev,
          {
            id: Date.now(),
            x: Math.random() * 220 - 110,
            y: Math.random() * 220 - 110,
          },
        ];
        return next.slice(-8); // keep last 8 dots
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isSearching]);

  return (
    <div className="flex flex-col items-center justify-center h-[420px] overflow-hidden relative">
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="searching"
            className="flex flex-col items-center justify-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Glow background */}
            <motion.div
              className="absolute w-72 h-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative w-64 h-64 flex flex-col items-center justify-center mb-6">
              {/* Radar rings */}
              <div className="absolute w-64 h-64 border border-purple-500/30 rounded-full pointer-events-none" />
              <div className="absolute w-48 h-48 border border-purple-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-32 h-32 border border-purple-500/10 rounded-full pointer-events-none" />

              {/* Rotating scan line */}
              <motion.div
                className="absolute w-[2px] h-32 bg-gradient-to-b from-purple-400 to-transparent"
                style={{
                  top: 0,
                  transformOrigin: "bottom center",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "linear",
                }}
              />

              {/* Signal dots */}
              <AnimatePresence>
                {signalDots.map((dot) => (
                  <motion.div
                    key={dot.id}
                    className="absolute w-3 h-3 bg-purple-400 rounded-full"
                    style={{
                      left: `calc(50% + ${dot.x}px)`,
                      top: `calc(50% + ${dot.y}px)`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Animated text */}
            <motion.p
              className="text-gray-300 text-lg font-medium tracking-wide"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
              }}
            >
              Scanning notification signals...
            </motion.p>
          </motion.div>
        ) : isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center w-full"
          >
            <h3 className="text-xl font-semibold text-foreground tracking-tight mb-2">
              No notification history available
            </h3>
            <p className="text-muted-foreground opacity-80 max-w-sm mx-auto">
              There are currently no notification records matching your filters.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
