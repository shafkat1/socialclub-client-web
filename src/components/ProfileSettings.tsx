import { useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../utils/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Camera, 
  X, 
  Save,
  Shield,
  Eye,
  EyeOff,
  Users,
  Lock,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { AgeVerificationDialog } from "./AgeVerificationDialog";
import { AgeVerificationBadge } from "./AgeVerificationBadge";

interface ProfileSettingsProps {
  currentUser: User;
  onUpdate: () => void;
}

export function ProfileSettings({ currentUser, onUpdate }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<User>(currentUser);
  const [saving, setSaving] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>(currentUser.photos || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  useEffect(() => {
    setProfile(currentUser);
    setPhotoUrls(currentUser.photos || []);
  }, [currentUser]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Update basic profile
      await api.updateProfile({
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        pronouns: profile.pronouns,
        lookingFor: profile.lookingFor,
        interests: profile.interests,
        preferredDrinks: profile.preferredDrinks,
      });

      toast.success("Profile updated successfully!");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhotos = async () => {
    try {
      setSaving(true);
      await api.updateProfilePhotos(photoUrls);
      toast.success("Photos updated successfully!");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating photos:", error);
      toast.error(error.message || "Failed to update photos");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      await api.updatePrivacySettings(profile.privacySettings);
      toast.success("Privacy settings updated!");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating privacy:", error);
      toast.error(error.message || "Failed to update privacy settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) {
      toast.error("Please enter a photo URL");
      return;
    }

    if (photoUrls.length >= 5) {
      toast.error("Maximum 5 additional photos allowed");
      return;
    }

    setPhotoUrls([...photoUrls, newPhotoUrl]);
    setNewPhotoUrl("");
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleAddInterest = (interest: string) => {
    if (!interest.trim()) return;
    
    const currentInterests = profile.interests || [];
    if (!currentInterests.includes(interest)) {
      setProfile({
        ...profile,
        interests: [...currentInterests, interest],
      });
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: (profile.interests || []).filter(i => i !== interest),
    });
  };

  const handleAddDrink = (drink: string) => {
    if (!drink.trim()) return;
    
    const currentDrinks = profile.preferredDrinks || [];
    if (!currentDrinks.includes(drink)) {
      setProfile({
        ...profile,
        preferredDrinks: [...currentDrinks, drink],
      });
    }
  };

  const handleRemoveDrink = (drink: string) => {
    setProfile({
      ...profile,
      preferredDrinks: (profile.preferredDrinks || []).filter(d => d !== drink),
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl mb-1">Profile Settings</h1>
          <p className="text-gray-600">Manage your profile information and privacy</p>
        </div>

        {/* Photos Section */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Your primary photo plus up to 5 additional photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Photo */}
            <div>
              <Label className="mb-2 block">Primary Photo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    placeholder="Avatar URL"
                    value={profile.avatar}
                    onChange={(e) =>
                      setProfile({ ...profile, avatar: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Photos */}
            <div>
              <Label className="mb-2 block">
                Additional Photos ({photoUrls.length}/5)
              </Label>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => handleRemovePhoto(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {photoUrls.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter photo URL"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddPhoto()}
                  />
                  <Button onClick={handleAddPhoto}>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <Button onClick={handleSavePhotos} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Photos
            </Button>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) =>
                    setProfile({ ...profile, username: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, age: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={profile.gender}
                  onValueChange={(value) =>
                    setProfile({ ...profile, gender: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="pronouns">Pronouns</Label>
              <Input
                id="pronouns"
                placeholder="e.g., he/him, she/her, they/them"
                value={profile.pronouns || ""}
                onChange={(e) =>
                  setProfile({ ...profile, pronouns: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell people about yourself..."
                value={profile.bio || ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="lookingFor">Looking For</Label>
              <Select
                value={profile.lookingFor}
                onValueChange={(value) =>
                  setProfile({ ...profile, lookingFor: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="What are you looking for?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendship">Friendship</SelectItem>
                  <SelectItem value="dating">Dating</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="just-social">Just Social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>
              Add your interests to help others find common ground
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {(profile.interests || []).map((interest) => (
                <Badge key={interest} variant="secondary">
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add an interest..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddInterest((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["Music", "Sports", "Travel", "Food", "Art", "Tech", "Gaming"].map(
                (interest) => (
                  <Button
                    key={interest}
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddInterest(interest)}
                  >
                    + {interest}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Drink Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Drink Preferences</CardTitle>
            <CardDescription>
              Let others know what you like to drink
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {(profile.preferredDrinks || []).map((drink) => (
                <Badge key={drink} variant="secondary">
                  {drink}
                  <button
                    onClick={() => handleRemoveDrink(drink)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {["Beer", "Wine", "Cocktails", "Whiskey", "Coffee", "Tea"].map(
                (drink) => (
                  <Button
                    key={drink}
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddDrink(drink)}
                  >
                    + {drink}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control who can see your profile and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="profileVisibility" className="mb-2 block">
                Profile Visibility
              </Label>
              <Select
                value={profile.privacySettings?.profileVisibility || "public"}
                onValueChange={(value) =>
                  setProfile({
                    ...profile,
                    privacySettings: {
                      ...profile.privacySettings,
                      profileVisibility: value as any,
                    } as any,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <div>
                        <div>Public</div>
                        <div className="text-xs text-gray-500">
                          Anyone can view your profile
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends-only">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div>Friends Only</div>
                        <div className="text-xs text-gray-500">
                          Only friends can view your profile
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <div>
                        <div>Private</div>
                        <div className="text-xs text-gray-500">
                          Only at same venue
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="allowMessages" className="mb-2 block">
                Who Can Message You
              </Label>
              <Select
                value={profile.privacySettings?.allowMessages || "anyone"}
                onValueChange={(value) =>
                  setProfile({
                    ...profile,
                    privacySettings: {
                      ...profile.privacySettings,
                      allowMessages: value as any,
                    } as any,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">Anyone</SelectItem>
                  <SelectItem value="connections-only">
                    Connections Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSavePrivacy} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>

        {/* Age Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Age Verification (21+)
            </CardTitle>
            <CardDescription>
              Verify your age to receive drinks and unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                {profile.ageVerification?.status === "verified" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AgeVerificationBadge user={profile} size="md" />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-green-900">
                            You're all set!
                          </p>
                          <p className="text-green-700 mt-1">
                            Your age has been verified. You can now receive drinks from other users.
                          </p>
                          {profile.ageVerification?.verifiedAt && (
                            <p className="text-xs text-green-600 mt-2">
                              Verified on {new Date(profile.ageVerification.verifiedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : profile.ageVerification?.status === "pending" ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900">
                          Verification Pending
                        </p>
                        <p className="text-yellow-700 mt-1">
                          Your documents are being reviewed. This typically takes 1-5 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : profile.ageVerification?.status === "rejected" ? (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-red-900">
                            Verification Failed
                          </p>
                          <p className="text-red-700 mt-1">
                            {profile.ageVerification?.rejectionReason || 
                              "Your documents could not be verified. Please try again with clearer photos."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowAgeVerification(true)}
                      className="w-full"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Retry Verification
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">
                            Age Verification Required
                          </p>
                          <p className="text-blue-700 mt-1">
                            To receive drinks from other users, you must verify your age by uploading a government-issued ID.
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-blue-700">
                            <li>• Required to receive alcoholic beverages</li>
                            <li>• One-time process (2-3 minutes)</li>
                            <li>• Secure & private verification</li>
                            <li>• Can still send drinks without verification</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowAgeVerification(true)}
                      className="w-full"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Start Age Verification
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other Verification Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Other Verifications</CardTitle>
            <CardDescription>
              Additional verified credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.verificationBadges?.phoneVerified && (
                <div className="flex items-center gap-2 text-green-600">
                  <Shield className="h-4 w-4" />
                  <span>Phone Verified ✓</span>
                </div>
              )}
              {profile.verificationBadges?.emailVerified && (
                <div className="flex items-center gap-2 text-green-600">
                  <Shield className="h-4 w-4" />
                  <span>Email Verified ✓</span>
                </div>
              )}
              {!profile.verificationBadges?.phoneVerified && (
                <p className="text-sm text-gray-500">
                  Additional verifications coming soon
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <AgeVerificationDialog
          open={showAgeVerification}
          onOpenChange={setShowAgeVerification}
          userId={profile.id}
          onVerificationSubmitted={() => {
            onUpdate();
          }}
        />
      </div>
    </ScrollArea>
  );
}
