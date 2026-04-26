// TODO: native ES review before launch — Spanish copy below is Claude-drafted
// from the Phase 1.5 warmth pass spec and has not been reviewed by a native
// speaker. Flagged in docs/TODO.md.

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  magicLinkUrl: string;
  firstName?: string;
  unsubscribeUrl?: string;
};

const tokens = {
  bg: '#FBF8F1',
  card: '#FFFFFF',
  border: '#E8E4DA',
  ink: '#1A1A1A',
  muted: '#71717A',
  cta: '#F5C842',
  brandPurple: '#6B4FBB',
};

const copy = {
  en: {
    preheader: 'Your sign-in link is ready.',
    heading: 'Hey again,',
    p1: 'Knew it was you.',
    cta: 'Sign me in →',
    browserHint:
      "Tip: For the best experience, open this in Safari or Chrome rather than your email app's built-in browser.",
    p2: "We kept your spot warm. Your schools, your kids' ages, your saved camps — all waiting exactly where you left them.",
    p3: "If you're here because a day off is coming up, don't worry. I got you.",
    signature: 'Noah',
    footer: {
      sentBy: "Sent by Noah at School's Out!",
      unsubscribe: 'Unsubscribe',
      contact: 'Contact',
    },
  },
  es: {
    preheader: 'Tu enlace de acceso está listo.',
    heading: 'Hola de nuevo,',
    p1: 'Sabía que eras tú.',
    cta: 'Iniciar sesión →',
    browserHint:
      'Consejo: Para la mejor experiencia, abre esto en Safari o Chrome en lugar del navegador integrado de tu app de correo.',
    p2: 'Te guardamos tu lugar calientito. Tus escuelas, las edades de tus hijos, tus campamentos guardados — todo esperándote justo donde lo dejaste.',
    p3: 'Si estás aquí porque se acerca un día libre, tranqui. Yo te cubro.',
    signature: 'Noah',
    footer: {
      sentBy: "Enviado por Noah en School's Out!",
      unsubscribe: 'Cancelar suscripción',
      contact: 'Contacto',
    },
  },
} as const;

export function WelcomeBackEmail({ locale, magicLinkUrl, unsubscribeUrl }: Props) {
  const c = copy[locale];
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
        <Container
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '24px 16px',
          }}
        >
          <Text
            style={{
              margin: '0 0 16px 0',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.01em',
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
              style={{ fontSize: 22, margin: '0 0 16px 0', color: tokens.ink, fontWeight: 700 }}
            >
              {c.heading}
            </Heading>
            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '0 0 20px 0' }}>
              {c.p1}
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

            <Text
              style={{
                fontSize: 12,
                lineHeight: 1.55,
                color: tokens.muted,
                margin: '12px 0 0 0',
              }}
            >
              {c.browserHint}
            </Text>

            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '24px 0 12px 0' }}>
              {c.p2}
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '0 0 20px 0' }}>
              {c.p3}
            </Text>

            <Hr style={{ borderColor: tokens.border, margin: '16px 0' }} />

            <Text
              style={{
                fontSize: 16,
                fontWeight: 800,
                margin: 0,
                color: tokens.ink,
              }}
            >
              {c.signature}
            </Text>
          </Container>

          <Text
            style={{
              fontSize: 11,
              color: tokens.muted,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            {c.footer.sentBy}
            {' · '}
            {unsubscribeUrl ? (
              <Link href={unsubscribeUrl} style={{ color: tokens.muted }}>
                {c.footer.unsubscribe}
              </Link>
            ) : (
              <span>{c.footer.unsubscribe}</span>
            )}
            {' · '}
            <Link href="mailto:hi@schoolsout.net" style={{ color: tokens.muted }}>
              {c.footer.contact}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
