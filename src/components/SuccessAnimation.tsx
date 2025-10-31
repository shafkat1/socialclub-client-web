import { useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle, Gift, MessageCircle, UserCheck, MapPin } from "lucide-react";

interface SuccessAnimationProps {
  type: "offer-sent" | "offer-accepted" | "friend-added" | "check-in" | "generic";
  title: string;
  description: string;
  onComplete?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function SuccessAnimation({
  type,
  title,
  description,
  onComplete,
  autoClose = true,
  duration = 3000,
}: SuccessAnimationProps) {
  useEffect(() => {
    if (autoClose && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onComplete]);

  const icons = {
    "offer-sent": Gift,
    "offer-accepted": CheckCircle,
    "friend-added": UserCheck,
    "check-in": MapPin,
    generic: CheckCircle,
  };

  const colors = {
    "offer-sent": "from-orange-500 to-red-500",
    "offer-accepted": "from-emerald-500 to-teal-500",
    "friend-added": "from-blue-500 to-cyan-500",
    "check-in": "from-purple-500 to-pink-500",
    generic: "from-indigo-500 to-purple-500",
  };

  const Icon = icons[type];
  const colorGradient = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
      onClick={onComplete}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-modern-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* Animated icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="mb-6 relative inline-block"
          >
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center shadow-modern-lg`}>
              <Icon className="h-12 w-12 text-white" />
            </div>
            
            {/* Ripple effect */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorGradient}`}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-gray-900 mb-3"
          >
            {title}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600"
          >
            {description}
          </motion.p>

          {/* Confetti-like particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${colorGradient}`}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                }}
                animate={{
                  x: `${50 + Math.cos((i / 12) * Math.PI * 2) * 40}%`,
                  y: `${50 + Math.sin((i / 12) * Math.PI * 2) * 40}%`,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: 0.1 + i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Quick toast-style success notification
export function QuickSuccess({
  message,
  icon = "✓",
}: {
  message: string;
  icon?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl shadow-modern-xl flex items-center gap-3"
    >
      <div className="text-2xl">{icon}</div>
      <div className="font-medium">{message}</div>
    </motion.div>
  );
}
