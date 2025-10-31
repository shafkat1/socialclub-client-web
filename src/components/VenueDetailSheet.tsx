import { useState, useEffect } from "react";
import { Venue, CheckIn, User, VenueUserBreakdown } from "../types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MapPin, Star, DollarSign, Users, Clock, MapPinCheck, LogOut, UserCircle, Compass } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { UserDiscovery } from "./UserDiscovery";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";

interface VenueDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: Venue | null;
  checkIns: CheckIn[];
  onSendOffer: (user: User, venue?: Venue) => void;
  onSelectUser?: (user: User) => void;
  currentUserId?: string;
}

export function VenueDetailSheet({
  open,
  onOpenChange,
  venue,
  checkIns,
  onSendOffer,
  onSelectUser,
  currentUserId,
}: VenueDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [wantsDrink, setWantsDrink] = useState(false);
  const [buyingDrinks, setBuyingDrinks] = useState(false);
  const [venueCheckIns, setVenueCheckIns] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<VenueUserBreakdown | null>(null);

  useEffect(() => {
    if (open && venue) {
      loadVenueCheckIns();
      loadVenueBreakdown();
    }
  }, [open, venue]);

  const loadVenueCheckIns = async () => {
    if (!venue) return;
    try {
      const checkIns = await api.getVenueCheckIns(venue.id);
      setVenueCheckIns(checkIns);
      
      // Check if current user is checked in
      const userCheckIn = checkIns.find((ci: any) => ci.userId === currentUserId);
      if (userCheckIn) {
        setCheckedIn(true);
        setCheckInId(userCheckIn.id);
        setStatus(userCheckIn.status || "");
        setWantsDrink(userCheckIn.wantsDrink || false);
        setBuyingDrinks(userCheckIn.buyingDrinks || false);
      }
    } catch (error) {
      console.error("Error loading venue check-ins:", error);
      // Fall back to props
      setVenueCheckIns(checkIns.filter((ci) => ci.venue.id === venue.id));
    }
  };

  const loadVenueBreakdown = async () => {
    if (!venue) return;
    try {
      const data = await api.getVenueBreakdown(venue.id);
      setBreakdown(data);
    } catch (error) {
      console.error("Error loading venue breakdown:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!venue) return;
    setLoading(true);
    try {
      const result = await api.checkIn(venue.id, {
        status,
        wantsDrink,
        buyingDrinks,
      });
      setCheckedIn(true);
      setCheckInId(result.id);
      toast.success(`Checked in to ${venue.name}!`);
      await loadVenueCheckIns();
      await loadVenueBreakdown();
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast.error(error.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await api.checkOut();
      setCheckedIn(false);
      setCheckInId(null);
      setStatus("");
      setWantsDrink(false);
      setBuyingDrinks(false);
      toast.success("Checked out successfully");
      await loadVenueCheckIns();
      await loadVenueBreakdown();
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCheckIn = async (updates: any) => {
    if (!checkInId) return;
    try {
      await api.updateCheckIn(checkInId, updates);
      await loadVenueCheckIns();
    } catch (error) {
      console.error("Error updating check-in:", error);
    }
  };

  const typeColors = {
    cafe: "bg-amber-100 text-amber-800 border-amber-200",
    bar: "bg-orange-100 text-orange-800 border-orange-200",
    nightclub: "bg-purple-100 text-purple-800 border-purple-200",
    restaurant: "bg-red-100 text-red-800 border-red-200",
  };

  // Early return check after all hooks
  if (!venue) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[540px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{venue.name}</SheetTitle>
          <SheetDescription>
            View people checked in at {venue.name} and send them drink or food offers
          </SheetDescription>
        </SheetHeader>
        <div className="h-full flex flex-col">
          {/* Header with Image */}
          <div className="relative h-48 flex-shrink-0">
            <ImageWithFallback
              src={venue.image}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <Badge
                className={`${typeColors[venue.type]} mb-2`}
              >
                {venue.type}
              </Badge>
              <h2 className="text-2xl font-semibold mb-1">{venue.name}</h2>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                <span>{venue.address}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-4 mb-4">
              {venue.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{venue.rating}</span>
                </div>
              )}
              {venue.priceRange && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>{venue.priceRange}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-primary">
                <Users className="h-4 w-4" />
                <span className="font-medium">{venueCheckIns.length} checked in</span>
              </div>
            </div>

            {/* Check-in Section */}
            {!checkedIn ? (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">What are you up to?</Label>
                </div>
                <Input
                  id="status"
                  placeholder="e.g., Looking for new friends!"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="wants-drink"
                      checked={wantsDrink}
                      onCheckedChange={(checked) => {
                        setWantsDrink(checked);
                        if (checkedIn) handleUpdateCheckIn({ wantsDrink: checked });
                      }}
                    />
                    <Label htmlFor="wants-drink" className="text-sm">
                      Want a drink
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="buying-drinks"
                      checked={buyingDrinks}
                      onCheckedChange={(checked) => {
                        setBuyingDrinks(checked);
                        if (checkedIn) handleUpdateCheckIn({ buyingDrinks: checked });
                      }}
                    />
                    <Label htmlFor="buying-drinks" className="text-sm">
                      Buying drinks
                    </Label>
                  </div>
                </div>
                <Button
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="w-full"
                >
                  <MapPinCheck className="h-4 w-4 mr-2" />
                  {loading ? "Checking in..." : "Check In"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <MapPinCheck className="h-4 w-4" />
                    <span className="font-medium">You're checked in!</span>
                  </div>
                </div>
                {status && (
                  <p className="text-sm text-muted-foreground">{status}</p>
                )}
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="wants-drink"
                      checked={wantsDrink}
                      onCheckedChange={(checked) => {
                        setWantsDrink(checked);
                        handleUpdateCheckIn({ wantsDrink: checked });
                      }}
                    />
                    <Label htmlFor="wants-drink" className="text-sm">
                      Want a drink
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="buying-drinks"
                      checked={buyingDrinks}
                      onCheckedChange={(checked) => {
                        setBuyingDrinks(checked);
                        handleUpdateCheckIn({ buyingDrinks: checked });
                      }}
                    />
                    <Label htmlFor="buying-drinks" className="text-sm">
                      Buying drinks
                    </Label>
                  </div>
                </div>
                <Button
                  onClick={handleCheckOut}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {loading ? "Checking out..." : "Check Out"}
                </Button>
              </div>
            )}
          </div>

          {/* People List with Breakdown */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">People Here Now</h3>
                <Badge variant="secondary">{breakdown?.totalUsers || venueCheckIns.length}</Badge>
              </div>
              {breakdown && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{breakdown.wantsDrinkCount} want drinks</span>
                  <span>{breakdown.buyingDrinksCount} buying drinks</span>
                </div>
              )}
            </div>

            <Tabs defaultValue="all" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2 grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="individuals">
                  <UserCircle className="w-4 h-4 mr-1" />
                  Solo
                </TabsTrigger>
                <TabsTrigger value="groups">
                  <Users className="w-4 h-4 mr-1" />
                  Groups
                </TabsTrigger>
                <TabsTrigger value="discover">
                  <Compass className="w-4 h-4 mr-1" />
                  Discover
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 mt-2">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-3">
                    {venueCheckIns.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No one checked in yet</p>
                      </div>
                    ) : (
                      venueCheckIns.map((checkIn) => (
                        <div
                          key={checkIn.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={checkIn.user.avatar}
                              alt={checkIn.user.name}
                            />
                            <AvatarFallback>
                              {checkIn.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{checkIn.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {checkIn.user.username}
                            </p>
                            {checkIn.status && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {checkIn.status}
                              </p>
                            )}
                            <div className="flex gap-2 mt-1">
                              {checkIn.wantsDrink && (
                                <Badge variant="outline" className="text-xs">Wants drink</Badge>
                              )}
                              {checkIn.buyingDrinks && (
                                <Badge variant="outline" className="text-xs">Buying drinks</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onSendOffer(checkIn.user, venue || undefined)}
                          >
                            Send Treat
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="individuals" className="flex-1 mt-2">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-3">
                    {(!breakdown || breakdown.individuals.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No individuals here</p>
                      </div>
                    ) : (
                      breakdown.individuals.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <div className="flex gap-2 mt-1">
                              {user.wantsDrink && (
                                <Badge variant="outline" className="text-xs">Wants drink</Badge>
                              )}
                              {user.buyingDrinks && (
                                <Badge variant="outline" className="text-xs">Buying drinks</Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => onSendOffer(user, venue || undefined)}>
                            Send Treat
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="groups" className="flex-1 mt-2">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-4">
                    {(!breakdown || breakdown.groups.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No groups here</p>
                      </div>
                    ) : (
                      breakdown.groups.map((group: any) => (
                        <div key={group.groupId} className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-primary" />
                            <h4 className="font-medium">{group.groupName}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {group.members.map((member: any) => (
                              <div
                                key={member.id}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.avatar} alt={member.name} />
                                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">@{member.username}</p>
                                  <div className="flex gap-1 mt-1">
                                    {member.wantsDrink && (
                                      <Badge variant="outline" className="text-xs">Wants drink</Badge>
                                    )}
                                    {member.buyingDrinks && (
                                      <Badge variant="outline" className="text-xs">Buying drinks</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onSendOffer(member, venue || undefined)}
                                >
                                  Send
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="discover" className="flex-1 mt-0">
                {venue && (
                  <UserDiscovery
                    venueId={venue.id}
                    venueName={venue.name}
                    onSelectUser={(user) => onSelectUser?.(user)}
                    onSendOffer={(user) => onSendOffer(user, venue)}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
