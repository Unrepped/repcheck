import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

export function InterviewStart({ onStart }: { onStart: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-blue-50 to-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, type: 'spring' }}
          className="mb-6"
        >
          {/* Calming illustration (house with heart) */}
          <span className="text-6xl">🏡</span>
        </motion.div>
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-blue-900 mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Ready to prepare for your real estate agent interview?
        </motion.h1>
        <motion.p
          className="text-base md:text-lg text-blue-700 mb-8 text-center max-w-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          I'll guide you step by step, ask the right questions, and help you build a personalized checklist. Let's make your homebuying journey smooth and confident.
        </motion.p>
        <motion.button
          className="px-8 py-3 rounded-full bg-blue-500 text-white text-lg font-semibold shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          onClick={onStart}
          aria-label="Start real estate interview"
        >
          Start Interview
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
} 