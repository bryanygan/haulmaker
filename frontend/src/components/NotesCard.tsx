"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Quote, UpdateQuotePayload } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotesCardProps {
  quote: Quote;
  onUpdate: (data: UpdateQuotePayload) => Promise<void>;
}

export function NotesCard({ quote, onUpdate }: NotesCardProps) {
  const [notes, setNotes] = useState(quote.notes || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    setNotes(quote.notes || "");
  }, [quote.notes]);

  // Commit any pending debounced update immediately (on blur/unmount)
  const flush = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (pendingRef.current !== null) {
      const value = pendingRef.current;
      pendingRef.current = null;
      onUpdateRef.current({ notes: value });
    }
  }, []);

  const debouncedUpdate = useCallback(
    (value: string) => {
      pendingRef.current = value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        pendingRef.current = null;
        onUpdateRef.current({ notes: value });
      }, 500);
    },
    []
  );

  // Flush on unmount so navigating away doesn't silently drop edits
  useEffect(() => flush, [flush]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            debouncedUpdate(e.target.value);
          }}
          onBlur={flush}
          placeholder="Internal notes, tracking info, etc..."
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </CardContent>
    </Card>
  );
}
