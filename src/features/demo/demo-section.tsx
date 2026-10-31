import { connection } from "next/server";
import { DemoButton } from "./demo-button";
import { demoEnabled } from "./synthetic-data";

// Reads the setting when the page is requested (not at build time), so DEMO_MODE can be changed without a rebuild.
export async function DemoSection() {
  await connection();
  if (!demoEnabled()) return null;
  return (
    <div className="mt-6 border-t border-border pt-6" data-testid="demo-section">
      <DemoButton />
    </div>
  );
}
