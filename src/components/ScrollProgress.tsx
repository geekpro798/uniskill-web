"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-[100] origin-left shadow-[0_0_8px_rgba(59,130,246,0.6)]"
      style={{ scaleX }}
    />
  );
}
