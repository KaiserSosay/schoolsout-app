// TODO: native ES review before launch — Spanish copy below is Claude-drafted
// from the Phase 3.1 spec and has not been reviewed by a native speaker.
// Flagged in docs/TODO.md.

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  campName: string;
  magicLinkUrl: string;
  expiresAtIso: string; // ISO timestamp; rendered as a friendly date below
};

const copy = {
  en: {
    preheader: 'Tap the link to manage your camp listing — no password needed.',
    heading: (name: string) => `${name} is live.`,
    p1: "You're approved on School's Out! Parents in Miami can already see your listing in the public catalog.",
    p2: "But here's the thing — listings with hours, photos, and a clear description get 4× more parent saves. The dashboard below lets you fill that in (and tell parents when you're open vs. closed for school holidays). Takes about 5 minutes.",
    cta: 'Open my dashboard →',
    bulletsEyebrow: 'What you can edit:',
    bullets: [
      'Hours, before/after-care times, lunch policy',
      'Photos (up to 5), description, special accommodations',
      'Pricing tier + dollar amounts, registration link, deadline',
      "School-holiday coverage — tell parents which days you're actually open",
    ],
    expiry: (when: string) =>
      `This link expires ${when}. If it lapses, just sign in with this email at schoolsout.net and we'll send a fresh one.`,
    sig: '— Noah & dad, School’s Out!',
    ps: "P.S. We'll never charge parents. Camps that want priority placement can upgrade to Featured ($29/month) — reply if interested. No pressure.",
  },
  es: {
    preheader: 'Toca el enlace para gestionar tu campamento — sin contraseña.',
    heading: (name: string) => `${name} está en vivo.`,
    p1: 'Tu campamento fue aprobado en School’s Out! Los padres en Miami ya pueden verlo en el catálogo público.',
    p2: 'Pero esto es lo importante: los listados con horarios, fotos y descripción clara reciben 4 veces más guardados. El panel abajo te deja llenarlos (y avisarles a los padres cuándo estás abierto o cerrado en feriados escolares). Toma como 5 minutos.',
    cta: 'Abrir mi panel →',
    bulletsEyebrow: 'Qué puedes editar:',
    bullets: [
      'Horarios, cuidado antes/después, política de almuerzo',
      'Fotos (hasta 5), descripción, adaptaciones especiales',
      'Nivel de precio + cantidades, enlace de inscripción, fecha límite',
      'Cobertura de feriados escolares — diles a los padres cuáles días estás abierto',
    ],
    expiry: (when: string) =>
      `Este enlace expira el ${when}. Si caduca, solo inicia sesión con este correo en schoolsout.net y te mandamos uno nuevo.`,
    sig: '— Noah y papá, School’s Out!',
    ps: 'P.D. Nunca le cobramos a los padres. Los campamentos que quieren colocación prioritaria pueden subir a Destacado ($29/mes) — responde si te interesa. Sin presión.',
  },
} as const;

const tokens = {
  bg: '#FBF8F1',
  card: '#FFFFFF',
  border: '#E8E4DA',
  ink: '#1A1A1A',
  muted: '#71717A',
  cta: '#F5C842',
  brandPurple: '#6B4FBB',
};

function formatExpiry(iso: string, locale: 'en' | 'es'): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  // Intl handles the localization; if the date is invalid we fall back to
  // the raw ISO so the email still renders something coherent.
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', opts);
}

export function OperatorWelcomeEmail({
  locale,
  campName,
  magicLinkUrl,
  expiresAtIso,
}: Props) {
  const c = copy[locale];
  const expiryText = c.expiry(formatExpiry(expiresAtIso, locale));
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{c.preheader}</Preview>
      <Body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: tokens.bg,
          color: tokens.ink,
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
          <Text
            style={{
              margin: '0 0 16px 0',
              fontSize: 14,
              fontWeight: 800,
              color: tokens.brandPurple,
            }}
          >
            School&apos;s Out<span style={{ color: tokens.cta }}>!</span>
          </Text>

          <Container
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
              borderRadius: 24,
              padding: '32px 24px',
            }}
          >
            <Heading
              as="h1"
              style={{ fontSize: 22, margin: '0 0 16px 0', fontWeight: 800 }}
            >
              {c.heading(campName)}
            </Heading>

            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 12px 0' }}>
              {c.p1}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 20px 0' }}>
              {c.p2}
            </Text>

            <Button
              href={magicLinkUrl}
              style={{
                background: tokens.cta,
                color: tokens.ink,
                borderRadius: 12,
                padding: '14px 28px',
                fontWeight: 800,
                fontSize: 16,
                display: 'inline-block',
                textDecoration: 'none',
                minHeight: 48,
                lineHeight: '20px',
              }}
            >
              {c.cta}
            </Button>

            <Hr style={{ borderColor: tokens.border, margin: '28px 0' }} />

            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: tokens.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                margin: '0 0 12px 0',
              }}
            >
              {c.bulletsEyebrow}
            </Text>
            <ul style={{ paddingLeft: 20, margin: '0 0 24px 0' }}>
              {c.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 8px 0' }}
                >
                  {b}
                </li>
              ))}
            </ul>

            <Text
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: tokens.muted,
                margin: '0 0 12px 0',
              }}
            >
              {expiryText}
            </Text>

            <Text style={{ fontSize: 14, color: tokens.muted, margin: '0 0 12px 0' }}>
              {c.sig}
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 1.5, color: tokens.muted, margin: 0 }}>
              {c.ps}
            </Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

export function operatorWelcomeSubject(
  locale: 'en' | 'es',
  campName: string,
): string {
  return locale === 'es'
    ? `${campName} está en School's Out! — gestiona tu listado`
    : `${campName} is live on School's Out! — manage your listing`;
}
