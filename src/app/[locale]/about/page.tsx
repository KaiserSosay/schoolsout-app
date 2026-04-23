import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import path from 'node:path';

// DECISION: The photo file is optional — `public/images/noah.jpg` may or may
// not exist. At render time (server component) we probe the filesystem and
// either render the Image or a cream SVG placeholder initial. We never
// fabricate a photo (UX_PRINCIPLES.md rule #2).
async function noahPhotoExists(): Promise<boolean> {
  try {
    const { access } = await import('node:fs/promises');
    await access(path.join(process.cwd(), 'public', 'images', 'noah.jpg'));
    return true;
  } catch {
    return false;
  }
}

async function NoahPhoto() {
  const exists = await noahPhotoExists();
  if (exists) {
    return (
      <Image
        src="/images/noah.jpg"
        alt="Noah Scarlett"
        width={320}
        height={320}
        className="rounded-3xl ring-2 ring-gold/60 object-cover w-full h-auto"
      />
    );
  }
  return (
    <div
      role="img"
      aria-label="Noah Scarlett"
      className="aspect-square rounded-3xl ring-2 ring-gold/60 bg-white border border-cream-border flex items-center justify-center"
    >
      <span aria-hidden="true" className="text-8xl font-black text-brand-purple">
        N
      </span>
    </div>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('about');

  return (
    <main className="min-h-screen bg-cream text-ink py-12 px-6">
      <div className="max-w-[720px] mx-auto space-y-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink transition"
        >
          {t('back')}
        </Link>

        <section className="md:flex md:items-center md:gap-10">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {t('hero.line1')}{' '}
              <span className="text-brand-purple">{t('hero.line2Highlight')}</span>{' '}
              {t('hero.line3')}
            </h1>
          </div>
          <div className="mt-6 md:mt-0 md:w-[320px] shrink-0">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <NoahPhoto />
          </div>
        </section>

        <article className="prose prose-lg max-w-none text-ink space-y-5">
          <p className="text-lg leading-relaxed">{t('body.p1')}</p>
          <p className="text-lg leading-relaxed">{t('body.p2')}</p>
          <p className="text-lg leading-relaxed font-semibold">{t('body.p3')}</p>
          <p className="text-lg leading-relaxed">{t('body.p4')}</p>
          <p className="text-lg leading-relaxed">{t('body.p5')}</p>
          <p className="text-lg leading-relaxed">{t('body.p6')}</p>
        </article>

        <section className="grid gap-4 sm:grid-cols-3">
          <a
            href="https://www.youtube.com/@NoahHalfAmazing"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl bg-white border border-cream-border p-5 hover:-translate-y-0.5 transition shadow-sm"
          >
            <div className="text-3xl" aria-hidden="true">
              🎥
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-purple">
              {t('links.youtubeLabel')}
            </p>
            <p className="mt-1 font-bold text-ink">{t('links.youtubeTitle')}</p>
          </a>

          <a
            href="https://BeSoGood.org"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl bg-white border border-cream-border p-5 hover:-translate-y-0.5 transition shadow-sm"
          >
            <div className="text-3xl" aria-hidden="true">
              🌐
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-purple">
              {t('links.websiteLabel')}
            </p>
            <p className="mt-1 font-bold text-ink">{t('links.websiteTitle')}</p>
          </a>

          <div className="rounded-2xl bg-gold text-ink p-5 shadow-sm">
            <div className="text-3xl" aria-hidden="true">
              💬
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest">
              {t('links.mottoLabel')}
            </p>
            <p className="mt-1 font-bold">{t('links.mottoTitle')}</p>
          </div>
        </section>

        <p className="text-center text-sm text-muted pt-8">{t('signature')}</p>
      </div>
    </main>
  );
}
