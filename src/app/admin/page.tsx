"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { hasRTL } from "@/lib/neon";
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
  widthCm: number;
  backgroundId: string | null;
  colorsJson: string | null;
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

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (!checked) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!token) {
    return <LoginCard onLogin={(t) => { window.localStorage.setItem(TOKEN_KEY, t); setToken(t); }} />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-extrabold leading-tight">PrintooNeon · Orders</h1>
              <p className="text-[12px] text-muted-foreground">
                {orders.length} order{orders.length === 1 ? "" : "s"} · newest first
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrders(token)}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
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
          <ul className="grid gap-4 sm:grid-cols-2">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} token={token} onDeleted={(id) => setOrders((l) => l.filter((x) => x.id !== id))} onStatus={(id, s) => setOrders((l) => l.map((x) => (x.id === id ? { ...x, status: s } : x)))} />
            ))}
          </ul>
        )}
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

/* ---------------- order card ---------------- */

function OrderCard({
  order,
  token,
  onDeleted,
  onStatus,
}: {
  order: AdminOrder;
  token: string;
  onDeleted: (id: string) => void;
  onStatus: (id: string, status: string) => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(order.hasImage);
  const [busy, setBusy] = useState(false);
  const askedRef = useRef(false);

  useEffect(() => {
    if (!order.hasImage || askedRef.current) return;
    askedRef.current = true;
    fetch(`/api/admin/orders/${order.id}?image=1`, { headers: { "x-admin-token": token } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setImage(d?.order?.imageData ?? null))
      .catch(() => setImage(null))
      .finally(() => setImgBusy(false));
  }, [order.hasImage, order.id, token]);

  const colors: AdminColor[] = (() => {
    try {
      return order.colorsJson ? (JSON.parse(order.colorsJson) as AdminColor[]) : [];
    } catch {
      return [];
    }
  })();

  const rtl = hasRTL(order.text);

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
    } catch {
      toast.error("Could not update the order.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete order ${order.code}? This cannot be undone.`)) return;
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
    <li className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* design preview — GIFs animate right in the list */}
      <div className="relative aspect-[8/5] w-full bg-[#14121a]">
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
        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-2 py-1 font-mono text-[12.5px] font-bold tracking-wider text-white backdrop-blur">
          {order.code}
        </span>
        {order.isGif && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-black/55 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-300 backdrop-blur">
            GIF · animated
          </span>
        )}
        <StatusPill status={order.status} />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p
          dir={rtl ? "rtl" : "ltr"}
          className={cn(
            "text-[17px] font-bold leading-snug text-foreground",
            rtl && "text-right"
          )}
        >
          {order.text.replace(/\n/g, " · ")}
        </p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1.5 text-[12.5px]">
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
          <Row icon={<Palette className="h-3.5 w-3.5" />} label="Mode">
            {order.mode}
          </Row>
          <Row icon={<Ruler className="h-3.5 w-3.5" />} label="Size">
            {order.widthCm} cm wide
          </Row>
          <Row icon={<Clock className="h-3.5 w-3.5" />} label="Placed">
            {new Date(order.createdAt).toLocaleString()}
          </Row>
        </dl>

        {colors.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              colors
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

        {order.note && (
          <p className="flex items-start gap-2 rounded-lg border border-dashed px-2.5 py-2 text-[12px] leading-5 text-muted-foreground">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {order.note}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1.5">
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
            className="ml-auto flex items-center gap-1 rounded-lg border border-transparent px-2 py-1.5 text-[11.5px] font-semibold text-destructive transition-all hover:border-destructive/40 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

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
        "absolute bottom-2.5 left-2.5 rounded-md px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white backdrop-blur",
        style
      )}
    >
      {status}
    </span>
  );
}
