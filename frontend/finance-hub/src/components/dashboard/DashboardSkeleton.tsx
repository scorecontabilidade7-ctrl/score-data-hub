import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-6 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-7 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </Card>
        <Card className="p-6 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </Card>
      </div>
      <Card className="p-6 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    </div>
  );
}
