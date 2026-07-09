import { execute } from "./db";
import type { SignalStatus } from "./types";

export async function logStatusChange(userId: number, status: SignalStatus): Promise<void> {
  await execute(
    "INSERT INTO user_status_logs (user_id, status, changed_at) VALUES (?, ?, NOW())",
    [userId, status],
  );
}
