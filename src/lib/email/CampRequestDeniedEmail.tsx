// TODO: native ES review before launch — Spanish copy below is Claude-drafted
// and has not been reviewed by a native speaker. Flagged in docs/TODO.md.

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
  campName: string;
  reason?: string | null;
};

const copy = {
  en: {
    preheader: "An update on your camp listing application.",
    heading: 'Thanks for applying.',
    p1: (name: string) =>
      `We reviewed your application for ${name} and aren't able to publish it right now.`,
    p1NoName: "We reviewed your application and aren't able to publish it right now.",
    reasonEyebrow: 'A note from our side:',
    p2: "If you'd like to reapply — a clearer website, updated hours, or more details about your program will all help — just reply to this email and we'll walk you through it.",
    sig: '— Noah & dad',
  },
  es: {
    preheader: 'Una actualización sobre tu solicitud de campamento.',
    heading: 'Gracias por postularte.',
    p1: (name: string) =>
      `Revisamos tu solicitud para ${name} y no podemos publicarla en este momento.`,
    p1NoName: 'Revisamos tu solicitud y no podemos publicarla en este momento.',
    reasonEyebrow: 'Una nota de nuestra parte:',
    p2: 'Si quieres volver a postular — un sitio web más claro, horarios actualizados, o más detalles sobre tu programa pueden ayudar — solo responde este correo y te guiamos.',
    sig: '— Noah y papá',
  },
} as const;

export function CampRequestDeniedEmail({ locale, campName, reason }: Props) {
  const c = copy[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{c.preheader}</Preview>
      <Body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#FBF8F1',
          color: '#1A1A1A',
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
          <Container
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E4DA',
              borderRadius: 24,
              padding: '32px 24px',
            }}
          >
            <Heading as="h1" style={{ fontSize: 22, margin: '0 0 16px 0', fontWeight: 800 }}>
              {c.heading}
            </Heading>
            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 16px 0' }}>
              {campName ? c.p1(campName) : c.p1NoName}
            </Text>
            {reason ? (
              <>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#71717A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    margin: '12px 0 4px 0',
                  }}
                >
                  {c.reasonEyebrow}
                </Text>
                <Container
                  style={{
                    borderLeft: '3px solid #6B4FBB',
                    padding: '8px 16px',
                    margin: '0 0 20px 0',
                    background: '#FAF6EF',
                  }}
                >
                  <Text style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>{reason}</Text>
                </Container>
              </>
            ) : null}
            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 20px 0' }}>{c.p2}</Text>
            <Text style={{ fontSize: 14, color: '#71717A', margin: 0 }}>{c.sig}</Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}
