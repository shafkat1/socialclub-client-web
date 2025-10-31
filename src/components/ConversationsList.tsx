import { Conversation } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface ConversationsListProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationsList({ conversations, onSelectConversation }: ConversationsListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="font-medium mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          When someone accepts your offer, you can start chatting!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conversation.user.avatar} alt={conversation.user.name} />
                  <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {conversation.user.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{conversation.user.name}</p>
                  {conversation.lastMessage && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                
                {conversation.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage.content}
                  </p>
                )}
              </div>

              {conversation.unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
