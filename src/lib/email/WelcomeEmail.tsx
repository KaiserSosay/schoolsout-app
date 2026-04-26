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
  Section,
  Text,
} from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  magicLinkUrl: string;
  firstName?: string;
  unsubscribeUrl?: string;
};

// DECISION: Design tokens pulled straight from the Phase 1.5 warmth spec.
// Keep them local to this module — they're deliberately different from the
// ReminderEmail dark-mode palette so the welcome email reads as a new,
// warmer moment distinct from the recurring reminder emails.
const tokens = {
  bg: '#FBF8F1', // cream page background
  card: '#FFFFFF',
  border: '#E8E4DA',
  ink: '#1A1A1A',
  muted: '#71717A',
  cta: '#F5C842',
  brandPurple: '#6B4FBB',
};

const copy = {
  en: {
    preheader: 'Tap the link to get started — no password needed.',
    heading: 'Hey there,',
    p1: "You're officially on the list. Welcome in.",
    p2: 'Tap the button to confirm your email and jump in:',
    cta: 'Sign me in →',
    browserHint:
      "Tip: For the best experience, open this in Safari or Chrome rather than your email app's built-in browser.",
    bulletsEyebrow: 'A couple things worth knowing:',
    bullets: [
      "Every time you come back, you'll use **this** email. No password, ever. Just type it and we'll send you a fresh link.",
      "We'll remember you. Your kids' ages, your saved camps, your schools — all waiting right where you left it.",
      "If a school day gets canceled, we'll tell you early. And we'll already have a plan for you.",
    ],
    trust:
      "Thanks for trusting us with this. I built School's Out! because my dad is busy and I wanted parents like him to stop scrambling when schools close. I'm Noah, I'm 8, and this is what I do — I build things.",
    signOff: 'Catch you on the inside,',
    signature: 'Noah',
    ps: "P.S. If you've got an idea, just reply. I read every one.",
    footer: {
      sentBy: "Sent by Noah at School's Out!",
      unsubscribe: 'Unsubscribe',
      contact: 'Contact',
    },
  },
  es: {
    preheader: 'Toca el enlace para empezar — sin contraseña.',
    heading: 'Hola,',
    p1: 'Ya estás oficialmente en la lista. Bienvenido.',
    p2: 'Toca el botón para confirmar tu correo y entrar:',
    cta: 'Iniciar sesión →',
    browserHint:
      'Consejo: Para la mejor experiencia, abre esto en Safari o Chrome en lugar del navegador integrado de tu app de correo.',
    bulletsEyebrow: 'Un par de cosas que vale la pena saber:',
    bullets: [
      'Cada vez que vuelvas, vas a usar **este** correo. Sin contraseña, nunca. Solo escríbelo y te mandamos un enlace nuevo.',
      'Te vamos a recordar. Las edades de tus hijos, tus campamentos guardados, tus escuelas — todo esperándote justo donde lo dejaste.',
      'Si se cancela un día de escuela, te avisamos temprano. Y ya vamos a tener un plan listo para ti.',
    ],
    trust:
      'Gracias por confiar en nosotros con esto. Construí School\'s Out! porque mi papá está ocupado y quería que padres como él dejaran de correr cuando cierra la escuela. Soy Noah, tengo 8 años, y esto es lo que hago — construyo cosas.',
    signOff: 'Nos vemos adentro,',
    signature: 'Noah',
    ps: 'P.D. Si tienes una idea, solo responde. Yo leo todas.',
    footer: {
      sentBy: "Enviado por Noah en School's Out!",
      unsubscribe: 'Cancelar suscripción',
      contact: 'Contacto',
    },
  },
} as const;

// DECISION: Render markdown-style **bold** inside the bullet list. React Email
// doesn't do markdown natively, so we split on ** pairs and wrap every odd
// segment in <strong>. Simple, no new dep.
function renderInlineBold(s: string, keyBase: string): React.ReactNode[] {
  const parts = s.split('**');
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyBase}-${i}`} style={{ color: tokens.ink, fontWeight: 700 }}>
        {part}
      </strong>
    ) : (
      <span key={`${keyBase}-${i}`}>{part}</span>
    ),
  );
}

export function WelcomeEmail({ locale, magicLinkUrl, unsubscribeUrl }: Props) {
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
          {/* Wordmark */}
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

          {/* Card */}
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
            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '0 0 12px 0' }}>
              {c.p1}
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 1.55, margin: '0 0 20px 0' }}>
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

            <Section style={{ marginTop: 32 }}>
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
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {c.bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 10px 0' }}>
                    {renderInlineBold(b, `bullet-${i}`)}
                  </li>
                ))}
              </ul>
            </Section>

            <Hr style={{ borderColor: tokens.border, margin: '28px 0' }} />

            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 16px 0' }}>
              {c.trust}
            </Text>

            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 4px 0' }}>
              {c.signOff}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 800,
                margin: '0 0 16px 0',
                color: tokens.ink,
              }}
            >
              {c.signature}
            </Text>

            <Text style={{ fontSize: 13, lineHeight: 1.5, color: tokens.muted, margin: 0 }}>
              {c.ps}
            </Text>
          </Container>

          {/* Footer */}
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
