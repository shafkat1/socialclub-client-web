import { useState } from "react";
import { api } from "../utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Shield
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface BartenderVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bartenderId?: string;
}

export function BartenderVerificationDialog({ 
  open, 
  onOpenChange,
  bartenderId 
}: BartenderVerificationDialogProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Please enter a redemption code");
      return;
    }

    try {
      setVerifying(true);
      setVerificationResult(null);
      
      const result = await api.verifyRedemptionCode(code.toUpperCase(), bartenderId);
      
      setVerificationResult(result);
      
      if (result.success) {
        toast.success("Drink verified and redeemed!");
      }
    } catch (error: any) {
      console.error("Error verifying code:", error);
      setVerificationResult({ 
        success: false, 
        error: error.message || "Invalid or expired code" 
      });
      toast.error(error.message || "Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setVerificationResult(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bartender Verification
          </DialogTitle>
          <DialogDescription>
            Enter the customer's redemption code to verify and redeem their drink
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Input */}
          {!verificationResult && (
            <div className="space-y-3">
              <Label htmlFor="code">Redemption Code</Label>
              <Input
                id="code"
                placeholder="Enter 6-8 character code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="text-lg font-mono tracking-wider text-center"
                maxLength={8}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Code should be 6-8 alphanumeric characters
              </p>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="space-y-4">
              {verificationResult.success ? (
                <>
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">
                      ✓ Verified! Drink can be served
                    </AlertDescription>
                  </Alert>

                  {verificationResult.redemption && (
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        {/* Drink Details */}
                        <div className="flex items-center gap-4">
                          <div className="text-5xl">
                            {verificationResult.redemption.drinkItem.emoji}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {verificationResult.redemption.drinkItem.name}
                            </h3>
                            <Badge variant="secondary" className="mt-1">
                              {verificationResult.redemption.drinkItem.category}
                            </Badge>
                          </div>
                        </div>

                        <Separator />

                        {/* Recipient Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Code:</span>
                            <span className="font-mono font-medium">
                              {verificationResult.redemption.code}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Recipient ID:</span>
                            <span className="font-medium">
                              {verificationResult.redemption.recipientId.substring(0, 8)}...
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Redeemed At:</span>
                            <span className="font-medium">
                              {new Date(verificationResult.redemption.redeemedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <Separator />

                        {/* Instructions */}
                        <Alert>
                          <AlertDescription className="text-sm">
                            <strong>Next Steps:</strong>
                            <ol className="list-decimal ml-4 mt-2 space-y-1">
                              <li>Verify customer ID (age verification)</li>
                              <li>Prepare the drink as ordered</li>
                              <li>Serve and enjoy!</li>
                            </ol>
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {verificationResult.error || "Invalid or expired redemption code"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {verificationResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Verify Another
                </Button>
                <Button onClick={() => onOpenChange(false)} className="flex-1">
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={verifying || !code.trim()}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
