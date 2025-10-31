import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Shield, Upload, Camera, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Progress } from "./ui/progress";
import { toast } from "sonner@2.0.3";
import { submitAgeVerification } from "../utils/api";

interface AgeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onVerificationSubmitted: () => void;
}

export function AgeVerificationDialog({
  open,
  onOpenChange,
  userId,
  onVerificationSubmitted,
}: AgeVerificationDialogProps) {
  const [step, setStep] = useState<"intro" | "upload" | "processing" | "success">("intro");
  const [documentType, setDocumentType] = useState<"drivers_license" | "passport" | "national_id">("drivers_license");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "front") setFrontImage(file);
      if (type === "back") setBackImage(file);
      if (type === "selfie") setSelfieImage(file);
    }
  };

  const handleSubmit = async () => {
    if (!frontImage || !selfieImage) {
      toast.error("Please upload required documents");
      return;
    }

    setLoading(true);
    setStep("processing");
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Convert images to base64
      const frontBase64 = await fileToBase64(frontImage);
      const backBase64 = backImage ? await fileToBase64(backImage) : undefined;
      const selfieBase64 = await fileToBase64(selfieImage);

      const result = await submitAgeVerification(userId, {
        documentType,
        frontImage: frontBase64,
        backImage: backBase64,
        selfieImage: selfieBase64,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setStep("success");
        toast.success("Age verification submitted successfully!");
        setTimeout(() => {
          onVerificationSubmitted();
          onOpenChange(false);
          resetForm();
        }, 2000);
      } else {
        throw new Error(result.error || "Verification failed");
      }
    } catch (error: any) {
      console.error("Age verification error:", error);
      toast.error(error.message || "Failed to submit verification");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const resetForm = () => {
    setStep("intro");
    setDocumentType("drivers_license");
    setFrontImage(null);
    setBackImage(null);
    setSelfieImage(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Age Verification
          </DialogTitle>
          <DialogDescription>
            Verify your age to unlock all features including receiving drinks
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Why verify?</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Required by law to receive alcoholic beverages</li>
                  <li>• Builds trust in the community</li>
                  <li>• Unlocks full app features</li>
                  <li>• One-time process (2-3 minutes)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-medium">What you'll need:</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Upload className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Government-issued ID</p>
                    <p className="text-xs text-gray-600">
                      Driver's license, passport, or national ID card
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Camera className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Selfie photo</p>
                    <p className="text-xs text-gray-600">
                      For facial verification against your ID photo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-700" />
                Privacy & Security
              </h3>
              <ul className="text-xs text-yellow-900 space-y-1">
                <li>• Your documents are encrypted and securely stored</li>
                <li>• We use trusted KYC providers (Persona, iDenfy, IDmission)</li>
                <li>• Documents are only used for age verification</li>
                <li>• Your personal information is never shared publicly</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep("upload")}>
                Start Verification
              </Button>
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="document-type">Document Type</Label>
                <Select
                  value={documentType}
                  onValueChange={(value: any) => setDocumentType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national_id">National ID Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="front-image">
                  {documentType === "passport" ? "Passport Photo Page" : "Front of ID"} *
                </Label>
                <Input
                  id="front-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "front")}
                  className="mt-1"
                />
                {frontImage && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {frontImage.name} uploaded
                  </p>
                )}
              </div>

              {documentType !== "passport" && (
                <div>
                  <Label htmlFor="back-image">Back of ID (optional)</Label>
                  <Input
                    id="back-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "back")}
                    className="mt-1"
                  />
                  {backImage && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {backImage.name} uploaded
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="selfie-image">Selfie Photo *</Label>
                <p className="text-xs text-gray-600 mb-1">
                  Take a clear photo of your face (for biometric matching)
                </p>
                <Input
                  id="selfie-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "selfie")}
                  className="mt-1"
                />
                {selfieImage && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {selfieImage.name} uploaded
                  </p>
                )}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Ensure all documents are clear, not blurred, and all text is readable.
                Your face must be clearly visible in the selfie.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep("intro")}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!frontImage || !selfieImage || loading}
              >
                Submit for Verification
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-blue-600 mb-4 animate-pulse" />
              <h3 className="font-medium mb-2">Processing Your Documents</h3>
              <p className="text-sm text-gray-600 mb-6">
                This may take a few moments...
              </p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-gray-500 mt-2">{uploadProgress}% complete</p>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Uploading documents...
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Extracting information with OCR...
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Performing facial recognition...
              </p>
              <p className="flex items-center gap-2">
                {uploadProgress === 100 ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                Verifying authenticity...
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h3 className="font-medium mb-2">Verification Submitted!</h3>
              <p className="text-sm text-gray-600">
                Your documents have been submitted for review.
              </p>
            </div>

            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-700" />
              <AlertDescription className="text-sm text-green-900">
                <strong>What happens next?</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Automated verification typically takes 1-5 minutes</li>
                  <li>• Manual review (if needed) takes up to 24 hours</li>
                  <li>• You'll receive a notification when verified</li>
                  <li>• Check your profile for verification status</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
