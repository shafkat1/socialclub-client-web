import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { MapPin, Users, Gift, MessageCircle, Shield, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: MapPin,
      title: "Discover Nearby Venues",
      description: "Find bars, cafes, and social spots on our interactive map. See who's checked in and what's happening in real-time.",
      image: "🗺️",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      title: "Meet Interesting People",
      description: "Browse profiles of people nearby. See their interests, what they're looking for, and if they're available to connect.",
      image: "👥",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Gift,
      title: "Send a Drink Offer",
      description: "Break the ice by sending a drink offer. Choose from the venue's menu and add a personal message to stand out.",
      image: "🎁",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: MessageCircle,
      title: "Start Chatting",
      description: "When someone accepts your offer, you unlock a private conversation. Meet up, enjoy your drinks, and make new connections!",
      image: "💬",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Shield,
      title: "Safe & Verified",
      description: "We prioritize your safety with age verification (21+), drink limits, and responsible drinking features built-in.",
      image: "🛡️",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("hasCompletedOnboarding", "true");
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    onComplete();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tour
            </button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Card with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 lg:p-12 border-0 shadow-modern-xl bg-white/90 backdrop-blur-sm">
              <div className="text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    delay: 0.1,
                  }}
                  className="mb-8"
                >
                  <div className={`inline-flex w-24 h-24 items-center justify-center rounded-3xl bg-gradient-to-br ${step.gradient} shadow-modern-lg`}>
                    <div className="text-5xl">{step.image}</div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-900 mb-4"
                >
                  {step.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed"
                >
                  {step.description}
                </motion.p>

                {/* Navigation dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center gap-2 mb-8"
                >
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-8 bg-gradient-to-r from-indigo-600 to-purple-600"
                          : "w-2 bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </motion.div>

                {/* Navigation buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3 justify-center"
                >
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handlePrev}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  <Button
                    size="lg"
                    onClick={handleNext}
                    className={`bg-gradient-to-r ${step.gradient} hover:opacity-90 shadow-md min-w-[140px]`}
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
