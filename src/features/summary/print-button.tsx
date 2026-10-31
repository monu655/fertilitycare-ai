"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Printing (or saving as PDF) is the user's own action, and only after they confirm what the page contains.
export function PrintButton() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 accent-[#0e8a7c]"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>I understand this summary contains my health information, and I choose to print it or save it as a PDF.</span>
      </label>
      <Button type="button" disabled={!confirmed} onClick={() => window.print()}>
        <Printer className="h-4 w-4" aria-hidden="true" /> Print or save as PDF
      </Button>
    </div>
  );
}
