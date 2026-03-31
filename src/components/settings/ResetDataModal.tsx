import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export function ResetDataModal({
  isOpen,
  onClose,
  onResetComplete,
}: ResetDataModalProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [step, setStep] = useState("confirm");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === "start") {
      runResetSequence();
    }
  }, [step]);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const runResetSequence = async () => {
    setStep("clearing");
    animateProgress();

    await delay(700);
    setStep("removing");

    await delay(700);
    setStep("deleting");

    await delay(700);
    setStep("finalizing");

    await delay(700);
    setStep("success");

    await delay(1200);

    onResetComplete();
    resetState();
  };

  const animateProgress = () => {
    let value = 0;
    const interval = setInterval(() => {
      value += 2;
      if (value > 100) value = 100;
      setProgress(value);
      if (value >= 100) clearInterval(interval);
    }, 55); 
  };

  const resetState = () => {
    setStep("confirm");
    setProgress(0);
  };

  const handleClose = () => {
    if (step === "confirm" || step === "success") {
      onClose();
      // Delay state reset to allow exit animation to finish
      setTimeout(resetState, 300);
    }
  };

  const steps = [
    { key: "clearing", label: t('Clearing subscriptions...') || "Clearing subscriptions..." },
    { key: "removing", label: t('Removing settings...') || "Removing settings..." },
    { key: "deleting", label: t('Deleting notifications...') || "Deleting notifications..." },
    { key: "finalizing", label: t('Finalizing reset...') || "Finalizing reset..." },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-[420px] shadow-2xl overflow-hidden relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* CONFIRM STEP */}
            {step === "confirm" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 border border-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </div>

                <h2 className="text-xl font-semibold text-white tracking-tight">
                  {t('resetAllData')}
                </h2>

                <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                  {t('resetAllDataConfirm') || "This action will permanently delete all subscriptions, settings, and notifications. This cannot be undone."}
                </p>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 font-medium transition-colors border border-white/5"
                  >
                    {t('cancel')}
                  </button>

                  <button
                    onClick={() => setStep("start")}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)] font-medium transition-all"
                  >
                    {t('resetAllData')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* PROGRESS STEP */}
            {step !== "confirm" && step !== "success" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="py-2"
              >
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Resetting your data...
                </h2>

                <div className="mt-6 space-y-4">
                  {steps.map((s, idx) => {
                    const isActive = step === s.key;
                    // Determine if the step is past
                    const currentIndex = steps.findIndex((x) => x.key === step);
                    const isDone = currentIndex > idx || step === "success" || step === "start";

                    return (
                      <motion.div
                        key={s.key}
                        className="flex items-center gap-3 text-sm font-medium"
                        animate={{
                          opacity: isActive || isDone ? 1 : 0.3,
                          color: isActive ? "#ffffff" : isDone ? "#9ca3af" : "#9ca3af"
                        }}
                      >
                        <div className="w-5 h-5 flex items-center justify-center relative">
                          {isDone && !isActive ? (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <motion.div
                              className="w-2.5 h-2.5 bg-red-500 rounded-full"
                              animate={{
                                scale: isActive ? [1, 1.4, 1] : 1,
                              }}
                              transition={{
                                repeat: isActive ? Infinity : 0,
                                duration: 0.8,
                              }}
                            />
                          )}
                          
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 border-2 border-red-500/30 rounded-full"
                              animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                              transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                            />
                          )}
                        </div>
                        {s.label}
                      </motion.div>
                    );
                  })}
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-8 w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full relative"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-white to-transparent" style={{ backgroundSize: '200% 100%' }} />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* SUCCESS STEP */}
            {step === "success" && (
              <motion.div 
                className="flex flex-col items-center py-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 text-3xl mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </motion.div>

                <h2 className="text-xl font-semibold text-white tracking-tight text-center">
                  Data Reset Complete
                </h2>
                
                <p className="text-gray-400 mt-2 text-sm text-center">
                  All data has been successfully securely erased.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
