"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, Github, Linkedin, Code2, CheckCircle, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import profile from "@/content/profile.json";
import config from "@/content/config.json";
import { trackEvent } from "@/lib/analytics";

interface ContactProps {
  showHeading?: boolean;
}

export default function Contact({ showHeading = true }: ContactProps) {
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
            title="Get In Touch"
            subtitle="Have a project in mind or want to chat? I'd love to hear from you."
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
              <h3 className="text-xl font-bold text-white mb-6">
                Let&apos;s Connect
              </h3>

              <p className="text-slate-300 mb-8">
                I&apos;m always open to discussing new projects, creative ideas, or
                opportunities to be part of your vision. Feel free to reach out!
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="text-violet-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-white hover:text-violet-400 transition-colors"
                    >
                      {profile.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <MapPin className="text-violet-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="text-white">{profile.location}</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3">
                <a
                  href={profile.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <Github size={20} />
                </a>
                <a
                  href={profile.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href={profile.social.leetcode}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <Code2 size={20} />
                </a>
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
              <h3 className="text-xl font-bold text-white mb-6">
                Send a Message
              </h3>

              {formStatus === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="text-green-400 mb-4" size={48} />
                  <h4 className="text-xl font-semibold text-white mb-2">Message Sent!</h4>
                  <p className="text-slate-400">
                    Thank you for reaching out. I&apos;ll get back to you soon.
                  </p>
                  <button
                    onClick={() => setFormStatus("idle")}
                    className="mt-4 text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm text-slate-400 mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-slate-400 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm text-slate-400 mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  {formStatus === "error" && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle size={16} />
                      <span>Something went wrong. Please try again.</span>
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
                        Sending...
                      </span>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
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
