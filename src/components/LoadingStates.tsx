import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function UserCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-modern">
      <Skeleton className="h-36 w-full bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-5 -mt-16">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
        <div className="space-y-3">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </Card>
  );
}

export function OfferCardSkeleton() {
  return (
    <Card className="p-5 border-0 shadow-modern">
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
      <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function VenueSkeleton() {
  return (
    <Card className="p-4 border-0 shadow-modern">
      <div className="flex gap-3">
        <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProfileSkeleton() {
  return (
    <Card className="p-8 border-0 shadow-modern-xl bg-white">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="h-40 w-40 rounded-full mb-6" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32 mb-6" />
        <Skeleton className="h-16 w-full max-w-md mb-6" />
        
        <div className="flex gap-8 mb-8">
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-24" />
          ))}
        </div>

        <Skeleton className="h-10 w-full max-w-xs" />
      </div>
    </Card>
  );
}

export function MapSkeleton() {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}

interface LoadingGridProps {
  count?: number;
  type: "user" | "offer" | "conversation" | "venue";
}

export function LoadingGrid({ count = 6, type }: LoadingGridProps) {
  const components = {
    user: UserCardSkeleton,
    offer: OfferCardSkeleton,
    conversation: ConversationSkeleton,
    venue: VenueSkeleton,
  };

  const Component = components[type];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
