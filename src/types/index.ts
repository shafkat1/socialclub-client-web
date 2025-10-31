export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  age?: number;
  dateOfBirth?: string;
  location?: string;
  interests?: string[];
  online?: boolean;
  pronouns?: string;
  preferredDrinks?: string[];
  verified?: boolean;
  privacySettings?: {
    profileVisibility: "public" | "friends-only" | "private";
    presenceVisibility: "public" | "friends" | "friends-of-friends";
    allowMessages: "anyone" | "connections-only";
  };
  // Extended profile fields
  photos?: string[]; // Up to 5 additional photos (avatar is primary)
  gender?: "male" | "female" | "non-binary" | "other" | "prefer-not-to-say";
  lookingFor?: "friendship" | "dating" | "both" | "just-social";
  verificationBadges?: {
    ageVerified?: boolean;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    idVerified?: boolean;
    socialMediaLinked?: string[]; // e.g., ["facebook", "instagram"]
  };
  ageVerification?: {
    status: "unverified" | "pending" | "verified" | "rejected";
    submittedAt?: string;
    verifiedAt?: string;
    documentType?: "drivers_license" | "passport" | "national_id";
    kycProvider?: "persona" | "idenfy" | "idmission";
    rejectionReason?: string;
  };
  stats?: {
    drinksReceived?: number;
    drinksGiven?: number;
    currentStreak?: number;
    rating?: number;
    reviewCount?: number;
  };
  currentVenue?: Venue;
  currentCheckIn?: CheckIn;
}

export interface MenuItem {
  id: string;
  name: string;
  category: "coffee" | "cocktail" | "food" | "beer" | "wine" | "spirits" | "shots" | "non-alcoholic";
  price: number;
  emoji: string;
  image?: string;
  venueId?: string; // Link menu items to specific venues
  description?: string;
  size?: string; // e.g., "12oz", "Pint", "Double"
  markup?: number; // Platform markup/commission percentage
}

export interface Offer {
  id: string;
  sender: User;
  receiver: User;
  item: MenuItem;
  message?: string;
  status: "pending" | "accepted" | "declined" | "redeemed" | "expired";
  timestamp: string;
  createdAt: Date;
  anonymous?: boolean; // If true, sender identity hidden until accepted
  venueId?: string;
  redemptionCode?: string; // Generated when accepted
  redeemedAt?: string;
  expiresAt?: string; // Drinks expire after a certain time
  paymentMethod?: string;
  totalAmount?: number; // Including markup
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage?: Message;
  unreadCount: number;
  offerId: string;
}

export interface Venue {
  id: string;
  name: string;
  type: "restaurant" | "bar" | "nightclub" | "cafe";
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string;
  checkInCount: number;
  rating?: number;
  priceRange?: string;
}

export interface CheckIn {
  id: string;
  user: User;
  venue: Venue;
  timestamp: Date;
  checkedInAt?: string;
  checkedOutAt?: string;
  status?: string;
  wantsDrink?: boolean;
  buyingDrinks?: boolean;
  active?: boolean;
}

export interface Session {
  access_token: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    user_metadata?: any;
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderUsername: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: string;
}

export interface Friend {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  online?: boolean;
  currentVenue?: Venue;
  location?: string;
  bio?: string;
  mutualFriends?: number;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  timestamp: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
  currentVenue?: Venue;
}

export interface GroupMember {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  joinedAt: string;
  online?: boolean;
  currentVenue?: Venue;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

export interface VenueUserBreakdown {
  totalUsers: number;
  individualsCount: number;
  groupsCount: number;
  individuals: User[];
  groups: {
    groupId: string;
    groupName: string;
    memberCount: number;
    members: User[];
  }[];
  wantsDrinkCount: number;
  buyingDrinksCount: number;
}

export interface UserReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewedUserId: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: string;
}

export interface DiscoveryFilters {
  gender?: string[];
  ageRange?: { min: number; max: number };
  groupMembership?: string; // groupId
  status?: "alone" | "in-group" | "all";
  sortBy?: "just-arrived" | "verified" | "high-rating" | "distance";
}

export interface DrinkLimit {
  userId: string;
  hourlyCount: number; // Drinks in last hour
  dailyCount: number; // Drinks today
  violations: number; // Number of violations
  lastDrinkTime?: string;
  suspended?: boolean;
  suspendedUntil?: string;
}

export interface RedemptionCode {
  id: string;
  code: string; // 6-8 digit alphanumeric
  offerId: string;
  venueId: string;
  recipientId: string;
  senderId: string;
  drinkItem: MenuItem;
  status: "pending" | "redeemed" | "expired";
  createdAt: string;
  redeemedAt?: string;
  redeemedBy?: string; // Bartender ID
  expiresAt: string;
}

export interface DrinkTransaction {
  id: string;
  senderId: string;
  recipientId: string;
  venueId: string;
  drinkItem: MenuItem;
  amount: number;
  status: "pending" | "completed" | "failed";
  timestamp: string;
  offerId: string;
  redemptionCodeId?: string;
}

export interface BartenderVerification {
  id: string;
  venueId: string;
  redemptionCode: string;
  drinkItem: MenuItem;
  recipientName: string;
  recipientId: string;
  verifiedAt?: string;
  verifiedBy?: string; // Bartender name/ID
}

export interface AgeVerificationDocument {
  id: string;
  userId: string;
  documentType: "drivers_license" | "passport" | "national_id";
  frontImageUrl: string;
  backImageUrl?: string;
  selfieImageUrl: string;
  status: "pending" | "processing" | "verified" | "rejected";
  submittedAt: string;
  processedAt?: string;
  extractedData?: {
    fullName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    expirationDate?: string;
    issuingCountry?: string;
  };
  verificationResult?: {
    ageVerified: boolean;
    faceMatch: boolean;
    documentAuthentic: boolean;
    confidence?: number;
  };
  kycProvider: "persona" | "idenfy" | "idmission" | "manual";
  notes?: string;
}
