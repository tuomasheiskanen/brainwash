"use client";

import { useEffect, useState } from "react";
import { getSyncStatus, subscribeSync, type SyncStatus } from "./sync";

/** Subscribe to the background sync status. */
export function useSyncStatus(): SyncStatus {
  const [s, setS] = useState<SyncStatus>(getSyncStatus());
  useEffect(() => subscribeSync(() => setS(getSyncStatus())), []);
  return s;
}
