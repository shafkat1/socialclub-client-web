import { Offer } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, X, MessageCircle, QrCode, Ticket } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface OfferCardProps {
  offer: Offer;
  type: "received" | "sent";
  onAccept?: (offerId: string) => void;
  onDecline?: (offerId: string) => void;
  onOpenChat?: (offerId: string) => void;
  onViewRedemption?: (offer: Offer) => void;
}

export function OfferCard({ offer, type, onAccept, onDecline, onOpenChat, onViewRedemption }: OfferCardProps) {
  const user = type === "received" ? offer.sender : offer.receiver;
  const isPending = offer.status === "pending";
  const isAccepted = offer.status === "accepted";
  const isRedeemed = offer.status === "redeemed";
  const isExpired = offer.status === "expired";

  return (
    <Card className="p-5 shadow-modern hover:shadow-modern-lg transition-all duration-300 border-0">
      <div className="flex gap-4">
        {/* Item Image */}
        <div className="flex-shrink-0">
          {offer.item.image ? (
            <ImageWithFallback
              src={offer.item.image}
              alt={offer.item.name}
              className="h-24 w-24 rounded-xl object-cover shadow-md ring-2 ring-gray-100"
            />
          ) : (
            <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-5xl shadow-md">
              {offer.item.emoji}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-indigo-100">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{offer.timestamp}</p>
              </div>
            </div>
            <Badge
              className={`${
                offer.status === "accepted" || offer.status === "redeemed"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                  : offer.status === "declined" || offer.status === "expired"
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
              }`}
              variant="default"
            >
              {offer.status === "redeemed" ? "✓ Redeemed" : offer.status}
            </Badge>
          </div>

          <div className="mb-3">
            <p className="font-medium text-gray-900">
              {type === "received" ? "Wants to buy you" : "You offered"} {offer.item.name}
            </p>
            <p className="text-sm font-semibold text-indigo-600">${offer.item.price}</p>
          </div>

          {offer.message && (
            <p className="text-sm bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 p-3 rounded-lg mb-3 border border-indigo-100">{offer.message}</p>
          )}

          {/* Actions */}
          {type === "received" && isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md"
                onClick={() => onAccept?.(offer.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-100"
                onClick={() => onDecline?.(offer.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}

          {type === "sent" && isPending && (
            <p className="text-sm text-muted-foreground">Waiting for response...</p>
          )}

          {(isAccepted || isRedeemed) && (
            <div className="flex gap-2">
              {type === "received" && !isRedeemed && (
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
                  onClick={() => onViewRedemption?.(offer)}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  View Code
                </Button>
              )}
              <Button
                size="sm"
                variant={isRedeemed ? "default" : "outline"}
                className={`flex-1 ${isRedeemed ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md" : "border-indigo-200 hover:bg-indigo-50"}`}
                onClick={() => onOpenChat?.(offer.id)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {isRedeemed ? "Chat" : "Message"}
              </Button>
            </div>
          )}

          {isExpired && (
            <p className="text-sm text-destructive">This offer has expired</p>
          )}
        </div>
      </div>
    </Card>
  );
}
