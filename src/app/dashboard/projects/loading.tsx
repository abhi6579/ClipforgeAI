import { SkeletonRows } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-52 rounded-2xl" />
        ))}
      </div>
      <SkeletonRows rows={1} />
    </div>
  );
}
