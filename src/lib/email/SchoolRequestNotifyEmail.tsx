// Admin notification — fires whenever a parent submits a school request
// from the SchoolAutocomplete "+ Add" affordance. Delivered to
// ADMIN_NOTIFY_EMAIL (defaults to hi@schoolsout.net). Plain, scannable.

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

type Props = {
  requestedName: string;
  city: string | null;
  notes: string | null;
  submitter: { email: string | null; displayName: string | null; isLoggedIn: boolean };
  adminUrl: string;
};

export function SchoolRequestNotifyEmail({
  requestedName,
  city,
  notes,
  submitter,
  adminUrl,
}: Props) {
  const submitterLabel = submitter.isLoggedIn
    ? `${submitter.displayName ?? submitter.email ?? 'logged-in user'} · logged in`
    : 'anonymous';
  return (
    <Html lang="en">
      <Head />
      <Preview>{`School requested: ${requestedName}`}</Preview>
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
          <Text style={{ fontSize: 12, color: '#6B4FBB', fontWeight: 800, margin: '0 0 12px 0' }}>
            NEW SCHOOL REQUEST
          </Text>
          <Heading as="h1" style={{ fontSize: 22, margin: '0 0 8px 0' }}>
            🏫 {requestedName}
          </Heading>
          <Text style={{ fontSize: 12, color: '#71717A', margin: '0 0 16px 0' }}>
            from {submitterLabel}
          </Text>
          <Container
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E4DA',
              borderRadius: 16,
              padding: '20px',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: '#71717A', margin: '0 0 4px 0', fontWeight: 700 }}>
              Requested name
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>
              {requestedName}
            </Text>
            {city ? (
              <>
                <Text style={{ fontSize: 13, color: '#71717A', margin: '0 0 4px 0', fontWeight: 700 }}>
                  City
                </Text>
                <Text style={{ fontSize: 15, margin: '0 0 12px 0' }}>{city}</Text>
              </>
            ) : null}
            {notes ? (
              <>
                <Text style={{ fontSize: 13, color: '#71717A', margin: '0 0 4px 0', fontWeight: 700 }}>
                  Notes
                </Text>
                <Text
                  style={{ fontSize: 14, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}
                >
                  {notes}
                </Text>
              </>
            ) : null}
          </Container>
          <Link
            href={adminUrl}
            style={{
              display: 'inline-block',
              background: '#F5C842',
              color: '#1A1A1A',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Triage in /admin →
          </Link>
          <Text style={{ fontSize: 11, color: '#71717A', marginTop: 24 }}>
            Mark as researching, link to an existing school after you add it,
            or reject if it&apos;s a duplicate.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
