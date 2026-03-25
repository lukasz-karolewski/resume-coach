type PageLoadingVariant = "cards" | "document" | "panel";

function LoadingBlock({
  className,
  testId,
}: {
  className: string;
  testId?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted ${className}`}
      data-testid={testId}
    />
  );
}

export default function PageLoading({
  variant = "panel",
}: {
  variant?: PageLoadingVariant;
}) {
  if (variant === "cards") {
    return (
      <div
        className="mx-auto flex max-w-6xl flex-col gap-8"
        data-testid="page-loading-cards"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <LoadingBlock className="h-8 w-56 rounded-md" />
            <LoadingBlock className="h-4 w-80 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <LoadingBlock className="h-9 w-36 rounded-full" />
            <LoadingBlock className="h-9 w-40 rounded-full" />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`resume-loading-card-${index}`}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <LoadingBlock className="h-6 w-3/4 rounded-md" />
                  <LoadingBlock className="h-4 w-1/2 rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <LoadingBlock className="h-16 rounded-lg" />
                  <LoadingBlock className="h-16 rounded-lg" />
                </div>
                <div className="space-y-2 pt-4">
                  <LoadingBlock className="h-4 w-32 rounded-md" />
                  <LoadingBlock className="h-4 w-28 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "document") {
    return (
      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-6"
        data-testid="page-loading-document"
      >
        <div className="sticky top-[89px] z-20 mx-auto w-full max-w-[calc(8.5in+6rem)] print:hidden">
          <div className="rounded-2xl border bg-card/95 px-12 py-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <LoadingBlock className="h-11 w-72 rounded-md" />
                <LoadingBlock className="size-5 rounded-full" />
              </div>
              <div className="flex items-center gap-1 self-end md:self-auto">
                <LoadingBlock className="size-8 rounded-full" />
                <LoadingBlock className="size-8 rounded-full" />
                <LoadingBlock className="size-8 rounded-full" />
                <LoadingBlock className="size-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto w-[8.5in] bg-white p-12 shadow-lg print:p-0 print:shadow-none">
          <div className="flex w-full flex-col gap-8">
            <div className="space-y-3">
              <LoadingBlock className="h-8 w-48 rounded-md" />
              <LoadingBlock className="h-4 w-40 rounded-md" />
              <LoadingBlock className="h-4 w-52 rounded-md" />
            </div>
            <LoadingBlock className="h-20 rounded-xl" />
            <LoadingBlock className="h-56 rounded-xl" />
            <LoadingBlock className="h-36 rounded-xl" />
            <LoadingBlock className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-6" data-testid="page-loading-panel">
      <div className="space-y-2">
        <LoadingBlock className="h-8 w-40 rounded-md" />
        <LoadingBlock className="h-4 w-72 rounded-md" />
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <LoadingBlock className="h-6 w-40 rounded-md" />
            <LoadingBlock className="h-9 w-48 rounded-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-16 rounded-md" />
              <LoadingBlock className="h-5 w-32 rounded-md" />
            </div>
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-16 rounded-md" />
              <LoadingBlock className="h-5 w-40 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
