import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LaserFlow from '@/components/LaserFlow';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white selection:bg-purple-500/30">
      {/* Background Animation Layer */}
      <div className="absolute inset-0 z-0 opacity-80">
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <LaserFlow
            color="#FF79C6"
            wispDensity={1.6}
            flowSpeed={0.4}
            verticalSizing={2}
            horizontalSizing={2.1}
            fogIntensity={0.75}
            fogScale={0.3}
            wispSpeed={15}
            wispIntensity={5}
            flowStrength={0.25}
            decay={1.1}
            horizontalBeamOffset={0}
            verticalBeamOffset={-0.5}
          />
        </div>
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 flex w-full h-full flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center p-12 max-w-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.8)] outline outline-1 outline-white/5"
        >
          {/* Subtle top glow line */}
          <div className="absolute top-0 inset-x-0 h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
            Manage Your Subscriptions Smarter
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-lg leading-relaxed">
            Track spending, monitor renewals, and stay in control.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]"
          >
           Get Started
           <svg
              className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
