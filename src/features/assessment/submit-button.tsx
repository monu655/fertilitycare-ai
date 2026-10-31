"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

// Disables itself while the form is being sent, so a double click cannot submit twice.
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {children}
    </Button>
  );
}
