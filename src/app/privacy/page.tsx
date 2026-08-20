import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="today">
      <p>
        This policy explains what ClipForge AI collects, why, and what control you have. We collect the minimum needed
        to run the product.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong className="text-white">Account data</strong> — your name, email, hashed password, chosen niche. Your
          password is stored as a salted scrypt hash and is never readable by us.
        </li>
        <li>
          <strong className="text-white">Content you create</strong> — video titles, links, production notes, clips,
          captions and ideas.
        </li>
        <li>
          <strong className="text-white">Usage data</strong> — credit transactions, task completions, plan changes.
        </li>
        <li>
          <strong className="text-white">Technical data</strong> — IP address, used only for rate limiting and abuse
          prevention.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <p>
        We do not store your card details — payments are handled entirely by our payment processor. We do not sell
        personal data. We do not run third-party advertising trackers.
      </p>

      <h2>AI processing</h2>
      <p>
        When you run an AI overview, the video title, platform, goal, duration and your notes are sent to our AI
        provider to generate the result. Your raw video files are not uploaded. Providers are contractually barred from
        training on this data. If no AI provider is configured, processing happens entirely on our own servers.
      </p>

      <h2>Cookies</h2>
      <p>
        We set one strictly necessary cookie, <code className="text-brand-300">cf_session</code>, which keeps you
        signed in. It is httpOnly, SameSite=Lax, and expires after 30 days. There are no advertising or tracking
        cookies.
      </p>

      <h2>Sponsored offers</h2>
      <p>
        When you claim a sponsor offer we record that the claim happened so we can credit your account. We share only
        an anonymous click identifier with the partner — never your email or content.
      </p>

      <h2>Retention</h2>
      <p>
        We keep your data while your account is active. After deletion, everything is permanently removed within 30
        days, except records we must retain for tax or legal reasons.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, export, correct or delete your data at any time from Settings, or by emailing us. If you are in
        the EEA or UK you have rights under GDPR, including the right to complain to your local supervisory authority.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or data requests: <span className="text-brand-300">{SUPPORT_EMAIL}</span>
      </p>
    </LegalLayout>
  );
}
