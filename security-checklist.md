# Pre-Launch Security Checklist

Use this checklist before deploying your application to production.

---

## Database Security

- [ ] All tables have RLS enabled (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`)
- [ ] All tables have RLS forced (`ALTER TABLE x FORCE ROW LEVEL SECURITY`)
- [ ] Every user-data table has `user_id` column with proper policies
- [ ] No tables accessible by `anon` role unless intentionally public
- [ ] Audit triggers applied to sensitive tables
- [ ] UUIDs used for all primary keys (no sequential IDs)
- [ ] Soft delete pattern implemented (`deleted_at` column)
- [ ] `updated_at` triggers on all mutable tables
- [ ] No sensitive data in plain text (encrypt if necessary)
- [ ] Database backups enabled and tested

---

## Authentication

- [ ] Email confirmation required for new signups
- [ ] Password requirements enforced (min 8 chars, mixed case, numbers, special chars)
- [ ] Rate limiting enabled on auth endpoints (Supabase default)
- [ ] OAuth redirect URLs strictly configured
- [ ] Password reset tokens expire appropriately
- [ ] Session timeout configured appropriately
- [ ] JWT secret is strong and not exposed
- [ ] Logout clears all sessions properly

---

## Storage

- [ ] All buckets have RLS policies
- [ ] User files scoped to user-id folders
- [ ] File type validation on uploads
- [ ] File size limits configured
- [ ] Signed URLs used for private files (not public URLs)
- [ ] Malware scanning enabled (if available)

---

## Frontend

- [ ] No sensitive data in localStorage (or encrypted if necessary)
- [ ] Logout clears all local state and caches
- [ ] Auth tokens auto-refresh configured
- [ ] Form inputs validated with Zod before submission
- [ ] Error messages don't expose internal details
- [ ] CSRF protection implemented (if using cookies)
- [ ] XSS prevention (React handles this, but review dangerouslySetInnerHTML usage)
- [ ] No secrets in client-side code

---

## API / Edge Functions

- [ ] All inputs validated and sanitized
- [ ] Rate limiting on expensive operations
- [ ] No user IDs accepted from client—always use `auth.uid()`
- [ ] Service role key never exposed to client
- [ ] CORS configured properly
- [ ] Error responses don't leak sensitive information

---

## Infrastructure

- [ ] HTTPS only (Supabase default)
- [ ] Environment variables for all secrets
- [ ] Service role key not in client bundle
- [ ] Database backups enabled
- [ ] Monitoring/alerting configured
- [ ] CDN caching configured appropriately
- [ ] WAF enabled (if available)

---

## Compliance (if applicable)

- [ ] Privacy policy in place
- [ ] Terms of service in place
- [ ] Cookie consent implemented (for EU/GDPR)
- [ ] Data retention policies defined
- [ ] User data export functionality
- [ ] Account deletion functionality

---

## Before Each New Table

When adding a new table, ensure:

1. [ ] Add `user_id UUID REFERENCES auth.users(id) NOT NULL`
2. [ ] Add `created_at TIMESTAMPTZ DEFAULT now()`
3. [ ] Add `updated_at TIMESTAMPTZ DEFAULT now()`
4. [ ] Add `deleted_at TIMESTAMPTZ` (for soft delete)
5. [ ] Run `SELECT apply_standard_rls('table_name')`
6. [ ] Run `SELECT apply_updated_at_trigger('table_name')`
7. [ ] Run `SELECT apply_audit_trigger('table_name')` if needed

---

## Regular Security Tasks

### Weekly
- [ ] Review authentication logs for anomalies
- [ ] Check for failed login attempts
- [ ] Review new user signups

### Monthly
- [ ] Review and rotate API keys if needed
- [ ] Check for dependency updates (especially security patches)
- [ ] Review access logs

### Quarterly
- [ ] Security audit of codebase
- [ ] Penetration testing (if resources allow)
- [ ] Review and update this checklist

---

## Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/Top10/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
