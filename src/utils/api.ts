import { config } from './config';

export class ApiClient {
  private baseUrl = config.api.baseUrl;
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem("access_token");
    }

    return this.accessToken;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // ✅ Call backend API (NOT Supabase)
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  // Profile
  async getProfile() {
    return this.request("/profile");
  }

  async updateProfile(updates: any) {
    return this.request("/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async getUserProfile(userId: string) {
    return this.request(`/profile/${userId}`);
  }

  // Venues
  async getVenues(lat: number, lng: number, radius: number = 5) {
    return this.request(`/venues?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getVenue(venueId: string) {
    return this.request(`/venues/${venueId}`);
  }

  async getVenueCheckIns(venueId: string) {
    return this.request(`/venues/${venueId}/checkins`);
  }

  // Check-ins
  async checkIn(venueId: string, options: {
    status?: string;
    wantsDrink?: boolean;
    buyingDrinks?: boolean;
  }) {
    return this.request("/checkin", {
      method: "POST",
      body: JSON.stringify({ venueId, ...options }),
    });
  }

  async updateCheckIn(checkInId: string, updates: any) {
    return this.request(`/checkin/${checkInId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async checkOut() {
    return this.request("/checkout", {
      method: "POST",
    });
  }

  // Offers
  async createOffer(offer: {
    receiverId: string;
    itemId: string;
    itemName: string;
    itemPrice: number;
    message?: string;
    venueId: string;
  }) {
    return this.request("/offers", {
      method: "POST",
      body: JSON.stringify(offer),
    });
  }

  async getOffers(type: "sent" | "received") {
    return this.request(`/offers?type=${type}`);
  }

  async updateOffer(offerId: string, status: "accepted" | "declined") {
    return this.request(`/offers/${offerId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // Messages
  async sendMessage(receiverId: string, content: string, offerId?: string) {
    return this.request("/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId, content, offerId }),
    });
  }

  async getMessages(otherUserId: string) {
    return this.request(`/messages/${otherUserId}`);
  }

  async markMessagesAsRead(messageIds: string[]) {
    return this.request("/messages/read", {
      method: "POST",
      body: JSON.stringify({ messageIds }),
    });
  }

  async getConversations() {
    return this.request("/conversations");
  }

  // Auth
  async signUp(email: string, password: string, name: string, dateOfBirth: string) {
    const response = await this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name, dateOfBirth }),
    });
    return response;
  }

  async signIn(email: string, password: string) {
    const response = await this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return response;
  }

  async signOut() {
    return this.request("/auth/signout", {
      method: "POST",
    });
  }

  async seedVenue(venue: any) {
    return this.request("/seed-venue", {
      method: "POST",
      body: JSON.stringify({ venue }),
    });
  }

  // Friends
  async sendFriendRequest(receiverId: string) {
    return this.request("/friends/request", {
      method: "POST",
      body: JSON.stringify({ receiverId }),
    });
  }

  async acceptFriendRequest(requestId: string) {
    return this.request("/friends/accept", {
      method: "POST",
      body: JSON.stringify({ requestId }),
    });
  }

  async rejectFriendRequest(requestId: string) {
    return this.request("/friends/reject", {
      method: "POST",
      body: JSON.stringify({ requestId }),
    });
  }

  async getFriendRequests(type: "received" | "sent") {
    return this.request(`/friends/requests?type=${type}`);
  }

  async getFriends() {
    return this.request("/friends/list");
  }

  async removeFriend(friendId: string) {
    return this.request("/friends/remove", {
      method: "DELETE",
      body: JSON.stringify({ friendId }),
    });
  }

  async blockUser(userId: string) {
    return this.request("/friends/block", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async unblockUser(userId: string) {
    return this.request("/friends/unblock", {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    });
  }

  async searchUsers(query: string) {
    return this.request(`/friends/search?q=${encodeURIComponent(query)}`);
  }

  // Groups
  async createGroup(name: string, memberIds: string[]) {
    return this.request("/groups/create", {
      method: "POST",
      body: JSON.stringify({ name, memberIds }),
    });
  }

  async getGroups() {
    return this.request("/groups/list");
  }

  async getGroupDetails(groupId: string) {
    return this.request(`/groups/${groupId}`);
  }

  async addGroupMember(groupId: string, userId: string) {
    return this.request(`/groups/${groupId}/add-member`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async removeGroupMember(groupId: string, userId: string) {
    return this.request(`/groups/${groupId}/remove-member`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    });
  }

  async sendGroupMessage(groupId: string, content: string) {
    return this.request(`/groups/${groupId}/message`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async getGroupMessages(groupId: string) {
    return this.request(`/groups/${groupId}/messages`);
  }

  async getVenueBreakdown(venueId: string) {
    return this.request(`/venues/${venueId}/breakdown`);
  }

  // User Discovery
  async getUsersAtVenue(venueId: string, filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params.append(key, typeof filters[key] === 'object' ? JSON.stringify(filters[key]) : filters[key]);
        }
      });
    }
    return this.request(`/venues/${venueId}/users?${params.toString()}`);
  }

  async getUserProfileExtended(userId: string) {
    return this.request(`/users/${userId}/profile`);
  }

  async updateProfilePhotos(photos: string[]) {
    return this.request("/profile/photos", {
      method: "PUT",
      body: JSON.stringify({ photos }),
    });
  }

  async updatePrivacySettings(settings: any) {
    return this.request("/profile/privacy", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async getUserStats(userId: string) {
    return this.request(`/users/${userId}/stats`);
  }

  async submitUserReview(userId: string, rating: number, comment?: string) {
    return this.request(`/users/${userId}/review`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
  }

  async getUserReviews(userId: string) {
    return this.request(`/users/${userId}/reviews`);
  }

  async likeUser(userId: string) {
    return this.request(`/users/${userId}/like`, {
      method: "POST",
    });
  }

  // Drink Menu & Purchasing
  async getVenueDrinkMenu(venueId: string) {
    return this.request(`/venues/${venueId}/drinks`);
  }

  async createDrinkOffer(offer: {
    receiverId: string;
    drinkId: string;
    message?: string;
    venueId: string;
    anonymous?: boolean;
    paymentMethod: string;
  }) {
    return this.request("/drinks/offer", {
      method: "POST",
      body: JSON.stringify(offer),
    });
  }

  async acceptDrinkOffer(offerId: string, message?: string) {
    return this.request(`/drinks/offer/${offerId}/accept`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  async declineDrinkOffer(offerId: string, reason?: string) {
    return this.request(`/drinks/offer/${offerId}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getRedemptionCode(offerId: string) {
    return this.request(`/drinks/redemption/${offerId}`);
  }

  async verifyRedemptionCode(code: string, bartenderId?: string) {
    return this.request("/drinks/verify", {
      method: "POST",
      body: JSON.stringify({ code, bartenderId }),
    });
  }

  async getDrinkLimits(userId?: string) {
    const endpoint = userId ? `/drinks/limits/${userId}` : "/drinks/limits";
    return this.request(endpoint);
  }

  async getDrinkHistory(userId?: string) {
    const endpoint = userId ? `/drinks/history/${userId}` : "/drinks/history";
    return this.request(endpoint);
  }

  async checkDrinkEligibility(receiverId: string) {
    return this.request(`/drinks/eligibility/${receiverId}`);
  }

  // Age Verification
  async submitAgeVerification(data: {
    documentType: "drivers_license" | "passport" | "national_id";
    frontImage: string;
    backImage?: string;
    selfieImage: string;
  }) {
    return this.request("/age-verification/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAgeVerificationStatus(userId?: string) {
    const endpoint = userId 
      ? `/age-verification/status/${userId}` 
      : "/age-verification/status";
    return this.request(endpoint);
  }

  async checkAgeVerification() {
    return this.request("/age-verification/check");
  }
}

export const api = new ApiClient();

// Standalone function for age verification submission
export async function submitAgeVerification(
  userId: string,
  data: {
    documentType: "drivers_license" | "passport" | "national_id";
    frontImage: string;
    backImage?: string;
    selfieImage: string;
  }
) {
  return api.submitAgeVerification(data);
}
