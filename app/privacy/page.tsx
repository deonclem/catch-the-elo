export const metadata = {
  title: 'Privacy Policy — Gueslo',
}

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 pb-24 md:pb-12">
      <h1 className="mb-8 text-2xl font-bold">Privacy Policy</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">What Gueslo is</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Gueslo is a free browser game where you guess the Elo rating of real
          chess games. Chess game data is sourced from Lichess open-source
          databases and used solely for gameplay purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Account &amp; data</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Creating an account is optional. If you sign up, we store your email
          address, chosen username, and game results (scores, guesses). This
          data is used only to display your stats and leaderboard position. We
          do not sell or share your personal data with third parties.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Google sign-in</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You may sign in with Google. When you do, we receive your email
          address from Google solely to create and identify your account. We do
          not access your Google contacts, Drive, or any other Google data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Cookies</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We use a session cookie to keep you logged in, and a short-lived
          cookie to remember your daily game result across page reloads. No
          third-party tracking cookies are used.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Analytics</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We use Vercel Analytics to collect anonymous, aggregated page-view
          data (no personal identifiers). This helps us understand how the app
          is used.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Deleting your account</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You can delete your account at any time from your profile page. This
          permanently removes your email and game history from our database.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Contact</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Questions? Reach out at{' '}
          <a
            href="mailto:contact@gueslo.app"
            className="text-foreground underline underline-offset-4"
          >
            contact@gueslo.app
          </a>
          .
        </p>
      </section>
    </main>
  )
}
