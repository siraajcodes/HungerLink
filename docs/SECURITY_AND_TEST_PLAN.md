# HUNGERLINK 2.0 — Security Architecture & Security Test Plan

## 1. Enforced Database-Layer Controls
Frontend route guards are strictly UX conveniences. All authorization and integrity rules are enforced in PostgreSQL:

| Threat Vector | Mitigation Implemented |
| :--- | :--- |
| Self-elevation to `ADMINISTRATOR` | `handle_new_user()` allowlists non-admin roles on sign-up; `trg_prevent_role_escalation` blocks `UPDATE profiles.role` unless `is_admin()` is true. |
| Organisation self-verification | `orgs_insert_authenticated` forces `verification_status = 'pending'`; `trg_prevent_org_verification_tampering` blocks non-admin status edits. |
| Cross-organisation data leaks | RLS policies on `donation_batches`, `meal_requests`, `allocations`, `delivery_routes`, `delivery_stops`, and `impact_records` scope access via `is_org_member()` and `delivery_partner_id = auth.uid()`. |
| Double / Over-allocation race conditions | `propose_split_allocations` locks both `donation_batches` and `meal_requests` rows using `SELECT ... FOR UPDATE` and enforces `chk_portions_bound`. |
| Audit / MealTrace tampering | `trg_mealtrace_append_only` and `trg_audit_logs_append_only` raise exceptions on any `UPDATE` or `DELETE`. |
| Verification document exposure | Private Supabase Storage bucket `org-verification-docs` restricts reads to owning folder UID or `is_admin()`. |
| QR PII leakage | QR codes encode only opaque random hex tokens (`qr_token`); `mealtrace-verify` Edge Function returns sanitized non-PII batch metadata and applies per-IP rate limiting. |
| CSV formula injection | `buildCsvDocument()` prefixes cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r`. |

## 2. Security Test Plan

### Test Case 1: Cross-Organisation Read Isolation
- **Setup**: Two verified donor accounts (Donor A, Donor B) and two verified NGO accounts (NGO A, NGO B).
- **Action**: Authenticated as Donor A, query `donation_batches` for Donor B's batch ID.
- **Expected**: 0 rows returned by Supabase PostgREST due to `batches_select_scoped` RLS policy.

### Test Case 2: Role Privilege Escalation Attempt
- **Setup**: Standard `FOOD_DONOR` JWT session.
- **Action**: Execute `supabase.from('profiles').update({ role: 'ADMINISTRATOR' }).eq('id', uid)`.
- **Expected**: PostgreSQL raises `Forbidden: Only administrators may change user roles.`

### Test Case 3: Unauthorised Verification Status Modification
- **Setup**: Organisation owner (`pending` status).
- **Action**: Execute `supabase.from('organisations').update({ verification_status: 'verified' }).eq('id', orgId)`.
- **Expected**: PostgreSQL raises `Forbidden: Only administrators may modify organisation verification status.`

### Test Case 4: Arbitrary MealTrace Event Injection & Ledger Deletion
- **Setup**: Unassigned delivery partner or NGO member.
- **Action**: Call `record_mealtrace_scan` for an unrelated batch, or attempt `DELETE FROM mealtrace_events`.
- **Expected**: RPC rejects with `Forbidden`; direct DELETE/UPDATE rejected by RLS and `enforce_append_only` trigger.

### Test Case 5: Concurrent Allocation Race Condition
- **Setup**: Batch with 100 portions; two parallel coordinator RPC calls requesting 70 and 60 portions.
- **Action**: Run both `propose_split_allocations` calls concurrently.
- **Expected**: First transaction acquires `FOR UPDATE` lock and succeeds; second sees 30 remaining and fails with `Over-allocation prevented`.
