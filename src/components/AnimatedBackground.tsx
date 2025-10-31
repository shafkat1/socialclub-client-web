import { motion } from "motion/react";

interface AnimatedBackgroundProps {
  variant?: "gradient" | "bubbles" | "particles" | "waves";
  intensity?: "low" | "medium" | "high";
  className?: string;
}

export function AnimatedBackground({
  variant = "gradient",
  intensity = "medium",
  className = "",
}: AnimatedBackgroundProps) {
  const speeds = {
    low: { duration: 15 },
    medium: { duration: 10 },
    high: { duration: 6 },
  };

  const speed = speeds[intensity];

  if (variant === "gradient") {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: speed.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: speed.duration + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full opacity-10 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: speed.duration * 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    );
  }

  if (variant === "bubbles") {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-xl"
            initial={{
              x: `${Math.random() * 100}%`,
              y: "120%",
            }}
            animate={{
              y: "-20%",
              x: `${Math.random() * 100}%`,
            }}
            transition={{
              duration: speed.duration + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "particles") {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-40"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
            }}
            animate={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: speed.duration + Math.random() * 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "waves") {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 left-0 right-0 h-64"
            style={{
              background: `linear-gradient(180deg, 
                transparent 0%, 
                rgba(99, 102, 241, ${0.05 * (i + 1)}) 100%)`,
            }}
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: speed.duration + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}

// Floating elements for specific contexts
export function FloatingDrinkEmojis() {
  const drinks = ["🍹", "🍸", "🍺", "🍷", "🥂", "🍾"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drinks.map((drink, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl opacity-10"
          initial={{
            x: `${Math.random() * 100}%`,
            y: "110%",
            rotate: 0,
          }}
          animate={{
            y: "-10%",
            rotate: 360,
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10,
          }}
        >
          {drink}
        </motion.div>
      ))}
    </div>
  );
}

// Sparkles effect
export function SparklesEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Gradient mesh background
export function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#667eea", stopOpacity: 0.5 }} />
            <stop offset="50%" style={{ stopColor: "#764ba2", stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: "#f093fb", stopOpacity: 0.5 }} />
          </linearGradient>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
        </defs>
        <motion.circle
          cx="20%"
          cy="30%"
          r="200"
          fill="url(#grad1)"
          filter="url(#blur)"
          animate={{
            cx: ["20%", "30%", "20%"],
            cy: ["30%", "40%", "30%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          cx="80%"
          cy="70%"
          r="250"
          fill="url(#grad1)"
          filter="url(#blur)"
          animate={{
            cx: ["80%", "70%", "80%"],
            cy: ["70%", "60%", "70%"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
