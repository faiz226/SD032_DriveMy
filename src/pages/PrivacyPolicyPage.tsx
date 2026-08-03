import { PRIVACY_CONTACT_EMAIL } from "@/lib/constants";

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-heading font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-muted-foreground">Effective Date: [Insert Date]</p>
      
      <div className="space-y-6 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">1. Introduction</h2>
          <p>Welcome to DriveMy. We respect your privacy and are committed to protecting your personal data in compliance with the Personal Data Protection Act 2010 (PDPA) of Malaysia and other applicable laws.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">2. Data We Collect</h2>
          <p className="mb-2">We collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your email address, and your name if you sign in with Google.</li>
            <li>Theory quiz and mock test results, including your answers and scores.</li>
            <li>Driving simulation results.</li>
            <li>
              Colour vision (Ishihara) screening results. This is health-related
              information, and we hold it for a shorter period than everything else.
            </li>
            <li>Which theory modules you have completed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">3. How We Use Your Data</h2>
          <p>Your data is used solely to track your progress, personalize your learning experience, and improve the application. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">4. How Long We Keep It</h2>
          <p className="mb-2">
            In line with the Retention Principle in section 10 of the PDPA, we do
            not keep your data longer than we need it:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Quiz, mock test and simulation results: <strong>2 years</strong> after each attempt.</li>
            <li>Colour vision screening results: <strong>1 year</strong> after each test.</li>
            <li>
              Your account and theory progress: kept until you delete your
              account, after which everything is removed.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">5. Where Your Data Is Stored</h2>
          <p>
            Your data is stored using Supabase (database, sign-in and file
            storage). If we have enabled error monitoring, technical error
            reports may also be processed by Sentry; we configure it not to send
            personal information, and we strip web addresses that could contain
            sign-in tokens.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">6. Your Rights</h2>
          <p>
            You have the right to access, export and delete your personal data at
            any time from the Settings page. &ldquo;Export My Data&rdquo; downloads
            everything we hold about you as a JSON file, and
            &ldquo;Delete Account&rdquo; permanently removes your account and all
            associated records.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, or want to
            access or delete your data, please contact us at{" "}
            <a
              href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
