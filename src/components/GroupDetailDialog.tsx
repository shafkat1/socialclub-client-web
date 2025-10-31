import { useState, useEffect } from "react";
import { Users, UserPlus, UserMinus, MapPin, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
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
import { Group, Friend } from "../types";
import { api } from "../utils/api";
import { Checkbox } from "./ui/checkbox";

interface GroupDetailDialogProps {
  group: Group;
  onClose: () => void;
  onUpdate: () => void;
}

export function GroupDetailDialog({ group, onClose, onUpdate }: GroupDetailDialogProps) {
  const [groupDetails, setGroupDetails] = useState<Group>(group);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroupDetails();
  }, [group.id]);

  useEffect(() => {
    if (showAddMembers) {
      loadFriends();
    }
  }, [showAddMembers]);

  const loadGroupDetails = async () => {
    try {
      const details = await api.getGroupDetails(group.id);
      setGroupDetails(details);
    } catch (error) {
      console.error("Error loading group details:", error);
      toast.error("Failed to load group details");
    }
  };

  const loadFriends = async () => {
    try {
      const friendsList = await api.getFriends();
      // Filter out friends who are already members
      const memberIds = groupDetails.members.map((m) => m.userId);
      const availableFriends = friendsList.filter((f) => !memberIds.includes(f.userId));
      setFriends(availableFriends);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast.error("Failed to load friends");
    }
  };

  const toggleFriend = (friendId: string) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else {
      newSelection.add(friendId);
    }
    setSelectedFriends(newSelection);
  };

  const addMembers = async () => {
    if (selectedFriends.size === 0) {
      toast.error("Please select at least one friend");
      return;
    }

    setLoading(true);
    try {
      // Add each selected friend to the group
      for (const friendId of selectedFriends) {
        await api.addGroupMember(group.id, friendId);
      }
      toast.success("Members added!");
      setShowAddMembers(false);
      setSelectedFriends(new Set());
      loadGroupDetails();
      onUpdate();
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error("Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await api.removeGroupMember(group.id, memberId);
      toast.success("Member removed");
      setRemovingMember(null);
      loadGroupDetails();
      onUpdate();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const leaveGroup = async () => {
    try {
      const currentUserId = localStorage.getItem("userId");
      if (currentUserId) {
        await api.removeGroupMember(group.id, currentUserId);
        toast.success("Left group");
        onClose();
        onUpdate();
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
    }
  };

  const isCreator = localStorage.getItem("userId") === groupDetails.createdBy;

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {groupDetails.name}
            </DialogTitle>
            <DialogDescription>
              {groupDetails.members.length} members
              {isCreator && " • You're the creator"}
            </DialogDescription>
          </DialogHeader>

          {!showAddMembers ? (
            <>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3 pb-4">
                  {groupDetails.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-start justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          {member.online && (
                            <Circle className="w-3 h-3 absolute bottom-0 right-0 fill-green-500 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p>{member.name}</p>
                            {member.userId === groupDetails.createdBy && (
                              <Badge variant="secondary" className="text-xs">Creator</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{member.username}</p>
                          {member.currentVenue && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-blue-600">
                              <MapPin className="w-3 h-3" />
                              <span>{member.currentVenue.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {isCreator && member.userId !== groupDetails.createdBy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovingMember(member.userId)}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t">
                {isCreator && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddMembers(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Members
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={leaveGroup}>
                  Leave Group
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm mb-2">Select friends to add ({selectedFriends.size} selected)</p>
                <ScrollArea className="h-64 border rounded-md">
                  {friends.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No friends available to add
                    </div>
                  ) : (
                    <div className="p-2">
                      {friends.map((friend) => (
                        <div
                          key={friend.userId}
                          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                          onClick={() => toggleFriend(friend.userId)}
                        >
                          <Checkbox
                            checked={selectedFriends.has(friend.userId)}
                            onCheckedChange={() => toggleFriend(friend.userId)}
                          />
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">{friend.name}</p>
                            <p className="text-xs text-muted-foreground">@{friend.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedFriends(new Set());
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={addMembers} disabled={loading}>
                  {loading ? "Adding..." : "Add Members"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removingMember && removeMember(removingMember)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
