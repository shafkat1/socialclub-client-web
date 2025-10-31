import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";
import { seedVenues } from "../utils/seedData";
import { Database } from "lucide-react";

export function DemoModeButton() {
  const [loading, setLoading] = useState(false);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedVenues();
      toast.success("Demo data seeded successfully! Refresh the page to see venues.");
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Failed to seed demo data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSeedData}
      disabled={loading}
      className="fixed bottom-4 right-4 z-50"
    >
      <Database className="h-4 w-4 mr-2" />
      {loading ? "Seeding..." : "Seed Demo Venues"}
    </Button>
  );
}
