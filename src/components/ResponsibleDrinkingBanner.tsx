import { useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { AlertTriangle, Info, Phone, X } from "lucide-react";

interface ResponsibleDrinkingBannerProps {
  context?: "home" | "send-offer" | "accept-offer" | "redeem-drink";
  dismissible?: boolean;
}

export function ResponsibleDrinkingBanner({
  context = "home",
  dismissible = false,
}: ResponsibleDrinkingBannerProps) {
  const [showResources, setShowResources] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const messages = {
    home: "Please drink responsibly. Know your limits and stay safe.",
    "send-offer": "Sending a drink? Ensure the recipient drinks responsibly.",
    "accept-offer": "Accepting a drink comes with responsibility. Drink safely and know when to stop.",
    "redeem-drink": "Enjoy responsibly. Never drink and drive. Ask for water between drinks.",
  };

  return (
    <>
      <Alert className="border-amber-300 bg-amber-50 relative">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertDescription className="text-sm text-amber-900 pr-6">
          <strong>Drink Responsibly:</strong> {messages[context]}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 ml-2 text-amber-900 underline"
            onClick={() => setShowResources(true)}
          >
            View Resources
          </Button>
        </AlertDescription>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </Alert>

      <Dialog open={showResources} onOpenChange={setShowResources}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Responsible Drinking & Support Resources
            </DialogTitle>
            <DialogDescription>
              Your safety and wellbeing are our top priority
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Responsible Drinking Tips */}
            <div>
              <h3 className="font-medium mb-3">Tips for Responsible Drinking</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Pace yourself: No more than 1 drink per hour</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Drink water between alcoholic beverages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Never drink on an empty stomach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Know your limits and stick to them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Never drink and drive - use rideshare or taxi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Watch out for friends and fellow patrons</span>
                </li>
              </ul>
            </div>

            {/* Standard Drink Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-sm">Standard Drink Sizes (U.S.)</h3>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>🍺 Beer (5% ABV)</span>
                  <span className="font-medium">12 oz</span>
                </div>
                <div className="flex justify-between">
                  <span>🍷 Wine (12% ABV)</span>
                  <span className="font-medium">5 oz</span>
                </div>
                <div className="flex justify-between">
                  <span>🥃 Spirits (40% ABV)</span>
                  <span className="font-medium">1.5 oz</span>
                </div>
                <div className="flex justify-between">
                  <span>🍹 Cocktail</span>
                  <span className="font-medium">Varies (check with bartender)</span>
                </div>
              </div>
            </div>

            {/* Daily Limits */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                App Limits for Your Safety
              </h3>
              <ul className="space-y-1 text-xs text-gray-700">
                <li>• Maximum 3 drinks per hour</li>
                <li>• Maximum 5 drinks per day</li>
                <li>• Violations may result in temporary suspension</li>
                <li>• These limits are enforced automatically</li>
              </ul>
            </div>

            {/* Support Resources */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-600" />
                Need Help? Support Resources
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="font-medium text-purple-900">SAMHSA National Helpline</p>
                  <p className="text-xs text-purple-800 mt-1">
                    1-800-662-4357 (24/7, Free & Confidential)
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Treatment referral and information service for substance abuse
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="font-medium text-purple-900">Alcoholics Anonymous (AA)</p>
                  <p className="text-xs text-purple-800 mt-1">
                    www.aa.org | Find local meetings
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="font-medium text-purple-900">Crisis Text Line</p>
                  <p className="text-xs text-purple-800 mt-1">
                    Text HOME to 741741 (24/7 Support)
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="font-medium text-red-900">Emergency Services</p>
                  <p className="text-xs text-red-800 mt-1">
                    Call 911 if you or someone needs immediate medical attention
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowResources(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
