import { User } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Heart } from "lucide-react";

interface UserCardProps {
  user: User;
  onSendOffer: (user: User) => void;
}

export function UserCard({ user, onSendOffer }: UserCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-modern-xl transition-all duration-300 border-0 shadow-modern">
      <div className="h-36 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 animate-gradient bg-[length:200%_200%]" />
      </div>
      <div className="p-5 -mt-16">
        <div className="flex justify-between items-start mb-4">
          <div className="relative">
            <Avatar className="h-28 w-28 border-[3px] border-white shadow-modern-lg ring-2 ring-indigo-100">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {user.online && (
              <div className="absolute bottom-2 right-2 h-5 w-5 bg-emerald-500 border-[3px] border-white rounded-full shadow-lg">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full mt-16 bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all duration-200 shadow-modern"
          >
            <Heart className="h-4 w-4 text-rose-500" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>

          {user.age && user.location && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="font-medium">{user.age}</span> years
              </span>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                <span>{user.location}</span>
              </div>
            </div>
          )}

          {user.bio && (
            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{user.bio}</p>
          )}

          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {user.interests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-100 hover:from-indigo-100 hover:to-purple-100 transition-colors">
                  {interest}
                </Badge>
              ))}
              {user.interests.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  +{user.interests.length - 3}
                </Badge>
              )}
            </div>
          )}

          <Button 
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]" 
            onClick={() => onSendOffer(user)}
          >
            <span className="mr-2">🍺</span>
            Buy a Drink
          </Button>
        </div>
      </div>
    </Card>
  );
}
