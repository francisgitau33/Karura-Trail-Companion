import { loginAction } from './actions';
import { getCmsSetupStatus } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const setupStatus = getCmsSetupStatus();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mist-cream)] px-4 text-[var(--main-text)]">
      <section className="w-full max-w-sm rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-6 shadow">
        <h1 className="mb-2 text-xl font-semibold">Platform Owner Login</h1>
        <p className="mb-6 text-sm text-[var(--charcoal-green)]">
          Sign in to manage public Karura Trail Companion content.
        </p>
        {!setupStatus.isConfigured || params?.setup ? (
          <p className="mb-4 rounded border border-[var(--safety-red)] bg-[var(--mist-cream)] px-3 py-2 text-sm text-[var(--safety-red)]">
            {setupStatus.message ?? 'CMS is not ready. Please confirm the database migration has run.'}
          </p>
        ) : null}
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2 text-sm"
            />
          </div>
          {params?.error ? <p className="text-sm text-[var(--safety-red)]">{params.error}</p> : null}
          <button
            type="submit"
            disabled={!setupStatus.isConfigured && !params?.error?.includes("Too many login attempts")}
            className="w-full rounded bg-[var(--forest-header)] px-4 py-2 text-sm font-semibold text-[var(--warm-ivory)]"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
