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
  businessName?: string | null;
};

const copy = {
  en: {
    preheader: 'Your camp listing was approved.',
    heading: (name: string) => `${name} is in.`,
    p1: "Thanks for applying. Your listing is now live on School's Out! — parents in Coral Gables will start seeing it when they browse camps for the ages you submitted.",
    p2: "We may reach out shortly to confirm logistics (hours, before/after-care, drop-off). That second review stamps your listing with a green 'verified' badge.",
    p3: "If you'd like to upgrade to a Featured listing ($29/month) for priority placement and a gold badge, reply to this email and we'll send you a payment link.",
    sig: '— Noah & dad',
  },
  es: {
    preheader: 'Tu listado de campamento fue aprobado.',
    heading: (name: string) => `${name} está adentro.`,
    p1: 'Gracias por postularte. Tu listado ya está publicado en School\'s Out! — los padres en Coral Gables van a verlo cuando busquen campamentos para las edades que enviaste.',
    p2: 'Puede que te contactemos pronto para confirmar logística (horarios, cuidado antes/después, drop-off). Esa segunda revisión le da a tu listado la insignia verde de "verificado".',
    p3: 'Si quieres subir de nivel a un listado Destacado ($29/mes) para tener colocación prioritaria y una insignia dorada, responde este correo y te enviamos un enlace de pago.',
    sig: '— Noah y papá',
  },
} as const;

export function CampRequestApprovedEmail({ locale, campName }: Props) {
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
              {c.heading(campName)}
            </Heading>
            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 12px 0' }}>
              {c.p1}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 12px 0' }}>
              {c.p2}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 24px 0' }}>
              {c.p3}
            </Text>
            <Text style={{ fontSize: 14, color: '#71717A', margin: 0 }}>{c.sig}</Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}
