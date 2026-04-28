'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Renders a camp description (CommonMark + GFM) with brand-consistent
// styling. Phase A scope: rendering only — admin edit form, structured
// description fields, and image upload arrive in Phase B.
//
// Why custom component overrides instead of @tailwindcss/typography:
// the project doesn't currently depend on the typography plugin, and
// the override list below is small enough (h1-h3, p, strong, em, ul,
// ol, li, a) that pulling in the plugin would be more bundle bloat
// than it solves. Images and raw HTML are intentionally suppressed
// (img → null, raw HTML escaped by react-markdown's v10 default).
//
// darkMode flips the text color shell for the in-app kid-mode detail
// view, where the camp card sits on a dark background and `text-ink`
// would be invisible. Public + parent-mode app surfaces stay on the
// default light shell.
export function CampDescription({
  description,
  darkMode = false,
}: {
  description: string | null;
  darkMode?: boolean;
}) {
  if (!description) return null;

  const textCls = darkMode ? 'text-white' : 'text-ink';
  const headingCls = darkMode ? 'text-white' : 'text-ink';
  const linkCls = darkMode
    ? 'font-bold text-gold underline hover:opacity-80'
    : 'font-bold text-brand-purple underline hover:opacity-80';

  return (
    <div data-testid="camp-description" className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className={`mt-6 mb-3 text-xl font-bold ${headingCls}`}>
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className={`mt-6 mb-3 text-xl font-bold ${headingCls}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`mt-5 mb-2 text-lg font-bold ${headingCls}`}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className={`mb-4 text-base leading-relaxed ${textCls}`}>
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className={`font-bold ${textCls}`}>{children}</strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${textCls}`}>{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-outside list-disc space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-outside list-decimal space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={`leading-relaxed ${textCls}`}>{children}</li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
            >
              {children}
            </a>
          ),
          // Images suppressed in Phase A — admin photo upload ships
          // in Phase B; until then we don't want to render arbitrary
          // <img> from description text.
          img: () => null,
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
  );
}
