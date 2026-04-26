// Admin notification email — fires when a parent / staff member submits
// a school calendar update. Plain, scannable. Goes to ADMIN_NOTIFY_EMAIL
// (defaults to hi@schoolsout.net).

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
  schoolName: string;
  schoolSlug: string;
  submitterEmail: string;
  submitterName: string | null;
  submitterRole: string;
  proposedUpdates: string;
  notes: string | null;
  domainVerified: boolean;
  adminUrl: string;
};

export function CalendarSubmissionNotifyEmail({
  schoolName,
  schoolSlug,
  submitterEmail,
  submitterName,
  submitterRole,
  proposedUpdates,
  notes,
  domainVerified,
  adminUrl,
}: Props) {
  const subject = `New calendar submission: ${schoolName}${
    domainVerified ? ' (✓ domain verified)' : ''
  }`;
  return (
    <Html lang="en">
      <Head />
      <Preview>{subject}</Preview>
      <Body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#FBF8F1',
          color: '#1A1A1A',
          margin: 0,
          padding: '24px 16px',
        }}
      >
        <Container style={{ maxWidth: 640, margin: '0 auto' }}>
          <Heading as="h1" style={{ fontSize: 18, margin: '0 0 16px 0', fontWeight: 700 }}>
            {subject}
          </Heading>
          <Text style={{ margin: '0 0 8px 0' }}>
            <strong>School:</strong> {schoolName} (<code>{schoolSlug}</code>)
          </Text>
          <Text style={{ margin: '0 0 8px 0' }}>
            <strong>Submitter:</strong>{' '}
            {submitterName ? `${submitterName} <${submitterEmail}>` : submitterEmail}{' '}
            · role: <em>{submitterRole}</em>
            {domainVerified ? ' · ✓ domain match' : ''}
          </Text>
          <Heading as="h2" style={{ fontSize: 14, margin: '20px 0 6px 0' }}>
            Proposed updates
          </Heading>
          <Text style={{ whiteSpace: 'pre-wrap', margin: '0 0 16px 0', fontSize: 14 }}>
            {proposedUpdates}
          </Text>
          {notes ? (
            <>
              <Heading as="h2" style={{ fontSize: 14, margin: '12px 0 6px 0' }}>
                Notes
              </Heading>
              <Text
                style={{ whiteSpace: 'pre-wrap', margin: '0 0 16px 0', fontSize: 14 }}
              >
                {notes}
              </Text>
            </>
          ) : null}
          <Text style={{ margin: '16px 0 0 0' }}>
            <Link href={adminUrl}>Open admin queue →</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
