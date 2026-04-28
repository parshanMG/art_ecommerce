/* ─────────────────────────────────────────────────────────────────────
   FOOTER
   Dark warm-brown background (#2F2A26) to mirror the trust-bar above it.
   Three columns:
     • Brand — logo name + tagline
     • Navigate — internal page links
     • Connect — contact + policy quick-links
   A thin divider separates the columns from the copyright line.
───────────────────────────────────────────────────────────────────── */
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#2F2A26] text-[#D6CFC6]">

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">

        {/* ── Column 1 · Brand ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="inline-block">
            <span className="island-moments text-4xl text-white leading-none">
              Parshan
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-[#A89E94]">
            Original watercolour paintings and fine-art prints — each piece
            hand-painted with water, light, and a quiet love for the
            fleeting moments that matter most.
          </p>
          {/* Decorative botanical divider */}
          <div className="flex items-center gap-2 mt-1 opacity-40 select-none">
            <span className="text-xl">✦</span>
            <span className="h-px flex-1 bg-[#A89E94]" />
            <span className="text-xl">✦</span>
          </div>
        </div>

        {/* ── Column 2 · Navigate ───────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#A89E94] mb-5">
            Navigate
          </h3>
          <ul className="flex flex-col gap-3 text-sm">
            {[
              { label: "Home",         to: "/"        },
              { label: "Shop",         to: "/shop"    },
              { label: "Contact",      to: "/contact" },
            ].map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="hover:text-white transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Column 3 · Connect ────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#A89E94] mb-5">
            Connect
          </h3>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <Link
                to="/contact"
                className="hover:text-white transition-colors duration-200"
              >
                Get in touch
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-white transition-colors duration-200"
              >
                Commission a piece
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-white transition-colors duration-200"
              >
                Shipping &amp; returns
              </Link>
            </li>
          </ul>

          {/* Social icons row */}
          <div className="flex gap-4 mt-6">
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-[#A89E94] hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            {/* Pinterest */}
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest"
              className="text-[#A89E94] hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────── */}
      <div className="border-t border-[#3E3832]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B6159]">
          <span>© {year} Parshan. All rights reserved.</span>
          <span className="italic text-[#504843]">
            Painted with water &amp; light.
          </span>
        </div>
      </div>

    </footer>
  );
}
