/**
 * @file src/lib/animations.js
 * @description Shared Motion variants for ReviewSense.
 * All variants use opacity + transform only — GPU-accelerated, no layout shift.
 * Import: `import { motion } from "motion/react"`  (not "framer-motion")
 */

/** Fade up — default reveal for cards and sections */
export const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/** Stagger container — wraps lists of animated children */
export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Fade pop — for badges, chips, small elements */
export const fadePop = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

/** Slide in from left — for result rows */
export const slideLeft = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.3, ease: "easeOut" } },
};

/** willChange style — defined once, reused to avoid new object on every render */
export const WC_OPACITY_TRANSFORM = { willChange: "opacity, transform" };
