import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { UserCard } from "./components/UserCard";
import { SendOfferDialog } from "./components/SendOfferDialog";
import { OfferCard } from "./components/OfferCard";
import { ConversationsList } from "./components/ConversationsList";
import { ChatView } from "./components/ChatView";
import { MapView } from "./components/MapView";
import { VenueDetailSheet } from "./components/VenueDetailSheet";
import { AuthScreen } from "./components/AuthScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { QuickActions } from "./components/QuickActions";
import { DemoModeButton } from "./components/DemoModeButton";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { GeofenceManager } from "./components/GeofenceManager";
import { CheckInConfirmationDialog } from "./components/CheckInConfirmationDialog";
import { FriendsView } from "./components/FriendsView";
import { GroupsView } from "./components/GroupsView";
import { UserProfile } from "./components/UserProfile";
import { ProfileSettings } from "./components/ProfileSettings";
import { DrinkMenuDialog } from "./components/DrinkMenuDialog";
import { DrinkRedemptionDialog } from "./components/DrinkRedemptionDialog";
import { BartenderVerificationDialog } from "./components/BartenderVerificationDialog";
import { DrinkLimitsCard } from "./components/DrinkLimitsCard";
import { users, menuItems, mockOffers, mockConversations, mockMessages, venues, checkIns } from "./data/mockData";
import { User, MenuItem, Offer, Conversation, Message, Venue, CheckIn } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Switch } from "./components/ui/switch";
import { toast, Toaster } from "sonner@2.0.3";
import { api } from "./utils/api";
import { LogOut } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { fetchRuntimeConfig } from "./utils/runtimeConfig";

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("hasVisited");
  });
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loadedVenues, setLoadedVenues] = useState<Venue[]>([]);
  
  const [sendOfferDialogOpen, setSendOfferDialogOpen] = useState(false);
  const [selectedUserForOffer, setSelectedUserForOffer] = useState<User | null>(null);
  const [selectedUserVenue, setSelectedUserVenue] = useState<Venue | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [venueSheetOpen, setVenueSheetOpen] = useState(false);

  // Geofencing state
  const [geofencingEnabled, setGeofencingEnabled] = useState(true);
  const [currentCheckIn, setCurrentCheckIn] = useState<CheckIn | null>(null);
  const [pendingCheckInVenue, setPendingCheckInVenue] = useState<Venue | null>(null);
  const [checkInConfirmDialogOpen, setCheckInConfirmDialogOpen] = useState(false);

  // User profile viewing
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [geolocationBlocked, setGeolocationBlocked] = useState(false);

  // Drink system
  const [drinkMenuOpen, setDrinkMenuOpen] = useState(false);
  const [selectedUserForDrink, setSelectedUserForDrink] = useState<User | null>(null);
  const [selectedVenueForDrink, setSelectedVenueForDrink] = useState<Venue | null>(null);
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [selectedOfferForRedemption, setSelectedOfferForRedemption] = useState<Offer | null>(null);
  const [bartenderDialogOpen, setBartenderDialogOpen] = useState(false);

  // Check for existing session on mount and fetch runtime config
  useEffect(() => {
    // Load runtime config (feature flags, min versions)
    fetchRuntimeConfig().then((cfg) => {
      if (cfg?.featureFlags) {
        console.log("Feature flags:", cfg.featureFlags);
      }
    });

    const token = api.getAccessToken();
    if (token) {
      loadUserData(token);
    } else {
      setLoading(false);
    }

    // Check if geolocation is available and not blocked
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success - geolocation is available
          setGeolocationBlocked(false);
        },
        (error) => {
          // Check if blocked by permissions policy
          if (error.message && error.message.includes("permissions policy")) {
            console.log("Geolocation blocked by permissions policy");
            setGeolocationBlocked(true);
          } else if (error.code === 1) {
            // Permission denied
            setGeolocationBlocked(true);
          }
        },
        { timeout: 5000 }
      );
    } else {
      setGeolocationBlocked(true);
    }
  }, []);

  // Load user data after authentication
  const loadUserData = async (token: string) => {
    try {
      api.setAccessToken(token);
      const profile = await api.getProfile();
      setCurrentUser(profile);
      
      // Load venues, offers, and conversations
      await loadVenues();
      await loadOffers();
      await loadConversations();
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      api.setAccessToken(null);
      setLoading(false);
    }
  };

  const loadVenues = async () => {
    try {
      // Use user's location or default to San Francisco
      const lat = 37.7749;
      const lng = -122.4194;
      const venuesData = await api.getVenues(lat, lng, 5);
      setLoadedVenues(venuesData);
    } catch (error) {
      console.error("Error loading venues:", error);
      // Fall back to mock data
      setLoadedVenues(venues);
    }
  };

  const loadOffers = async () => {
    try {
      const [sentOffers, receivedOffers] = await Promise.all([
        api.getOffers("sent"),
        api.getOffers("received"),
      ]);
      setOffers([...receivedOffers, ...sentOffers]);
    } catch (error) {
      console.error("Error loading offers:", error);
      // Fall back to mock data for demo
      setOffers(mockOffers);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
      // Fall back to mock data for demo
      setConversations(mockConversations);
    }
  };

  const handleAuthSuccess = (authSession: any) => {
    setSession(authSession);
    loadUserData(authSession.access_token);
    toast.success("Welcome! You're signed in.");
  };

  const handleSignOut = async () => {
    try {
      await api.signOut();
      api.setAccessToken(null);
      setSession(null);
      setCurrentUser(null);
      setOffers([]);
      setConversations([]);
      setMessages({});
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const receivedOffers = currentUser ? offers.filter(offer => offer.receiver?.id === currentUser.id) : [];
  const sentOffers = currentUser ? offers.filter(offer => offer.sender?.id === currentUser.id) : [];
  const pendingReceivedCount = receivedOffers.filter(offer => offer.status === "pending").length;
  const unreadMessagesCount = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  const handleSendOffer = (user: User, venue?: Venue) => {
    setSelectedUserForOffer(user);
    setSelectedUserVenue(venue || null);
    setSendOfferDialogOpen(true);
  };

  const handleCreateOffer = async (item: MenuItem, message: string) => {
    if (!selectedUserForOffer) return;

    try {
      const newOffer = await api.createOffer({
        receiverId: selectedUserForOffer.id,
        itemId: item.id,
        itemName: item.name,
        itemPrice: item.price,
        message,
        venueId: selectedVenueId || "venue-1", // Use selected venue or default
      });

      // Add sender and receiver info for display
      const enrichedOffer = {
        ...newOffer,
        sender: currentUser,
        receiver: selectedUserForOffer,
        item,
        timestamp: "Just now",
        createdAt: new Date(),
      };

      setOffers([enrichedOffer, ...offers]);
      toast.success(`Offer sent to ${selectedUserForOffer.name}!`);
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error("Failed to send offer. Please try again.");
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await api.updateOffer(offerId, "accepted");

      setOffers(offers.map(offer => 
        offer.id === offerId ? { ...offer, status: "accepted" as const } : offer
      ));

      const acceptedOffer = offers.find(o => o.id === offerId);
      if (acceptedOffer) {
        // Reload conversations to get the new one
        await loadConversations();
        toast.success(`You accepted the offer! You can now chat with ${acceptedOffer.sender.name}`);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error("Failed to accept offer. Please try again.");
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      await api.updateOffer(offerId, "declined");

      setOffers(offers.map(offer => 
        offer.id === offerId ? { ...offer, status: "declined" as const } : offer
      ));
      toast.info("Offer declined");
    } catch (error) {
      console.error("Error declining offer:", error);
      toast.error("Failed to decline offer. Please try again.");
    }
  };

  const handleOpenChat = (offerId: string) => {
    const conversation = conversations.find(conv => conv.offerId === offerId);
    if (conversation) {
      setSelectedConversation(conversation.id);
      setActiveTab("messages");
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Load messages for this conversation
    try {
      const msgs = await api.getMessages(conversation.user.id);
      setMessages({ ...messages, [conversationId]: msgs });

      // Mark unread messages as read
      const unreadIds = msgs
        .filter((m: Message) => !m.read && m.receiverId === currentUser?.id)
        .map((m: Message) => m.id);

      if (unreadIds.length > 0) {
        await api.markMessagesAsRead(unreadIds);
      }

      // Update local conversation state
      setConversations(conversations.map(conv =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleVenueClick = (venueId: string) => {
    setSelectedVenueId(venueId);
    setVenueSheetOpen(true);
  };

  // Geofencing handlers
  const handleGeofenceCheckIn = (venue: Venue) => {
    setPendingCheckInVenue(venue);
    setCheckInConfirmDialogOpen(true);
  };

  const handleConfirmCheckIn = async (intent: "buying" | "receiving") => {
    if (!pendingCheckInVenue) return;

    try {
      const result = await api.checkIn(pendingCheckInVenue.id, {
        wantsDrink: intent === "receiving",
        buyingDrinks: intent === "buying",
        status: intent === "receiving" ? "Looking for drinks" : "Buying drinks",
      });
      
      // Update current check-in state
      setCurrentCheckIn({
        id: result.id,
        user: currentUser,
        venue: pendingCheckInVenue,
        timestamp: new Date(result.checkedInAt || result.timestamp),
        checkedInAt: result.checkedInAt,
        wantsDrink: result.wantsDrink,
        buyingDrinks: result.buyingDrinks,
        active: result.active,
      });
      
      toast.success(`Checked in to ${pendingCheckInVenue.name}!`);
      setCheckInConfirmDialogOpen(false);
      setPendingCheckInVenue(null);
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast.error(error.message || "Failed to check in");
    }
  };

  const handleCancelCheckIn = () => {
    setCheckInConfirmDialogOpen(false);
    setPendingCheckInVenue(null);
  };

  const handleGeofenceCheckOut = async () => {
    if (!currentCheckIn) return;

    try {
      await api.checkOut();
      toast.info(`Checked out from ${currentCheckIn.venue.name}`);
      setCurrentCheckIn(null);
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    try {
      const newMessage = await api.sendMessage(
        conversation.user.id,
        content,
        conversation.offerId
      );

      // Add to local state
      setMessages({
        ...messages,
        [selectedConversation]: [...(messages[selectedConversation] || []), newMessage],
      });

      // Update last message in conversation
      setConversations(conversations.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: newMessage }
          : conv
      ));
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id);
    setUserProfileOpen(true);
  };

  const handleProfileUpdate = () => {
    // Reload current user profile
    if (currentUser) {
      loadUserData(api.getAccessToken()!);
    }
  };

  const handleSendDrink = (user: User, venue?: Venue) => {
    setSelectedUserForDrink(user);
    setSelectedVenueForDrink(venue || null);
    setDrinkMenuOpen(true);
  };

  const handleDrinkSent = () => {
    // Reload offers after sending a drink
    loadOffers();
  };

  const handleViewRedemption = (offer: Offer) => {
    setSelectedOfferForRedemption(offer);
    setRedemptionDialogOpen(true);
  };

  const renderMapTab = () => (
    <div className="relative h-screen w-full overflow-hidden">
      <MapView venues={loadedVenues.length > 0 ? loadedVenues : venues} onVenueClick={handleVenueClick} />
      
      {/* Venue Detail Sheet - will render as a side panel overlay */}
      <VenueDetailSheet
        open={venueSheetOpen}
        onOpenChange={setVenueSheetOpen}
        venue={(loadedVenues.length > 0 ? loadedVenues : venues).find(v => v.id === selectedVenueId) || null}
        checkIns={checkIns}
        onSendOffer={(user) => handleSendDrink(user)}
        onSelectUser={handleSelectUser}
        currentUserId={currentUser?.id}
      />
    </div>
  );

  const renderDiscoverTab = () => (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Discover People</h2>
        <p className="text-gray-600">Connect with people nearby and buy them drinks</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          // Find the user's active check-in to get their current venue
          const userCheckIn = checkIns.find(
            (ci) => ci.user.id === user.id && ci.active !== false
          );
          const userVenue = userCheckIn
            ? (loadedVenues.length > 0 ? loadedVenues : venues).find(
                (v) => v.id === userCheckIn.venue.id
              )
            : undefined;
          
          return (
            <UserCard 
              key={user.id} 
              user={user} 
              onSendOffer={(u) => handleSendDrink(u, userVenue)} 
            />
          );
        })}
      </div>
    </div>
  );

  const renderOffersTab = () => (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Your Offers</h2>
        <p className="text-gray-600">Manage your sent and received treats</p>
      </div>

      <Tabs defaultValue="received">
        <TabsList className="mb-6 bg-white shadow-modern">
          <TabsTrigger value="received" className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            Received
            {pendingReceivedCount > 0 && (
              <Badge className="ml-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0">
                {pendingReceivedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <div className="space-y-4">
            {receivedOffers.length === 0 ? (
              <Card className="p-16 text-center border-0 shadow-modern bg-white">
                <div className="text-7xl mb-4">🎁</div>
                <h3 className="font-semibold text-xl mb-2 text-gray-900">No offers yet</h3>
                <p className="text-sm text-gray-600">
                  When someone sends you a treat, it will appear here
                </p>
              </Card>
            ) : (
              receivedOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  type="received"
                  onAccept={handleAcceptOffer}
                  onDecline={handleDeclineOffer}
                  onOpenChat={handleOpenChat}
                  onViewRedemption={handleViewRedemption}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="space-y-4">
            {sentOffers.length === 0 ? (
              <Card className="p-16 text-center border-0 shadow-modern bg-white">
                <div className="text-7xl mb-4">☕</div>
                <h3 className="font-semibold text-xl mb-2 text-gray-900">No offers sent</h3>
                <p className="text-sm text-gray-600">
                  Browse the Discover tab to send treats to people
                </p>
              </Card>
            ) : (
              sentOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  type="sent"
                  onOpenChat={handleOpenChat}
                  onViewRedemption={handleViewRedemption}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderMessagesTab = () => {
    if (selectedConversation) {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return null;

      return (
        <ChatView
          user={conversation.user}
          currentUserId={currentUser.id}
          messages={messages[selectedConversation] || []}
          onSendMessage={handleSendMessage}
          onBack={() => setSelectedConversation(null)}
        />
      );
    }

    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
        <div className="p-8 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <h2 className="text-3xl font-bold gradient-text mb-2">Messages</h2>
          <p className="text-gray-600">Chat with people who accepted your offers</p>
        </div>
        <ConversationsList
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
        />
      </div>
    );
  };

  const renderFriendsTab = () => {
    return <FriendsView onClose={() => setActiveTab("discover")} />;
  };

  const renderGroupsTab = () => {
    return <GroupsView onClose={() => setActiveTab("discover")} />;
  };

  const renderProfileTab = () => {
    if (!currentUser) return null;

    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-white">
        <Tabs defaultValue="view" className="h-full flex flex-col">
          <div className="border-b border-gray-200 px-8 pt-8 bg-white/80 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold gradient-text mb-6">My Profile</h2>
              <TabsList className="mb-4 bg-white shadow-modern">
                <TabsTrigger value="view" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">View Profile</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">Edit Profile</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="view" className="flex-1 overflow-y-auto">
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <Card className="p-8 shadow-modern-xl border-0 bg-white">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-40 w-40 mb-6 ring-4 ring-indigo-100 shadow-modern-lg">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl">
                        {currentUser.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">{currentUser.name}</h2>
                    <p className="text-gray-500 mb-6">@{currentUser.username}</p>
                    
                    {currentUser.bio && (
                      <p className="mb-6 text-gray-700 max-w-md">{currentUser.bio}</p>
                    )}

                    <div className="flex gap-8 mb-8">
                      {currentUser.age && (
                        <div className="text-center">
                          <p className="text-2xl font-bold gradient-text">{currentUser.age}</p>
                          <p className="text-sm text-gray-500">Years old</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-2xl font-bold gradient-text">{sentOffers.filter(o => o.status === "accepted").length}</p>
                        <p className="text-sm text-gray-500">Connections</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold gradient-text">{sentOffers.length}</p>
                        <p className="text-sm text-gray-500">Offers Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold gradient-text">{receivedOffers.filter(o => o.status === "accepted").length}</p>
                        <p className="text-sm text-gray-500">Offers Received</p>
                      </div>
                    </div>

                    {currentUser.interests && currentUser.interests.length > 0 && (
                      <div className="w-full mb-8">
                        <p className="text-sm font-medium text-gray-600 mb-3">Interests</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {currentUser.interests.map((interest: string, index: number) => (
                            <Badge key={index} className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200 hover:from-indigo-200 hover:to-purple-200">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentUser.preferredDrinks && currentUser.preferredDrinks.length > 0 && (
                      <div className="w-full mb-8">
                        <p className="text-sm font-medium text-gray-600 mb-3">Drink Preferences</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {currentUser.preferredDrinks.map((drink: string, index: number) => (
                            <Badge key={index} className="border-2 border-purple-200 text-purple-700 bg-white hover:bg-purple-50">
                              {drink}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Drink Limits */}
                    <div className="w-full max-w-xs mb-6">
                      <DrinkLimitsCard compact />
                    </div>

                    {/* Geofencing Toggle */}
                    <Card className="w-full max-w-xs mb-6 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Automatic Check-In</p>
                          <p className="text-xs text-muted-foreground">
                            Auto-detect when you enter venues
                          </p>
                        </div>
                        <Switch
                          checked={geofencingEnabled}
                          onCheckedChange={setGeofencingEnabled}
                          disabled={geolocationBlocked}
                        />
                      </div>
                      
                      {geolocationBlocked && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500">
                            <span className="text-lg">⚠️</span>
                            <div>
                              <p className="font-medium text-sm">Location Unavailable</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Automatic check-in requires location access. You can still check in manually at venues.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!geolocationBlocked && currentCheckIn && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          <p className="text-muted-foreground">Currently at:</p>
                          <p className="font-medium">{currentCheckIn.venue.name}</p>
                        </div>
                      )}
                    </Card>

                    <Button 
                      variant="outline" 
                      onClick={handleSignOut}
                      className="w-full max-w-xs border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-hidden">
            <ProfileSettings 
              currentUser={currentUser} 
              onUpdate={handleProfileUpdate} 
            />
          </TabsContent>
        </Tabs>
        
        {/* Bartender Verification Button (bottom right) */}
        <div className="fixed bottom-6 right-6">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setBartenderDialogOpen(true)}
            className="shadow-lg"
          >
            🍺 Bartender Mode
          </Button>
        </div>
      </div>
    );
  };

  // Show welcome screen for first-time visitors
  if (showWelcome && !session && !currentUser) {
    return (
      <WelcomeScreen
        onGetStarted={() => {
          localStorage.setItem("hasVisited", "true");
          setShowWelcome(false);
        }}
      />
    );
  }

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="text-center relative z-10">
          <div className="text-7xl mb-6 animate-bounce">🍹</div>
          <h2 className="text-2xl font-semibold gradient-text mb-2">TreatMe</h2>
          <p className="text-gray-600">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!session || !currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ConnectionStatus />
      
      {/* Geofence Manager - invisible component that handles automatic check-in/out */}
      <GeofenceManager
        venues={loadedVenues.length > 0 ? loadedVenues : venues}
        currentCheckIn={currentCheckIn}
        onCheckInDetected={handleGeofenceCheckIn}
        onCheckOutDetected={handleGeofenceCheckOut}
        enabled={geofencingEnabled && !!currentUser}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] max-w-[1800px] mx-auto">
        <div className="hidden lg:block">
          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadOffersCount={pendingReceivedCount}
            unreadMessagesCount={unreadMessagesCount}
          />
        </div>

        <main className="min-h-screen overflow-y-auto">
          {activeTab === "map" && renderMapTab()}
          {activeTab === "discover" && renderDiscoverTab()}
          {activeTab === "friends" && renderFriendsTab()}
          {activeTab === "groups" && renderGroupsTab()}
          {activeTab === "offers" && renderOffersTab()}
          {activeTab === "messages" && renderMessagesTab()}
          {activeTab === "profile" && renderProfileTab()}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-40 shadow-modern-lg">
          <div className="flex justify-around items-center px-2 py-3">
            {[
              { id: "map", icon: "🗺️", label: "Map" },
              { id: "discover", icon: "👥", label: "Discover" },
              { id: "offers", icon: "🎁", label: "Offers", badge: pendingReceivedCount },
              { id: "messages", icon: "💬", label: "Messages", badge: unreadMessagesCount },
              { id: "profile", icon: "👤", label: "Profile" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-indigo-100 to-purple-100"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="relative text-xl">
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {item.badge}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${
                  activeTab === item.id ? "gradient-text" : "text-gray-600"
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions FAB (hidden on mobile to avoid conflict with bottom nav) */}
      <div className="hidden lg:block">
        <QuickActions
          onCheckIn={() => {
            setActiveTab("map");
            // Could add logic to open check-in dialog
          }}
          onFindPeople={() => setActiveTab("discover")}
          onSendOffer={() => setActiveTab("discover")}
        />
      </div>

      <SendOfferDialog
        open={sendOfferDialogOpen}
        onOpenChange={setSendOfferDialogOpen}
        user={selectedUserForOffer || users[0]}
        menuItems={menuItems}
        onSend={handleCreateOffer}
        venue={selectedUserVenue}
      />

      <VenueDetailSheet
        open={venueSheetOpen}
        onOpenChange={setVenueSheetOpen}
        venue={(loadedVenues.length > 0 ? loadedVenues : venues).find(v => v.id === selectedVenueId) || null}
        checkIns={checkIns}
        onSendOffer={handleSendDrink}
        onSelectUser={handleSelectUser}
        currentUserId={currentUser?.id}
      />

      {selectedUserId && (
        <UserProfile
          userId={selectedUserId}
          open={userProfileOpen}
          onClose={() => {
            setUserProfileOpen(false);
            setSelectedUserId(null);
          }}
          onSendOffer={(user) => {
            handleSendOffer(user);
            setUserProfileOpen(false);
          }}
          currentUserId={currentUser?.id}
        />
      )}

      <CheckInConfirmationDialog
        venue={pendingCheckInVenue}
        open={checkInConfirmDialogOpen}
        onConfirm={handleConfirmCheckIn}
        onCancel={handleCancelCheckIn}
      />

      {selectedUserForDrink && selectedVenueForDrink && (
        <DrinkMenuDialog
          open={drinkMenuOpen}
          onOpenChange={setDrinkMenuOpen}
          user={selectedUserForDrink}
          venue={selectedVenueForDrink}
          onSuccess={handleDrinkSent}
        />
      )}

      {selectedOfferForRedemption && (
        <DrinkRedemptionDialog
          open={redemptionDialogOpen}
          onOpenChange={setRedemptionDialogOpen}
          offer={selectedOfferForRedemption}
        />
      )}

      <BartenderVerificationDialog
        open={bartenderDialogOpen}
        onOpenChange={setBartenderDialogOpen}
      />

      <DemoModeButton />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right" 
        expand={true}
        richColors
        closeButton
      />
    </div>
  );
}

// Wrap the default export with ErrorBoundary
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
// Deployment trigger - OIDC ready
