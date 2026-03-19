'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  // 1. 获取页面的全局滚动进度 (0 到 1)
  // (Get the global scroll progress of the page, from 0 to 1)
  const { scrollYProgress } = useScroll();

  // 2. 添加物理弹簧效果，让进度条的跟随如丝般顺滑，消除生硬的卡顿感
  // (Add spring physics so the progress bar follows smoothly, eliminating rigid jumps)
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      // 样式解析：
      // fixed top-0: 永远吸附在屏幕最顶端 (Always stick to the top)
      // origin-left: 确保动画是从左向右生长 (Ensure animation grows from left to right)
      // h-[3px]: 稍微增加一点厚度，深色模式下更显眼 (Slightly thicker for dark mode visibility)
      // z-[100]: 确保盖住 Navbar (Ensure it covers the Navbar)
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left 
                 bg-blue-600 
                 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-blue-500 dark:to-emerald-400 
                 dark:shadow-[0_0_12px_rgba(34,211,238,0.9)]"
      style={{ scaleX }}
    />
  );
}
