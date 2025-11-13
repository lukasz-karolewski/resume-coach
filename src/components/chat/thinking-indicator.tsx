export function ThinkingIndicator({ tool }: { tool?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <span className="animate-bounce delay-0">●</span>
        <span className="animate-bounce delay-100">●</span>
        <span className="animate-bounce delay-200">●</span>
      </div>
      {tool && <span>Using {tool}...</span>}
    </div>
  );
}
