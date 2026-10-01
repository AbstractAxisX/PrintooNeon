"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * تشخیص mount بدون setState داخل effect
 * (سمت سرور false، بلافاصله بعد از hydration true)
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
