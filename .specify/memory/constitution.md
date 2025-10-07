<!--
Sync Impact Report - Version 1.1.0

Version Change: 1.0.0 → 1.1.0
Rationale: Simplified constitution to focus on governance principles, not implementation details

Changes:
- Removed prescriptive technical details (debounce timings, cache sizes, file structure)
- Relaxed framework prohibition: now "prefer vanilla JS unless framework solves problem better"
- Relaxed analytics prohibition: allowed when justified (A/B testing, error monitoring)
- Added development vs production environment distinction (local packages vs CDN)
- Moved implementation details to .specify/specs/ (where they belong)
- Kept only governance-level principles

Philosophy: Constitution = "Why & When", Specs = "How & What"
-->

# BC-UR.me Constitution

## Core Principles

### I. Trust the Library

Use `@ngraveio/bc-ur` library as the authoritative implementation. Never reimplement encoding pipelines—leverage `UR.pipeline`, `BytewordEncoding`, `UrFountainEncoder`, `UrFountainDecoder`.

**Rationale:** The bc-ur library is production-tested and handles complex edge cases. Reimplementation introduces bugs, maintenance burden, and drift from standards.

**Enforcement:**
- All conversions MUST use library methods (never manual CBOR encoding/decoding)
- Pin library versions in production (avoid breaking changes)
- Verify behavior against library documentation before using

### II. Client-First Architecture

Prefer client-side processing. All sensitive data processing happens in the browser. Server/analytics allowed only when justified by concrete benefits.

**Rationale:** Privacy-first design ensures user data stays under their control. Client-only deployment is simpler, faster, and more trustworthy. However, some features (A/B testing, error monitoring, performance analytics) may require external services when benefits outweigh privacy costs.

**Enforcement:**
- Default: no backend, no analytics, no tracking
- Exception: justify need, document privacy impact, provide opt-out
- Sensitive data (URs, decoded CBOR) never sent to third parties
- Temporary state only (no persistent storage without user consent)

### III. Simplicity Over Abstractions

Prefer vanilla JS with semantic HTML and modular CSS. Only introduce frameworks/build tools when concrete benefits (performance, maintainability, accessibility) outweigh complexity costs.

**Rationale:** Simple code is easier to understand, debug, and maintain. Frameworks add bundle size, build complexity, and cognitive load. However, some problems (complex state management, animations, accessibility) may be better solved with frameworks.

**Decision Framework:**
- Start vanilla (HTML/CSS/JS)
- Add complexity only when benefits are clear and measurable
- Document rationale for framework/tool adoption
- Prefer incremental adoption (add Rollup when needed, not upfront)

### IV. Explicit Errors

Every failure MUST surface visible, contextual UI messages. Never silently ignore malformed input—show what broke and why. Preserve console errors for debugging.

**Rationale:** Users cannot fix what they cannot see. Debugging requires visibility into failure points. Contextual errors reduce support burden and enable self-service troubleshooting.

**Enforcement:**
- All error paths display user-facing message with context
- Console errors retained (structured logging encouraged)
- Status indicators show success/error/warning states
- Error messages guide recovery (e.g., "Invalid hex (odd length)" vs "Error")

### V. Fast Feedback

Optimize for perceived performance. Users should see instant visual feedback. Debounce inputs, cache results, show loading states.

**Rationale:** Perceived performance is user experience. Instant feedback builds confidence and trust in the tool.

**Implementation:** See `.specify/specs/` for specific timing targets and caching strategies.

### VI. Reference Projects as Authority

Reference projects in `reference_projects/` are READ-ONLY and authoritative. Consult in order: (1) README.md, (2) source code, (3) tests.

**Rationale:** Reference projects are maintained by domain experts and battle-tested. Local assumptions may be outdated or incorrect. Following authoritative sources prevents bugs and standards drift.

**Enforcement:**
- Never modify `reference_projects/` (excluded from deployments)
- Before implementing features: read relevant README first
- Verify library behavior against reference tests
- Document deviations in TASK files with rationale

### VII. Deterministic & Inspectable

All conversions must be reproducible (same input → same output). State must be debuggable via browser DevTools. No minification in production (readable source encouraged).

**Rationale:** Cryptographic tools require auditability. Deterministic output builds trust. Inspector-friendly code enables community contributions and security review.

**Enforcement:**
- Deterministic conversions (no random state, no timestamps in output)
- State stored in inspectable objects (classes with public properties)
- DevTools-friendly: breakpoints work predictably

## Development Practices

### Environment Separation

- **Development:** Local packages via `yarn` (faster iteration, offline support)
- **Production:** CDN imports with version pinning (no build step, deterministic)

**Primary Dependency:** `@ngraveio/bc-ur@2.0.0-beta.9`

### Task-Driven Development

All features implemented via `.specify/specs/` and `.github/TASK-*.md` files:
1. Read FEATURES_TODO.md → identify active task
2. Read full TASK/spec file → understand requirements
3. Consult reference projects → verify library usage
4. Implement → test → update status

**Source of Truth Hierarchy:**
1. Reference Project READMEs
2. Reference Project Source Code
3. Spec/TASK Files
4. Copilot Instructions (cross-cutting concerns only)

### Quality Gates

Before marking task complete:
- ✅ Follows "Trust the Library" (uses library, not reimplementation)
- ✅ Client-first (justifies any external services)
- ✅ Simple as possible (justifies any added complexity)
- ✅ Explicit errors (user-visible messages with context)
- ✅ Fast feedback (perceived performance optimized)
- ✅ Reference verified (checked against authoritative sources)
- ✅ Inspectable (debuggable in DevTools)

## Governance

### Constitutional Authority

This constitution defines **governance principles**, not implementation details. Specs define implementation.

**In case of conflict:**
- Constitution > Specs (principles override implementation)
- Specs > Code (documented design overrides ad-hoc decisions)
- Reference Projects > Local assumptions (external authority wins)

### Amendment Process

1. Propose change with rationale (problem + solution)
2. Impact analysis: affected templates/files
3. Version bump: MAJOR (principle change) / MINOR (new principle) / PATCH (clarification)
4. Update constitution + sync templates
5. Document in Sync Impact Report
6. Commit: `docs: amend constitution to vX.Y.Z (summary)`

### Compliance

**Agent Guidance:** See `.github/copilot-instructions.md` for development patterns.  
**Implementation Details:** See `.specify/specs/` for technical specifications.

**Version**: 1.1.0 | **Ratified**: 2025-10-08 | **Last Amended**: 2025-10-08