"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, History, Trash2, Inbox } from "lucide-react";
import { getHistory, clearHistory, type OrderHistoryEntry } from "@/lib/history";
import { hasRTL } from "@/lib/neon";
import { cn } from "@/lib/utils";

/**
 * "My orders" — the customer's own order history from localStorage,
 * with every order code ready to copy and show the shop.
 */
export function HistoryDialog({
  open,
  onOpenChange,
  onOrdersChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** signal the parent to refresh its badge count */
  onOrdersChanged?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl p-0 sm:max-w-lg">
        {/* mounts fresh each time the dialog opens — reads the latest localStorage */}
        <HistoryList onOrdersChanged={onOrdersChanged} />
      </DialogContent>
    </Dialog>
  );
}

function HistoryList({ onOrdersChanged }: { onOrdersChanged?: () => void }) {
  const [orders, setOrders] = useState<OrderHistoryEntry[]>(() => getHistory());

  function copyCode(code: string) {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success("Order code copied."))
      .catch(() => toast.error("Could not copy."));
  }

  function handleClear() {
    clearHistory();
    setOrders([]);
    onOrdersChanged?.();
    toast.success("Order history cleared.");
  }

  return (
    <>
      <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
            <History className="h-5 w-5 text-primary" />
            My orders
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-6 text-muted-foreground">
            Orders you placed from this device. Show the order code to the shop
            so they can find your exact design.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 py-5">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-[13px] font-medium text-muted-foreground">
                No orders yet
              </p>
              <p className="max-w-[240px] text-[12px] leading-5 text-muted-foreground/70">
                Design a sign and place an order — it will appear here with its code.
              </p>
            </div>
          ) : (
            <ul className="flex max-h-[55dvh] flex-col gap-3 overflow-y-auto pr-1">
              {orders.map((o) => (
                <li
                  key={o.code + o.createdAt}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm"
                >
                  {o.thumb ? (
                    <img
                      src={o.thumb}
                      alt={`Design preview for order ${o.code}`}
                      className="h-14 w-20 shrink-0 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-20 shrink-0 place-items-center rounded-lg border bg-muted/50 text-[10px] text-muted-foreground">
                      design
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[15px] font-extrabold tracking-wider text-primary">
                        {o.code}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Copy order code ${o.code}`}
                        onClick={() => copyCode(o.code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p
                      dir={hasRTL(o.text) ? "rtl" : "ltr"}
                      className={cn(
                        "truncate text-[13px] font-semibold text-foreground",
                        hasRTL(o.text) && "text-right"
                      )}
                    >
                      {o.text.replace(/\n/g, " · ")}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                      <span aria-hidden>·</span>
                      <span>{o.fontName.split(" ")[0]}</span>
                      <span aria-hidden>·</span>
                      <span>{o.modeName}</span>
                      <span aria-hidden>·</span>
                      <span>{o.widthCm} cm</span>
                      {o.colors.length > 0 && (
                        <span className="flex items-center gap-1" aria-label="colors used">
                          {o.colors.slice(0, 6).map((c, i) => (
                            <span
                              key={c.id + i}
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{
                                background: c.tube,
                                boxShadow: `0 0 5px ${c.tube}`,
                              }}
                              title={c.name}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {orders.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground">
                {orders.length} order{orders.length > 1 ? "s" : ""} · saved only on this device
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 gap-1.5 text-[12px] text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear history
              </Button>
            </div>
          )}
        </div>
    </>
  );
}
