import Link from 'next/link';
import { locales, type Locale } from '@/i18n/config';

export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  return (
    <div className="flex gap-2 text-sm">
      {locales.map((loc) => (
        <Link
          key={loc}
          href={`/${loc}`}
          aria-current={loc === currentLocale ? 'page' : undefined}
          className={
            'px-2 py-1 rounded-full ' +
            (loc === currentLocale ? 'bg-white/20 font-bold' : 'bg-white/5 hover:bg-white/10')
          }
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
