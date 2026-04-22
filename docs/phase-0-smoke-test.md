# Phase 0 smoke test

Run after deploying to production.

- [ ] EN home renders at https://schoolsout.net/en
- [ ] ES home renders at https://schoolsout.net/es
- [ ] Reminder signup → `reminder_subscriptions` row created
- [ ] Magic link confirms user
- [ ] Manual cron trigger sends email (curl with Authorization header)
- [ ] Open tracking updates `reminder_sends.opened_at`
- [ ] Click tracking updates `reminder_sends.clicked_at`
- [ ] Unsubscribe link disables subscription
- [ ] Privacy + Terms pages linked from footer
- [ ] Language toggle works (top-right header)
