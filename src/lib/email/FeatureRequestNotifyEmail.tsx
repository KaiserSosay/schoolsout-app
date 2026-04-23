// Admin notification — fires whenever a parent submits a feature request.
// Delivered to ADMIN_NOTIFY_EMAIL (defaults to hi@schoolsout.net). Plain,
// scannable: category pill, body, submitter, direct link to the admin row.

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
  category: 'idea' | 'bug' | 'love' | 'question';
  body: string;
  submitter: { email: string; displayName?: string | null; isLoggedIn: boolean };
  locale: string;
  pagePath?: string | null;
  adminUrl: string;
};

const categoryLabel: Record<Props['category'], string> = {
  idea: '💡 Idea',
  bug: "🐛 Something's broken",
  love: '❤️ A thing I love',
  question: '❓ Question',
};

export function FeatureRequestNotifyEmail({
  category,
  body,
  submitter,
  locale,
  pagePath,
  adminUrl,
}: Props) {
  const shortBody = body.length > 60 ? body.slice(0, 60) + '…' : body;
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${categoryLabel[category]}: ${shortBody}`}</Preview>
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
            NEW FEEDBACK
          </Text>
          <Heading as="h1" style={{ fontSize: 20, margin: '0 0 8px 0' }}>
            {categoryLabel[category]}
          </Heading>
          <Text style={{ fontSize: 12, color: '#71717A', margin: '0 0 16px 0' }}>
            from {submitter.displayName ?? submitter.email}
            {submitter.isLoggedIn ? ' · logged in' : ' · anonymous'}
            {' · '}
            {locale}
            {pagePath ? ` · ${pagePath}` : ''}
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
            <Text style={{ fontSize: 15, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
              {body}
            </Text>
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
            Reply directly to {submitter.email} or respond from the admin UI to trigger
            the {'"'}Noah wrote you back{'"'} email template.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
