import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Calendar,
  RefreshCw,
  TrendingUp,
  ShieldAlert
} from "lucide-react";

interface DrinkLimitsCardProps {
  userId?: string;
  compact?: boolean;
}

export function DrinkLimitsCard({ userId, compact = false }: DrinkLimitsCardProps) {
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLimits();
  }, [userId]);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const data = await api.getDrinkLimits(userId);
      setLimits(data.limits);
    } catch (error) {
      console.error("Error loading drink limits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) {
    return null;
  }

  const MAX_HOURLY = 3;
  const MAX_DAILY = 5;
  
  const hourlyPercent = (limits.hourlyCount / MAX_HOURLY) * 100;
  const dailyPercent = (limits.dailyCount / MAX_DAILY) * 100;
  
  const getHourlyStatus = () => {
    if (limits.hourlyCount >= MAX_HOURLY) return "danger";
    if (limits.hourlyCount >= MAX_HOURLY - 1) return "warning";
    return "safe";
  };
  
  const getDailyStatus = () => {
    if (limits.dailyCount >= MAX_DAILY) return "danger";
    if (limits.dailyCount >= MAX_DAILY - 2) return "warning";
    return "safe";
  };

  const hourlyStatus = getHourlyStatus();
  const dailyStatus = getDailyStatus();

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Drink Limits</h4>
            <Button variant="ghost" size="sm" onClick={loadLimits}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Hourly
                </span>
                <span className="text-xs font-medium">
                  {limits.hourlyCount}/{MAX_HOURLY}
                </span>
              </div>
              <Progress 
                value={hourlyPercent} 
                className={`h-2 ${
                  hourlyStatus === "danger" ? "bg-red-100" : 
                  hourlyStatus === "warning" ? "bg-yellow-100" : ""
                }`}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Daily
                </span>
                <span className="text-xs font-medium">
                  {limits.dailyCount}/{MAX_DAILY}
                </span>
              </div>
              <Progress 
                value={dailyPercent} 
                className={`h-2 ${
                  dailyStatus === "danger" ? "bg-red-100" : 
                  dailyStatus === "warning" ? "bg-yellow-100" : ""
                }`}
              />
            </div>
          </div>

          {limits.suspended && (
            <Alert variant="destructive" className="mt-3">
              <ShieldAlert className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Account suspended until {new Date(limits.suspendedUntil).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Drink Limits & Safety</CardTitle>
            <CardDescription>Monitor your responsible drinking</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadLimits}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Suspended Alert */}
        {limits.suspended && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              <strong>Account Suspended</strong>
              <p className="text-sm mt-1">
                Your account is suspended until{" "}
                {new Date(limits.suspendedUntil).toLocaleString()} due to multiple 
                violations of drink limits. This is for your safety.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Hourly Limit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Hourly Limit</span>
            </div>
            <Badge 
              variant={
                hourlyStatus === "danger" ? "destructive" : 
                hourlyStatus === "warning" ? "secondary" : 
                "outline"
              }
            >
              {limits.hourlyCount} / {MAX_HOURLY}
            </Badge>
          </div>
          
          <Progress 
            value={hourlyPercent} 
            className={`h-3 ${
              hourlyStatus === "danger" ? "[&>div]:bg-red-500" : 
              hourlyStatus === "warning" ? "[&>div]:bg-yellow-500" : 
              "[&>div]:bg-green-500"
            }`}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            {hourlyStatus === "danger" ? (
              "⚠️ Maximum hourly limit reached. Please wait before accepting more drinks."
            ) : hourlyStatus === "warning" ? (
              "⚠️ Approaching hourly limit. Drink responsibly."
            ) : (
              `✓ ${MAX_HOURLY - limits.hourlyCount} drinks remaining this hour`
            )}
          </p>
        </div>

        {/* Daily Limit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Daily Limit</span>
            </div>
            <Badge 
              variant={
                dailyStatus === "danger" ? "destructive" : 
                dailyStatus === "warning" ? "secondary" : 
                "outline"
              }
            >
              {limits.dailyCount} / {MAX_DAILY}
            </Badge>
          </div>
          
          <Progress 
            value={dailyPercent} 
            className={`h-3 ${
              dailyStatus === "danger" ? "[&>div]:bg-red-500" : 
              dailyStatus === "warning" ? "[&>div]:bg-yellow-500" : 
              "[&>div]:bg-green-500"
            }`}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            {dailyStatus === "danger" ? (
              "⚠️ Maximum daily limit reached. Come back tomorrow!"
            ) : dailyStatus === "warning" ? (
              "⚠️ Approaching daily limit. Drink responsibly."
            ) : (
              `✓ ${MAX_DAILY - limits.dailyCount} drinks remaining today`
            )}
          </p>
        </div>

        {/* Violations */}
        {limits.violations > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Violations</span>
            </div>
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                You have {limits.violations} violation{limits.violations !== 1 ? 's' : ''}.
                {limits.violations >= 5 ? (
                  " Your account will be suspended after 5 violations within 7 days."
                ) : (
                  ` ${5 - limits.violations} more violation${5 - limits.violations !== 1 ? 's' : ''} will result in account suspension.`
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Last Drink */}
        {limits.lastDrinkTime && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last drink accepted:</span>
              <span className="font-medium">
                {new Date(limits.lastDrinkTime).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Safety Message */}
        {!limits.suspended && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-sm">
              These limits are in place for your safety and to promote responsible drinking.
              Please drink water between alcoholic beverages and never drink and drive.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
