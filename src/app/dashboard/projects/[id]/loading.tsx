export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-12 w-2/3 rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
      <div className="skeleton h-32 rounded-2xl" />
    </div>
  );
}
