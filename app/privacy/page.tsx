import type { Metadata } from "next";
import { getSeo } from "@/lib/seo";
import { getProfile } from "@/lib/content";
import config from "@/content/config.json";
import { PAGE_CONTAINER } from "@/components/ui/PageContainer";

export const metadata: Metadata = getSeo("privacy");

const profile = getProfile();

/** Only describe what is actually switched on, so this page can't drift from the code. */
const analyticsEnabled = !!config.gaMeasurementId;
const clarityEnabled = !!config.clarityProjectId;
const workerEnabled = !!config.aiChatWorkerUrl;
const contactFormEnabled = !!config.web3formsAccessKey;
const commentsEnabled = !!config.giscus?.repo;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="pt-16 md:pt-0">
      <section className="py-16">
        <div className={PAGE_CONTAINER}>
          {/* Page width matches every other page; the text keeps a readable measure. */}
          <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Privacy</h1>
          <p className="text-muted mb-10">
            This is a personal portfolio. There are no accounts and nothing is sold or shared
            for advertising. What follows is everything it measures and every third party
            that can see your visit.
          </p>

          <Section title="What is stored in your browser">
            <p>
              Your theme choice, which pages you have already counted a view for, your
              reactions, and whether you dismissed the chat prompt are kept in this
              browser&apos;s own storage. They never leave your device and are not readable by
              anyone else.
            </p>
          </Section>

          {(analyticsEnabled || clarityEnabled) && (
            <Section title="Analytics">
              {analyticsEnabled && (
                <p>
                  <strong className="text-foreground">Google Analytics 4</strong> records page
                  views and a few interaction events (opening the chat, clicking Hire Me,
                  downloading the CV). It sets its own cookies and processes an abbreviated
                  form of your IP address.
                </p>
              )}
              {clarityEnabled && (
                <p>
                  <strong className="text-foreground">Microsoft Clarity</strong> produces click
                  heatmaps and <strong className="text-foreground">records session
                  replays</strong> — a reconstruction of your mouse movement, scrolling and
                  clicks on the page. Clarity masks text input by default, so what you type
                  into the contact form is not captured, but the replay does show how you moved
                  around the page.
                </p>
              )}
            </Section>
          )}

          {workerEnabled && (
            <Section title="What this site&apos;s own backend records">
              <p>
                A small Cloudflare Worker keeps per-page view counts, reaction totals and
                counts of which areas get clicked. These are aggregate numbers, not tied to
                you.
              </p>
              <p>
                Search terms typed into the site search, and questions asked of the AI
                assistant together with its answers, are logged so the content can be improved.
                These are kept for 90 days and then deleted automatically. Please do not put
                anything confidential into either box.
              </p>
            </Section>
          )}

          {contactFormEnabled && (
            <Section title="Contact form">
              <p>
                The form is delivered by <strong className="text-foreground">Web3Forms</strong>,
                which passes your name, email and message on to me by email. It is used to
                reply to you and nothing else.
              </p>
            </Section>
          )}

          {commentsEnabled && (
            <Section title="Comments">
              <p>
                Comments are powered by <strong className="text-foreground">giscus</strong> and
                stored as GitHub Discussions, so they are public and governed by GitHub&apos;s
                own privacy policy.
              </p>
            </Section>
          )}

          <Section title="Testimonials">
            <p>
              If you submit a testimonial, what you send is reviewed before anything appears
              on the site. Nothing is published until I approve it, and you can ask for it to
              be removed at any time.
            </p>
          </Section>

          <Section title="How to opt out">
            <p>
              Turning on &ldquo;Do Not Track&rdquo; or a tracker blocker in your browser, or an
              extension such as uBlock Origin or Google&apos;s own opt-out add-on, stops the
              analytics scripts above from loading. The site works exactly the same without
              them.
            </p>
          </Section>

          <Section title="Getting your data removed">
            <p>
              Email{" "}
              <a href={`mailto:${profile.email}`} className="text-accent hover:text-accent-hover">
                {profile.email}
              </a>{" "}
              and I will delete anything connected to you that I am able to identify.
            </p>
          </Section>
          </div>
        </div>
      </section>
    </div>
  );
}
