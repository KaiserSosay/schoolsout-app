// TODO: native ES review before launch — Spanish copy below is Claude-drafted
// and has not been reviewed by a native speaker. Flagged in docs/TODO.md.

// Reply email — fires when admin writes an admin_response on a feature
// request. Includes the original submission as a quote so the user remembers
// what they asked, and Noah's answer below. Cheers-style warmth.

import {
  Body,
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
  originalBody: string;
  adminResponse: string;
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
    preheader: 'Noah wrote you back.',
    heading: 'Hey,',
    intro: 'You sent me an idea a bit ago:',
    answerEyebrow: "Here's what I wanted to say:",
    outro: 'Thanks again for helping.',
    signOff: '— Noah',
  },
  es: {
    preheader: 'Noah te respondió.',
    heading: 'Hola,',
    intro: 'Hace poco me mandaste una idea:',
    answerEyebrow: 'Esto es lo que quería decirte:',
    outro: 'Gracias de nuevo por ayudar.',
    signOff: '— Noah',
  },
} as const;

export function FeatureRequestReplyEmail({ locale, originalBody, adminResponse }: Props) {
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
            <Heading as="h1" style={{ fontSize: 22, margin: '0 0 16px 0', fontWeight: 700 }}>
              {c.heading}
            </Heading>
            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '0 0 12px 0' }}>
              {c.intro}
            </Text>
            <Container
              style={{
                borderLeft: `3px solid ${tokens.brandPurple}`,
                padding: '8px 16px',
                margin: '12px 0 20px 0',
                background: '#FAF6EF',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  margin: 0,
                  color: tokens.muted,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {originalBody}
              </Text>
            </Container>
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: tokens.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                margin: '24px 0 8px 0',
              }}
            >
              {c.answerEyebrow}
            </Text>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                margin: '0 0 24px 0',
                whiteSpace: 'pre-wrap',
              }}
            >
              {adminResponse}
            </Text>
            <Hr style={{ borderColor: tokens.border, margin: '24px 0' }} />
            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 8px 0' }}>
              {c.outro}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              {c.signOff}
            </Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}
