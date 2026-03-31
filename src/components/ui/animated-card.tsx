import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  glowColor?: string
  className?: string
  containerClassName?: string
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    { 
      children, 
      className, 
      containerClassName, 
      glowColor = "rgba(168, 85, 247, 0.4)", // Default subtle purple glow
      ...props 
    }, 
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{
          scale: 1.05,
          y: -6,
          boxShadow: `0 20px 40px -10px ${glowColor}`,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        className={cn(
          "relative group rounded-xl p-[1px] cursor-pointer overflow-hidden",
          containerClassName
        )}
        {...props}
      >
        {/* Subtle Ambient Glow Background Mask */}
        <div 
          className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none rounded-full scale-150"
          style={{ backgroundColor: glowColor }}
        />

        {/* 1px Linear Gradient Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/5 dark:from-white/30 dark:via-white/5 to-transparent rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Inner Glassmorphism Content Area */}
        <div 
          className={cn(
            "relative z-10 h-full w-full rounded-xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl p-6 text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
            className
          )}
        >
          {children}
        </div>
      </motion.div>
    )
  }
)
AnimatedCard.displayName = "AnimatedCard"
