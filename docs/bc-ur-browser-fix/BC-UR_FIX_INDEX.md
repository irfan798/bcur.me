# BC-UR Browser Fix Documentation Index

**Date**: 2025-10-10  
**Status**: ✅ Working - Local bc-ur package functional in browsers  
**Author**: AI Assistant (with context from bc-ur debugging session)

---

## 📚 Documentation Files

### 1. **QUICK_ANSWERS.md** ⭐ START HERE
Direct answers to key questions:
- How to fix the bc-ur source code?
- Would using cbor2 ESM without bundling work?
- What is the current workaround?
- Will it work in Node.js too?

**Best for**: Quick understanding of the issue and solutions

---

### 2. **BC-UR_FIX_DIAGRAM.md** 📊 VISUAL GUIDE
Visual diagrams explaining:
- Current broken structure
- My fix (workaround)
- Proper fix (for maintainers)
- Alternative solutions
- Dual Package Hazard explained with diagrams
- Import map solutions

**Best for**: Understanding the structure and flow visually

---

### 3. **BC-UR_BUILD_FIX_TASK.md** 🔧 TECHNICAL DETAILS
Comprehensive task document for bc-ur maintainers:
- Problem summary and root cause
- Understanding Dual Package Hazard
- Proper fix with implementation steps
- Alternative solutions with trade-offs
- Testing checklist
- References and links

**Best for**: Implementing the permanent fix in bc-ur package

---

### 4. **IMPORT_SETUP_SUMMARY.md** ✅ IMPLEMENTATION STATUS
Current state documentation:
- Final import map configuration
- Browser fixes applied
- Verification and test results
- Known limitations
- Workaround options (patch-package, etc.)

**Best for**: Understanding what was done and current status

---

## 🎯 Quick Navigation

### "I just want to understand the issue"
→ Read: `QUICK_ANSWERS.md` (5 min read)

### "I want to see it visually"
→ Read: `BC-UR_FIX_DIAGRAM.md` (10 min read)

### "I'm a bc-ur maintainer, how do I fix this?"
→ Read: `BC-UR_BUILD_FIX_TASK.md` (20 min read)

### "What's the current status of the project?"
→ Read: `IMPORT_SETUP_SUMMARY.md` (15 min read)

---

## 🔑 Key Points Summary

### The Problem
- `@ngraveio/bc-ur@2.0.0-beta.9` ESM build references CommonJS files
- Browsers cannot load CommonJS as ES modules
- Error: "The requested module does not provide an export named 'decode'"

### The Root Cause
- ESM build missing bundled CBOR2 code
- `/dist/esm/wrappers/cbor2.js` imports from `../../commonjs/` (wrong!)
- `/dist/esm/wrappers/cbor2Wrapper.js` imports from external `cbor2` (not bundled!)

### My Fix (Workaround)
1. Made ESM cbor2.js import from local `./cbor2Wrapper.js`
2. Converted CommonJS bundled CBOR2 to ESM format
3. Made ESM cbor2Wrapper.js use the bundled ESM version

**Result**: Works in browsers AND Node.js, preserves Dual Package Hazard protection

### Proper Fix (For bc-ur Package)
Update Rollup build to generate bundled CBOR2 in **both** formats:
- `dist/esm/wrappers/cbor2Wrapper.js` (bundled ESM)
- `dist/commonjs/wrappers/cbor2Wrapper.js` (bundled CommonJS - already exists)

### Alternative (Simpler but trade-offs)
Use cbor2 ESM directly without bundling:
- ✅ Works in browsers
- ✅ Simpler build
- ❌ Dual Package Hazard returns
- ❌ Requires cbor2 as peer dependency

---

## 📋 Files Modified (Current Workaround)

### In `node_modules/@ngraveio/bc-ur/dist/esm/wrappers/`:

1. **`cbor2.js`** (line 6):
   ```javascript
   export { decode, encode, Tag, registerEncoder, comment, diagnose } from "./cbor2Wrapper.js";
   ```

2. **`cbor2Wrapper-fixed.js`** (NEW FILE):
   - Created by converting CommonJS bundle to ESM
   - 48 lines of bundled CBOR2 code in ESM format

3. **`cbor2Wrapper.js`** (entire file):
   ```javascript
   export { decode, encode, Tag, registerEncoder, comment, diagnose } from "./cbor2Wrapper-fixed.js";
   ```

---

## 🧪 Verification

### Test Command
```bash
# Check no CommonJS references in ESM build
grep -r "../../commonjs" node_modules/@ngraveio/bc-ur/dist/esm/
# Should return empty
```

### Browser Test
```javascript
import { UR } from '@ngraveio/bc-ur';
const ur = UR.fromData({ type: 'test', payload: { id: 123 } });
console.log(ur.toString());
// Should output: ur:test/... (no errors)
```

### Console Output (Success)
```
BC-UR Playground initialized ✅
```

---

## 📝 Next Steps

### Immediate (Development)
- [x] Application working with local bc-ur
- [ ] Set up patch-package for automated fixes
- [ ] Continue Phase 4 (QR Scanner) development

### Future (Contribute to bc-ur)
- [ ] Create GitHub issue in @ngraveio/bc-ur repository
- [ ] Attach `BC-UR_BUILD_FIX_TASK.md` as detailed report
- [ ] Offer to contribute PR with proper fix
- [ ] Wait for official package update

### Production
- [ ] Verify production uses esm.sh CDN (no local patches needed)
- [ ] Test production deployment
- [ ] Monitor for bc-ur package updates

---

## 🔗 External References

- [bc-ur GitHub](https://github.com/ngraveio/bc-ur)
- [Dual Package Hazard (Node.js)](https://nodejs.org/docs/latest-v18.x/api/packages.html#dual-package-hazard)
- [cbor2 Dual Packaging PR](https://github.com/hildjj/cbor2/pull/57)
- [Import Maps Spec](https://github.com/WICG/import-maps)

---

## 📞 Contact

For questions about this documentation:
- See conversation context in `IMPORT_SETUP_SUMMARY.md`
- Review implementation in `index.html` (lines 12-50)
- Check original issue in `BC-UR_BUILD_FIX_TASK.md`

---

**Last Updated**: 2025-10-10  
**Status**: ✅ Working solution implemented, awaiting permanent fix in bc-ur package
