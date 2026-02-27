"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuoteEditor } from "@/components/QuoteEditor";

function EditorContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No quote ID provided.</p>
      </div>
    );
  }

  return <QuoteEditor id={id} />;
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading...</p></div>}>
      <EditorContent />
    </Suspense>
  );
}
