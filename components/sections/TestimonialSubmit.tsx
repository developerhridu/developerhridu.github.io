"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import config from "@/content/config.json";
import { trackEvent } from "@/lib/analytics";

const WORKER_URL = config.aiChatWorkerUrl.replace(/\/$/, "");

const inputClass =
  "w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors";

export default function TestimonialSubmit() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "not-configured">(
    "idle"
  );
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    company: "",
    email: "",
    linkedinUrl: "",
    quote: "",
    honeypot: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`${WORKER_URL}/testimonials/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.status === 501) {
        setStatus("not-configured");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        trackEvent("testimonial_submit", { status: "error" });
        return;
      }

      setStatus("success");
      trackEvent("testimonial_submit", { status: "success" });
      setFormData({ name: "", role: "", company: "", email: "", linkedinUrl: "", quote: "", honeypot: "" });
    } catch {
      setStatus("error");
      trackEvent("testimonial_submit", { status: "error" });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Testimonials"
          title="Share Your Experience"
          subtitle="Worked with me? I'd love to hear about it — your testimonial will be reviewed before it's published."
        />

        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard hover={false}>
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="text-green-400 mb-4" size={48} />
                  <h4 className="text-xl font-semibold text-foreground mb-2">Thank you!</h4>
                  <p className="text-muted">
                    Your testimonial has been submitted and will appear on the site once reviewed.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-4 text-accent hover:text-accent-hover transition-colors"
                  >
                    Submit another
                  </button>
                </div>
              ) : status === "not-configured" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="text-yellow-500 mb-4" size={48} />
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    Submissions aren&apos;t open yet
                  </h4>
                  <p className="text-muted">
                    This form isn&apos;t fully set up yet — please reach out via the Contact page instead.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
                  <input
                    type="text"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleChange}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm text-muted mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm text-muted mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="role" className="block text-sm text-muted mb-2">
                        Role (optional)
                      </label>
                      <input
                        type="text"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Engineering Manager"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm text-muted mb-2">
                        Company (optional)
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Acme Inc"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="linkedinUrl" className="block text-sm text-muted mb-2">
                      LinkedIn URL (optional)
                    </label>
                    <input
                      type="url"
                      id="linkedinUrl"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label htmlFor="quote" className="block text-sm text-muted mb-2">
                      Your testimonial
                    </label>
                    <textarea
                      id="quote"
                      name="quote"
                      rows={5}
                      value={formData.quote}
                      onChange={handleChange}
                      required
                      className={`${inputClass} resize-none`}
                      placeholder="What was it like working together?"
                    />
                  </div>

                  {status === "error" && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle size={16} />
                      <span>Something went wrong. Please try again.</span>
                    </div>
                  )}

                  <Button variant="primary" className="w-full justify-center" onClick={() => {}}>
                    {status === "loading" ? (
                      "Submitting…"
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Testimonial
                      </>
                    )}
                  </Button>
                </form>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
