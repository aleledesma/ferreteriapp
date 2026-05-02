import { Skeleton } from "@/components/ui/skeleton"

export function ProductsTableSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  )
}
