# BC-UR.me — Project Roadmap

## Vision
A comprehensive, client-only web application for working with Uniform Resources (UR), multi-part fountain encoding, animated QR codes, and CBOR registry development.

## Architecture Overview

### Multi-Tab Single Page Application
- **Tab Navigation:** Client-side routing with hash-based navigation (`#converter`, `#multi-ur`, `#qr-scanner`, `#registry`)
- **State Sharing:** Data flows between tabs via URL parameters and sessionStorage (temporary, cleared on close)
- **Responsive Design:** Mobile-first with desktop enhancements

### Technology Stack
- **Core Library:** `@ngraveio/bc-ur@2.0.0-beta.9` (CDN via esm.sh)
- **QR Generation:** TBD - library with granular control over encoding, error correction, size
- **QR Scanning:** jsQR or similar with camera access
- **Build:** None (pure ESM modules)
- **Deployment:** GitHub Pages

---

## Phase 0: Deployment Setup ✅ NEXT
**Goal:** Publish current converter to GitHub Pages

### Deliverables
- [ ] GitHub Actions workflow for automatic deployment
- [ ] Custom domain configuration (bcur.me)
- [ ] Asset optimization (minification optional, prefer readable source)
- [ ] README with live demo link
- [ ] Security headers via `_headers` file

### Success Criteria
- Live site accessible at `https://bcur.me` or `https://irfan798.github.io/bcur.me/`
- Automatic deployment on push to `main`
- No broken CDN imports
- Works on mobile Chrome/Firefox

---

## Phase 1: Multi-Tab Architecture
**Goal:** Restructure into tabbed interface without breaking existing functionality

### Tab 1: Converter (Current Functionality)
- ✅ Already implemented
- [ ] Add "Send to Multi-UR Generator" button (appears when output is single UR)
- [ ] Data forwarding to Tab 2 via URL param `?ur=<encoded>`

### Tab 2: Multi-UR Generator & QR Display
**Inputs from UrFountainEncoder:**
- `maxFragmentLength` (default: 100, range: 10-200)
- `minFragmentLength` (default: 10, range: 5-50)
- `firstSeqNum` (default: 0)
- `repeatAfterRatio` (default: 2, 0 = infinite)

**QR Settings Section:**
- Framerate/Speed (fps slider: 1-30, default: 5)
- QR Size (pixels: 200-800, default: 400)
- Error Correction (L/M/Q/H, default: L)
- Encoding Mode: Alphanumeric (fixed, optimized for bytewords)

**Output:**
- Animated QR code canvas
- Current part indicator (e.g., "Part 3 of 15")
- Multi-UR text output (scrollable)
- Download buttons (GIF/frames as ZIP)

### Tab 3: QR Scanner & Fountain Decoder
**Camera Integration:**
- Request camera permission
- Live video preview
- Auto-scan with visual feedback (green box on successful scan)

**Decoder Progress:**
- Real-time progress bar (`UrFountainDecoder.getProgress()`)
- Parts received counter (e.g., "7/12 parts received")
- Visual flow: Scanned → Assembling → Complete
- Error display if incompatible parts detected

**Completion Flow:**
- Auto-forward assembled multi-UR to Tab 1
- Show full pipeline from multi-UR → decoded CBOR

### Tab 4: Registry Developer Tools
**Registry Browser:**
- List all registered items (tag, URType, CDDL)
- Collapsible CDDL viewer with syntax highlighting
- Links to documentation (if available)

**Interactive Registry Item Creator:**
- Form fields: tag (number), URType (string), CDDL (textarea)
- `keyMap` builder (optional key→int mapping)
- Live validation feedback
- "Register & Test" button

**Developer Console Integration:**
- `window.registryPlayground` object exposed
- Create instance → auto-log to console
- Show decoded structure with expandable properties
- CDDL verification results (valid/invalid with reasons)

---

## Implementation Principles

### Code Organization
```
index.html          # Main shell with tab navigation
js/
  ├── converter.js  # Tab 1 (existing FormatConverter class)
  ├── multiur.js    # Tab 2 (UrFountainEncoder wrapper)
  ├── scanner.js    # Tab 3 (Camera + UrFountainDecoder)
  ├── registry.js   # Tab 4 (Registry tools)
  ├── router.js     # Hash-based tab switching
  └── shared.js     # Common utilities, state management
css/
  ├── main.css      # Global styles
  └── tabs.css      # Tab-specific styles
```

### State Management
- **No Framework:** Vanilla JS with custom event system
- **Data Flow:** Forward-only between tabs (no circular dependencies)
- **Persistence:** sessionStorage for tab state, cleared on close
- **URL Params:** For deep linking and data passing

### Performance
- **Lazy Loading:** Tab content loaded on first access
- **Debouncing:** All user inputs (150ms typing, 10ms paste)
- **Caching:** Conversion results, QR frames
- **Memory:** Clear camera stream when leaving Tab 3

### Error Handling
- **User-Facing:** All errors shown in UI with recovery actions
- **Console:** Detailed errors for debugging (never removed)
- **Validation:** Inputs validated before processing
- **Fallbacks:** Graceful degradation if camera/clipboard unavailable

---

## QR Library Selection Criteria
**Requirements:**
- Alphanumeric mode support (explicit control)
- Error correction level selection (L/M/Q/H)
- Size configuration (pixel dimensions)
- Canvas output (for animation)
- No external dependencies
- Browser-compatible (no Node.js APIs)

**Candidates to Evaluate:**
1. `qrcode-generator` - Lightweight, full control
2. `qrcode` - Popular, well-maintained
3. `node-qrcode` - Feature-rich (check browser compatibility)

**Decision Factors:**
- Control over encoding mode
- Animation support (frame-by-frame generation)
- Bundle size (<50KB)
- TypeScript definitions (nice to have)

---

## Testing Strategy

### Manual Testing
- [ ] Cross-tab data flow (Converter → Multi-UR → Scanner → Converter)
- [ ] QR generation at different settings
- [ ] Camera permission handling (allow/deny)
- [ ] Mobile responsive behavior
- [ ] Error scenarios for each tab

### Reference Data
- Use test cases from `reference_projects/bc-ur/tests/`
- Validate against known UR examples
- Test edge cases (max fragment length, incomplete scans)

### Browser Compatibility
- Chrome 90+ (desktop & mobile)
- Firefox 88+ (desktop & mobile)
- Safari 14+ (iOS)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All CDN imports use pinned versions
- [ ] No console errors in production
- [ ] Mobile touch interactions tested
- [ ] Camera permissions tested on HTTPS
- [ ] Asset paths relative (not absolute)

### GitHub Pages Setup
- [ ] Enable Pages in repo settings
- [ ] Configure custom domain (if applicable)
- [ ] Add CNAME file
- [ ] Set up GitHub Actions workflow
- [ ] Test deployment in staging branch first

### Post-Deployment
- [ ] Verify live site functionality
- [ ] Check CDN asset loading
- [ ] Test camera on mobile over HTTPS
- [ ] Update README with demo link
- [ ] Monitor browser console for errors

---

## Future Enhancements (Post-MVP)

### Advanced Features
- [ ] QR frame export as animated GIF
- [ ] Batch UR processing (file upload)
- [ ] Shareable links (URL-encoded state)
- [ ] Dark mode toggle
- [ ] Accessibility improvements (ARIA, keyboard nav)

### Developer Tools
- [ ] Custom CDDL validator
- [ ] Registry item export/import
- [ ] Test vector generator
- [ ] Performance profiler

### Community
- [ ] Contribution guidelines
- [ ] Example use cases documentation
- [ ] Tutorial videos
- [ ] API documentation

---

## Non-Goals (Explicit Boundaries)
- ❌ No backend services (remains client-only)
- ❌ No user authentication
- ❌ No data persistence (localStorage/indexedDB)
- ❌ No cryptographic key handling
- ❌ No wallet functionality
- ❌ No build tooling (stays pure ESM)

---

## Success Metrics
- **Performance:** < 100ms conversion time
- **UX:** Zero-click workflows where possible
- **Accessibility:** WCAG AA compliance
- **Mobile:** Full feature parity with desktop
- **Reliability:** Graceful error handling, no crashes
