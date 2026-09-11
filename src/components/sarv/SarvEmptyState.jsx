import React from 'react';
import { motion } from 'framer-motion';

export default function SarvEmptyState({
  icon: Icon,
  title,
  description,
  children,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`sarv-card p-12 text-center space-y-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-base-500/30 text-neutral flex items-center justify-center mx-auto">
        {Icon ? <Icon className="w-8 h-8" /> : null}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-base-content">{title}</h3>
        {description && (
          <p className="text-xs text-neutral max-w-md mx-auto leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}
