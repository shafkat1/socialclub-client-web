import { useState, useEffect } from "react";
import { Users, UserPlus, UserMinus, Ban, Search, MapPin, Circle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { Friend, FriendRequest } from "../types";
import { api } from "../utils/api";

interface FriendsViewProps {
  onClose: () => void;
}

export function FriendsView({ onClose }: FriendsViewProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriends = async () => {
    try {
      const friendsList = await api.getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const requestsList = await api.getFriendRequests("received");
      setRequests(requestsList);
    } catch (error) {
      console.error("Error loading friend requests:", error);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;

    setSearching(true);
    try {
      const results = await api.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId);
      toast.success("Friend request sent!");
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to send friend request");
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      toast.success("Friend request accepted!");
      loadRequests();
      loadFriends();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId);
      toast.success("Friend request rejected");
      loadRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject friend request");
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await api.removeFriend(friendId);
      toast.success("Friend removed");
      setRemovingFriend(null);
      loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const blockUser = async (userId: string) => {
    try {
      await api.blockUser(userId);
      toast.success("User blocked");
      loadFriends();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by username or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {searchResults.length > 0 && (
          <Card className="mt-2 absolute z-10 w-[calc(100%-2rem)]">
            <ScrollArea className="max-h-64">
              {searchResults.map((user) => (
                <div
                  key={user.userId}
                  className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{user.name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  {user.isFriend ? (
                    <Badge variant="secondary">Friends</Badge>
                  ) : (
                    <Button size="sm" onClick={() => sendFriendRequest(user.userId)}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </ScrollArea>
          </Card>
        )}
      </div>

      <Tabs defaultValue="friends" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests {requests.length > 0 && `(${requests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="flex-1 mt-0">
          <ScrollArea className="h-full px-4">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : friends.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm mt-1">Search above to add friends</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                {friends.map((friend) => (
                  <Card key={friend.userId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback>{friend.name[0]}</AvatarFallback>
                            </Avatar>
                            {friend.online && (
                              <Circle className="w-3 h-3 absolute bottom-0 right-0 fill-green-500 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p>{friend.name}</p>
                            <p className="text-sm text-muted-foreground">@{friend.username}</p>
                            {friend.bio && (
                              <p className="text-sm text-muted-foreground mt-1">{friend.bio}</p>
                            )}
                            {friend.currentVenue && (
                              <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                                <MapPin className="w-3 h-3" />
                                <span>At {friend.currentVenue.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemovingFriend(friend.userId)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => blockUser(friend.userId)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 mt-0">
          <ScrollArea className="h-full px-4">
            {requests.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.senderAvatar} />
                            <AvatarFallback>{request.senderName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p>{request.senderName}</p>
                            <p className="text-sm text-muted-foreground">
                              @{request.senderUsername}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => acceptRequest(request.id)}>
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectRequest(request.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!removingFriend} onOpenChange={() => setRemovingFriend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? You can always send them another friend
              request later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removingFriend && removeFriend(removingFriend)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
