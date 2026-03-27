import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { AppHeader } from "../components/AppHeader";
import { HeaderUserLeft } from "../components/HeaderUserLeft";

export type EnvelopeSummary = {
  id: number;
  name: string;
  opening_balance_cents: number;
  balance_cents: number;
  created_at: string;
  shared_with_household: boolean;
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function Dashboard() {
  const { user } = useAuth();
  const [envelopes, setEnvelopes] = useState<EnvelopeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ envelopes: EnvelopeSummary[] }>("/api/envelopes");
      setEnvelopes(data.envelopes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = envelopes.reduce((s, e) => s + e.balance_cents, 0);

  return (
    <div className="min-h-[100dvh] bg-paper">
      <AppHeader left={<HeaderUserLeft user={user} />} />

      <main className="safe-x safe-b page-y mx-auto w-full max-w-3xl">
        {error && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-400/60 dark:bg-red-950/70 dark:text-red-50 dark:shadow-[0_0_32px_rgba(255,60,120,0.45),0_0_60px_rgba(239,68,68,0.2)]"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-card to-accent-dim/30 p-4 shadow-sm neon-hero-total sm:mb-8 sm:p-6">
          <p className="text-sm font-medium text-muted">Total across envelopes</p>
          <p className="font-display mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">
            {formatMoney(total)}
          </p>
        </div>

        <section className="pb-2">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
            Envelopes
          </h2>
          <p className="mt-1 text-sm text-muted">
            Shared envelopes are visible to everyone in your household; private
            ones only to you. Anyone who can see an envelope can add
            transactions.
          </p>
          {loading ? (
            <p className="mt-4 text-muted">Loading…</p>
          ) : envelopes.length === 0 ? (
            <p className="neon-panel mt-4 rounded-xl border border-dashed border-border bg-paper/50 px-4 py-8 text-center text-muted dark:border-[rgba(0,245,255,0.45)] dark:bg-black/30 dark:text-[#d4c4f0]">
              No envelopes yet.{" "}
              <Link to="/manage" className="font-medium text-accent underline">
                Manage household
              </Link>{" "}
              to add one.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {envelopes.map((env) => (
                <li key={env.id}>
                  <Link
                    to={`/envelope/${env.id}`}
                    className="neon-panel flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm transition active:bg-stone-50/80 dark:active:bg-purple-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-5 hover:border-accent/40 hover:shadow-md dark:hover:border-[rgba(0,245,255,0.75)] dark:hover:shadow-[0_0_36px_rgba(0,240,255,0.35),0_0_60px_rgba(200,79,255,0.2)]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {env.name}
                        <span
                          className={`ml-2 align-middle text-xs font-medium ${
                            env.shared_with_household ? "text-accent" : "text-warm"
                          }`}
                        >
                          {env.shared_with_household ? "Shared" : "Private"}
                        </span>
                      </p>
                      <p className="text-xs text-muted">
                        Opened {new Date(env.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-baseline justify-between gap-4 border-t border-border pt-3 sm:border-t-0 sm:pt-0 sm:text-right">
                      <span className="text-xs text-muted sm:hidden">Balance</span>
                      <p className="font-display text-xl font-semibold tabular-nums text-ink sm:text-2xl">
                        {formatMoney(env.balance_cents)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
