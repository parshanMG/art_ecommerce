/* ─────────────────────────────────────────────────────────────────────
   PRIVACY POLICY PAGE
   Rendered at "/privacy", in English and Persian. Written for this
   setup:
     • the site is run from the UK (so UK GDPR applies) on behalf of
       the artist, who lives in Iran
     • contact-form messages are forwarded to her — a transfer to a
       country with no UK adequacy decision, so it relies on the
       visitor's explicit consent (the checkbox on the contact form)
     • no payments happen on the site; sales are arranged directly

   ── BEFORE LAUNCH ─────────────────────────────────────────────────
   Fill in every constant marked TODO. The policy must name the real
   person responsible and a working contact address.

   ── KEEP IT ACCURATE ──────────────────────────────────────────────
   • Contact messages aren't stored on the server — they're emailed.
     They reach only the artist's inbox; RETENTION is how long she keeps
     them after the last contact. Each email also carries the time the
     visitor consented, so it doubles as the consent record.
   • Resend, the email provider, keeps a copy of every email it sends
     for PROVIDER_RETENTION. Check it still matches Resend's plan
     (resend.com/pricing) and update it if you change plan or provider.
   • If you add analytics, embeds (YouTube, Instagram feeds, maps),
     newsletters, online payments or any new third-party service,
     update this page first — most of those also need a cookie banner.
   • Change both languages together and update LAST_UPDATED.
   • In the text, {tokens} are filled in by the renderer below.
─────────────────────────────────────────────────────────────────── */

import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

/* ── Editable constants ──────────────────────────────────────────── */
const OPERATOR_NAME     = "[Your full name]";                         // TODO: whoever runs the site (you)
const CONTACT_EMAIL     = "privacy@example.com";                      // TODO: an address you read
const HOSTING_PROVIDERS = "[Website and server hosting provider(s)]"; // TODO: e.g. "Netlify and Render"
const LAST_UPDATED      = new Date("2026-10-29");
const ARTIST_NAME       = { en: "Maryam Mohseni", fa: "مریم محسنی" };
const RETENTION         = { en: "24 months", fa: "۲۴ ماه" };
const PROVIDER_RETENTION = { en: "30 days", fa: "۳۰ روز" };          // Resend's retention on its current plans

/* ── Policy text ─────────────────────────────────────────────────────
   Each section: { title, blocks }. A block is a paragraph string,
   { heading } for a sub-heading, or { list: [...] }.
─────────────────────────────────────────────────────────────────── */
const COPY = {
  en: {
    eyebrow: "Legal",
    heading: "Privacy Policy",
    updated: "Last updated",
    summaryTitle: "In short",
    summary: "This website shows the work of the artist {artist}. It only collects what you choose to send through the contact form. It doesn't take payments, and it doesn't use analytics, advertising or tracking cookies. Your details are never sold.",
    contactLinkText: "get in touch",
    icoText: "ico.org.uk",
    sections: [
      {
        title: "1. Who is responsible for your data",
        blocks: [
          "This website is run by {operator}, based in the United Kingdom, on behalf of the artist {artist}, who lives in Iran. {operator} is the “controller” responsible for personal data collected through this website, and UK data protection law (the UK GDPR and the Data Protection Act 2018) applies.",
          "When you arrange a purchase or commission, the artist uses your details to deal with you directly and is responsible for that use.",
          "Questions about this policy or your data: {email}.",
        ],
      },
      {
        title: "2. What we collect and why",
        blocks: [
          { heading: "When you use the contact form" },
          { list: [
            "Your name, email address, the subject you choose, your message, the language you were using on the site and, if you came from an “Enquire” button, which artwork you asked about.",
            "We use this only to pass your message to the artist so she can reply to you and, if you wish, arrange a purchase or commission.",
            "Lawful basis: our legitimate interest in answering messages sent to us, and — where you're asking about buying or commissioning a piece — taking steps at your request before entering into a contract.",
            "You'll receive an automatic confirmation email. It confirms the subject you chose but doesn't repeat your message.",
            "You don't have to give us these details, but we can't reply without an email address.",
          ] },
          { heading: "Buying artwork" },
          "No payments are made through this website. If you decide to buy a piece, payment and delivery are arranged directly between you and the artist, outside this website. Please don't send card or bank details through the contact form.",
          { heading: "When you visit the site" },
          { list: [
            "Like every website, our hosting provider's servers receive technical information such as your IP address, browser type and the pages you request, so the site can be delivered to you and protected from abuse.",
            "Your IP address is also used briefly to limit how often forms can be submitted, to stop spam. It is held in memory only and never stored.",
            "Lawful basis: our legitimate interest in running a secure website.",
          ] },
          "We don't use your data for automated decision-making or profiling, and we don't send marketing emails.",
        ],
      },
      {
        title: "3. Cookies and storage",
        blocks: [
          "This website doesn't use cookies. Fonts and images are served from our own site, so visiting it doesn't send your details to third parties such as Google.",
          "If you choose a language using the flags at the bottom of the page, that choice is saved in your browser's local storage so the site opens in the same language next time. It's saved only when you choose it, it's needed to give you the setting you asked for, and you can clear it in your browser settings at any time.",
        ],
      },
      {
        title: "4. Who we share it with",
        blocks: [
          { list: [
            "The artist, {artist}, in Iran — receives your message by email so she can reply to you.",
            "{hosting} — host the website and the server that sends contact messages.",
            "Resend (resend.com) — sends the emails generated by the contact form. It keeps a copy of each email for {providerRetention}, then deletes it.",
          ] },
          "Service providers act on our instructions and may not use your data for their own purposes. We may also disclose information if the law requires us to. We never sell your personal data.",
          "Links to Instagram take you to Instagram's own website, which has its own privacy policy. Nothing is loaded from Instagram unless you click the link.",
        ],
      },
      {
        title: "5. Transfers outside the UK",
        blocks: [
          "Your message is sent to the artist in Iran. The UK has not recognised Iran as providing adequate protection for personal data, and the usual UK safeguards can't be relied on there. We therefore only send your message with your explicit consent, which you give by ticking the box on the contact form (UK GDPR Article 49(1)(a)). Without that consent we can't pass your message on.",
          "The risks: data protection law in Iran differs from UK law, and you may not be able to enforce your UK rights against people or organisations there. Please don't include anything sensitive in your message.",
          "Some of our service providers may store or process data outside the UK, for example in the United States. Those transfers are protected by UK adequacy regulations (such as the UK–US Data Bridge) or approved contract clauses.",
        ],
      },
      {
        title: "6. How long we keep it",
        blocks: [
          { list: [
            "Contact form messages aren't stored on this website — they're sent straight on by email. Our email provider, Resend, deletes its copy {providerRetention} after sending.",
            "The artist keeps your emails only as long as needed to deal with your enquiry or purchase, and no longer than {retention} after your last contact.",
            "Server logs kept by our hosting provider are deleted on its standard short cycle.",
          ] },
        ],
      },
      {
        title: "7. Your rights",
        blocks: [
          "Depending on where you live, you have the right to:",
          { list: [
            "get a copy of the personal data we hold about you",
            "have inaccurate data corrected",
            "have your data deleted",
            "restrict or object to how we use it",
            "receive your data in a portable format",
            "withdraw your consent to the transfer for the future — messages already sent can't be recalled, but you can ask for them to be deleted",
          ] },
          "To use any of these rights, email {email}. We'll respond within one month. There's no charge.",
          "If you're unhappy with how we've handled your data, please tell us first so we can put it right. You can also complain to a data protection regulator — in the UK that's the Information Commissioner's Office ({ico}), and in the EU it's the authority in your country.",
        ],
      },
      {
        title: "8. Visitors in the United States",
        blocks: [
          { list: [
            "We don't sell or share your personal information for advertising, and we haven't done so in the past 12 months.",
            "Do Not Track: we don't track visitors across other websites, so we treat every visitor the same whether or not their browser sends a Do Not Track signal.",
            "You can review or correct the information we hold by emailing us at the address above.",
          ] },
        ],
      },
      {
        title: "9. Children",
        blocks: [
          "This website isn't aimed at children under 13, and we don't knowingly collect their personal data. If you believe a child has sent us their details, contact us and we'll delete them.",
        ],
      },
      {
        title: "10. Security",
        blocks: [
          "The site is served over an encrypted (HTTPS) connection, and access to the email accounts that receive your messages is restricted. No system is completely secure, but we take reasonable steps to protect your data.",
        ],
      },
      {
        title: "11. Changes to this policy",
        blocks: [
          "If we change how we use your data we'll update this page and the date at the top. If you have any questions, {contact} or email {email}.",
        ],
      },
    ],
  },

  fa: {
    eyebrow: "حقوقی",
    heading: "سیاست حفظ حریم خصوصی",
    updated: "آخرین به‌روزرسانی",
    summaryTitle: "به‌طور خلاصه",
    summary: "این وب‌سایت آثار هنرمند، {artist}، را نمایش می‌دهد و فقط اطلاعاتی را جمع‌آوری می‌کند که خودتان از طریق فرم تماس می‌فرستید. هیچ پرداختی در آن انجام نمی‌شود و از ابزارهای آمارگیری، تبلیغات یا کوکی‌های ردیابی استفاده نمی‌کند. اطلاعات شما هرگز فروخته نمی‌شود.",
    contactLinkText: "با ما تماس بگیرید",
    icoText: "ico.org.uk",
    translationNote: "این ترجمه برای سهولت ارائه شده است؛ در صورت هرگونه اختلاف، نسخه انگلیسی ملاک است.",
    sections: [
      {
        title: "۱. چه کسی مسئول اطلاعات شماست",
        blocks: [
          "این وب‌سایت را {operator}، ساکن بریتانیا، از طرف هنرمند، {artist}، که در ایران زندگی می‌کند، اداره می‌کند. {operator} «کنترل‌کننده» یعنی مسئول اطلاعات شخصی‌ای است که از طریق این وب‌سایت جمع‌آوری می‌شود، و قانون حفاظت از داده‌های بریتانیا (UK GDPR و قانون حفاظت از داده‌ها مصوب ۲۰۱۸) بر آن حاکم است.",
          "هنگامی که برای خرید یا سفارش اثری هماهنگ می‌کنید، هنرمند از اطلاعات شما برای ارتباط مستقیم با شما استفاده می‌کند و مسئول این استفاده است.",
          "برای پرسش درباره این سیاست یا اطلاعاتتان: {email}",
        ],
      },
      {
        title: "۲. چه اطلاعاتی جمع‌آوری می‌کنیم و چرا",
        blocks: [
          { heading: "هنگام استفاده از فرم تماس" },
          { list: [
            "نام، نشانی ایمیل، موضوعی که انتخاب می‌کنید، پیام شما، زبانی که در سایت استفاده می‌کردید و — اگر از دکمه «استعلام» آمده باشید — اثری که درباره‌اش پرسیده‌اید.",
            "از این اطلاعات فقط برای رساندن پیام شما به هنرمند استفاده می‌کنیم تا بتواند پاسخ دهد و در صورت تمایل شما، خرید یا سفارش اثری را هماهنگ کند.",
            "مبنای قانونی: منفعت مشروع ما در پاسخ دادن به پیام‌ها، و — اگر درباره خرید یا سفارش اثری می‌پرسید — انجام اقداماتی به درخواست شما پیش از بستن قرارداد.",
            "یک ایمیل خودکار برای تأیید دریافت پیام برایتان فرستاده می‌شود. این ایمیل موضوعی را که انتخاب کرده‌اید تأیید می‌کند، اما متن پیامتان را تکرار نمی‌کند.",
            "الزامی به ارائه این اطلاعات ندارید، اما بدون نشانی ایمیل نمی‌توانیم پاسخ دهیم.",
          ] },
          { heading: "خرید آثار" },
          "هیچ پرداختی از طریق این وب‌سایت انجام نمی‌شود. اگر تصمیم به خرید اثری بگیرید، پرداخت و ارسال مستقیماً میان شما و هنرمند و خارج از این وب‌سایت هماهنگ می‌شود. لطفاً اطلاعات کارت یا حساب بانکی خود را از طریق فرم تماس نفرستید.",
          { heading: "هنگام بازدید از سایت" },
          { list: [
            "مانند هر وب‌سایت دیگری، سرورهای ارائه‌دهنده میزبانی ما اطلاعات فنی‌ای مانند نشانی IP، نوع مرورگر و صفحه‌هایی را که درخواست می‌کنید دریافت می‌کنند تا سایت به شما نمایش داده شود و در برابر سوءاستفاده محافظت شود.",
            "نشانی IP شما همچنین برای مدت کوتاهی برای محدود کردن دفعات ارسال فرم و جلوگیری از هرزنامه استفاده می‌شود. این اطلاعات فقط در حافظه موقت نگه داشته می‌شود و هرگز ذخیره نمی‌شود.",
            "مبنای قانونی: منفعت مشروع ما در اداره یک وب‌سایت امن.",
          ] },
          "از اطلاعات شما برای تصمیم‌گیری خودکار یا پروفایل‌سازی استفاده نمی‌کنیم و ایمیل تبلیغاتی نمی‌فرستیم.",
        ],
      },
      {
        title: "۳. کوکی‌ها و ذخیره‌سازی",
        blocks: [
          "این وب‌سایت از کوکی استفاده نمی‌کند. فونت‌ها و تصاویر از سایت خودمان بارگذاری می‌شوند، بنابراین بازدید از سایت اطلاعات شما را برای اشخاص ثالثی مانند گوگل نمی‌فرستد.",
          "اگر با پرچم‌های پایین صفحه زبانی را انتخاب کنید، این انتخاب در حافظه محلی (local storage) مرورگرتان ذخیره می‌شود تا دفعه بعد سایت به همان زبان باز شود. این تنظیم فقط زمانی ذخیره می‌شود که خودتان زبانی را انتخاب کنید، برای ارائه همان تنظیمی که خواسته‌اید لازم است، و هر زمان بخواهید می‌توانید آن را از تنظیمات مرورگر پاک کنید.",
        ],
      },
      {
        title: "۴. با چه کسانی به اشتراک می‌گذاریم",
        blocks: [
          { list: [
            "هنرمند، {artist}، در ایران — پیام شما را از طریق ایمیل دریافت می‌کند تا بتواند پاسخ دهد.",
            "{hosting} — میزبانی وب‌سایت و سروری که پیام‌های فرم تماس را ارسال می‌کند.",
            "Resend (resend.com) — ارسال ایمیل‌های فرم تماس. این سرویس از هر ایمیل یک نسخه را به مدت {providerRetention} نگه می‌دارد و سپس آن را حذف می‌کند.",
          ] },
          "ارائه‌دهندگان خدمات طبق دستور ما عمل می‌کنند و اجازه ندارند از اطلاعات شما برای اهداف خودشان استفاده کنند. در صورت الزام قانونی نیز ممکن است اطلاعاتی را افشا کنیم. ما هرگز اطلاعات شخصی شما را نمی‌فروشیم.",
          "پیوندهای اینستاگرام شما را به وب‌سایت خود اینستاگرام می‌برند که سیاست حفظ حریم خصوصی جداگانه‌ای دارد. تا روی پیوند نزنید، چیزی از اینستاگرام بارگذاری نمی‌شود.",
        ],
      },
      {
        title: "۵. انتقال اطلاعات به خارج از بریتانیا",
        blocks: [
          "پیام شما برای هنرمند در ایران فرستاده می‌شود. بریتانیا ایران را دارای سطح کافی از حفاظت از داده‌های شخصی نمی‌شناسد و تضمین‌های معمول قانون بریتانیا در آنجا قابل اتکا نیستند. به همین دلیل پیام شما را فقط با رضایت صریح خودتان می‌فرستیم که با تیک زدن گزینه مربوط در فرم تماس اعلام می‌کنید (ماده ۴۹(۱)(الف) UK GDPR). بدون این رضایت نمی‌توانیم پیامتان را به هنرمند برسانیم.",
          "خطرها: قوانین حفاظت از داده‌ها در ایران با قوانین بریتانیا متفاوت است و ممکن است نتوانید حقوق خود طبق قانون بریتانیا را در برابر اشخاص یا سازمان‌های آنجا اعمال کنید. لطفاً اطلاعات حساس در پیامتان ننویسید.",
          "برخی از ارائه‌دهندگان خدمات ما ممکن است اطلاعات را خارج از بریتانیا، مثلاً در ایالات متحده، ذخیره یا پردازش کنند. این انتقال‌ها با مقررات کفایت بریتانیا (مانند «پل داده بریتانیا–آمریکا») یا بندهای قراردادی مصوب محافظت می‌شوند.",
        ],
      },
      {
        title: "۶. مدت نگهداری",
        blocks: [
          { list: [
            "پیام‌های فرم تماس در این وب‌سایت ذخیره نمی‌شوند و مستقیماً با ایمیل فرستاده می‌شوند. ارائه‌دهنده خدمات ایمیل ما، Resend، نسخه خود را {providerRetention} پس از ارسال حذف می‌کند.",
            "هنرمند ایمیل‌های شما را فقط تا زمانی که برای رسیدگی به پرسش یا خریدتان لازم است نگه می‌دارد، و نه بیش از {retention} پس از آخرین تماس شما.",
            "گزارش‌های سرور نزد ارائه‌دهنده میزبانی طبق چرخه کوتاه معمول آن حذف می‌شوند.",
          ] },
        ],
      },
      {
        title: "۷. حقوق شما",
        blocks: [
          "بسته به محل زندگی‌تان، حق دارید:",
          { list: [
            "نسخه‌ای از اطلاعات شخصی‌ای را که از شما نگه می‌داریم دریافت کنید",
            "اطلاعات نادرست را اصلاح کنید",
            "اطلاعاتتان را حذف کنید",
            "استفاده از آن را محدود کنید یا به آن اعتراض کنید",
            "اطلاعاتتان را در قالبی قابل انتقال دریافت کنید",
            "رضایت خود برای انتقال اطلاعات را برای آینده پس بگیرید — پیام‌هایی که قبلاً فرستاده شده‌اند قابل بازگشت نیستند، اما می‌توانید درخواست حذف آن‌ها را بدهید",
          ] },
          "برای استفاده از هر یک از این حقوق به {email} ایمیل بزنید. ظرف یک ماه پاسخ می‌دهیم و هزینه‌ای ندارد.",
          "اگر از نحوه رسیدگی ما به اطلاعاتتان ناراضی هستید، لطفاً ابتدا به ما بگویید تا آن را اصلاح کنیم. همچنین می‌توانید به نهاد ناظر حفاظت از داده‌ها شکایت کنید — در بریتانیا، دفتر کمیسیونر اطلاعات ({ico}) و در اتحادیه اروپا، نهاد ناظر کشور خودتان.",
        ],
      },
      {
        title: "۸. بازدیدکنندگان از ایالات متحده",
        blocks: [
          { list: [
            "ما اطلاعات شخصی شما را برای تبلیغات نمی‌فروشیم یا به اشتراک نمی‌گذاریم و در ۱۲ ماه گذشته نیز چنین نکرده‌ایم.",
            "Do Not Track: ما بازدیدکنندگان را در وب‌سایت‌های دیگر ردیابی نمی‌کنیم، بنابراین با همه بازدیدکنندگان یکسان رفتار می‌کنیم، چه مرورگرشان سیگنال Do Not Track بفرستد چه نه.",
            "می‌توانید با ایمیل به نشانی بالا، اطلاعاتی را که از شما نگه می‌داریم بررسی یا اصلاح کنید.",
          ] },
        ],
      },
      {
        title: "۹. کودکان",
        blocks: [
          "این وب‌سایت برای کودکان زیر ۱۳ سال طراحی نشده و آگاهانه اطلاعات آن‌ها را جمع‌آوری نمی‌کنیم. اگر فکر می‌کنید کودکی اطلاعاتش را برای ما فرستاده، با ما تماس بگیرید تا آن را حذف کنیم.",
        ],
      },
      {
        title: "۱۰. امنیت",
        blocks: [
          "سایت از طریق اتصال رمزگذاری‌شده (HTTPS) ارائه می‌شود و دسترسی به حساب‌های ایمیلی که پیام‌های شما را دریافت می‌کنند محدود است. هیچ سیستمی کاملاً امن نیست، اما اقدامات معقولی برای محافظت از اطلاعات شما انجام می‌دهیم.",
        ],
      },
      {
        title: "۱۱. تغییرات این سیاست",
        blocks: [
          "اگر نحوه استفاده از اطلاعات شما را تغییر دهیم، این صفحه و تاریخ بالای آن را به‌روز می‌کنیم. اگر پرسشی دارید، {contact} یا به {email} ایمیل بزنید.",
        ],
      },
    ],
  },
};

/* ── Rendering helpers ───────────────────────────────────────────── */
const linkClass = "text-[#D98C7A] underline underline-offset-2 hover:text-[#bf7360]";

/* Replaces {tokens} in a policy string with names, links and dates */
function Rich({ text, lang }) {
  const c = COPY[lang];
  const tokens = {
    operator: OPERATOR_NAME,
    artist: ARTIST_NAME[lang],
    hosting: HOSTING_PROVIDERS,
    retention: RETENTION[lang],
    providerRetention: PROVIDER_RETENTION[lang],
    email: <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className={linkClass}>{CONTACT_EMAIL}</a>,
    ico: <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" dir="ltr" className={linkClass}>{c.icoText}</a>,
    contact: <Link to="/contact" className={linkClass}>{c.contactLinkText}</Link>,
  };

  return text.split(/(\{\w+\})/).map((part, i) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{key && key in tokens ? tokens[key] : part}</Fragment>;
  });
}

function Block({ block, lang }) {
  if (typeof block === "string") {
    return <p><Rich text={block} lang={lang} /></p>;
  }
  if (block.heading) {
    return <p className="pt-2 font-medium text-[#2F2A26]">{block.heading}</p>;
  }
  return (
    <ul className="list-disc space-y-2 ps-5">
      {block.list.map((item, i) => <li key={i}><Rich text={item} lang={lang} /></li>)}
    </ul>
  );
}

/* ── Component ───────────────────────────────────────────────────── */
export default function Privacy() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const updated = new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", { dateStyle: "long" }).format(LAST_UPDATED);

  return (
    <main className="min-h-screen bg-[#F6F1EB] pt-28 pb-20">

      {/* ── Page header ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-3xl px-6 md:px-10">
        <div className="mb-10 border-b border-[#E8DCD0] pb-6">
          <p className="header-item text-sm uppercase tracking-[0.3em] text-[#D98C7A]" style={{ "--header-delay": "80ms" }}>{c.eyebrow}</p>
          <h1 className="header-item mt-3 text-4xl font-semibold text-[#2F2A26]" style={{ "--header-delay": "200ms" }}>{c.heading}</h1>
          <p className="header-item mt-4 text-sm text-gray-500" style={{ "--header-delay": "320ms" }}>
            {c.updated} {updated}
          </p>
          {c.translationNote && (
            <p className="header-item mt-2 text-xs text-gray-500" style={{ "--header-delay": "360ms" }}>
              {c.translationNote}
            </p>
          )}
        </div>
      </section>

      <div className="header-item mx-auto w-full max-w-3xl px-6 md:px-10 space-y-10" style={{ "--header-delay": "420ms" }}>

        {/* ── In short ── */}
        <div className="rounded-2xl border border-[#E8DCD0] bg-[#E8DCD0]/60 p-6 text-sm md:text-base leading-relaxed text-[#2F2A26]/85">
          <p className="mb-2 font-semibold text-[#2F2A26]">{c.summaryTitle}</p>
          <p><Rich text={c.summary} lang={lang} /></p>
        </div>

        {c.sections.map((section) => (
          <section key={section.title} className="border-t border-[#E8DCD0] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-[#2F2A26]">{section.title}</h2>
            <div className="space-y-4 text-sm md:text-base leading-relaxed text-[#2F2A26]/80">
              {section.blocks.map((block, i) => <Block key={i} block={block} lang={lang} />)}
            </div>
          </section>
        ))}

      </div>
    </main>
  );
}
