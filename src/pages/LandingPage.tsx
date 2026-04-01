import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen h-screen overflow-hidden dark:text-white text-black selection:bg-purple-500/30 bg-transparent">
      {/* Background is now global */}

      {/* Hero Content Overlay */}
      <div className="relative z-10 flex w-full h-full flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center max-w-4xl w-full"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="px-6 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
          >
            <span className="text-xs md:text-sm font-bold text-purple-300 tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              Introducing SubManager 2.0
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-purple-400 drop-shadow-2xl leading-tight"
          >
            Manage Subscriptions <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 animate-pulse">Smarter.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/50 mb-12 max-w-2xl font-medium leading-relaxed"
          >
            Track every payment, monitor renewals instantly, and stay in control of your digital life—no box required.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard")}
              className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-300 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(236,72,153,0.6)] text-lg"
            >
             Get Started
             <svg
                className="w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
              className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-300 rounded-full border border-white/20 bg-white/5 backdrop-blur-md shadow-lg hover:border-white/40 text-lg"
            >
             Sign In
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
