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

  useEffect(() => {
    setNotes(quote.notes || "");
  }, [quote.notes]);

  const debouncedUpdate = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onUpdate({ notes: value }), 500);
    },
    [onUpdate]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
          placeholder="Internal notes, tracking info, etc..."
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </CardContent>
    </Card>
  );
}
