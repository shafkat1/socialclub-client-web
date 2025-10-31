import { useState, useEffect } from "react";
import { User, DiscoveryFilters } from "../types";
import { api } from "../utils/api";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { 
  Filter, 
  Star, 
  MapPin, 
  Users, 
  UserCircle,
  CheckCircle2,
  Gift,
  Heart
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface UserDiscoveryProps {
  venueId: string;
  venueName: string;
  onSelectUser: (user: User) => void;
  onSendOffer?: (user: User) => void;
}

export function UserDiscovery({ 
  venueId, 
  venueName, 
  onSelectUser,
  onSendOffer 
}: UserDiscoveryProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DiscoveryFilters>({
    sortBy: "just-arrived",
    status: "all",
  });

  useEffect(() => {
    loadUsers();
  }, [venueId, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filters.gender && filters.gender.length > 0) {
        params.gender = filters.gender.join(",");
      }
      if (filters.ageRange) {
        params.ageMin = filters.ageRange.min;
        params.ageMax = filters.ageRange.max;
      }
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
      }

      const data = await api.getUsersAtVenue(venueId, params);
      setUsers(data.users);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleGenderFilter = (gender: string, checked: boolean) => {
    setFilters(prev => {
      const currentGender = prev.gender || [];
      if (checked) {
        return { ...prev, gender: [...currentGender, gender] };
      } else {
        return { ...prev, gender: currentGender.filter(g => g !== gender) };
      }
    });
  };

  const handleAgeRangeFilter = (range: string) => {
    if (range === "all") {
      setFilters(prev => ({ ...prev, ageRange: undefined }));
    } else if (range === "18-25") {
      setFilters(prev => ({ ...prev, ageRange: { min: 18, max: 25 } }));
    } else if (range === "26-35") {
      setFilters(prev => ({ ...prev, ageRange: { min: 26, max: 35 } }));
    } else if (range === "36+") {
      setFilters(prev => ({ ...prev, ageRange: { min: 36, max: 100 } }));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg">People at {venueName}</h2>
            <p className="text-sm text-gray-600">{users.length} people nearby</p>
          </div>

          {/* Filters Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Users</SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Gender Filter */}
                <div>
                  <Label className="mb-3 block">Gender</Label>
                  <div className="space-y-2">
                    {["male", "female", "non-binary", "other"].map((gender) => (
                      <div key={gender} className="flex items-center space-x-2">
                        <Checkbox
                          id={gender}
                          checked={filters.gender?.includes(gender)}
                          onCheckedChange={(checked) =>
                            handleGenderFilter(gender, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={gender}
                          className="text-sm capitalize cursor-pointer"
                        >
                          {gender}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Age Range Filter */}
                <div>
                  <Label className="mb-3 block">Age Range</Label>
                  <Select
                    value={
                      !filters.ageRange
                        ? "all"
                        : filters.ageRange.min === 18 && filters.ageRange.max === 25
                        ? "18-25"
                        : filters.ageRange.min === 26 && filters.ageRange.max === 35
                        ? "26-35"
                        : "36+"
                    }
                    onValueChange={handleAgeRangeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="18-25">18-25</SelectItem>
                      <SelectItem value="26-35">26-35</SelectItem>
                      <SelectItem value="36+">36+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className="mb-3 block">Status</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, status: value as any }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="alone">Solo</SelectItem>
                      <SelectItem value="in-group">In a Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <Label className="mb-3 block">Sort By</Label>
                  <Select
                    value={filters.sortBy || "just-arrived"}
                    onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, sortBy: value as any }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="just-arrived">Just Arrived</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="high-rating">High Rating</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setFilters({ sortBy: "just-arrived", status: "all" });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={filters.status === "all" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filters.status === "alone" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "alone" }))}
          >
            <UserCircle className="h-4 w-4 mr-1" />
            Solo
          </Button>
          <Button
            size="sm"
            variant={filters.status === "in-group" ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, status: "in-group" }))}
          >
            <Users className="h-4 w-4 mr-1" />
            Groups
          </Button>
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <UserCircle className="h-16 w-16 mb-4 opacity-50" />
            <p>No users found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {users.map((user) => (
              <Card 
                key={user.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectUser(user)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{user.name}</span>
                        {user.age && (
                          <span className="text-gray-600">{user.age}</span>
                        )}
                        {user.verificationBadges?.ageVerified && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        {user.stats?.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span>{user.stats.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {user.stats?.drinksGiven > 0 && (
                          <div className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            <span>{user.stats.drinksGiven} given</span>
                          </div>
                        )}
                      </div>

                      {/* Bio Preview */}
                      {user.bio && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                          {user.bio}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1">
                        {(user as any).wantsDrink && (
                          <Badge variant="secondary" className="text-xs">
                            <Heart className="h-3 w-3 mr-1" />
                            Looking for drinks
                          </Badge>
                        )}
                        {(user as any).buyingDrinks && (
                          <Badge variant="secondary" className="text-xs">
                            <Gift className="h-3 w-3 mr-1" />
                            Buying drinks
                          </Badge>
                        )}
                        {user.lookingFor && (
                          <Badge variant="outline" className="text-xs">
                            {user.lookingFor === "friendship" && "Friendship"}
                            {user.lookingFor === "dating" && "Dating"}
                            {user.lookingFor === "both" && "Both"}
                            {user.lookingFor === "just-social" && "Social"}
                          </Badge>
                        )}
                        {user.preferredDrinks && user.preferredDrinks.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {user.preferredDrinks[0]}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {onSendOffer && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendOffer(user);
                          }}
                        >
                          <Gift className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
