# DriveMy — Disaster Recovery & Backup Runbook

> **Last updated:** 2026-07-03
> **Owner:** Platform / DriveMy FYP Team
> **Scope:** Supabase hosted database, Auth, and Storage for the DriveMy PWA

---

## 1. Infrastructure Overview

| Component | Provider | Details |
|-----------|----------|---------|
| Database | Supabase (PostgreSQL) | Project ID: `yvkzixbyxonvlicyrhpy` |
| Auth | Supabase Auth | Email + Google OAuth |
| Storage | Supabase Storage | Bucket: `kpp-images` |
| Frontend | Vercel | Auto-deployed from `main` branch |
| DNS / CDN | Vercel Edge Network | — |

---

## 2. Supabase Plan & Backup Policy

> [!IMPORTANT]
> **Verify the current plan** in the Supabase dashboard under **Project Settings → Billing**.

| Plan | Daily Backups | Point-in-Time Recovery (PITR) | Retention |
|------|--------------|-------------------------------|-----------|
| **Free** | ✅ Daily snapshot | ❌ Not available | 7 days |
| **Pro** | ✅ Daily snapshot | ✅ ~5-minute RPO | 7 days |
| **Team / Enterprise** | ✅ Continuous | ✅ ~1-minute RPO | 30 days |

**Current assessment:**
- Free tier has **no PITR** — the maximum data loss on a free tier is up to 24 hours.
- If the project handles real user data (quiz results, progress), **upgrading to Pro is strongly recommended** to achieve a ≤ 5-minute RPO.

**RTO Target:** < 2 hours (restore from daily backup)
**RPO Target:** < 5 minutes (Pro PITR) or < 24 hours (Free daily backup)

---

## 3. Backup Locations

### 3.1 Supabase Managed Backups
- Automatically taken by Supabase daily at ~00:00 UTC.
- Accessible via: **Supabase Dashboard → Project → Database → Backups**
- No manual action required for creation.

### 3.2 Schema Migrations (Source of Truth)
- All schema changes live in `supabase/migrations/` and are version-controlled in Git.
- The full schema can be recreated from migrations alone — this is the primary DR path for the schema.

### 3.3 Manual Export (Recommended Monthly)
Run the following to create a manual pg_dump:

```bash
# Requires Supabase CLI and SUPABASE_DB_PASSWORD in env
supabase db dump -f backup_$(date +%Y%m%d).sql
```

Store the dump in a secure location (e.g., encrypted cloud storage, not in the Git repo).

---

## 4. Restore Procedure

### 4.1 Restore from Supabase Dashboard Backup (Recommended)

1. Go to **Supabase Dashboard → Project → Database → Backups**
2. Identify the backup closest to the desired recovery point.
3. Click **Restore** and confirm. The project will enter maintenance mode briefly.
4. Verify data integrity with a few spot-check queries:
   ```sql
   SELECT count(*) FROM public.profiles;
   SELECT count(*) FROM public.quiz_results;
   SELECT max(created_at) FROM public.quiz_results;
   ```
5. Re-run any migrations that post-date the backup:
   ```bash
   supabase db push
   ```

### 4.2 Restore from Manual pg_dump

```bash
# 1. Connect to the Supabase database
psql "postgresql://postgres:[DB_PASSWORD]@db.yvkzixbyxonvlicyrhpy.supabase.co:5432/postgres"

# 2. Restore
psql "postgresql://..." -f backup_YYYYMMDD.sql
```

> [!WARNING]
> A `pg_dump` restore on a live project will **replace all data**. Notify all stakeholders and put the app in maintenance mode (e.g., remove Vercel deployment) before restoring.

### 4.3 Restore Schema Only (No Data Loss)

If only the schema is corrupted (e.g., an accidental `DROP TABLE`):

```bash
# Re-apply all migrations from scratch
supabase db reset   # Local only — do NOT run against production

# For production, push only the missing migration:
supabase db push
```

---

## 5. Vercel Frontend Recovery

The frontend is stateless — all state lives in Supabase. A Vercel re-deploy restores the frontend:

```bash
# Trigger a re-deploy from the last successful build
# In Vercel Dashboard → Deployments → Promote last successful deployment
```

Or force a Git-triggered redeploy:

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## 6. Incident Response Checklist

```
[ ] 1. Identify the incident type (data loss / corruption / outage)
[ ] 2. Check Supabase status page: https://status.supabase.com
[ ] 3. Check Vercel status page: https://www.vercel-status.com
[ ] 4. If data loss: identify the earliest clean backup in the Supabase Dashboard
[ ] 5. Put frontend in maintenance mode (disable Vercel deployment)
[ ] 6. Restore database (Section 4.1 or 4.2 above)
[ ] 7. Re-run post-backup migrations: `supabase db push`
[ ] 8. Smoke-test critical flows (sign-in, quiz start, progress save)
[ ] 9. Re-enable frontend deployment
[ ] 10. Document the incident: date, cause, RTO achieved, actions taken
```

---

## 7. Key Contacts & Links

| Resource | URL |
|----------|-----|
| Supabase Dashboard | https://app.supabase.com/project/yvkzixbyxonvlicyrhpy |
| Supabase Status | https://status.supabase.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Vercel Status | https://www.vercel-status.com |
| GitHub Repo | https://github.com/faiz226/SD032_DriveMy |

---

## 8. Fire Drill Record

| Date | Type | RTO Achieved | Performed By | Notes |
|------|------|-------------|--------------|-------|
| _(first drill pending)_ | Schema restore | — | — | — |
