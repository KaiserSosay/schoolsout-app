// Acknowledgment email sent to a submitter after they propose a school
// calendar update via the public form. Brief, warm, no logos. Tells the
// submitter when to expect review (2 business days) and surfaces the
// domain-verified fast-track if their email matched.

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  schoolName: string;
  domainVerified: boolean;
};

const tokens = {
  bg: '#FBF8F1',
  card: '#FFFFFF',
  border: '#E8E4DA',
  ink: '#1A1A1A',
  muted: '#71717A',
  brandPurple: '#6B4FBB',
  cta: '#F5C842',
};

const copy = {
  en: {
    preheader: "Thanks — we'll review {name}'s calendar update.",
    heading: "Thanks for sending {name}'s calendar update.",
    body: "We'll review your submission and email you within 2 business days. If everything checks out, the dates will appear on {name}'s page on School's Out!",
    domainVerified:
      "Heads-up: your email matches {name}'s domain — we've fast-tracked this for review.",
    signoff: '— Noah & dad',
  },
  es: {
    preheader: 'Gracias — revisaremos la actualización del calendario de {name}.',
    heading: 'Gracias por enviar la actualización del calendario de {name}.',
    body: 'Revisaremos tu solicitud y te enviaremos un correo en 2 días hábiles. Si todo está bien, las fechas aparecerán en la página de {name} en School\'s Out!',
    domainVerified:
      'Aviso: tu correo coincide con el dominio de {name} — esto va por la vía rápida.',
    signoff: '— Noah y papá',
  },
} as const;

function fill(template: string, name: string): string {
  return template.replaceAll('{name}', name);
}

export function CalendarSubmissionAckEmail({
  locale,
  schoolName,
  domainVerified,
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
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
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
              {fill(c.heading, schoolName)}
            </Heading>
            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '0 0 16px 0' }}>
              {fill(c.body, schoolName)}
            </Text>
            {domainVerified ? (
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  margin: '0 0 16px 0',
                  color: tokens.muted,
                }}
              >
                ✓ {fill(c.domainVerified, schoolName)}
              </Text>
            ) : null}
            <Text style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              {c.signoff}
            </Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}
