# Copilot Instructions — bcur.me

> BC-UR playground: multi-tab SPA for UR/Bytewords/Hex/CBOR conversion, animated QR codes, fountain encoding, registry tools.

## 🎯 Workflow (Speckit-Driven)

**Before ANY code change:**
1. Read `specs/002-bc-ur-playground/tasks.md` → find current task
2. Read task description + acceptance criteria  
3. Consult `reference_projects/bc-ur/README.md` for API patterns
4. Implement → Test → Update `tasks.md` checkbox `[ ]` → `[x]`

**All implementation details are in:**
- `specs/002-bc-ur-playground/spec.md` - User stories, requirements
- `specs/002-bc-ur-playground/tasks.md` - 83 tasks (61 done, 22 remaining)
- `specs/002-bc-ur-playground/plan.md` - Architecture, tech stack
- `specs/002-bc-ur-playground/data-model.md` - Entities, validation

## Source of Truth

1. `reference_projects/*/README.md` → 2. `reference_projects/*/src/` → 3. `specs/*.md` → 4. This file

**Reference projects are READ-ONLY and AUTHORITATIVE.**

## Core Principles

1. **Trust bc-ur library** - Never reimplement. Use `UR.pipeline`, `BytewordEncoding`, `UrFountainEncoder/Decoder`
2. **Client-only** - No backend, sessionStorage only (auto-clear on unload)
3. **Simplicity** - Vanilla JS/HTML/CSS. No frameworks unless justified.
4. **Explicit errors** - UI messages + console logs. Never silent failures.
5. **Fast feedback** - Debounce (150ms typing/10ms paste), cache (LRU 120), instant visual updates
6. **Deterministic** - Same input → same output. DevTools-inspectable state.

## Current State (73% - 61/83 tasks)

✅ **Tab 1: Converter** (100%) - Multi-format conversion, property inspector, console API  
✅ **Tab 2: Multi-UR** (93%) - Animated QR, fountain encoding | ⏳ T051 GIF export  
✅ **Tab 3: Scanner** (100%) - Camera, real-time scanning, auto-forward  
✅ **Tab 4: Registry** (78%) - 6 packages, CDDL viewer | ⏳ T059-60  
🔄 **Phase 7: Console** (28%) - Inline execution done | ⏳ T078-83 TypeScript integration  
⏳ **Phase 8: Polish** (0%) - T073-76 mobile/a11y

**See `tasks.md` for details**

## File Structure (All ✅)

```
js/converter.js (1402L), multi-ur.js, scanner.js, registry.js,
   registry-item-ui.js (540L), registry-loader.js, router.js, shared.js
css/main.css, tabs.css
docs/history/ - 7 archived bug fixes
specs/002-bc-ur-playground/ - Speckit specs
reference_projects/ - READ-ONLY examples
```

## Key Patterns

**Pipeline:** `multiur → ur → bytewords → hex → decoded`  
**Auto-detect:** Multi-part UR → UR → hex → bytewords → JSON

```js
// Use UR.fromString(), never manual parse
const ur = UR.fromString('ur:...');

// Pipeline for encoding
const hex = UR.pipeline.encode(data, { until: 'hex' });

// Fountain decoder
const decoder = new UrFountainDecoder();
decoder.receivePartUr(part);
if (decoder.isComplete()) { const result = decoder.resultUr; }
```

## Console API

```js
// Exposed classes
window.UR, BytewordEncoding, UrFountainEncoder, UrFountainDecoder
window.CryptoHDKey, CryptoSeed, DetailedAccount, /* + all registry classes */

// Auto-exposed
window.$lastDecoded, $lastRegistryItem

// Utils
window.$cbor.inspect(), .diff(), .export(), .findType(), .listTags()
window.registryPackages.{blockchainCommons, coinIdentity, urSync, ...}
```

## Error Standards

- Invalid input: `throw new Error('Invalid hex input')` + context
- Camera: `showError(container, 'Camera access required. Grant permission.')`
- **Pattern:** User-facing message in UI, technical details in console

**Full error table:** See `specs/002-bc-ur-playground/spec.md`

## Quick Ref

**Dev:** `yarn dev` (checks port first) | `lsof -ti:8000` to check running  
**Architecture:** Hash routing, sessionStorage (temp), no localStorage  
**Security:** ⚠️ Demo only. Not audited for secrets.

---

**📖 For everything else, see:** `specs/002-bc-ur-playground/*.md`, `docs/history/`, `reference_projects/`
