import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StepperProps {
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  children: ReactNode;
}

export const Step = ({ children }: { children: ReactNode }) => {
  return <div className="step-content w-full h-full">{children}</div>;
};

export default function Stepper({
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = 'Previous',
  nextButtonText = 'Next',
  children,
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      onFinalStepCompleted?.();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      <div className="relative overflow-hidden min-h-[200px] flex items-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            {steps[currentStep - 1]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-2">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          type="button"
          className="px-5 py-2.5 rounded-xl bg-white/5 font-medium disabled:opacity-0 disabled:pointer-events-none hover:bg-white/10 transition-all active:scale-95"
        >
          {backButtonText}
        </button>
        <button
          onClick={handleNext}
          type="button"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all active:scale-95"
        >
          {currentStep === totalSteps ? 'Finish' : nextButtonText}
        </button>
      </div>
    </div>
  );
}
