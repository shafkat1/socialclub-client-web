import { useState, useEffect } from "react";
import { User, MenuItem, Venue } from "../types";
import { api } from "../utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Beer, 
  Wine, 
  Martini, 
  Coffee,
  AlertTriangle,
  Gift,
  Eye,
  EyeOff,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface DrinkMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  venue: Venue;
  onSuccess?: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  beer: Beer,
  wine: Wine,
  cocktail: Martini,
  spirits: Martini,
  shots: Martini,
  "non-alcoholic": Coffee,
};

const PRESET_MESSAGES = [
  "On me! 🍻",
  "Cheers! 🥂",
  "Enjoy! 😊",
  "Let's connect!",
  "Happy hour! 🎉",
  "Nice to meet you!",
];

export function DrinkMenuDialog({ 
  open, 
  onOpenChange, 
  user, 
  venue,
  onSuccess 
}: DrinkMenuDialogProps) {
  const [drinks, setDrinks] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | null>(null);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  useEffect(() => {
    if (open && venue) {
      loadDrinkMenu();
      checkEligibility();
    }
  }, [open, venue?.id]);

  const loadDrinkMenu = async () => {
    try {
      setLoading(true);
      const data = await api.getVenueDrinkMenu(venue.id);
      setDrinks(data.drinks || []);
    } catch (error) {
      console.error("Error loading drink menu:", error);
      toast.error("Failed to load drink menu");
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const data = await api.checkDrinkEligibility(user.id);
      setEligibility(data);
    } catch (error) {
      console.error("Error checking eligibility:", error);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSendDrink = async () => {
    if (!selectedDrink) return;

    try {
      setSending(true);
      await api.createDrinkOffer({
        receiverId: user.id,
        drinkId: selectedDrink.id,
        message,
        venueId: venue.id,
        anonymous,
        paymentMethod: "card", // In real app, would have payment selection
      });

      toast.success(`Drink sent to ${user.name}!`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset form
      setSelectedDrink(null);
      setMessage("");
      setAnonymous(false);
    } catch (error: any) {
      console.error("Error sending drink:", error);
      toast.error(error.message || "Failed to send drink");
    } finally {
      setSending(false);
    }
  };

  const groupedDrinks = drinks.reduce((acc, drink) => {
    const category = drink.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(drink);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(groupedDrinks);

  if (checkingEligibility) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Drink Menu</DialogTitle>
            <DialogDescription>Checking eligibility and loading menu...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Send a Drink to {user.name}</DialogTitle>
          <DialogDescription>
            Choose a drink from {venue.name}'s menu
          </DialogDescription>
        </DialogHeader>

        {!eligibility?.eligible && (
          <Alert variant="destructive" className="mx-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {eligibility?.reason || "This user cannot receive drinks at this time"}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {!selectedDrink ? (
            <ScrollArea className="flex-1 px-6">
              <Tabs defaultValue={categories[0]} className="w-full">
                <TabsList className="mb-4 flex-wrap h-auto">
                  {categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category] || Coffee;
                    return (
                      <TabsTrigger key={category} value={category} className="gap-2">
                        <Icon className="h-4 w-4" />
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="space-y-3">
                    {groupedDrinks[category].map((drink) => {
                      const markup = 0.1;
                      const totalPrice = drink.price * (1 + markup);
                      
                      return (
                        <Card 
                          key={drink.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setSelectedDrink(drink)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="text-3xl">{drink.emoji}</div>
                                <div>
                                  <h4 className="font-medium">{drink.name}</h4>
                                  {drink.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {drink.description}
                                    </p>
                                  )}
                                  {drink.size && (
                                    <Badge variant="outline" className="mt-2">
                                      {drink.size}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${totalPrice.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${drink.price.toFixed(2)} + 10% fee
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </TabsContent>
                ))}
              </Tabs>
            </ScrollArea>
          ) : (
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6">
                {/* Selected Drink Summary */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{selectedDrink.emoji}</div>
                        <div>
                          <h3 className="font-medium">{selectedDrink.name}</h3>
                          {selectedDrink.size && (
                            <p className="text-sm text-muted-foreground">{selectedDrink.size}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(selectedDrink.price * 1.1).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${selectedDrink.price.toFixed(2)} + 10% fee
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Message */}
                <div className="space-y-3">
                  <Label>Add a message (optional)</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_MESSAGES.map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage(preset)}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Say something nice..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {anonymous ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <div>
                      <Label>Send anonymously</Label>
                      <p className="text-sm text-muted-foreground">
                        Your identity will be revealed when they accept
                      </p>
                    </div>
                  </div>
                  <Switch checked={anonymous} onCheckedChange={setAnonymous} />
                </div>

                {/* Payment Method */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="h-5 w-5" />
                    <Label>Payment Method</Label>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Credit Card ending in 4242</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You'll be charged when the drink is accepted
                  </p>
                </div>

                {/* Summary */}
                <Card className="bg-muted">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Drink price</span>
                      <span>${selectedDrink.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Platform fee (10%)</span>
                      <span>${(selectedDrink.price * 0.1).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${(selectedDrink.price * 1.1).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t p-6 flex gap-3">
          {selectedDrink ? (
            <>
              <Button
                variant="outline"
                onClick={() => setSelectedDrink(null)}
                className="flex-1"
              >
                Back to Menu
              </Button>
              <Button
                onClick={handleSendDrink}
                disabled={sending || !eligibility?.eligible}
                className="flex-1"
              >
                <Gift className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Drink"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
