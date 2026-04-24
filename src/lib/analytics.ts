import { createHash } from 'node:crypto';
import { createServiceSupabase } from '@/lib/supabase/service';

// Phase 2.7 Goal 6: privacy-first page-view logger.
//
// Philosophy:
//   - No cookies, no tracker pixel, no third-party JS.
//   - IP addresses are hashed with a daily-rotating salt so two hits from
//     the same IP on the same day appear identical, but the IP cannot be
//     recovered from a stored row.
//   - Bot traffic is flagged but not suppressed (admin sees bot-vs-human
//     split separately).
//
// The logger is fire-and-forget — page renders never block on it.

const BOT_UA_RE =
  /(bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedin|whatsapp|telegram|discord|chatgpt|gptbot|perplexity|claudebot|anthropic|google-extended|ccbot)/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true;
  return BOT_UA_RE.test(ua);
}

// Daily-rotating salt. Same hash scheme across a single day, different
// across day boundaries. Combined with IP — individual IPs can't be
// reversed from the hash.
function dailySalt(date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10);
  const secret = process.env.IP_HASH_SECRET ?? 'schoolsout-dev-salt';
  return `${ymd}:${secret}`;
}

export function hashIp(ip: string | null | undefined, date = new Date()): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip + ':' + dailySalt(date)).digest('hex').slice(0, 32);
}

export type LogPageViewInput = {
  path: string;
  referrer: string | null;
  userAgent: string | null;
  ip: string | null;
  locale: string | null;
};

// Fire-and-forget. Caller does NOT await. Errors are swallowed; logging
// must never cause a page to error.
export function logPageView(input: LogPageViewInput): void {
  try {
    const db = createServiceSupabase();
    const row = {
      path: input.path,
      referrer: input.referrer,
      user_agent: input.userAgent,
      ip_hash: hashIp(input.ip),
      locale: input.locale,
      is_bot: isBotUserAgent(input.userAgent),
    };
    void db
      .from('page_views')
      .insert(row)
      .then(() => undefined, () => undefined);
  } catch {
    // swallow — never block a render
  }
}
