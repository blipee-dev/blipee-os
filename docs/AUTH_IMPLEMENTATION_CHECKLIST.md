# Authentication Security Fixes - Implementation Checklist

## Overview

This checklist tracks the implementation of all security fixes identified in the authentication system audit. Use this document to track progress and ensure nothing is missed.

**Timeline**: 3-4 weeks
**Start Date**: _________________
**Target Completion**: _________________

---

## 🚨 CRITICAL PRIORITY - DAY 1

### Fix 1: Remove Hardcoded Gmail Password

**File**: `src/lib/email/send-invitation-gmail.ts`
**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] **Step 1**: Revoke exposed Gmail app password
  - [ ] Go to https://myaccount.google.com/apppasswords
  - [ ] Delete "blipee-smtp" password (or equivalent)
  - [ ] Document old password as compromised

- [ ] **Step 2**: Generate new app password
  - [ ] Create new app password in Google account
  - [ ] Save securely in password manager
  - [ ] Document location of password in team docs

- [ ] **Step 3**: Update production environment
  - [ ] Vercel production: `vercel env add SMTP_PASSWORD`
  - [ ] Vercel staging: `vercel env add SMTP_PASSWORD --environment=preview`
  - [ ] Verify variables are set: `vercel env ls`

- [ ] **Step 4**: Update local development
  - [ ] Add to `.env.local`: `SMTP_PASSWORD=new-password`
  - [ ] Test email sending locally
  - [ ] Notify team to update their local env files

- [ ] **Step 5**: Update code
  - [ ] Remove hardcoded password from `send-invitation-gmail.ts:11`
  - [ ] Add validation: throw error if `SMTP_PASSWORD` not set
  - [ ] Add fail-fast check at module initialization
  - [ ] Update `.env.example` with required variables

- [ ] **Step 6**: Update documentation
  - [ ] Add setup instructions for SMTP
  - [ ] Update README with email configuration
  - [ ] Document in onboarding guide for new developers

- [ ] **Step 7**: Git history cleanup (if needed)
  - [ ] Check if password is in git history: `git log -S "dptc xmxt"`
  - [ ] If found, consider BFG Repo-Cleaner or git-filter-repo
  - [ ] Force push if repository is private and team is small

- [ ] **Step 8**: Testing
  - [ ] Test without env var (should fail gracefully)
  - [ ] Test with correct env var (should send email)
  - [ ] Test on staging environment
  - [ ] Test on production environment

- [ ] **Step 9**: Security audit
  - [ ] Grep codebase for any other hardcoded credentials
  - [ ] Check all `.env.example` files for defaults
  - [ ] Review other email-related code

- [ ] **Step 10**: Team communication
  - [ ] Notify team of password rotation
  - [ ] Share updated `.env.example`
  - [ ] Update setup documentation
  - [ ] Schedule follow-up security review

**Verification**:
```bash
# Should fail gracefully
unset SMTP_PASSWORD
npm run dev
# Try creating user → should show config error

# Should work
export SMTP_PASSWORD="new-password"
npm run dev
# Create user → should send email

# Should find nothing
grep -r "dptc xmxt" . --exclude-dir=node_modules
```

**Completion Date**: _________________
**Verified By**: _________________

---

## 🔴 HIGH PRIORITY - WEEK 1

### Fix 2: Session Timing Issues

**Files**:
- `src/app/set-password/page.tsx`
- `src/app/auth/callback/page.tsx`

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Replace hardcoded delays with auth state listeners
- [ ] Update `set-password/page.tsx` to use `onAuthStateChange`
- [ ] Update `auth/callback/page.tsx` to use `onAuthStateChange`
- [ ] Remove all `setTimeout` and `Promise` delay code
- [ ] Add loading states while waiting for auth
- [ ] Test on slow network (3G throttling)
- [ ] Test on fast network
- [ ] Test invitation flow end-to-end
- [ ] Test password reset flow end-to-end
- [ ] Update documentation with new pattern

**Testing Scenarios**:
- [ ] New user invitation → set password
- [ ] Existing user password reset
- [ ] Slow network (3G) - should not timeout
- [ ] Fast network - should be instant
- [ ] Expired invitation link
- [ ] Already used invitation link

**Completion Date**: _________________
**Verified By**: _________________

---

### Fix 3: Centralize Permission Checks

**Files**: Multiple API routes
**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Audit all API routes for manual permission checks
  ```bash
  grep -r "super_admins" src/app/api/
  grep -r "role === 'owner'" src/app/api/
  grep -r "role === 'manager'" src/app/api/
  ```
- [ ] Update `src/app/api/users/resend-invitation/route.ts`
- [ ] Update `src/app/api/users/bulk-delete/route.ts`
- [ ] Update any other routes with manual checks
- [ ] Test each updated route
- [ ] Add integration tests for permission checks
- [ ] Document permission check pattern in developer guide

**Routes to Update**:
- [ ] `/api/users/resend-invitation` → Use `PermissionService.canManageUsers`
- [ ] `/api/users/bulk-delete` → Use `PermissionService.canManageUsers`
- [ ] `/api/users/manage` → Verify uses `PermissionService` (line 24)
- [ ] _________________
- [ ] _________________

**Completion Date**: _________________
**Verified By**: _________________

---

### Fix 4: Add Rate Limiting

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Create rate limiting middleware: `src/lib/rate-limit/index.ts`
- [ ] Implement in-memory store (development)
- [ ] Add Redis support for production (optional)
- [ ] Apply to user creation endpoint (10/hour)
- [ ] Apply to invitation resend endpoint (5/5min)
- [ ] Apply to bulk delete endpoint (3/10min)
- [ ] Add rate limit headers to responses
- [ ] Add monitoring for rate limit hits
- [ ] Test rate limiting behavior
- [ ] Document rate limits in API docs

**Endpoints to Protect**:
- [ ] `POST /api/users/manage` → 10 requests/hour
- [ ] `POST /api/users/resend-invitation` → 5 requests/5min
- [ ] `POST /api/users/bulk-delete` → 3 requests/10min
- [ ] `POST /api/auth/reset-password` → 5 requests/15min

**Completion Date**: _________________
**Verified By**: _________________

---

### Fix 5: SQL Trigger Conflict Bug

**File**: `supabase/migrations/20250117_fix_auth_user_creation.sql`
**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Create new migration file
- [ ] Fix `handle_new_user()` function with proper conflict resolution
- [ ] Test migration on local database
- [ ] Test with multiple conflict scenarios
- [ ] Apply to staging database
- [ ] Verify no errors in staging
- [ ] Apply to production database
- [ ] Monitor for errors post-deployment

**Test Cases**:
```sql
-- Test 1: New user (no conflict)
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'new@test.com');

-- Test 2: Email exists in app_users, no auth_user_id
INSERT INTO app_users (email, name) VALUES ('existing@test.com', 'Test');
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'existing@test.com');

-- Test 3: Verify trigger doesn't fail on error
-- (manually break something to test exception handling)
```

**Completion Date**: _________________
**Verified By**: _________________

---

## 🟡 MEDIUM PRIORITY - WEEK 2-3

### Fix 6: Email Validation Before Creation

**File**: `src/app/api/users/manage/route.ts`
**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Add check for existing email in `auth.users`
- [ ] Handle linking existing auth user to new app_user
- [ ] Update error messages
- [ ] Test with existing auth user
- [ ] Test with new user
- [ ] Update documentation

**Completion Date**: _________________

---

### Fix 7: Password Strength Enhancement

**File**: `src/app/set-password/page.tsx`
**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Install `zxcvbn` library
- [ ] Create `src/lib/auth/password-validation.ts`
- [ ] Implement password strength checker
- [ ] Add visual strength meter to UI
- [ ] Test with weak passwords
- [ ] Test with strong passwords
- [ ] Update user feedback messages

**Completion Date**: _________________

---

### Fix 8: Security Audit Logging

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Create `security_audit_logs` table migration
- [ ] Create `src/lib/auth/audit-logger.ts`
- [ ] Add logging to permission checks
- [ ] Add logging to failed auth attempts
- [ ] Add logging to rate limit hits
- [ ] Create admin dashboard to view logs
- [ ] Set up alerts for suspicious activity

**Completion Date**: _________________

---

### Fix 9: Improve Error Messages

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Create `src/lib/api/errors.ts` helper
- [ ] Audit all API routes for error messages
- [ ] Replace technical errors with user-friendly messages
- [ ] Ensure sensitive info is not leaked
- [ ] Log full details server-side
- [ ] Test error scenarios
- [ ] Update error message translations

**Completion Date**: _________________

---

### Fix 10: Transaction Support

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Create database function for atomic user deletion
- [ ] Update bulk delete to use transactions
- [ ] Update user creation to use transactions
- [ ] Test rollback scenarios
- [ ] Document transaction patterns

**Completion Date**: _________________

---

## 🟢 LOW PRIORITY - WEEK 3-4

### Feature 11: Session Management Dashboard

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Design UI for session management
- [ ] Create API endpoint to list sessions
- [ ] Implement "logout other sessions" feature
- [ ] Add device and location info
- [ ] Test on multiple devices
- [ ] Document feature in user guide

**Completion Date**: _________________

---

### Feature 12: Multi-Factor Authentication

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Design MFA enrollment UI
- [ ] Implement TOTP enrollment
- [ ] Add QR code generation
- [ ] Create MFA verification flow
- [ ] Add backup codes
- [ ] Test with authenticator apps
- [ ] Document MFA setup for users

**Completion Date**: _________________

---

### Feature 13: IP Whitelisting

**Assignee**: _________________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Verified

**Tasks**:
- [ ] Create IP whitelist table
- [ ] Add middleware to check IP
- [ ] Create admin UI to manage whitelist
- [ ] Test with whitelisted IP
- [ ] Test with non-whitelisted IP
- [ ] Document IP whitelisting feature

**Completion Date**: _________________

---

## Testing Checklist

### Unit Tests
- [ ] Permission service tests
- [ ] Password validation tests
- [ ] Rate limiting tests
- [ ] Email service tests
- [ ] Audit logger tests

### Integration Tests
- [ ] User creation flow (end-to-end)
- [ ] Invitation acceptance flow
- [ ] Password reset flow
- [ ] Permission checks at each step
- [ ] Rate limiting behavior
- [ ] Error handling

### Security Tests
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF token validation
- [ ] Rate limit bypass attempts
- [ ] Permission escalation attempts
- [ ] Session hijacking attempts

### Performance Tests
- [ ] Load test user creation endpoint
- [ ] Load test authentication endpoint
- [ ] Check database query performance
- [ ] Monitor rate limiter performance

---

## Deployment Checklist

### Pre-Deployment
- [ ] All high-priority fixes complete
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Team notified of changes
- [ ] Rollback plan prepared

### Staging Deployment
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Test user creation
- [ ] Test invitation flow
- [ ] Test password reset
- [ ] Check logs for errors
- [ ] Monitor for 24 hours

### Production Deployment
- [ ] Schedule deployment during low-traffic hours
- [ ] Deploy to production
- [ ] Run smoke tests immediately
- [ ] Monitor error rates
- [ ] Monitor authentication success rate
- [ ] Monitor email sending
- [ ] Check for any security alerts
- [ ] Monitor for 48 hours

### Post-Deployment
- [ ] Verify all fixes are working
- [ ] Check security logs
- [ ] Review metrics and alerts
- [ ] Gather user feedback
- [ ] Schedule post-mortem meeting
- [ ] Update incident response docs

---

## Documentation Checklist

- [ ] `AUTH_SYSTEM_OVERVIEW.md` updated
- [ ] `AUTH_SECURITY_FIXES.md` marked complete
- [ ] `AUTH_QUICK_REFERENCE.md` updated with new patterns
- [ ] README updated with setup instructions
- [ ] API documentation updated
- [ ] Onboarding guide updated
- [ ] Security policy updated
- [ ] Changelog updated

---

## Team Communication Checklist

- [ ] Kickoff meeting scheduled
- [ ] Daily standup for updates
- [ ] Slack channel created: #auth-security-fixes
- [ ] Progress tracked in project board
- [ ] Blockers escalated immediately
- [ ] Weekly demo of completed fixes
- [ ] Final review meeting scheduled
- [ ] Post-implementation retrospective

---

## Success Metrics

### Before Fixes
- Authentication success rate: ____%
- Average session establishment time: ____ ms
- Failed permission checks per day: ____
- Rate limit hits per day: ____
- Security incidents per month: ____

### After Fixes (Target)
- Authentication success rate: >99%
- Average session establishment time: <500ms
- Failed permission checks per day: <10
- Rate limit hits per day: <100
- Security incidents per month: 0

### Actual Results
- Authentication success rate: ____%
- Average session establishment time: ____ ms
- Failed permission checks per day: ____
- Rate limit hits per day: ____
- Security incidents per month: ____

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Email sending breaks after password rotation | Medium | High | Test thoroughly, have rollback plan |
| Session timing changes break auth flow | Low | High | Test all auth flows, gradual rollout |
| Rate limiting too strict | Medium | Medium | Start with high limits, adjust down |
| Performance impact from audit logging | Low | Medium | Use async logging, monitor performance |
| Database migration fails | Low | High | Test on staging first, have rollback |

---

## Rollback Procedures

### If Critical Issue Found

1. **Immediate Actions**:
   - [ ] Stop any in-progress deployments
   - [ ] Assess severity and impact
   - [ ] Notify team in #incidents channel
   - [ ] Start incident log

2. **Rollback Steps**:
   ```bash
   # Revert to previous version
   git checkout <previous-tag>
   vercel --prod
   ```
   - [ ] Verify rollback successful
   - [ ] Check authentication working
   - [ ] Monitor error rates
   - [ ] Update status page

3. **Post-Incident**:
   - [ ] Complete incident report
   - [ ] Identify root cause
   - [ ] Create fix for issue
   - [ ] Schedule post-mortem
   - [ ] Update runbooks

---

## Sign-Off

### Critical Priority Complete
- **Completed By**: _________________
- **Date**: _________________
- **Verified By**: _________________
- **Notes**: _________________

### High Priority Complete
- **Completed By**: _________________
- **Date**: _________________
- **Verified By**: _________________
- **Notes**: _________________

### Medium Priority Complete
- **Completed By**: _________________
- **Date**: _________________
- **Verified By**: _________________
- **Notes**: _________________

### Low Priority Complete
- **Completed By**: _________________
- **Date**: _________________
- **Verified By**: _________________
- **Notes**: _________________

### Final Sign-Off
- **Project Manager**: _________________ Date: _________
- **Tech Lead**: _________________ Date: _________
- **Security Officer**: _________________ Date: _________
- **Product Owner**: _________________ Date: _________

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Next Review**: After completion of all fixes
