import { useState, useEffect } from "react";
import { Users, Plus, MessageCircle, MapPin, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner@2.0.3";
import { Group } from "../types";
import { api } from "../utils/api";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupDetailDialog } from "./GroupDetailDialog";
import { GroupChatDialog } from "./GroupChatDialog";

interface GroupsViewProps {
  onClose: () => void;
}

export function GroupsView({ onClose }: GroupsViewProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [chatGroup, setChatGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const groupsList = await api.getGroups();
      setGroups(groupsList);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = () => {
    setShowCreateDialog(false);
    loadGroups();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Groups
          </h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Group
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No groups yet</p>
            <p className="text-sm mt-1">Create a group to get started</p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3>{group.name}</h3>
                        <Badge variant="secondary">{group.members.length} members</Badge>
                      </div>

                      {group.currentVenue && (
                        <div className="flex items-center gap-1 mb-2 text-sm text-blue-600">
                          <MapPin className="w-3 h-3" />
                          <span>At {group.currentVenue.name}</span>
                        </div>
                      )}

                      <div className="flex -space-x-2 mb-3">
                        {group.members.slice(0, 5).map((member) => (
                          <Avatar key={member.userId} className="border-2 border-background w-8 h-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                        {group.members.length > 5 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{group.members.length - 5}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChatGroup(group)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGroup(group)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <CreateGroupDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onGroupCreated={handleGroupCreated}
      />

      {selectedGroup && (
        <GroupDetailDialog
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onUpdate={loadGroups}
        />
      )}

      {chatGroup && (
        <GroupChatDialog
          group={chatGroup}
          onClose={() => setChatGroup(null)}
        />
      )}
    </div>
  );
}
