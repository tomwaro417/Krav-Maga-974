import * as React from "react";

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}
