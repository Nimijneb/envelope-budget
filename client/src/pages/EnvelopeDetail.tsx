import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ThemeToggle } from "../theme";

type Envelope = {
  id: number;
  name: string;
  balance_cents: number;
  created_at: string;
  shared_with_household: boolean;
};

type TransactionRow = {
  id: number;
  amount_cents: number;
  note: string | null;
  created_at: string;
  recorded_by_username: string;
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function EnvelopeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  /** Stored as `note` in the API; label in UI is merchant / description. */
  const [merchantOrDescription, setMerchantOrDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await api<{
        envelope: Envelope;
        transactions: TransactionRow[];
      }>(`/api/envelopes/${id}`);
      setEnvelope(data.envelope);
      setTransactions(data.transactions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setEnvelope(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const raw = amount.replace(/[^0-9.]/g, "");
    const dollars = parseFloat(raw || "0");
    const cents = Math.round(dollars * 100);
    const detail = merchantOrDescription.trim();
    if (cents <= 0 || !detail) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/api/envelopes/${id}/transactions`, {
        method: "POST",
        body: JSON.stringify({
          amount_cents: cents,
          type,
          note: detail,
        }),
      });
      setAmount("");
      setMerchantOrDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add transaction");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeEnvelope() {
    if (!id || !envelope) return;
    if (
      !confirm(
        `Delete “${envelope.name}” and all its transactions? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await api(`/api/envelopes/${id}`, { method: "DELETE" });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="safe-x safe-t flex min-h-[100dvh] items-center justify-center bg-paper">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="safe-x safe-b safe-t mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">{error ?? "Envelope not found."}</p>
        <Link
          to="/"
          className="mt-4 inline-block min-h-11 py-2 text-accent hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-paper">
      <header className="chromatic-header sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="safe-x safe-t mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4">
          <Link
            to="/"
            className="min-h-11 inline-flex items-center text-base font-medium text-accent hover:underline"
          >
            ← All envelopes
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={removeEnvelope}
              className="min-h-11 text-base text-red-700 hover:underline dark:text-red-400"
            >
              Delete envelope
            </button>
          </div>
        </div>
      </header>

      <main className="safe-x safe-b page-y mx-auto w-full max-w-3xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display break-words text-2xl font-semibold leading-tight text-ink sm:text-3xl">
            {envelope.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {envelope.shared_with_household ? (
              <>Shared with your household · anyone here can view and add activity</>
            ) : (
              <>
                <span className="font-medium text-warm">Private</span>
                {" · "}
                only you can see this envelope and its transactions
              </>
            )}
          </p>
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Current balance
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums text-ink sm:text-4xl">
              {formatMoney(envelope.balance_cents)}
            </p>
          </div>
        </div>

        <section className="neon-panel mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:mb-10 sm:p-6">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
            Add transaction
          </h2>
          <p className="mt-1 text-sm text-muted">
            Debit removes money from this envelope; credit adds money back.
          </p>
          <form onSubmit={addTransaction} className="mt-4 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="block w-full min-w-0 sm:max-w-xs sm:flex-1">
                <span className="text-sm font-medium text-ink">Amount</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  enterKeyHint="done"
                  className="input-field mt-1"
                />
              </label>
              <fieldset className="flex min-h-[44px] items-center gap-6 border-0 p-0 sm:pb-1">
                <legend className="sr-only">Transaction type</legend>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-base touch-manipulation">
                  <input
                    type="radio"
                    name="txtype"
                    checked={type === "debit"}
                    onChange={() => setType("debit")}
                    className="h-5 w-5 accent-warm"
                  />
                  <span>Debit</span>
                </label>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-base touch-manipulation">
                  <input
                    type="radio"
                    name="txtype"
                    checked={type === "credit"}
                    onChange={() => setType("credit")}
                    className="h-5 w-5 accent-accent"
                  />
                  <span>Credit</span>
                </label>
              </fieldset>
            </div>
            <label className="block text-sm font-medium text-ink">
              Merchant or description
              <input
                value={merchantOrDescription}
                onChange={(e) => setMerchantOrDescription(e.target.value)}
                placeholder="Store name, landlord, gift, transfer…"
                required
                maxLength={500}
                autoComplete="off"
                className="input-field mt-1"
              />
            </label>
            <button
              type="submit"
              disabled={
                submitting ||
                !merchantOrDescription.trim() ||
                Math.round(
                  parseFloat(amount.replace(/[^0-9.]/g, "") || "0") * 100
                ) <= 0
              }
              className="btn-primary w-full touch-manipulation sm:w-auto"
            >
              {submitting ? "Saving…" : "Record transaction"}
            </button>
          </form>
        </section>

        {error && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-400/60 dark:bg-red-950/70 dark:text-red-50 dark:shadow-[0_0_32px_rgba(255,60,120,0.45),0_0_60px_rgba(239,68,68,0.2)]"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="pb-2">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
            Activity
          </h2>
          {transactions.length === 0 ? (
            <p className="neon-panel mt-4 rounded-xl border border-dashed border-border bg-paper/50 px-4 py-8 text-center text-muted dark:border-[rgba(0,245,255,0.45)] dark:bg-black/30 dark:text-[#d4c4f0]">
              No transactions yet.
            </p>
          ) : (
            <ul className="neon-panel mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium text-ink">
                      {t.note
                        ? `${t.note} · ${t.amount_cents < 0 ? "Debit" : "Credit"}`
                        : t.amount_cents < 0
                          ? "Debit"
                          : "Credit"}
                    </p>
                    <p className="mt-0.5 break-words text-xs text-muted">
                      {new Date(t.created_at).toLocaleString()} ·{" "}
                      {t.recorded_by_username}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 self-end font-display text-lg font-semibold tabular-nums sm:self-auto sm:text-xl ${
                      t.amount_cents < 0 ? "text-warm" : "text-accent"
                    }`}
                  >
                    {t.amount_cents < 0 ? "−" : "+"}
                    {formatMoney(Math.abs(t.amount_cents))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
