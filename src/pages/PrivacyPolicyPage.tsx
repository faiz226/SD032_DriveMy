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
          <p>We may collect personal data such as your name, email address, and performance data from quizzes and mock tests to provide and improve our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">3. How We Use Your Data</h2>
          <p>Your data is used solely to track your progress, personalize your learning experience, and improve the application. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">4. Your Rights</h2>
          <p>You have the right to access, export, and request the deletion of your personal data at any time via the Profile settings page.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-foreground">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@drivemy.local.</p>
        </section>
      </div>
    </div>
  );
}
