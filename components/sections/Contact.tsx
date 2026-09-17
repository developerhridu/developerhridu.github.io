"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, Github, Linkedin, Code2, CheckCircle, AlertCircle } from "lucide-react";
import UpworkIcon from "@/components/ui/icons/UpworkIcon";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import profile from "@/content/profile.json";
import config from "@/content/config.json";
import uiStrings from "@/content/ui-strings.json";
import { getSectionCopy } from "@/lib/sections";
import { trackEvent } from "@/lib/analytics";

const t = uiStrings.contact;

interface ContactProps {
  showHeading?: boolean;
}

export default function Contact({ showHeading = true }: ContactProps) {
  const sectionCopy = getSectionCopy("contact");
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("loading");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_key: config.web3formsAccessKey,
          name: formData.name,
          email: formData.email,
          message: formData.message,
          subject: `Portfolio Contact from ${formData.name}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormStatus("success");
        setFormData({ name: "", email: "", message: "" });
        trackEvent("contact_form_submit", { status: "success" });
      } else {
        setFormStatus("error");
        trackEvent("contact_form_submit", { status: "error" });
      }
    } catch {
      setFormStatus("error");
      trackEvent("contact_form_submit", { status: "error" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {showHeading && (
          <SectionHeading
            eyebrow={sectionCopy.eyebrow}
            title={sectionCopy.title}
            subtitle={sectionCopy.subtitle}
          />
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard hover={false} className="h-full">
              <h3 className="text-xl font-bold text-foreground mb-6">
                {t.letsConnectTitle}
              </h3>

              <p className="text-muted mb-8">
                {t.letsConnectIntro}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Mail className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted">{t.emailLabel}</p>
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {profile.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <MapPin className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted">{t.locationLabel}</p>
                    <p className="text-foreground">{profile.location}</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3">
                <a
                  href={profile.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-surface hover:bg-surface-hover border border-border hover:border-accent/40 rounded-lg flex items-center justify-center text-muted hover:text-foreground transition-all"
                >
                  <Github size={20} />
                </a>
                <a
                  href={profile.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-surface hover:bg-surface-hover border border-border hover:border-accent/40 rounded-lg flex items-center justify-center text-muted hover:text-foreground transition-all"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href={profile.social.leetcode}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-surface hover:bg-surface-hover border border-border hover:border-accent/40 rounded-lg flex items-center justify-center text-muted hover:text-foreground transition-all"
                >
                  <Code2 size={20} />
                </a>
                {profile.social.upwork && (
                  <a
                    href={profile.social.upwork}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-surface hover:bg-surface-hover border border-border hover:border-accent/40 rounded-lg flex items-center justify-center text-muted hover:text-foreground transition-all"
                  >
                    <UpworkIcon size={20} />
                  </a>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard hover={false} className="h-full">
              <h3 className="text-xl font-bold text-foreground mb-6">
                {t.sendMessageTitle}
              </h3>

              {formStatus === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="text-green-400 mb-4" size={48} />
                  <h4 className="text-xl font-semibold text-foreground mb-2">{t.messageSentTitle}</h4>
                  <p className="text-muted">
                    {t.messageSentBody}
                  </p>
                  <button
                    onClick={() => setFormStatus("idle")}
                    className="mt-4 text-accent hover:text-accent-hover transition-colors"
                  >
                    {t.sendAnotherMessage}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm text-muted mb-2"
                    >
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                      placeholder={t.namePlaceholder}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-muted mb-2"
                    >
                      {t.emailFieldLabel}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                      placeholder={t.emailPlaceholder}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm text-muted mb-2"
                    >
                      {t.messageLabel}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors resize-none"
                      placeholder={t.messagePlaceholder}
                    />
                  </div>

                  {formStatus === "error" && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle size={16} />
                      <span>{t.errorText}</span>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => {}}
                  >
                    {formStatus === "loading" ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {t.sending}
                      </span>
                    ) : (
                      <>
                        <Send size={18} />
                        {t.sendMessageButton}
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
