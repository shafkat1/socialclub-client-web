import { useState, useEffect } from "react";
import { User, UserReview } from "../types";
import { api } from "../utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { 
  MapPin, 
  Heart, 
  UserPlus, 
  Star, 
  CheckCircle2, 
  Shield, 
  Phone, 
  Mail,
  Facebook,
  Instagram,
  Gift,
  TrendingUp,
  MessageCircle,
  X
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface UserProfileProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  onSendOffer?: (user: User) => void;
  onSendMessage?: (user: User) => void;
  currentUserId?: string;
}

export function UserProfile({ 
  userId, 
  open, 
  onClose, 
  onSendOffer,
  onSendMessage,
  currentUserId 
}: UserProfileProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    if (open && userId) {
      loadProfile();
      loadReviews();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getUserProfileExtended(userId);
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await api.getUserReviews(userId);
      setReviews(data);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  const handleLike = async () => {
    try {
      const result = await api.likeUser(userId);
      setLiked(true);
      
      if (result.mutual) {
        toast.success("It's a match! You both liked each other! 🎉");
      } else {
        toast.success("Like sent!");
      }
    } catch (error) {
      console.error("Error liking user:", error);
      toast.error("Failed to send like");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await api.sendFriendRequest(userId);
      toast.success("Friend request sent!");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error(error.message || "Failed to send friend request");
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Loading Profile</DialogTitle>
            <DialogDescription>Please wait while we load the user profile...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return null;
  }

  const allPhotos = [profile.avatar, ...(profile.photos || [])];
  const isOwnProfile = currentUserId === userId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{profile.name}'s Profile</DialogTitle>
          <DialogDescription>View user profile information and photos</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full">
          {/* Photo Gallery */}
          <div className="relative h-80 bg-gray-100">
            <img
              src={allPhotos[selectedPhotoIndex]}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
            
            {/* Photo indicators */}
            {allPhotos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {allPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === selectedPhotoIndex 
                        ? "bg-white w-6" 
                        : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl">{profile.name}</h2>
                    {profile.age && (
                      <span className="text-xl text-gray-600">{profile.age}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <span>@{profile.username}</span>
                    {profile.pronouns && (
                      <>
                        <span>•</span>
                        <span>{profile.pronouns}</span>
                      </>
                    )}
                  </div>

                  {/* Verification Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.verificationBadges?.ageVerified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Age Verified
                      </Badge>
                    )}
                    {profile.verificationBadges?.phoneVerified && (
                      <Badge variant="secondary" className="gap-1">
                        <Phone className="h-3 w-3" />
                        Phone Verified
                      </Badge>
                    )}
                    {profile.verificationBadges?.emailVerified && (
                      <Badge variant="secondary" className="gap-1">
                        <Mail className="h-3 w-3" />
                        Email Verified
                      </Badge>
                    )}
                    {profile.verificationBadges?.idVerified && (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        ID Verified
                      </Badge>
                    )}
                    {profile.verificationBadges?.socialMediaLinked?.map((platform) => (
                      <Badge key={platform} variant="secondary" className="gap-1">
                        {platform === "facebook" && <Facebook className="h-3 w-3" />}
                        {platform === "instagram" && <Instagram className="h-3 w-3" />}
                        {platform}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  {profile.stats && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{profile.stats.rating?.toFixed(1) || "N/A"}</span>
                        <span className="text-gray-500">
                          ({profile.stats.reviewCount || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift className="h-4 w-4 text-primary" />
                        <span>{profile.stats.drinksGiven || 0} given</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift className="h-4 w-4 text-green-500" />
                        <span>{profile.stats.drinksReceived || 0} received</span>
                      </div>
                      {profile.stats.currentStreak > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <span>{profile.stats.currentStreak} day streak</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant={liked ? "default" : "outline"}
                      onClick={handleLike}
                      disabled={liked}
                    >
                      <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleSendFriendRequest}
                    >
                      <UserPlus className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Current Location */}
              {profile.currentVenue && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Currently at</span>
                      <span className="font-medium">{profile.currentVenue.name}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Looking For Badge */}
              {profile.lookingFor && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-sm">
                    {profile.lookingFor === "friendship" && "Looking for friendship"}
                    {profile.lookingFor === "dating" && "Open to dating"}
                    {profile.lookingFor === "both" && "Open to friendship & dating"}
                    {profile.lookingFor === "just-social" && "Just here to socialize"}
                  </Badge>
                </div>
              )}

              <Separator className="my-4" />

              {/* Tabs */}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1">
                    Reviews ({reviews.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4 mt-4">
                  {/* Bio */}
                  {profile.bio && (
                    <div>
                      <h3 className="mb-2 text-sm text-gray-600">About</h3>
                      <p>{profile.bio}</p>
                    </div>
                  )}

                  {/* Interests */}
                  {profile.interests && profile.interests.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm text-gray-600">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, idx) => (
                          <Badge key={idx} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drink Preferences */}
                  {profile.preferredDrinks && profile.preferredDrinks.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm text-gray-600">Drink Preferences</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferredDrinks.map((drink, idx) => (
                          <Badge key={idx} variant="secondary">
                            {drink}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                  {reviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={review.reviewerAvatar} />
                                <AvatarFallback>
                                  {review.reviewerName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">
                                    {review.reviewerName}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span>{review.rating}</span>
                                  </div>
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-gray-700">{review.comment}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(review.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <>
                  <Separator className="my-6" />
                  <div className="flex gap-3">
                    {onSendOffer && (
                      <Button
                        className="flex-1"
                        onClick={() => {
                          onSendOffer(profile);
                          onClose();
                        }}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Send Offer
                      </Button>
                    )}
                    {onSendMessage && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          onSendMessage(profile);
                          onClose();
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
