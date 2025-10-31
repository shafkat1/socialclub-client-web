import { Venue } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { MapPin } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useState } from "react";

interface CheckInConfirmationDialogProps {
  venue: Venue | null;
  open: boolean;
  onConfirm: (intent: "buying" | "receiving") => void;
  onCancel: () => void;
}

export function CheckInConfirmationDialog({
  venue,
  open,
  onConfirm,
  onCancel,
}: CheckInConfirmationDialogProps) {
  const [intent, setIntent] = useState<"buying" | "receiving">("receiving");

  if (!venue) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            You're at {venue.name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to check in? Let others know your intentions.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup value={intent} onValueChange={(v) => setIntent(v as "buying" | "receiving")}>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="receiving" id="receiving" />
            <Label htmlFor="receiving" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Looking for drinks 🍹</p>
                <p className="text-xs text-muted-foreground">
                  Open to receiving offers from others
                </p>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="buying" id="buying" />
            <Label htmlFor="buying" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Buying drinks 🎁</p>
                <p className="text-xs text-muted-foreground">
                  Interested in sending offers to others
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(intent)}>
            Check In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
