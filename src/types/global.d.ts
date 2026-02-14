// Add module declarations for packages that don't have type definitions

declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
  export const variants: any;
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    custom?: any;
    whileHover?: any;
    className?: string;
    onClick?: () => void;
    [key: string]: any;
  }
  
  // Add other exports as needed
}

// Add any other missing module declarations as needed
