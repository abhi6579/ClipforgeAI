import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="today">
      <p>
        These terms govern your use of ClipForge AI (&quot;the Service&quot;). By creating an account you agree to
        them. If you don&apos;t agree, please don&apos;t use the Service.
      </p>

      <h2>1. Your account</h2>
      <p>
        You must provide an accurate email address and keep your password secure. You are responsible for all activity
        under your account. One person or organisation per account; sharing credentials to bypass plan limits is not
        permitted.
      </p>

      <h2>2. Your content</h2>
      <p>
        You keep all rights to the videos, notes and text you submit. You grant us only the limited licence needed to
        process that content in order to generate summaries, scores, clip suggestions and captions for you. We do not
        sell your content, and we do not use it to train third-party models.
      </p>
      <p>
        You confirm you have the rights to any material you submit and that it does not infringe copyright or contain
        unlawful content.
      </p>

      <h2>3. Credits</h2>
      <ul>
        <li>Credits are a prepaid, in-app unit used to run AI features. They have no cash value.</li>
        <li>Credits earned from games, tasks and sponsor offers are promotional and non-refundable.</li>
        <li>We may cap or reverse credits obtained through automation, fake accounts or offer fraud.</li>
        <li>Unused credits expire 12 months after they are issued.</li>
      </ul>

      <h2>4. Plans and billing</h2>
      <p>
        Paid plans renew monthly until cancelled. You can cancel at any time and keep access until the end of the
        billing period. Fees already paid are non-refundable except where required by law. We&apos;ll give at least 30
        days notice before any price change.
      </p>

      <h2>5. AI output</h2>
      <p>
        Scores, hooks, captions and cut suggestions are generated automatically and are advisory only. We make no
        guarantee of views, reach, revenue or any specific result. Always review output before publishing it.
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>No scraping, reverse engineering, or automated abuse of the API.</li>
        <li>No uploading content that is illegal, hateful, or infringes someone else&apos;s rights.</li>
        <li>No reselling the Service&apos;s output as your own competing product.</li>
      </ul>

      <h2>7. Termination</h2>
      <p>
        You can delete your account at any time. We may suspend accounts that breach these terms, with notice where
        practical. On termination your data is deleted within 30 days.
      </p>

      <h2>8. Liability</h2>
      <p>
        The Service is provided &quot;as is&quot;. To the maximum extent permitted by law our total liability is
        limited to the amount you paid us in the previous 12 months.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms: <span className="text-brand-300">{SUPPORT_EMAIL}</span>
      </p>
    </LegalLayout>
  );
}
