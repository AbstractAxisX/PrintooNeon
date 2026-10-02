"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Lock,
  LogOut,
  RefreshCw,
  Trash2,
  Loader2,
  Package,
  Phone,
  User,
  StickyNote,
  Ruler,
  Type as TypeIcon,
  Palette,
  Clock,
  KeyRound,
  ChevronRight,
  Spline,
  Timer,
} from "lucide-react";
import { COLOR_MODES, hasRTL, textTokens } from "@/lib/neon";
import { getColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface AdminOrder {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  note: string | null;
  text: string;
  fontId: string;
  fontName: string;
  colorId: string;
  colorName: string;
  colorId2: string | null;
  colorName2: string | null;
  mode: string;
  lineMode: string;
  widthCm: number;
  backgroundId: string | null;
  colorsJson: string | null;
  /** full design config as sent by the designer (timings, per-letter colors) */
  configJson: string | null;
  hasImage: boolean;
  isGif: boolean;
  status: string;
  createdAt: string;
}

interface AdminColor {
  id: string;
  name: string;
  tube: string;
}

const TOKEN_KEY = "printoo-admin-token";
const STATUSES: { id: string; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "done", label: "Done" },
];

const MODE_NAMES = new Map(COLOR_MODES.map((m) => [m.id as string, m.name]));

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    setToken(window.localStorage.getItem(TOKEN_KEY));
    setChecked(true);
  }, []);

  const loadOrders = useCallback(async (tok: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-token": tok } });
      if (res.status === 401) {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        toast.error("Session expired — log in again.");
        return;
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast.error("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadOrders(token);
  }, [token, loadOrders]);

  function openDetail(order: AdminOrder) {
    setSelected(order);
    setDetailOpen(true);
  }

  function patchOrder(id: string, patch: Partial<AdminOrder>) {
    setOrders((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
  }

  function removeOrder(id: string) {
    setOrders((l) => l.filter((x) => x.id !== id));
    setSelected((s) => (s && s.id === id ? null : s));
  }

  if (!checked) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!token) {
    return (
      <LoginCard
        onLogin={(t) => {
          window.localStorage.setItem(TOKEN_KEY, t);
          setToken(t);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background px-3 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-extrabold leading-tight">
                PrintooNeon · Orders
              </h1>
              <p className="text-[12px] text-muted-foreground">
                {orders.length} order{orders.length === 1 ? "" : "s"} · newest first ·
                click a row for the full detail
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPwOpen(true)}
              className="gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Change password
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrders(token)}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                window.localStorage.removeItem(TOKEN_KEY);
                setToken(null);
                setOrders([]);
                setSelected(null);
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </Button>
          </div>
        </header>

        {orders.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 font-semibold text-muted-foreground">No orders yet</p>
            <p className="text-[12.5px] text-muted-foreground/70">
              Customer orders will appear here the moment they are placed.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[90px]">Order</TableHead>
                    <TableHead className="hidden w-[150px] md:table-cell">Placed</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>Sign text</TableHead>
                    <TableHead className="hidden w-[70px] sm:table-cell">Size</TableHead>
                    <TableHead className="hidden w-[130px] sm:table-cell">Style</TableHead>
                    <TableHead className="w-[96px]">Status</TableHead>
                    <TableHead className="w-10" aria-label="Open detail" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-14 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {orders.map((o) => (
                    <TableRow
                      key={o.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open order ${o.code}`}
                      onClick={() => openDetail(o)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetail(o);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono text-[13px] font-bold tracking-wide text-primary">
                        {o.code}
                      </TableCell>
                      <TableCell className="hidden text-[12px] text-muted-foreground md:table-cell">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-[13px] font-semibold">
                        {o.customerName}
                      </TableCell>
                      <TableCell className="hidden text-[12.5px] md:table-cell">
                        <a
                          href={`tel:${o.phone}`}
                          dir="ltr"
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-primary hover:underline"
                        >
                          {o.phone}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span
                          dir={hasRTL(o.text) ? "rtl" : "ltr"}
                          className={cn(
                            "block truncate text-[13px] font-semibold",
                            hasRTL(o.text) && "text-right"
                          )}
                        >
                          {o.text.replace(/\n/g, " · ")}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-[12.5px] tabular-nums sm:table-cell">
                        {o.widthCm} cm
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-[12px]">
                          {MODE_NAMES.get(o.mode) ?? o.mode}
                          <span className="text-muted-foreground">
                            {" · "}
                            {o.lineMode === "single" ? "single" : "double"}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={o.status} />
                      </TableCell>
                      <TableCell className="pr-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* order detail — opens when a table row is clicked */}
        {selected && (
          <OrderDetailDialog
            order={selected}
            token={token}
            open={detailOpen}
            onOpenChange={(v) => {
              setDetailOpen(v);
              if (!v) setSelected(null);
            }}
            onStatus={(id, status) => patchOrder(id, { status })}
            onDeleted={(id) => {
              removeOrder(id);
              setDetailOpen(false);
            }}
          />
        )}

        {/* change the admin password from inside the panel */}
        <PasswordDialog
          open={pwOpen}
          onOpenChange={setPwOpen}
          token={token}
          onTokenChanged={(t) => {
            window.localStorage.setItem(TOKEN_KEY, t);
            setToken(t);
          }}
        />
      </div>
    </main>
  );
}

/* ---------------- login ---------------- */

function LoginCard({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      onLogin(data.token);
      toast.success("Welcome back.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-2xl border bg-card p-6 shadow-lg"
      >
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-lg font-extrabold">Admin panel</h1>
        <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
          Enter the admin password to review customer orders.
        </p>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="mt-4"
          autoFocus
        />
        <Button type="submit" className="mt-3 w-full font-bold" disabled={busy || !password}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
        </Button>
      </form>
    </main>
  );
}

/* ---------------- order detail dialog ---------------- */

function OrderDetailDialog({
  order,
  token,
  open,
  onOpenChange,
  onStatus,
  onDeleted,
}: {
  order: AdminOrder;
  token: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStatus: (id: string, status: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(order.hasImage);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // fetch the (possibly animated) design preview when the dialog opens
  useEffect(() => {
    if (!open) return;
    setImage(null);
    setConfirmDelete(false);
    setImgBusy(order.hasImage);
    if (!order.hasImage) return;
    let alive = true;
    fetch(`/api/admin/orders/${order.id}?image=1`, { headers: { "x-admin-token": token } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (alive) setImage(d?.order?.imageData ?? null);
      })
      .catch(() => {
        if (alive) setImage(null);
      })
      .finally(() => {
        if (alive) setImgBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [open, order.id, order.hasImage, token]);

  const colors: AdminColor[] = (() => {
    try {
      return order.colorsJson ? (JSON.parse(order.colorsJson) as AdminColor[]) : [];
    } catch {
      return [];
    }
  })();

  // full design config (timings, per-letter paint map) — sent by the designer
  const cfg: Record<string, unknown> = (() => {
    try {
      return order.configJson ? (JSON.parse(order.configJson) as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  })();
  const letterColors = (cfg.letterColors ?? {}) as Record<string, string>;
  const cycleHold = typeof cfg.cycleHold === "number" ? cfg.cycleHold : 1;
  const cycleFade = typeof cfg.cycleFade === "number" ? cfg.cycleFade : 0.8;
  const flowSpeed = typeof cfg.flowSpeed === "number" ? cfg.flowSpeed : 1;
  const cycleCount = Array.isArray(cfg.cycleColors) ? cfg.cycleColors.length : 0;
  const flowCount = Array.isArray(cfg.flowColors) ? cfg.flowColors.length : 0;

  const rtl = hasRTL(order.text);
  const tokens = order.mode === "perLetter" ? textTokens(order.text) : [];

  async function setStatus(status: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      onStatus(order.id, status);
      toast.success(`Order ${order.code} → ${status}`);
    } catch {
      toast.error("Could not update the order.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (!res.ok) throw new Error();
      onDeleted(order.id);
      toast.success(`Order ${order.code} deleted.`);
    } catch {
      toast.error("Could not delete the order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex flex-wrap items-center gap-2.5 text-lg font-extrabold">
            <span className="font-mono tracking-wider text-primary">{order.code}</span>
            <StatusPill status={order.status} />
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-5">
          {/* design preview — GIFs animate right in the dialog */}
          <div className="relative aspect-[8/5] w-full overflow-hidden rounded-xl bg-[#14121a]">
            {imgBusy && (
              <div className="absolute inset-0 grid place-items-center">
                <Loader2 className="h-5 w-5 animate-spin text-white/40" />
              </div>
            )}
            {image ? (
              <img
                src={image}
                alt={`Design for order ${order.code}`}
                className="h-full w-full object-contain"
              />
            ) : (
              !imgBusy && (
                <div className="grid h-full place-items-center text-[12px] text-white/30">
                  no preview attached
                </div>
              )
            )}
            {order.isGif && (
              <span className="absolute right-2.5 top-2.5 rounded-md bg-black/55 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-300 backdrop-blur">
                GIF · animated
              </span>
            )}
          </div>

          <p
            dir={rtl ? "rtl" : "ltr"}
            className={cn(
              "text-[18px] font-bold leading-snug text-foreground",
              rtl && "text-right"
            )}
          >
            {order.text.replace(/\n/g, " · ")}
          </p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[12.5px]">
            <Row icon={<User className="h-3.5 w-3.5" />} label="Customer">
              {order.customerName}
            </Row>
            <Row icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
              <a href={`tel:${order.phone}`} className="font-semibold text-primary" dir="ltr">
                {order.phone}
              </a>
            </Row>
            <Row icon={<TypeIcon className="h-3.5 w-3.5" />} label="Font">
              {order.fontName}
            </Row>
            <Row icon={<Palette className="h-3.5 w-3.5" />} label="Colors">
              {order.mode === "gradient" && order.colorName2
                ? `${order.colorName} → ${order.colorName2} (gradient)`
                : MODE_NAMES.get(order.mode) ?? order.mode}
            </Row>
            <Row icon={<Spline className="h-3.5 w-3.5" />} label="Tube">
              {order.lineMode === "single" ? "Single-line (solid text)" : "Double-line (outline)"}
            </Row>
            {(order.mode === "cycle" || order.mode === "flow") && (
              <Row icon={<Timer className="h-3.5 w-3.5" />} label="Timing">
                {order.mode === "cycle" ? (
                  <span className="tabular-nums">
                    each color holds {cycleHold}s · crossfade {cycleFade}s ·{" "}
                    {cycleCount || colors.length} colors in sequence
                  </span>
                ) : (
                  <span className="tabular-nums">
                    flow speed {flowSpeed}× · {flowCount || colors.length} colors sweeping
                  </span>
                )}
              </Row>
            )}
            <Row icon={<Ruler className="h-3.5 w-3.5" />} label="Size">
              {order.widthCm} cm wide
            </Row>
            <Row icon={<Clock className="h-3.5 w-3.5" />} label="Placed">
              {formatDate(order.createdAt)}
            </Row>
          </dl>

          {colors.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                colors in order
              </span>
              {colors.map((c, i) => (
                <span
                  key={c.id + i}
                  className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: c.tube, boxShadow: `0 0 6px ${c.tube}` }}
                    aria-hidden
                  />
                  {i + 1}. {c.name}
                </span>
              ))}
            </div>
          )}

          {/* per-letter / per-word paint map, exactly as the customer set it */}
          {order.mode === "perLetter" && tokens.length > 0 && (
            <div className="rounded-lg border bg-muted/30 px-2.5 py-2">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                color per {rtl ? "word" : "letter"} — as painted
              </p>
              <div
                dir={rtl ? "rtl" : "ltr"}
                className={cn("flex flex-wrap items-center gap-1", rtl && "justify-end")}
              >
                {tokens.map((tok) => {
                  const id = letterColors[String(tok.index)] ?? order.colorId;
                  const c = getColor(id);
                  const blank = tok.ch.trim() === "";
                  return (
                    <span
                      key={tok.index}
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[13px] font-semibold",
                        blank ? "text-muted-foreground/50" : "border"
                      )}
                      style={
                        blank
                          ? undefined
                          : {
                              color: c.tube,
                              textShadow: `0 0 8px ${c.glow}`,
                              borderColor: `${c.glow}66`,
                              background: `${c.glow}12`,
                            }
                      }
                    >
                      {blank ? "·" : tok.ch}
                    </span>
                  );
                })}
              </div>
              {rtl && (
                <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                  Arabic-script letters join inside a word, so whole words share one tube color.
                </p>
              )}
            </div>
          )}

          {order.note && (
            <p className="flex items-start gap-2 rounded-lg border border-dashed px-2.5 py-2 text-[12px] leading-5 text-muted-foreground">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {order.note}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-1.5 border-t pt-4">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy || order.status === s.id}
                onClick={() => setStatus(s.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-all",
                  order.status === s.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              aria-label={`Delete order ${order.code}`}
              className={cn(
                "ml-auto flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11.5px] font-semibold transition-all",
                confirmDelete
                  ? "border-destructive bg-destructive text-destructive-foreground"
                  : "border-transparent text-destructive hover:border-destructive/40 hover:bg-destructive/10"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmDelete ? "Really delete?" : "Delete"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- change password dialog ---------------- */

function PasswordDialog({
  open,
  onOpenChange,
  token,
  onTokenChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string | null;
  onTokenChanged: (t: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const nextValid = next.length >= 6;
  const confirmValid = next === confirm;
  const canSubmit = !!current && nextValid && confirmValid && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not change the password");
      onTokenChanged(data.token);
      toast.success("Password changed. Other sessions are now logged out.");
      setCurrent("");
      setNext("");
      setConfirm("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
            <KeyRound className="h-5 w-5 text-primary" />
            Change password
          </DialogTitle>
          <DialogDescription className="text-[12.5px] leading-5 text-muted-foreground">
            The new password applies immediately — sessions on other devices
            get logged out.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3.5 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-current" className="text-[13px] font-semibold">
              Current password
            </Label>
            <Input
              id="pw-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-next" className="text-[13px] font-semibold">
              New password
            </Label>
            <Input
              id="pw-next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className={next && !nextValid ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {next && !nextValid && (
              <p className="text-[11.5px] text-destructive">At least 6 characters.</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-confirm" className="text-[13px] font-semibold">
              Repeat new password
            </Label>
            <Input
              id="pw-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className={confirm && !confirmValid ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {confirm && !confirmValid && (
              <p className="text-[11.5px] text-destructive">Passwords don&apos;t match.</p>
            )}
          </div>
          <Button type="submit" className="mt-1 w-full font-bold" disabled={!canSubmit}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save new password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- helpers ---------------- */

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-foreground">{children}</dd>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === "done"
      ? "bg-emerald-500/85"
      : status === "contacted"
        ? "bg-amber-500/85"
        : "bg-sky-500/85";
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white",
        style
      )}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
