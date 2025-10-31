import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner@2.0.3";
import { Friend } from "../types";
import { api } from "../utils/api";

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export function CreateGroupDialog({ open, onClose, onGroupCreated }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadFriends();
      setGroupName("");
      setSelectedFriends(new Set());
    }
  }, [open]);

  const loadFriends = async () => {
    try {
      const friendsList = await api.getFriends();
      setFriends(friendsList);
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

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedFriends.size === 0) {
      toast.error("Please select at least one friend");
      return;
    }

    setLoading(true);
    try {
      await api.createGroup(groupName.trim(), Array.from(selectedFriends));
      toast.success("Group created!");
      onGroupCreated();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Group
          </DialogTitle>
          <DialogDescription>
            Create a group with your friends to stay connected and chat together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="e.g., College Friends, Work Crew"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Select Friends ({selectedFriends.size} selected)</Label>
            <ScrollArea className="h-64 border rounded-md mt-1">
              {friends.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No friends to add yet
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

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
