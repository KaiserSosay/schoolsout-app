// Sent in a batch by an admin when a school's calendar flips from
// 'needs_research' to 'verified_*'. Recipients are everyone who tapped
// "Notify me" on the unverified-calendar placeholder — typically
// Noah, Mom, and a handful of parents who happened to land on the page
// before we had verified data.
//
// Short and warm — one CTA to view the school's page. ES is Claude-
// drafted; flagged for native review per existing convention.

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  schoolName: string;
  schoolPageUrl: string;
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
    preheader: '{name}\'s calendar is live on School\'s Out!',
    heading: 'Good news — {name}\'s calendar is verified.',
    p1: 'Last time you visited, we were still working on getting verified dates from {name}. We\'ve got them now. Spring break, holidays, early dismissals — it\'s all there.',
    cta: 'See {name}\'s calendar →',
    p2: 'You\'ll only get this email once per school you subscribed to. From now on, your reminder schedule kicks in for every break.',
    signature: '— Noah',
    footer: {
      sentBy: 'Sent by Noah at School\'s Out!',
      unsubscribe: 'Unsubscribe',
      contact: 'Contact',
    },
  },
  es: {
    preheader: 'El calendario de {name} ya está en School\'s Out!',
    heading: 'Buenas noticias — el calendario de {name} está verificado.',
    p1: 'La última vez que visitaste, todavía estábamos consiguiendo las fechas verificadas de {name}. Ya las tenemos. Vacaciones de primavera, días feriados, salidas temprano — todo está ahí.',
    cta: 'Ver el calendario de {name} →',
    p2: 'Recibirás este correo solo una vez por escuela a la que te suscribiste. A partir de ahora, tus recordatorios se activan para cada vacación.',
    signature: '— Noah',
    footer: {
      sentBy: 'Enviado por Noah en School\'s Out!',
      unsubscribe: 'Cancelar suscripción',
      contact: 'Contacto',
    },
  },
} as const;

function fill(template: string, name: string): string {
  return template.replaceAll('{name}', name);
}

export function SchoolCalendarVerifiedEmail({
  locale,
  schoolName,
  schoolPageUrl,
  unsubscribeUrl,
}: Props) {
  const c = copy[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{fill(c.preheader, schoolName)}</Preview>
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
          style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}
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
              style={{
                fontSize: 22,
                margin: '0 0 16px 0',
                color: tokens.ink,
                fontWeight: 700,
              }}
            >
              {fill(c.heading, schoolName)}
            </Heading>
            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '0 0 20px 0' }}>
              {fill(c.p1, schoolName)}
            </Text>
            <Button
              href={schoolPageUrl}
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
              {fill(c.cta, schoolName)}
            </Button>
            <Text
              style={{ fontSize: 14, lineHeight: 1.55, margin: '24px 0 0 0', color: tokens.muted }}
            >
              {c.p2}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 800, margin: '24px 0 0 0' }}>
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
