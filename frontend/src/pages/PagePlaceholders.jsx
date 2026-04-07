import React from 'react';
import { motion } from 'framer-motion';

const PagePlaceholder = ({ title }) => (
  <div className="pt-24 px-6 min-h-screen flex flex-col items-center justify-center text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-12 rounded-[2.5rem] border border-white/5 max-w-lg w-full"
    >
      <h1 className="text-3xl font-black mb-4 tracking-tight">{title}</h1>
      <p className="text-text-muted leading-relaxed">
        This section is currently under development to bring you a world-class learning experience. Check back very soon!
      </p>
      <div className="mt-8 flex justify-center">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    </motion.div>
  </div>
);

export const ExploreCourses = () => <PagePlaceholder title="Explore Courses" />;
export const MyLearning = () => <PagePlaceholder title="My Learning" />;
export const Certificates = () => <PagePlaceholder title="My Certificates" />;
