import { Html, Body, Container, Heading, Text, Button, Hr } from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  confirmUrl: string;
  // DECISION: Added in Goal 1 of the Phase 1.5 warmth pass so the route can
  // pass through a new-vs-returning flag. Goal 2 swaps this template out
  // entirely for WelcomeEmail + WelcomeBackEmail — this prop is deliberately
  // a no-op for now so the interface is stable while both sides land.
  isReturning?: boolean;
};

const copy = {
  en: {
    heading: "Confirm your School's Out! reminder subscription",
    body: "One more step! Click below to confirm your email — we'll remind you 2 weeks, 1 week, and 3 days before every Coral Gables school closure.",
    cta: 'Confirm my email →',
    fine: "If you didn't sign up, you can ignore this email. This link expires in 1 hour.",
  },
  es: {
    heading: "Confirma tu suscripción a School's Out!",
    body: '¡Un paso más! Haz clic abajo para confirmar tu correo — te enviaremos recordatorios 2 semanas, 1 semana y 3 días antes de cada vacación escolar.',
    cta: 'Confirmar mi correo →',
    fine: 'Si no te suscribiste, puedes ignorar este correo. Este enlace expira en 1 hora.',
  },
} as const;

// DECISION: Match ReminderEmail visual language — dark purple bg (#1a0b2e),
// yellow CTA (#facc15), system font — so the confirmation feels like the
// same brand as the reminder emails users will get later.
export function ConfirmEmail({ locale, confirmUrl, isReturning: _isReturning }: Props) {
  // isReturning intentionally unused in Commit 1 body; Commit 2 replaces this
  // template with WelcomeEmail + WelcomeBackEmail components.
  void _isReturning;
  const c = copy[locale];
  return (
    <Html lang={locale}>
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#1a0b2e', color: '#fff' }}>
        <Container style={{ padding: 32 }}>
          <Heading style={{ fontSize: 24 }}>{c.heading}</Heading>
          <Text style={{ fontSize: 16, lineHeight: 1.5 }}>{c.body}</Text>
          <Button
            href={confirmUrl}
            style={{
              background: '#facc15',
              color: '#1a0b2e',
              padding: '14px 24px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              display: 'inline-block',
              textDecoration: 'none',
            }}
          >
            {c.cta}
          </Button>
          <Hr style={{ borderColor: '#444', marginTop: 32 }} />
          <Text style={{ fontSize: 11, color: '#aaa' }}>{c.fine}</Text>
        </Container>
      </Body>
    </Html>
  );
}
