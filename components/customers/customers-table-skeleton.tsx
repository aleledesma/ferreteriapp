import { Skeleton } from "@/components/ui/skeleton"

export function CustomersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
      <div className="space-y-4 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-4 rounded-lg border border-border/50 p-4 md:grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr_1fr]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}