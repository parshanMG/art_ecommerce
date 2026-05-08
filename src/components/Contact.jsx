/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "../services/api";

/* ─────────────────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────────────────── */
const SUBJECTS = [
  "Artwork Enquiry",
  "Commission Request",
  "Shipping Question",
  "Return / Refund",
  "General Enquiry",
];

const FAQS = [
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, I ship worldwide. Shipping costs are calculated at checkout based on your location and the size of the piece.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Original works are final sale. Prints may be returned within 14 days if they arrive damaged — please photograph the damage and get in touch.",
  },
  {
    question: "Do you accept commissions?",
    answer:
      "Yes! Please use the form above to describe your idea, and I'll get back to you within a few days.",
  },
];

/* ─────────────────────────────────────────────────────────────────────
   FAQ ITEM
   Individual accordion row — toggles open/closed on click.
───────────────────────────────────────────────────────────────────── */
function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-[#2F2A26] hover:bg-[#E8DCD0] transition"
      >
        <span>{faq.question}</span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-40" : "max-h-0"
        }`}
      >
        <p className="px-6 pb-4 pt-1 text-sm text-gray-600">{faq.answer}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CONTACT PAGE
   Rendered at the "/contact" route. Contains:
     • Page header
     • Two-column layout: contact form | other ways to connect
     • FAQ accordion section

   When navigated to with ?product=<id> (e.g. from the Gallery "Enquire"
   button), the page scrolls to the form and pre-selects "Artwork Enquiry".
───────────────────────────────────────────────────────────────────── */
export default function Contact() {
  const location = useLocation();
  const formRef = useRef(null);

  const [openFaq, setOpenFaq] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  /* ── Auto-scroll & pre-fill when arriving from an Enquire button ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("product")) {
      setForm((prev) => ({ ...prev, subject: "Artwork Enquiry" }));
      // Small delay so the page has time to paint before scrolling
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location.search]);

  const handleChange = (e) => {
    setSubmitError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || payload.message || "We couldn't send your message. Please try again.");
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || "We couldn't send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitError("");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-[#F6F1EB] pt-28 pb-20">

      {/* ── Page header ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16">
        <div className="mb-10 border-b border-[#E8DCD0] pb-6">
          <p className="header-item text-sm uppercase tracking-[0.3em] text-[#D98C7A]" style={{ "--header-delay": "80ms" }}>Contact</p>
          <h1 className="header-item mt-3 text-4xl font-semibold text-[#2F2A26]" style={{ "--header-delay": "200ms" }}>Contact the Artist</h1>
          <p className="header-item mt-4 max-w-2xl text-base text-gray-600" style={{ "--header-delay": "320ms" }}>
            Have a question about a piece or a commission? I'd love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Form + Other Ways ─────────────────────────────────────── */}
      <section
        ref={formRef}
        className="header-item mx-auto w-full max-w-5xl px-6 md:px-10 xl:px-16"
        style={{ "--header-delay": "480ms" }}
      >

          {/* ── Contact Form ────────────────────────────────────────
              Controlled form — all state lives in `form`.
              On submit, flips to a success screen.
          ─────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#E8DCD0] bg-[#E8DCD0] p-10">
            <h2 className="mb-8 text-2xl font-semibold text-[#2F2A26]">Contact Form</h2>

            {submitted ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D98C7A]">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-[#2F2A26]">Message sent!</p>
                <p className="max-w-xs text-sm text-gray-500">
                  Thanks for reaching out. I'll be in touch soon.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-sm text-gray-400 underline underline-offset-2 hover:text-[#2F2A26] transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {submitError && (
                  <div className="rounded-lg border border-[#d8a29a] bg-[#f4ddd8] px-4 py-3 text-sm text-[#7a4036]">
                    {submitError}
                  </div>
                )}

                {/* Name + Email row */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-base font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[#2F2A26] placeholder-gray-400 transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A] bg-white/70"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-base font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[#2F2A26] placeholder-gray-400 transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A] bg-white/70"
                    />
                  </div>
                </div>

                {/* Subject dropdown */}
                <div>
                  <label htmlFor="contact-subject" className="mb-1.5 block text-base font-medium text-gray-700">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white/70 px-4 py-3 pr-10 text-base text-[#2F2A26] transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A]"
                    >
                      <option value="" disabled>Select a subject</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {/* Custom chevron for the select */}
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-base font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell me about your enquiry…"
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-base text-[#2F2A26] placeholder-gray-400 transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A] bg-white/70"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-lg bg-[#D98C7A] py-3.5 text-base font-semibold text-white transition hover:bg-[#bf7360]"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* ── Other Ways to Connect (commented out for now) ──────────
          <div className="rounded-2xl border border-[#E8DCD0] bg-[#E8DCD0] p-8">
            <h2 className="mb-6 text-xl font-semibold text-[#2F2A26]">Other Ways</h2>

            <ul className="flex flex-col gap-6">
              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2F2A26] text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22H7.75A5.75 5.75 0 0 1 2 16.25V7.75A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25V7.75A4.25 4.25 0 0 0 16.25 3.5H7.75zm4.25 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.75-.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400">Instagram</p>
                  <a
                    href="https://www.instagram.com/maryammohseni.art/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#2F2A26] hover:text-[#D98C7A] transition"
                  >
                    @maryammohseni.art
                  </a>
                </div>
              </li>
            </ul>
          </div>
          ── end Other Ways ── */}

      </section>

      {/* ── FAQ Accordion ─────────────────────────────────────────── */}
      <section className="header-item mx-auto mt-16 w-full max-w-5xl px-6 md:px-10 xl:px-16" style={{ "--header-delay": "560ms" }}>
        <div className="border-t border-gray-200 pt-10">
          <h2 className="mb-8 text-2xl font-semibold text-[#2F2A26]">Frequently Asked</h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <FaqItem
                key={i}
                faq={faq}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
