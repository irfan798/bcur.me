# Task: Deploy Current Version to GitHub Pages

## Priority: HIGH
## Status: TODO
## Assignee: Agent
## Estimated Time: 1-2 hours

---

## Objective
Deploy the current BC-UR converter (single-page version) to GitHub Pages with automatic deployment via GitHub Actions.

---

## Prerequisites
- [x] Working local version (converter functional)
- [ ] GitHub repository with push access
- [ ] Domain configuration (optional: bcur.me)

---

## Task Breakdown

### 1. Repository Configuration
**Files to Create/Modify:**

#### 1.1 Create `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Validation:**
- [ ] Workflow file syntax correct
- [ ] Permissions properly set
- [ ] Artifact path includes all necessary files

---

### 2. Asset Path Verification
**Check all file references are relative:**

#### 2.1 index.html
- [ ] `<script type="module" src="demo.js"></script>` (relative)
- [ ] No absolute paths to `/assets/` or similar

#### 2.2 demo.js
- [ ] CDN imports use HTTPS
- [ ] No local filesystem references
- [ ] Import statement: `from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9'`

**Action Items:**
```bash
# Search for potential issues
grep -r "file://" .
grep -r "localhost" .
grep -r "127.0.0.1" .
```

---

### 3. Custom Domain Setup (Optional)

#### 3.1 Create CNAME file (if using custom domain)
```
bcur.me
```

#### 3.2 DNS Configuration
**Add these records to domain provider:**
```
Type: CNAME
Host: @
Value: irfan798.github.io

Type: CNAME  
Host: www
Value: irfan798.github.io
```

**Validation:**
- [ ] DNS propagation complete (check with `dig bcur.me`)
- [ ] HTTPS certificate provisioned by GitHub

---

### 4. Security Headers (Optional Enhancement)

#### 4.1 Create `_headers` file
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Note:** GitHub Pages has limited support for custom headers. This is aspirational for future CDN setup.

---

### 5. Documentation Updates

#### 5.1 Update README.md
Add deployment section:
```markdown
## 🚀 Live Demo
Try it now: [https://bcur.me](https://bcur.me) (or https://irfan798.github.io/bcur.me/)

## Development
```bash
# Serve locally
python3 -m http.server 8000
# or
npx live-server
```

Visit http://localhost:8000
```

#### 5.2 Add deployment badge
```markdown
[![Deploy](https://github.com/irfan798/bcur.me/actions/workflows/deploy.yml/badge.svg)](https://github.com/irfan798/bcur.me/actions/workflows/deploy.yml)
```

---

### 6. Pre-Deployment Testing

#### 6.1 Local Build Simulation
```bash
# Test in a clean directory
mkdir -p /tmp/bcur-test
cp index.html demo.js /tmp/bcur-test/
cd /tmp/bcur-test
python3 -m http.server 9000
```

**Test Checklist:**
- [ ] Page loads without errors
- [ ] CDN imports resolve
- [ ] All conversions work
- [ ] Copy button functions
- [ ] Example buttons work
- [ ] Mobile viewport responsive

#### 6.2 Browser Console Check
- [ ] No 404 errors for assets
- [ ] No CORS errors
- [ ] No CSP violations
- [ ] UR library loaded successfully

---

### 7. GitHub Pages Activation

#### 7.1 Repository Settings
1. Navigate to: `Settings > Pages`
2. Source: **GitHub Actions** (not branch)
3. Custom domain: `bcur.me` (if applicable)
4. Enforce HTTPS: **✓ Enabled**

#### 7.2 Trigger Deployment
```bash
# Commit workflow file
git add .github/workflows/deploy.yml
git commit -m "chore: add GitHub Pages deployment workflow"
git push origin main

# Monitor deployment
# Go to: Actions tab in GitHub
```

---

### 8. Post-Deployment Validation

#### 8.1 Production Testing
Visit deployed URL and verify:
- [ ] Page loads (no blank screen)
- [ ] CSS styles applied
- [ ] JavaScript executes
- [ ] CDN resources load
- [ ] All features functional

#### 8.2 Mobile Testing
Test on actual devices:
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Firefox Mobile

#### 8.3 Performance Check
```bash
# Lighthouse audit
npx lighthouse https://bcur.me --view

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
```

---

### 9. Rollback Plan

#### If deployment fails:
1. Check Actions logs: `Actions > Latest workflow run > View logs`
2. Common issues:
   - **404 on CDN:** Check import URLs
   - **Blank page:** Check browser console
   - **CORS error:** Ensure HTTPS for all imports
3. Rollback command:
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   ```

---

### 10. Monitoring & Maintenance

#### 10.1 Set Up Notifications
- [ ] Watch repository for deployment failures
- [ ] GitHub Actions email notifications enabled

#### 10.2 Dependency Pinning
- [ ] Document CDN version: `@ngraveio/bc-ur@2.0.0-beta.9`
- [ ] Create upgrade checklist for future updates

---

## Success Criteria
- ✅ Site accessible at production URL
- ✅ All features work as in local development
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Automatic deployment on push to main
- ✅ Documentation updated with live demo link

---

## Deliverables
1. `.github/workflows/deploy.yml` - Deployment workflow
2. `CNAME` - Custom domain config (optional)
3. Updated `README.md` - Live demo link + badge
4. Verified production deployment

---

## Notes for Agent
- **Test locally first:** Simulate GitHub Pages environment
- **Check CDN versions:** Ensure pinned to specific version
- **Mobile-first:** Test on actual devices, not just devtools
- **Error handling:** All errors must be user-visible, not just console
- **Documentation:** Update README immediately after successful deployment

---

## Related Tasks
- Next: [TASK-002-multi-tab-architecture.md]
- Blocks: All future feature implementations
- References: `PROJECT_ROADMAP.md` Phase 0

---

## Completion Checklist
- [ ] Workflow created and tested
- [ ] Assets paths verified
- [ ] Domain configured (if applicable)
- [ ] README updated
- [ ] Production tested on desktop
- [ ] Production tested on mobile
- [ ] Rollback plan documented
- [ ] Team notified of live URL
