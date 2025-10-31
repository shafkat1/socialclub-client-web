import { Map, Users, Gift, MessageCircle, User, Settings, UserCircle, UsersRound } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadOffersCount?: number;
  unreadMessagesCount?: number;
}

export function Navigation({ activeTab, onTabChange, unreadOffersCount = 0, unreadMessagesCount = 0 }: NavigationProps) {
  const navItems = [
    { id: "map", icon: Map, label: "Map" },
    { id: "discover", icon: Users, label: "Discover" },
    { id: "friends", icon: UserCircle, label: "Friends" },
    { id: "groups", icon: UsersRound, label: "Groups" },
    { id: "offers", icon: Gift, label: "Offers", badge: unreadOffersCount },
    { id: "messages", icon: MessageCircle, label: "Messages", badge: unreadMessagesCount },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="sticky top-0 h-screen p-5 border-r border-gray-200 bg-white/80 backdrop-blur-xl flex flex-col">
      <div className="mb-10 px-1">
        <h1 className="text-2xl font-bold gradient-text mb-1">TreatMe</h1>
        <p className="text-xs text-gray-500">Connect over drinks</p>
      </div>
      
      <div className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start transition-all duration-200 ${
                isActive 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md" 
                  : "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700"
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={`h-5 w-5 mr-3 ${isActive ? "text-white" : "text-gray-600"}`} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge 
                  className={`ml-auto ${
                    isActive 
                      ? "bg-white/20 text-white hover:bg-white/30" 
                      : "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                  }`}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <Button 
        variant="ghost" 
        className="w-full justify-start text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-700"
      >
        <Settings className="h-5 w-5 mr-3" />
        <span className="font-medium">Settings</span>
      </Button>
    </nav>
  );
}
