import { randomBytes } from "node:crypto";

// Random, unguessable id. Unguessable ids are one layer of defence,
// but we still check ownership on the server for every private record.
export function createId(): string {
  return randomBytes(16).toString("hex");
}
