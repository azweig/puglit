"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

type VerifyStatus = "idle" | "loading" | "success" | "error" | "empty";

type VerificationResult = {
  destination: string;
  channel: string;
  statusPageTitle: string;
  statusPageSlug: string;
  manageToken: string;
  verifiedAt: string;
  message: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(source: Record<string, unknown> | null, key: string): string {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
}

function firstString(records: Array<Record<string, unknown> | null>, keys: string[]): string {
  for (const record of records) {
    for (const key of keys) {
      const value = readString(record, key).trim();
      if (value.length > 0) return value;
    }
  }
  return "";
}

function formatDateTime(value: string): string {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function channelLabel(channel: string): string {
  if (channel === "sms") return "SMS";
  if (channel === "slack") return "Slack";
  if (channel === "webhook") return "Webhook";
  return "Email";
}

function maskToken(token: string): string {
  if (token.length <= 10) return token;
  return `${token.slice(0, 5)}••••${token.slice(-5)}`;
}

function extractVerification(data: unknown): VerificationResult {
  const root = asRecord(data);
  const subscriber = asRecord(root?.subscriber) ?? asRecord(root?.subscription) ?? null;
  const statusPage = asRecord(root?.status_page) ?? asRecord(root?.statusPage) ?? asRecord(subscriber?.status_page) ?? null;

  return {
    destination: firstString([subscriber, root], ["destination", "email", "phone"]),
    channel: firstString([subscriber, root], ["channel"]),
    statusPageTitle: firstString([statusPage, root], ["title", "status_page_title", "statusPageTitle", "page_title"]),
    statusPageSlug: firstString([statusPage, root], ["slug", "status_page_slug", "statusPageSlug"]),
    manageToken: firstString([subscriber, root], ["manage_token", "manageToken"]),
    verifiedAt: firstString([subscriber, root], ["verified_at", "verifiedAt", "updated_at"]),
    message: firstString([root], ["message", "detail"]),
  };
}

function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm" role="alert">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-sm font-extrabold text-[#FFFFFF]">!</div>
          <div>
            <p className="text-sm font-bold text-[#991B1B]">We couldn’t verify this subscription</p>
            <p className="mt-1 text-sm leading-6 text-[#7F1D1D]">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#991B1B] shadow-sm ring-1 ring-[#FECACA] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFF7F7] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="min-h-11 rounded-full bg-[#FEF2F2] px-4 py-2 text-sm font-semibold text-[#991B1B] transition-all duration-200 hover:bg-[#FEE2E2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0B1220]">
      <header className="sticky top-0 z-30 border-b border-[#D8E0EE] bg-[#F6F8FC]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-full pr-2 transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF] shadow-sm">S</span>
            <span className="hidden text-sm font-extrabold tracking-tight text-[#0B1220] sm:inline">Statura</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">Estado</Link>
            <Link href="/uptime" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">Uptime histórico</Link>
            <Link href="/history" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">Historial de incidentes</Link>
            <a href="/api/public/status-pages/[slug]" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">RSS</a>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#047857] sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" /> Operational
            </span>
            <Link href="/#subscribe" className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
              Subscribe
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function LoadingCard({ token }: { token: string }) {
  return (
    <div className="rounded-[2rem] border border-[#D8E0EE] bg-[#FFFFFF] p-5 text-[#0B1220] shadow-xl shadow-[#0F172A]/10 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-2xl text-[#1D4ED8]">✉</div>
      <div className="mt-6 space-y-3 text-center">
        <div className="mx-auto h-8 w-72 max-w-full animate-pulse rounded-xl bg-black/5" />
        <div className="mx-auto h-4 w-80 max-w-full animate-pulse rounded-xl bg-black/5" />
        <div className="mx-auto h-4 w-56 max-w-full animate-pulse rounded-xl bg-black/5" />
      </div>
      <div className="mt-8 rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-black/5" />
            <div className="h-5 w-44 animate-pulse rounded-full bg-black/5" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-full bg-black/5" />
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-[#EFF6FF] p-4 text-center text-sm font-medium text-[#1D4ED8]">
        Securely checking token {maskToken(token)}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="h-11 animate-pulse rounded-full bg-black/5" />
        <div className="h-11 animate-pulse rounded-full bg-black/5" />
      </div>
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="rounded-[2rem] border border-[#D8E0EE] bg-[#FFFFFF] p-6 text-center text-[#0B1220] shadow-xl shadow-[#0F172A]/10 sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] text-3xl text-[#1D4ED8]">⌁</div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl">Verification link missing or expired</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#526071] sm:text-base">
        Open the latest verification email from Statura, or request a fresh subscription link from the public status page.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/#subscribe" className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
          Request new link
        </Link>
        <Link href="/" className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
          View system status
        </Link>
      </div>
    </div>
  );
}

function SuccessCard({ result }: { result: VerificationResult }) {
  const pageTitle = result.statusPageTitle || "Statura status";
  const destination = result.destination || "your destination";
  const channel = channelLabel(result.channel);
  const manageHref = result.manageToken ? `/subscribe/manage/${encodeURIComponent(result.manageToken)}` : "";
  const statusHref = result.statusPageSlug ? `/status/${encodeURIComponent(result.statusPageSlug)}` : "/";

  return (
    <div className="rounded-[2rem] border border-[#D8E0EE] bg-[#FFFFFF] p-6 text-[#0B1220] shadow-xl shadow-[#0F172A]/10 sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#A7F3D0] bg-[#ECFDF5] text-3xl text-[#047857]">✓</div>
      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#047857]">
          Verified subscription
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl">You’re subscribed to updates</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#526071] sm:text-base">
          {result.message || `We confirmed ${destination} for ${pageTitle}. You’ll receive calm, timely notifications when incidents or maintenance affect the service.`}
        </p>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4">
          <dt className="text-xs font-medium text-[#7A8799]">Destination</dt>
          <dd className="mt-1 break-words text-sm font-bold text-[#0B1220]">{destination}</dd>
        </div>
        <div className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4">
          <dt className="text-xs font-medium text-[#7A8799]">Channel</dt>
          <dd className="mt-1 text-sm font-bold text-[#0B1220]">{channel}</dd>
        </div>
        <div className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4">
          <dt className="text-xs font-medium text-[#7A8799]">Status page</dt>
          <dd className="mt-1 text-sm font-bold text-[#0B1220]">{pageTitle}</dd>
        </div>
        <div className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4">
          <dt className="text-xs font-medium text-[#7A8799]">Verified</dt>
          <dd className="mt-1 text-sm font-bold text-[#0B1220]">{formatDateTime(result.verifiedAt)}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {manageHref ? (
          <Link href={manageHref} className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-center text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Manage subscription
          </Link>
        ) : (
          <Link href="/#subscribe" className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-center text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Request management link
          </Link>
        )}
        <Link href={statusHref} className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-center text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
          Back to status page
        </Link>
      </div>
    </div>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get("token") ?? "").trim(), [searchParams]);
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(true);

  const verify = useCallback(async () => {
    if (!token) {
      setStatus("empty");
      setResult(null);
      setError("");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setShowError(true);

    try {
      const response = await fetch("/api/public/subscribers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => ({}));
      const record = asRecord(data);

      if (!response.ok) {
        const message = firstString([record], ["message", "error", "detail"]);
        setError(message || "The verification link may have expired or already been replaced by a newer email.");
        setStatus(response.status === 404 || response.status === 410 ? "empty" : "error");
        setResult(null);
        return;
      }

      setResult(extractVerification(data));
      setStatus("success");
    } catch (caught: any) {
      const message = caught instanceof Error ? caught.message : "Network request failed.";
      setError(message || "Network request failed.");
      setStatus("error");
      setResult(null);
    }
  }, [token]);

  useEffect(() => {
    void verify();
  }, [verify]);

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-4 text-[#FFFFFF] shadow-xl shadow-[#1D4ED8]/20 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
            <div className="py-4 sm:py-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#FFFFFF]">
                Public subscription verification
              </span>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-4xl">Verify your subscription</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#DBEAFE] sm:text-base">
                Statura confirms every destination before sending operational alerts. This keeps incident updates trusted, intentional, and easy to manage.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-[#FFFFFF]">Secure token check</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-[#FFFFFF]">No account required</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-[#FFFFFF]">Manage anytime</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-[#FFFFFF] p-4 text-[#0B1220] shadow-2xl shadow-[#0F172A]/25">
              <div className="flex items-center gap-3 rounded-2xl bg-[#F9FBFF] p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] text-lg font-bold text-[#FFFFFF]">S</div>
                <div>
                  <p className="text-sm font-bold text-[#0B1220]">Statura notifications</p>
                  <p className="text-xs font-medium text-[#7A8799]">Incident and maintenance updates</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-3">
                  <p className="text-lg font-extrabold text-[#0B1220]">90d</p>
                  <p className="text-xs font-medium text-[#7A8799]">history</p>
                </div>
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-3">
                  <p className="text-lg font-extrabold text-[#047857]">AA</p>
                  <p className="text-xs font-medium text-[#7A8799]">contrast</p>
                </div>
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-3">
                  <p className="text-lg font-extrabold text-[#1D4ED8]">RSS</p>
                  <p className="text-xs font-medium text-[#7A8799]">feeds</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-2xl sm:mt-8" aria-live="polite">
          {status === "loading" || status === "idle" ? <LoadingCard token={token || "pending"} /> : null}

          {status === "empty" ? <EmptyCard /> : null}

          {status === "error" ? (
            <div className="rounded-[2rem] border border-[#D8E0EE] bg-[#FFFFFF] p-5 text-[#0B1220] shadow-xl shadow-[#0F172A]/10 sm:p-8">
              {showError ? <ErrorBanner message={error} onRetry={verify} onDismiss={() => setShowError(false)} /> : null}
              <div className="mt-7 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-2xl text-[#1D4ED8]">✉</div>
                <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220]">Keep your subscription under control</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#526071]">
                  If the link came from an older email, request a fresh verification message from the status page and try again.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={verify}
                    className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                  >
                    Retry verification
                  </button>
                  <Link href="/#subscribe" className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-center text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
                    Subscribe again
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {status === "success" && result ? <SuccessCard result={result} /> : null}
        </section>
      </main>
    </Shell>
  );
}

export default function SubscribeVerifyPage() {
  return (
    <Suspense fallback={<Shell><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><section className="mx-auto max-w-2xl"><LoadingCard token="pending" /></section></main></Shell>}>
      <VerifyContent />
    </Suspense>
  );
}
