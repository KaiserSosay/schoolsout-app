// Tests for scripts/data-quality-report.ts.
//
// The script is read-only. Tests cover:
//   - Empty-creds path (no NEXT_PUBLIC_SUPABASE_URL etc.) returns a
//     friendly skipped report.
//   - With a minimal stub Supabase that resolves every query to a
//     predictable value, the report contains all four expected
//     sections and the key totals.
//
// We don't hit the real DB. The stub uses a single thenable resolver
// keyed off the recorded filter sequence — simpler than trying to
// faithfully reproduce postgrest's full chain.

import { describe, expect, it } from 'vitest';

import { buildReport } from '../../scripts/data-quality-report';

describe('buildReport — no creds', () => {
  it('returns a "skipped" report when given null', async () => {
    const md = await buildReport(null);
    expect(md).toContain('# Data Quality Report');
    expect(md).toContain('Skipped — NEXT_PUBLIC_SUPABASE_URL');
    expect(md).toContain('.deploy-secrets/env.sh');
  });
});

describe('buildReport — with stub client', () => {
  // Make a fresh thenable per-from call. Each .from(table) returns a
  // fluent object that records every chained method, then resolves
  // (when awaited) to a value computed from the recorded filters.
  function makeStub() {
    function fromFactory(table: string): unknown {
      const ops: { method: string; args: unknown[] }[] = [];
      const isFiltered = (col: string, val: unknown): boolean =>
        ops.some(
          (op) =>
            op.method === 'eq' && op.args[0] === col && op.args[1] === val,
        );
      const isOr = (clausePrefix: string): boolean =>
        ops.some(
          (op) =>
            op.method === 'or' &&
            typeof op.args[0] === 'string' &&
            (op.args[0] as string).startsWith(clausePrefix),
        );
      const isLt = (col: string): boolean =>
        ops.some((op) => op.method === 'lt' && op.args[0] === col);
      const isIs = (col: string): boolean =>
        ops.some((op) => op.method === 'is' && op.args[0] === col);

      function computeCount(): number {
        if (table === 'camps') {
          if (isFiltered('verified', true) && isLt('last_verified_at')) return 2;
          if (isLt('data_completeness')) return 19;
          if (isIs('hours_start')) return 7;
          if (isOr('website_url')) return 1;
          if (isOr('phone')) return 11;
          if (isOr('address')) return 4;
          if (isFiltered('verified', true)) return 92;
          return 108;
        }
        if (table === 'schools') {
          if (isFiltered('verified', true)) return 305;
          if (isFiltered('is_mdcps', true)) return 312;
          return 318;
        }
        if (table === 'closures') {
          if (
            isFiltered('status', 'verified') &&
            isFiltered('school_year', '2025-2026')
          )
            return 200;
          if (
            isFiltered('status', 'verified') &&
            isFiltered('school_year', '2026-2027')
          )
            return 180;
          if (isFiltered('status', 'verified')) return 22; // anchor counts
          if (isFiltered('status', 'ai_draft')) return 32;
          return 412;
        }
        if (table === 'reminder_subscriptions') {
          if (isFiltered('enabled', true)) return 13;
          return 14;
        }
        if (table === 'feature_requests') {
          if (isFiltered('status', 'new')) return 2;
          return 6;
        }
        if (table === 'camp_applications') {
          if (isFiltered('status', 'pending')) return 3;
          return 9;
        }
        return 0;
      }

      function computeData(): unknown[] {
        // .order().limit() data path for camps top/bottom 10.
        if (table === 'camps') {
          const ordered = ops.find((o) => o.method === 'order');
          if (ordered) {
            return [
              {
                slug: 'camp-a',
                name: 'Camp A',
                data_completeness: 0.95,
                address: '1 St',
                phone: '555-555',
              },
              {
                slug: 'camp-b',
                name: 'Camp B',
                data_completeness: 0.4,
                address: null,
                phone: null,
              },
            ];
          }
        }
        // Schools list paths.
        if (table === 'schools') {
          const sel = ops.find((o) => o.method === 'select');
          if (sel) {
            const cols = sel.args[0] as string;
            if (cols === 'district') {
              return [
                { district: 'Miami-Dade County Public Schools' },
                { district: 'Miami-Dade County Public Schools' },
                { district: 'Independent — Private' },
              ];
            }
            if (cols === 'slug, name, calendar_status') {
              return []; // none not_yet_published in fixture
            }
          }
        }
        return [];
      }

      const proxy: Record<string, unknown> = {};
      const record = (method: string) =>
        function (...args: unknown[]): unknown {
          ops.push({ method, args });
          return proxy;
        };
      proxy.select = record('select');
      proxy.eq = record('eq');
      proxy.lt = record('lt');
      proxy.is = record('is');
      proxy.or = record('or');
      proxy.order = record('order');
      proxy.limit = record('limit');
      proxy.maybeSingle = (): Promise<unknown> =>
        Promise.resolve({ data: { id: 'fake-school-id' }, error: null });
      // Thenable: when awaited, decide based on whether any of the data
      // shapes apply — otherwise return count.
      (proxy as { then: unknown }).then = function (
        onFulfilled: (val: unknown) => unknown,
      ): unknown {
        const lastOp = ops[ops.length - 1]?.method;
        if (lastOp === 'limit' || lastOp === 'order' || lastOp === 'select') {
          // Data-shaped query (no count requested) — return rows.
          // But .select with count:'exact' is also caught here; in that
          // case the next chained eq/etc will overwrite. The terminal
          // SELECT-only path matters only for schools/district + camps
          // top/bottom — those go through .order(...).limit(...) or
          // .select('district') with no further filters.
          const sel = ops.find((o) => o.method === 'select');
          const wantsHeadCount =
            sel &&
            sel.args[1] &&
            typeof sel.args[1] === 'object' &&
            (sel.args[1] as { head?: boolean; count?: string }).head === true;
          if (wantsHeadCount && lastOp === 'select') {
            return Promise.resolve({ count: computeCount(), error: null }).then(
              onFulfilled,
            );
          }
          return Promise.resolve({ data: computeData(), error: null }).then(
            onFulfilled,
          );
        }
        // Default: count query
        return Promise.resolve({ count: computeCount(), error: null }).then(
          onFulfilled,
        );
      };
      return proxy;
    }

    return {
      from: (table: string): unknown => fromFactory(table),
    };
  }

  it('produces all four sections + key counts', async () => {
    const stub = makeStub() as unknown as Parameters<typeof buildReport>[0];
    const md = await buildReport(stub);

    expect(md).toContain('## 1. Camps');
    expect(md).toContain('## 2. Schools');
    expect(md).toContain('## 3. Closures');
    expect(md).toContain('## 4. User-facing health');

    expect(md).toContain('Total camps:** 108');
    expect(md).toContain('Total schools:** 318');
    expect(md).toContain('Total closures:** 412');
    expect(md).toContain('Reminder subscriptions:** 14 (13 enabled)');
  });
});
