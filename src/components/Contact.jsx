/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiUrl } from "../services/api";
import { fetchProducts } from "../services/productsService";
import { useLanguage } from "../i18n/LanguageContext";
import { productText } from "../i18n/format";

/* ─────────────────────────────────────────────────────────────────────
   STATIC DATA
   Subject values are what the server validates and stores, so they stay
   in English; only the labels are translated.
───────────────────────────────────────────────────────────────────── */
const SUBJECTS = [
  { value: "Artwork Enquiry",    label: { en: "Artwork Enquiry",    fa: "استعلام اثر" } },
  { value: "Commission Request", label: { en: "Commission Request", fa: "سفارش اثر" } },
  { value: "Shipping Question",  label: { en: "Shipping Question",  fa: "پرسش درباره ارسال" } },
  { value: "Return / Refund",    label: { en: "Return / Refund",    fa: "مرجوعی / بازپرداخت" } },
  { value: "General Enquiry",    label: { en: "General Enquiry",    fa: "پرسش عمومی" } },
];

/* Sales are arranged directly with the artist — nothing is paid on the
   site — so the FAQ explains that rather than promising checkout,
   shipping rates or a fixed returns policy. */
const COPY = {
  en: {
    eyebrow: "Contact",
    heading: "Contact the Artist",
    intro: "Have a question about a piece, or want to buy or commission one? I'd love to hear from you.",
    formHeading: "Contact Form",
    successTitle: "Message sent!",
    successText: "Thanks for reaching out. I'll be in touch soon.",
    sendAnother: "Send another message",
    enquiringAbout: "Enquiring about",
    removeArtwork: (title) => `Remove ${title} from this enquiry`,
    name: "Full Name",
    namePlaceholder: "Your name",
    email: "Email",
    subject: "Subject",
    selectSubject: "Select a subject",
    message: "Message",
    messagePlaceholder: "Tell me about your enquiry…",
    consent: "I understand my message will be sent to the artist, who lives in Iran, so she can reply to me.",
    send: "Send Message",
    sending: "Sending...",
    notice: "Your details are used only to reply to your message and are deleted after 24 months. See the",
    privacy: "Privacy Policy",
    sendError: "We couldn't send your message. Please try again.",
    faqHeading: "Frequently Asked",
    faqs: [
      {
        question: "How do I buy a painting?",
        answer: "Press “Enquire” on any piece, or use the form above. The artist will reply personally to confirm it's available and agree payment and delivery with you. Nothing is paid through this website.",
      },
      {
        question: "Where are the paintings, and do you ship?",
        answer: "The paintings are currently in Iran. Delivery within Iran is arranged directly with you. For other countries, get in touch and we'll let you know what's possible.",
      },
      {
        question: "What is your return policy?",
        answer: "Returns and refunds are agreed with the artist when you arrange your purchase, so please ask before you buy.",
      },
      {
        question: "Do you accept commissions?",
        answer: "Yes! Please use the form above to describe your idea, and I'll get back to you within a few days.",
      },
    ],
  },
  fa: {
    eyebrow: "تماس",
    heading: "تماس با هنرمند",
    intro: "پرسشی درباره یک اثر دارید یا می‌خواهید اثری بخرید یا سفارش دهید؟ خوشحال می‌شوم از شما بشنوم.",
    formHeading: "فرم تماس",
    successTitle: "پیام ارسال شد!",
    successText: "از پیام شما ممنونم. به‌زودی پاسخ می‌دهم.",
    sendAnother: "ارسال پیام دیگر",
    enquiringAbout: "درباره این اثر",
    removeArtwork: (title) => `حذف ${title} از این پیام`,
    name: "نام و نام خانوادگی",
    namePlaceholder: "نام شما",
    email: "ایمیل",
    subject: "موضوع",
    selectSubject: "یک موضوع انتخاب کنید",
    message: "پیام",
    messagePlaceholder: "پیام خود را بنویسید…",
    consent: "می‌دانم که پیام من برای هنرمند که در ایران زندگی می‌کند فرستاده می‌شود تا بتواند به من پاسخ دهد.",
    send: "ارسال پیام",
    sending: "در حال ارسال…",
    notice: "اطلاعات شما فقط برای پاسخ به پیامتان استفاده می‌شود و پس از ۲۴ ماه حذف می‌شود. برای جزئیات",
    privacy: "سیاست حفظ حریم خصوصی",
    sendError: "ارسال پیام ممکن نشد. لطفاً اطلاعات فرم را بررسی کنید و دوباره تلاش کنید.",
    faqHeading: "پرسش‌های متداول",
    faqs: [
      {
        question: "چگونه می‌توانم یک نقاشی بخرم؟",
        answer: "روی دکمه «استعلام» هر اثر بزنید یا از فرم بالا استفاده کنید. هنرمند شخصاً پاسخ می‌دهد، موجود بودن اثر را تأیید می‌کند و درباره پرداخت و ارسال با شما هماهنگ می‌کند. هیچ پرداختی از طریق این وب‌سایت انجام نمی‌شود.",
      },
      {
        question: "نقاشی‌ها کجا هستند و آیا ارسال دارید؟",
        answer: "نقاشی‌ها در حال حاضر در ایران هستند. ارسال در داخل ایران مستقیماً با شما هماهنگ می‌شود. برای کشورهای دیگر با ما تماس بگیرید تا امکان‌ها را بررسی کنیم.",
      },
      {
        question: "شرایط مرجوعی چیست؟",
        answer: "شرایط مرجوعی و بازپرداخت هنگام هماهنگی خرید با هنرمند توافق می‌شود؛ لطفاً پیش از خرید بپرسید.",
      },
      {
        question: "آیا سفارش اثر می‌پذیرید؟",
        answer: "بله! ایده خود را در فرم بالا شرح دهید تا ظرف چند روز پاسخ بدهم.",
      },
    ],
  },
};

const EMPTY_FORM = { name: "", email: "", subject: "", message: "", transferConsent: false };

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
        className="flex w-full items-center justify-between px-6 py-4 text-start text-sm font-medium text-[#2F2A26] hover:bg-[#E8DCD0] transition"
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
          isOpen ? "max-h-60" : "max-h-0"
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
     • Contact form
     • FAQ accordion section

   When navigated to with ?product=<id> (e.g. from the Gallery "Enquire"
   button), the page scrolls to the form, pre-selects "Artwork Enquiry",
   shows which artwork the enquiry is about, and sends its id with the
   message so the artist knows which piece was asked about.

   Messages go to the artist in Iran. Iran has no UK data-protection
   adequacy decision, so the visitor must tick the consent box (UK GDPR
   Article 49(1)(a)); the server rejects the message without it.
───────────────────────────────────────────────────────────────────── */
export default function Contact() {
  const location = useLocation();
  const formRef = useRef(null);
  const { lang } = useLanguage();
  const c = COPY[lang];

  const [product, setProduct] = useState(null); // artwork being enquired about
  const [openFaq, setOpenFaq] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  /* ── Auto-scroll & pre-fill when arriving from an Enquire button ── */
  useEffect(() => {
    // The page stays mounted when only ?product changes (e.g. the Contact
    // nav link from /contact?product=x), so drop the previous artwork first
    setProduct(null);
    const productId = new URLSearchParams(location.search).get("product");
    if (!productId) return;

    setForm((prev) => ({ ...prev, subject: "Artwork Enquiry" }));
    // Small delay so the page has time to paint before scrolling
    const scrollTimer = setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    let active = true;
    fetchProducts()
      .then((products) => {
        if (active) setProduct(products.find((p) => p.id === productId) ?? null);
      })
      .catch(() => {}); // the enquiry still works without the artwork preview

    return () => {
      active = false;
      clearTimeout(scrollTimer);
    };
  }, [location.search]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSubmitError("");
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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
        body: JSON.stringify({ ...form, productId: product?.id, lang }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        // Server messages are in English — Persian visitors get the Persian fallback
        throw new Error((lang === "en" && (payload.error || payload.message)) || c.sendError);
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || c.sendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitError("");
    setProduct(null);
    setForm(EMPTY_FORM);
  };

  return (
    <main className="min-h-screen bg-[#F6F1EB] pt-28 pb-20">

      {/* ── Page header ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16">
        <div className="mb-10 border-b border-[#E8DCD0] pb-6">
          <p className="header-item text-sm uppercase tracking-[0.3em] text-[#D98C7A]" style={{ "--header-delay": "80ms" }}>{c.eyebrow}</p>
          <h1 className="header-item mt-3 text-4xl font-semibold text-[#2F2A26]" style={{ "--header-delay": "200ms" }}>{c.heading}</h1>
          <p className="header-item mt-4 max-w-2xl text-base text-gray-600" style={{ "--header-delay": "320ms" }}>
            {c.intro}
          </p>
        </div>
      </section>

      {/* ── Form ──────────────────────────────────────────────────── */}
      <section
        ref={formRef}
        className="header-item mx-auto w-full max-w-5xl px-6 md:px-10 xl:px-16"
        style={{ "--header-delay": "480ms" }}
      >

          {/* ── Contact Form ────────────────────────────────────────
              Controlled form — all state lives in `form`.
              On submit, flips to a success screen.
          ─────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#E8DCD0] bg-[#E8DCD0] p-6 sm:p-10">
            <h2 className="mb-8 text-2xl font-semibold text-[#2F2A26]">{c.formHeading}</h2>

            {submitted ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D98C7A]">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-[#2F2A26]">{c.successTitle}</p>
                <p className="max-w-xs text-sm text-gray-500">
                  {c.successText}
                </p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-sm text-gray-400 underline underline-offset-2 hover:text-[#2F2A26] transition"
                >
                  {c.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {submitError && (
                  <div className="rounded-lg border border-[#d8a29a] bg-[#f4ddd8] px-4 py-3 text-sm text-[#7a4036]">
                    {submitError}
                  </div>
                )}

                {/* Artwork this enquiry is about (set by ?product=<id>) */}
                {product && (
                  <div className="flex items-center gap-4 rounded-xl border border-[#D9CBBE] bg-white/70 p-3">
                    <img
                      src={product.thumbnail || product.image}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#6F8F8B]">{c.enquiringAbout}</p>
                      <p className="truncate font-medium text-[#2F2A26]">{productText(product, "title", lang)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProduct(null)}
                      aria-label={c.removeArtwork(productText(product, "title", lang))}
                      className="shrink-0 px-2 text-gray-400 transition hover:text-[#2F2A26]"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Name + Email row */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-base font-medium text-gray-700">
                      {c.name}
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      maxLength={100}
                      value={form.name}
                      onChange={handleChange}
                      placeholder={c.namePlaceholder}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[#2F2A26] placeholder-gray-400 transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A] bg-white/70"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-base font-medium text-gray-700">
                      {c.email}
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      dir="ltr"
                      required
                      autoComplete="email"
                      maxLength={254}
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[#2F2A26] placeholder-gray-400 transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A] bg-white/70 rtl:text-end"
                    />
                  </div>
                </div>

                {/* Subject dropdown */}
                <div>
                  <label htmlFor="contact-subject" className="mb-1.5 block text-base font-medium text-gray-700">
                    {c.subject}
                  </label>
                  <div className="relative">
                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white/70 px-4 py-3 pe-10 text-base text-[#2F2A26] transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A]"
                    >
                      <option value="" disabled>{c.selectSubject}</option>
                      {SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label[lang]}</option>
                      ))}
                    </select>
                    {/* Custom chevron for the select */}
                    <svg
                      className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-base font-medium text-gray-700">
                    {c.message}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    dir="auto"
                    required
                    rows={6}
                    maxLength={5000}
                    value={form.message}
                    onChange={handleChange}
                    placeholder={c.messagePlaceholder}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-base text-[#2F2A26] placeholder-gray-400 transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A] bg-white/70"
                  />
                </div>

                {/* Consent to send the message to Iran (UK GDPR Art. 49(1)(a)) */}
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="transferConsent"
                    required
                    checked={form.transferConsent}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#D98C7A]"
                  />
                  <span>{c.consent}</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-lg bg-[#D98C7A] py-3.5 text-base font-semibold text-white transition hover:bg-[#bf7360]"
                >
                  {isSubmitting ? c.sending : c.send}
                </button>

                {/* Privacy notice at the point of collection (UK GDPR) */}
                <p className="text-center text-xs leading-relaxed text-gray-500">
                  {c.notice}{" "}
                  <Link to="/privacy" className="underline underline-offset-2 hover:text-[#2F2A26]">{c.privacy}</Link>
                  {lang === "fa" ? " را ببینید." : "."}
                </p>
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
          <h2 className="mb-8 text-2xl font-semibold text-[#2F2A26]">{c.faqHeading}</h2>
          <div className="flex flex-col gap-3">
            {c.faqs.map((faq, i) => (
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
