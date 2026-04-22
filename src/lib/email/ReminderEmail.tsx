import { Html, Body, Container, Heading, Text, Button, Hr, Link } from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  closureName: string;
  startDate: string;
  endDate: string;
  emoji: string;
  daysBefore: 3 | 7 | 14;
  unsubscribeUrl: string;
};

const copy = {
  en: {
    heading: (days: number) => `${days === 14 ? '🗓️' : days === 7 ? '⏳' : '🚨'} School's out in ${days} days`,
    intro: (n: string) => `Heads up — ${n} is coming up.`,
    cta: 'Plan it now',
    unsubscribe: 'Unsubscribe',
  },
  es: {
    heading: (days: number) => `${days === 14 ? '🗓️' : days === 7 ? '⏳' : '🚨'} No hay escuela en ${days} días`,
    intro: (n: string) => `¡Atención! Se acerca ${n}.`,
    cta: 'Planéalo ahora',
    unsubscribe: 'Cancelar suscripción',
  },
} as const;

export function ReminderEmail({ locale, closureName, startDate, endDate, emoji, daysBefore, unsubscribeUrl }: Props) {
  const c = copy[locale];
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale);
  return (
    <Html lang={locale}>
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#1a0b2e', color: '#fff' }}>
        <Container style={{ padding: 32 }}>
          <Heading style={{ fontSize: 24 }}>{c.heading(daysBefore)}</Heading>
          <Text style={{ fontSize: 48, margin: 0 }}>{emoji}</Text>
          <Heading as="h2" style={{ fontSize: 20 }}>{closureName}</Heading>
          <Text>{c.intro(closureName)}</Text>
          <Text>{fmt(startDate)} – {fmt(endDate)}</Text>
          <Button href="https://schoolsout.net" style={{ background: '#facc15', color: '#1a0b2e', padding: '12px 20px', borderRadius: 12, fontWeight: 700 }}>
            {c.cta}
          </Button>
          <Hr style={{ borderColor: '#444', marginTop: 32 }} />
          <Text style={{ fontSize: 11, color: '#aaa' }}>
            <Link href={unsubscribeUrl} style={{ color: '#aaa' }}>{c.unsubscribe}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
