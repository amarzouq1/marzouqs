export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-cobalt/20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-cobalt animate-spin"
            style={{ animationDuration: '0.7s' }}
          />
        </div>
        <div className="text-sm text-white/40 font-medium tracking-wider uppercase">
          Loading
        </div>
      </div>
    </div>
  );
}
