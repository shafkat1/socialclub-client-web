import { Shield, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { User } from "../types";

interface AgeVerificationBadgeProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function AgeVerificationBadge({
  user,
  size = "md",
  showText = true,
}: AgeVerificationBadgeProps) {
  const status = user.ageVerification?.status || "unverified";
  const verifiedAt = user.ageVerification?.verifiedAt;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const iconSize = sizeClasses[size];

  const badgeConfig = {
    verified: {
      icon: <Shield className={iconSize} />,
      text: "Age Verified",
      color: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm",
      tooltip: `Age verified on ${
        verifiedAt ? new Date(verifiedAt).toLocaleDateString() : "N/A"
      }. This user has completed ID verification and is 21+.`,
    },
    pending: {
      icon: <Clock className={iconSize} />,
      text: "Pending",
      color: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm",
      tooltip: "Age verification is being processed. This usually takes 1-5 minutes.",
    },
    rejected: {
      icon: <AlertCircle className={iconSize} />,
      text: "Verification Failed",
      color: "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-sm",
      tooltip:
        "Age verification was rejected. User may need to resubmit documents.",
    },
    unverified: {
      icon: <AlertCircle className={iconSize} />,
      text: "Not Verified",
      color: "bg-gray-400 hover:bg-gray-500 shadow-sm",
      tooltip: "This user has not completed age verification. They cannot receive drinks.",
    },
  };

  const config = badgeConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${config.color} text-white flex items-center gap-1.5 cursor-help border-0`}
            variant="default"
          >
            {config.icon}
            {showText && <span className="text-xs font-medium">{config.text}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-0 shadow-modern-lg">
          <p className="text-xs max-w-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for use in lists
export function AgeVerificationIcon({ user }: { user: User }) {
  const status = user.ageVerification?.status || "unverified";

  if (status === "verified") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <CheckCircle className="h-4 w-4 text-blue-600 cursor-help drop-shadow-sm" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white border-0 shadow-modern-lg">
            <p className="text-xs">Age Verified (21+)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === "pending") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Clock className="h-4 w-4 text-amber-600 cursor-help drop-shadow-sm" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white border-0 shadow-modern-lg">
            <p className="text-xs">Verification Pending</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-0 shadow-modern-lg">
          <p className="text-xs">Not Age Verified</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
