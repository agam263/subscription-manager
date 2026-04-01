import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface BounceCardsProps {
  className?: string;
  images: string[];
  containerWidth?: number | string;
  containerHeight?: number | string;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
}

export default function BounceCards({
  className = '',
  images = [],
  containerWidth = 500,
  containerHeight = 250,
  animationDelay = 1,
  animationStagger = 0.08,
  easeType = 'elastic.out(1, 0.5)',
  transformStyles = [],
  enableHover = false,
}: BounceCardsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: containerWidth, height: containerHeight }}
    >
      {images.map((src, idx) => {
        const targetTransform = transformStyles[idx] || 'none';
        
        return (
          <motion.div
            key={idx}
            className="absolute shadow-2xl rounded-2xl overflow-hidden border-2 border-white/10"
            style={{
              width: typeof containerWidth === 'number' ? containerWidth * 0.4 : '150px',
              aspectRatio: '1/1.2',
              zIndex: images.length - idx,
            }}
            initial={{ opacity: 0, transform: "translateY(200px) scale(0.6)" }}
            animate={isMounted ? { 
               opacity: 1, 
               transform: targetTransform 
            } : {}}
            transition={{
              type: "spring",
              stiffness: 150,
              damping: 12,
              mass: 0.8,
              delay: animationDelay + (idx * animationStagger)
            }}
            whileHover={enableHover ? { scale: 1.05, zIndex: 50, transition: { duration: 0.3 } } : {}}
          >
            <motion.div
              animate={{
                y: [0, -15 + (idx % 2 === 0 ? 5 : -5), 0],
                rotate: [0, idx % 2 === 0 ? 2 : -2, 0]
              }}
              transition={{
                duration: 4 + (idx * 0.5),
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-full h-full relative"
            >
              <img 
                src={src} 
                alt={`card-${idx}`} 
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
