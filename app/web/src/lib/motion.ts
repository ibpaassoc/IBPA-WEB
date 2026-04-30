import type { MotionProps } from "motion/react";

export function getRevealProps(
  shouldReduceMotion: boolean | null,
  options?: {
    delay?: number;
    x?: number;
    y?: number;
    duration?: number;
  },
): MotionProps {
  const { delay = 0, x = 0, y = 24, duration = 0.6 } = options || {};

  if (shouldReduceMotion) {
    return {
      initial: false,
      whileInView: { opacity: 1 },
      viewport: { once: true, amount: 0.2 },
      transition: { duration: 0.01, delay: 0 },
    };
  }

  return {
    initial: { opacity: 0, x, y },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { delay, duration, ease: [0.22, 1, 0.36, 1] },
  };
}
