import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Plus, MapPin, Users, Gift, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface QuickActionsProps {
  onCheckIn: () => void;
  onFindPeople: () => void;
  onSendOffer: () => void;
}

export function QuickActions({ onCheckIn, onFindPeople, onSendOffer }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: MapPin,
      label: "Check In",
      onClick: () => {
        onCheckIn();
        setIsOpen(false);
      },
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      label: "Find People",
      onClick: () => {
        onFindPeople();
        setIsOpen(false);
      },
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Gift,
      label: "Send Drink",
      onClick: () => {
        onSendOffer();
        setIsOpen(false);
      },
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          onClick={action.onClick}
                          className={`bg-gradient-to-r ${action.gradient} hover:opacity-90 shadow-modern-xl w-14 h-14 p-0 rounded-full`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-gray-900 text-white border-0">
                        <p>{action.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 p-0 rounded-full shadow-modern-xl transition-all duration-300 ${
                  isOpen
                    ? "bg-gradient-to-r from-rose-500 to-pink-500"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600"
                }`}
              >
                <motion.div
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {isOpen ? (
                    <X className="h-7 w-7 text-white" />
                  ) : (
                    <Plus className="h-7 w-7 text-white" />
                  )}
                </motion.div>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-gray-900 text-white border-0">
            <p>{isOpen ? "Close menu" : "Quick actions"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
