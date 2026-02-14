"use client";

import { Variants } from 'framer-motion';

/**
 * Animation variants for the symptom-based resource finder
 * These animations enhance the user experience with smooth transitions
 */

// Staggered container animations for lists and grids
export const staggeredContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

// Item animations for cards and list items
export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    scale: 1.03,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

// Page transition animations
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2
    }
  }
};

// Fade in animation for modals and overlays
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

// Scale animation for buttons and interactive elements
export const scaleVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

// Progress indicator animation
export const progressIndicatorVariants: Variants = {
  hidden: { width: 0 },
  visible: (custom: number) => ({
    width: `${custom}%`,
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  })
};

// Notification animation
export const notificationVariants: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.3
    }
  }
};

// Pulse animation for highlighting important elements
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop'
    }
  }
};
