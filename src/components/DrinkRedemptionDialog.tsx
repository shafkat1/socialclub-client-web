import { useState, useEffect } from "react";
import { Offer } from "../types";
import { api } from "../utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Copy,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface DrinkRedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
}

export function DrinkRedemptionDialog({ 
  open, 
  onOpenChange, 
  offer 
}: DrinkRedemptionDialogProps) {
  const [redemption, setRedemption] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && offer) {
      loadRedemptionCode();
    }
  }, [open, offer?.id]);

  const loadRedemptionCode = async () => {
    try {
      setLoading(true);
      const data = await api.getRedemptionCode(offer.id);
      setRedemption(data.redemption);
    } catch (error) {
      console.error("Error loading redemption code:", error);
      toast.error("Failed to load redemption code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (redemption?.code) {
      navigator.clipboard.writeText(redemption.code);
      toast.success("Code copied to clipboard!");
    }
  };

  const getTimeRemaining = () => {
    if (!redemption?.expiresAt) return "";
    
    const now = new Date();
    const expires = new Date(redemption.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff < 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const isExpired = () => {
    if (!redemption?.expiresAt) return false;
    return new Date(redemption.expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Redemption Code</DialogTitle>
            <DialogDescription>Retrieving your drink redemption details...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!redemption) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redemption Code</DialogTitle>
            <DialogDescription>Unable to retrieve redemption code</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Redemption code not available. Please accept the offer first.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your Drink is Ready!</DialogTitle>
          <DialogDescription>
            Show this code to the bartender to redeem your drink
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          {redemption.status === "redeemed" ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Drink redeemed! Enjoy!
              </AlertDescription>
            </Alert>
          ) : isExpired() ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This redemption code has expired
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {getTimeRemaining()}
              </AlertDescription>
            </Alert>
          )}

          {/* Drink Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">{offer.item.emoji}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{offer.item.name}</h3>
                  {offer.item.category && (
                    <Badge variant="secondary" className="mt-1">
                      {offer.item.category}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">
                    {offer.anonymous ? "Anonymous" : offer.sender.name}
                  </span>
                </div>
                {offer.message && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Message:</span>
                    <span className="italic">"{offer.message}"</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Redemption Code */}
          {redemption.status !== "redeemed" && !isExpired() && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">Redemption Code</p>
                  <div className="text-4xl font-mono font-bold tracking-wider">
                    {redemption.code}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Placeholder */}
          {redemption.status !== "redeemed" && !isExpired() && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">or scan QR code</p>
                  <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    {/* In a real app, this would be an actual QR code */}
                    <div className="text-center text-gray-400">
                      <div className="text-4xl mb-2">📱</div>
                      <p className="text-xs">QR Code</p>
                      <p className="text-xs">{redemption.code}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bartender can scan this code to verify
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Redeemed Info */}
          {redemption.status === "redeemed" && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  <p className="font-medium text-green-800">Drink Redeemed!</p>
                  <p className="text-sm text-green-700">
                    Redeemed on {new Date(redemption.redeemedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {redemption.status !== "redeemed" && !isExpired() && (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Instructions:</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Go to the bar at {offer.venueId}</li>
                  <li>Show this code to the bartender</li>
                  <li>Verify your ID if requested</li>
                  <li>Enjoy your drink! 🍻</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={loadRedemptionCode}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
