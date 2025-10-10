# BC-UR Package Patching Guide

**Created**: 2025-10-10  
**Patch File**: `patches/@ngraveio+bc-ur+2.0.0-beta.9.patch`  
**Status**: ✅ Automated and Working

---

## 🎯 Overview

This project uses [patch-package](https://github.com/ds300/patch-package) to automatically apply browser compatibility fixes to the `@ngraveio/bc-ur` package after installation.

---

## 🚀 Quick Start

### For New Contributors

```bash
# 1. Clone the repository
git clone <repo-url>
cd bcur.me

# 2. Install dependencies (patch is applied automatically)
yarn install

# 3. Start development server
yarn dev
```

**That's it!** The patch is applied automatically during `yarn install`.

---

## 📦 What Gets Patched?

The patch modifies 3 files in `node_modules/@ngraveio/bc-ur/`:

1. **`dist/esm/wrappers/cbor2.js`**
   - Fixes: Import path from `../../commonjs/` → `./cbor2Wrapper.js`
   - Why: ESM cannot import CommonJS files in browsers

2. **`dist/esm/wrappers/cbor2Wrapper.js`**
   - Fixes: Import source from external `cbor2` → `./cbor2Wrapper-fixed.js`
   - Why: Uses bundled CBOR2 code instead of external dependency

3. **`dist/esm/wrappers/cbor2Wrapper-fixed.js`** (NEW FILE)
   - Creates: ESM version of bundled CBOR2 code
   - Why: Provides same bundled code as CommonJS, just in ESM format

**Total patch size**: ~2.7KB (87 lines diff)

---

## 🔧 How It Works

### Automatic Application

The patch is applied via the `postinstall` script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  },
  "devDependencies": {
    "patch-package": "^8.0.1",
    "postinstall-postinstall": "^2.1.0"
  }
}
```

**When does it run?**
- After `yarn install`
- After `yarn add <package>`
- After `yarn upgrade`
- After any command that modifies `node_modules`

### Verification

Check if the patch was applied successfully:

```bash
# Should show the patched files
ls -l node_modules/@ngraveio/bc-ur/dist/esm/wrappers/cbor2*

# Expected output:
# cbor2.js              (modified by patch)
# cbor2Wrapper.js       (modified by patch)
# cbor2Wrapper-fixed.js (created by patch)
```

---

## 🛠️ Maintaining the Patch

### If You Need to Update the Fixes

1. **Modify the files** in `node_modules/@ngraveio/bc-ur/`:
   ```bash
   # Make your changes to the files
   nano node_modules/@ngraveio/bc-ur/dist/esm/wrappers/cbor2.js
   ```

2. **Regenerate the patch**:
   ```bash
   npx patch-package @ngraveio/bc-ur
   ```

3. **Commit the updated patch**:
   ```bash
   git add patches/@ngraveio+bc-ur+2.0.0-beta.9.patch
   git commit -m "chore: update bc-ur browser compatibility patch"
   ```

### If bc-ur Package is Updated

When upgrading `@ngraveio/bc-ur` to a new version:

1. **Check if patch still applies**:
   ```bash
   yarn upgrade @ngraveio/bc-ur@<new-version>
   # If patch fails, you'll see an error
   ```

2. **Options if patch fails**:
   
   **Option A**: Re-create patch for new version
   ```bash
   # 1. Remove old patch
   rm patches/@ngraveio+bc-ur+*.patch
   
   # 2. Reinstall (without patch)
   yarn install
   
   # 3. Apply fixes manually (see IMPLEMENTATION_STATUS.md)
   # ... manual edits ...
   
   # 4. Create new patch
   npx patch-package @ngraveio/bc-ur
   ```
   
   **Option B**: Wait for official fix
   ```bash
   # Check if new version fixed the bug
   # See BC-UR_BUILD_FIX_TASK.md for what should be fixed
   ```

---

## 🐛 Troubleshooting

### Patch Not Applied After Install

**Symptom**: Console shows import errors after `yarn install`

**Fix**:
```bash
# Manually apply the patch
npx patch-package @ngraveio/bc-ur

# Or reinstall everything
rm -rf node_modules
yarn install
```

### Patch Conflicts on Upgrade

**Symptom**: Error message during `yarn upgrade`
```
**ERROR** Failed to apply patch for package @ngraveio/bc-ur
```

**Fix**:
```bash
# 1. Note the new version number
# 2. Remove old patch
rm patches/@ngraveio+bc-ur+*.patch

# 3. Complete the upgrade
yarn upgrade @ngraveio/bc-ur@<version>

# 4. Check if fix is still needed
yarn dev
# Open browser, check console for import errors

# 5. If errors persist, re-apply fixes and create new patch
# (see "If bc-ur Package is Updated" section)
```

### Patch Applied But Still Getting Errors

**Symptom**: Import errors persist even after patch

**Diagnosis**:
```bash
# 1. Check if files were actually modified
cat node_modules/@ngraveio/bc-ur/dist/esm/wrappers/cbor2.js | grep "cbor2Wrapper.js"
# Should show: from "./cbor2Wrapper.js"
# NOT: from "../../commonjs/..."

# 2. Check if new file was created
ls node_modules/@ngraveio/bc-ur/dist/esm/wrappers/cbor2Wrapper-fixed.js
# Should exist

# 3. Clear browser cache
# Hard reload: Ctrl+Shift+R (Linux/Windows) or Cmd+Shift+R (Mac)
```

---

## 📋 CI/CD Integration

### GitHub Actions

The patch is automatically applied in CI:

```yaml
# .github/workflows/test.yml
steps:
  - uses: actions/checkout@v3
  - uses: actions/setup-node@v3
  - run: yarn install  # Patch applied here automatically
  - run: yarn test
```

**No special configuration needed!** The `postinstall` script handles it.

### Docker

```dockerfile
# Dockerfile
FROM node:18
WORKDIR /app
COPY package.json yarn.lock ./
COPY patches ./patches  # ← Include patches directory
RUN yarn install        # ← Patch applied automatically
COPY . .
```

**Important**: Must copy `patches/` directory before `yarn install`

---

## 🔗 Related Documentation

- **Why is this needed?** → See [BC-UR_FIX_INDEX.md](./BC-UR_FIX_INDEX.md)
- **What's the proper fix?** → See [BC-UR_BUILD_FIX_TASK.md](./BC-UR_BUILD_FIX_TASK.md)
- **Current implementation details** → See [IMPORT_SETUP_SUMMARY.md](./IMPORT_SETUP_SUMMARY.md)
- **Visual diagrams** → See [BC-UR_FIX_DIAGRAM.md](./BC-UR_FIX_DIAGRAM.md)

---

## 📚 Additional Resources

- [patch-package GitHub](https://github.com/ds300/patch-package)
- [patch-package FAQ](https://github.com/ds300/patch-package#faq)
- [Why postinstall-postinstall?](https://github.com/ds300/patch-package#why-postinstall-postinstall)

---

**Last Updated**: 2025-10-10  
**Patch Version**: `@ngraveio/bc-ur@2.0.0-beta.9`  
**Maintainer**: See [BC-UR_BUILD_FIX_TASK.md](./BC-UR_BUILD_FIX_TASK.md) for submitting issue to bc-ur maintainers
