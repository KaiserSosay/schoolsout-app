import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  APP_URL: z.string().url(),
  ADMIN_EMAILS: z.string().default(''),
  ADMIN_NOTIFY_EMAIL: z.string().email().default('hi@schoolsout.net'),
});

type Env = z.infer<typeof schema>;
let parsed: Env | undefined;

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    parsed ??= schema.parse(process.env);
    return parsed[prop as keyof Env];
  },
}) as Env;
