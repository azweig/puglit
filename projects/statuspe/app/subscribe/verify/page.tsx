"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

type VerifyState = "idle" | "loading" | "success" | "error";

type VerificationResult = {
  email: string;
  manage_token: string;
  status_slug: string;
  status_name: string;
  verified_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(source: unknown, key: string): string {
  if (!isRecord(source)) return "";
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function firstString(values: string[]): string {
  return values.find((value) => value.trim().length > 0) ?? "";
}

function normalizeVerificationResponse(data: unknown): VerificationResult {
  const root = isRecord(data) ? data : {};
  const subscriber = isRecord(root.subscriber) ? root.subscriber : root;
  const statusPage = isRecord(root.status_page)
    ? root.status_page
    : isRecord(root.statusPage)
      ? root.statusPage
      : isRecord(subscriber.status_page)
        ? subscriber.status_page
        : {};

  return {
    email: firstString([readString(subscriber, "email"), readString(root, "email")]),
    manage_token: firstString([
      readString(subscriber, "manage_token"),
      readString(root, "manage_token"),
      readString(root, "manageToken"),
    ]),
    status_slug: firstString([
      readString(statusPage, "slug"),
      readString(root, "status_slug"),
      readString(root, "slug"),
      "statuspe",
    ]),
    status_name: firstString([
      readString(statusPage, "name"),
      readString(root, "status_name"),
      "StatusPe",
    ]),
    verified_at: firstString([
      readString(subscriber, "verified_at"),
      readString(root, "verified_at"),
      new Date().toISOString(),
    ]),
  };
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ahora";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Header(): JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Navegación principal">
        <Link href="/" className="group flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-extrabold text-white shadow-sm shadow-blue-950/20">SP</span>
          <span className="hidden text-sm font-bold tracking-tight text-[#0F172A] sm:inline">StatusPe</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-white/70 p-1">
          <Link href="/" className="min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[#475569] transition-all duration-200 ease-out hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Estado
          </Link>
          <Link href="/s/statuspe/history" className="hidden min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[#475569] transition-all duration-200 ease-out hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex sm:items-center">
            Historial
          </Link>
          <Link href="/s/statuspe/subscribe" className="min-h-11 whitespace-nowrap rounded-full bg-[#EFF6FF] px-3 py-2 text-sm font-semibold text-[#2563EB] transition-all duration-200 ease-out hover:bg-[#DBEAFE] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Suscribirse
          </Link>
          <Link href="/api/v1/status-pages/[slug]" className="hidden min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[#475569] transition-all duration-200 ease-out hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex sm:items-center">
            RSS
          </Link>
        </div>
      </nav>
    </header>
  );
}

function LoadingCard(): JSX.Element {
  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-lg shadow-blue-950/5 sm:p-6" aria-label="Confirmando suscripción">
      <div className="flex flex-col items-center text-center">
        <div className="size-16 animate-pulse rounded-full bg-black/5" />
        <div className="mt-6 h-8 w-56 animate-pulse rounded-xl bg-black/5" />
        <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-xl bg-black/5" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-xl bg-black/5" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-24 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-24 animate-pulse rounded-2xl bg-black/5" />
      </div>
      <div className="mt-6 h-11 animate-pulse rounded-full bg-black/5" />
    </section>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }): JSX.Element {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 shadow-sm" role="alert">
      <div>
        <p className="text-sm font-semibold text-[#991B1B]">No pudimos confirmar la suscripción</p>
        <p className="mt-1 text-sm leading-6 text-[#7F1D1D]">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-lg font-semibold text-[#991B1B] transition-all duration-200 ease-out hover:bg-[#FEE2E2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2"
        aria-label="Cerrar aviso de error"
      >
        ×
      </button>
    </div>
  );
}

function InvalidTokenCard({ token, onRetry, isRetrying }: { token: string; onRetry: () => void; isRetrying: boolean }): JSX.Element {
  const hasToken = token.trim().length > 0;

  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center shadow-lg shadow-blue-950/5 sm:p-6">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#FEE2E2] text-3xl" aria-hidden="true">
        ⚠️
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0F172A]">Token inválido o expirado</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#334155] sm:text-base">
        {hasToken
          ? "El enlace de confirmación ya fue utilizado, expiró o no corresponde a una suscripción activa. Solicita un nuevo correo para proteger tus preferencias."
          : "El enlace no incluye un token de verificación. Abre el enlace completo desde tu correo o solicita una nueva confirmación."}
      </p>

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Estado</p>
          <p className="mt-2 text-sm font-semibold text-[#0F172A]">Sin confirmar</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Siguiente paso</p>
          <p className="mt-2 text-sm font-semibold text-[#0F172A]">Reenviar enlace</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Servicio</p>
          <p className="mt-2 text-sm font-semibold text-[#0F172A]">StatusPe</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {hasToken ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Intentar confirmar otra vez
          </button>
        ) : null}
        <Link href="/s/statuspe/subscribe" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 ease-out hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
          Solicitar nuevo enlace
        </Link>
      </div>
    </section>
  );
}

function SuccessCard({ result }: { result: VerificationResult }): JSX.Element {
  const manageHref = result.manage_token.trim().length > 0 ? `/subscribe/manage/${encodeURIComponent(result.manage_token)}` : "/s/statuspe/subscribe";
  const statusHref = `/s/${encodeURIComponent(result.status_slug || "statuspe")}`;
  const emailLabel = result.email.trim().length > 0 ? result.email : "tu correo";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-lg shadow-blue-950/5">
      <div className="bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] px-4 py-8 text-center sm:px-6 sm:py-10">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#DCFCE7] text-4xl font-extrabold text-[#166534] shadow-sm" aria-hidden="true">
          ✓
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Suscripción confirmada</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">Ya recibirás avisos de StatusPe</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#334155] sm:text-base">
          Confirmamos <span className="font-semibold text-[#0F172A]">{emailLabel}</span>. Te notificaremos cuando haya incidentes, mantenimientos programados o actualizaciones importantes en la página pública.
        </p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Estado</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]">
              <span className="size-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
              Verificado
            </div>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Servicio</p>
            <p className="mt-3 text-sm font-semibold text-[#0F172A]">{result.status_name || "StatusPe"}</p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Confirmado</p>
            <p className="mt-3 text-sm font-semibold text-[#0F172A]">{formatDateTime(result.verified_at)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-[#0F172A]">Qué recibirás</h2>
          <ul className="mt-4 grid gap-3 text-sm text-[#334155] sm:grid-cols-3">
            <li className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
              <span className="mt-0.5 text-[#2563EB]" aria-hidden="true">●</span>
              <span>Alertas cuando un componente cambie a degradado o fuera de servicio.</span>
            </li>
            <li className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
              <span className="mt-0.5 text-[#2563EB]" aria-hidden="true">●</span>
              <span>Actualizaciones de investigación, monitoreo y resolución de incidentes.</span>
            </li>
            <li className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
              <span className="mt-0.5 text-[#2563EB]" aria-hidden="true">●</span>
              <span>Ventanas de mantenimiento programado antes de que empiecen.</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={manageHref} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Gestionar preferencias
          </Link>
          <Link href={statusHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 ease-out hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Ver página pública
          </Link>
        </div>
      </div>
    </section>
  );
}

function VerifyContent(): JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerifyState>(token.trim().length > 0 ? "loading" : "error");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(
    token.trim().length > 0 ? "" : "El enlace no incluye un token de verificación."
  );
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const attemptedTokenRef = useRef<string>("");

  const verify = useCallback(async (verificationToken: string): Promise<void> => {
    const trimmedToken = verificationToken.trim();
    if (trimmedToken.length === 0) {
      setResult(null);
      setErrorMessage("El enlace no incluye un token de verificación.");
      setShowBanner(false);
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage("");
    setShowBanner(false);

    try {
      const response = await fetch("/api/v1/subscriptions/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: trimmedToken }),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = firstString([
          readString(data, "message"),
          readString(data, "error"),
          "El token es inválido, expiró o ya no está disponible.",
        ]);
        setResult(null);
        setErrorMessage(message);
        setShowBanner(true);
        setState("error");
        return;
      }

      const normalized = normalizeVerificationResponse(data);
      if (normalized.manage_token.trim().length === 0) {
        setResult(null);
        setErrorMessage("La confirmación fue recibida, pero no llegó el enlace de gestión. Solicita un nuevo enlace de suscripción.");
        setShowBanner(true);
        setState("error");
        return;
      }

      setResult(normalized);
      setState("success");
    } catch {
      setResult(null);
      setErrorMessage("Hubo un problema de red al confirmar la suscripción. Revisa tu conexión e inténtalo nuevamente.");
      setShowBanner(true);
      setState("error");
    }
  }, []);

  useEffect(() => {
    const trimmedToken = token.trim();
    if (trimmedToken.length === 0) {
      setState("error");
      setErrorMessage("El enlace no incluye un token de verificación.");
      setShowBanner(false);
      return;
    }

    if (attemptedTokenRef.current === trimmedToken) return;
    attemptedTokenRef.current = trimmedToken;
    void verify(trimmedToken);
  }, [token, verify]);

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] bg-[#F6F8FC]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <section className="mb-6 rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Confirmar suscripción</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0F172A]">Activación segura de alertas</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#334155] sm:text-base">
                  Verificamos tu token antes de activar notificaciones públicas de incidentes, mantenimientos y cambios operativos.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-semibold text-[#1D4ED8] shadow-sm">
                <span className="size-2 rounded-full bg-[#2563EB]" aria-hidden="true" />
                Flujo protegido
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-3xl">
            {showBanner ? <ErrorBanner message={errorMessage} onDismiss={() => setShowBanner(false)} /> : null}
            {state === "loading" ? <LoadingCard /> : null}
            {state === "success" && result ? <SuccessCard result={result} /> : null}
            {state === "error" ? (
              <InvalidTokenCard
                token={token}
                onRetry={() => {
                  attemptedTokenRef.current = "";
                  void verify(token);
                }}
                isRetrying={state === "loading"}
              />
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

export default function VerifySubscriptionPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="min-h-[calc(100vh-4rem)] bg-[#F6F8FC]">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
              <div className="mx-auto max-w-3xl">
                <LoadingCard />
              </div>
            </div>
          </main>
        </>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
