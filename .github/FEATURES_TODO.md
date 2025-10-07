# Features & TODO List — BC-UR.me

## Project Status: Phase 0 (Deployment)

---

## 📋 Task Overview

| Task ID | Title | Status | Priority | Assignee | Blocked By |
|---------|-------|--------|----------|----------|------------|
| TASK-001 | Deploy to GitHub Pages | � DONE | HIGH | Agent | - |
| TASK-002 | Multi-Tab Architecture | 🔴 TODO | MEDIUM | Agent | TASK-001 |
| TASK-003 | Multi-UR Generator & QR | 🔴 TODO | HIGH | Agent | TASK-002 |
| TASK-004 | QR Scanner & Decoder | 🔴 TODO | HIGH | Agent | TASK-002 |
| TASK-005 | Registry Developer Tools | 🔴 TODO | MEDIUM | Agent | TASK-002 |

**Legend:**
- 🔴 TODO - Not started
- 🟡 IN PROGRESS - Currently being worked on
- 🟢 DONE - Completed and verified
- ⏸️ BLOCKED - Waiting on dependencies

---

## 🎯 Current Sprint: Deployment

### Active Task: TASK-001
**Objective:** Deploy current converter to GitHub Pages

**Deliverables:**
- [ ] GitHub Actions workflow (`.github/workflows/deploy.yml`)
- [ ] Asset path verification (all relative)
- [ ] Custom domain setup (optional: bcur.me)
- [ ] README with live demo link
- [ ] Production testing (desktop + mobile)

**Acceptance Criteria:**
- Site live at production URL
- All features work as in local dev
- No console errors
- Mobile responsive
- Auto-deploy on push to main

📄 **Details:** See [TASK-001-deploy-github-pages.md](.github/TASK-001-deploy-github-pages.md)

---

## 🚀 Upcoming Features

### Phase 1: Multi-Tab Architecture (TASK-002)
**Goal:** Transform single-page app into tabbed interface

**Key Components:**
- Hash-based routing (`#converter`, `#multi-ur`, `#scanner`, `#registry`)
- Cross-tab state management (sessionStorage + URL params)
- Lazy loading for performance
- Mobile-optimized sticky navigation

**Impact:**
- Enables all future features
- Improves UX with focused workflows
- Maintains existing functionality

📄 **Details:** See [TASK-002-multi-tab-architecture.md](.github/TASK-002-multi-tab-architecture.md)

---

### Phase 2: Multi-UR & Animated QR (TASK-003)
**Goal:** Generate fountain-encoded multi-part URs with animated QR display

**Features:**
- UrFountainEncoder integration with full parameter control:
  - Max/min fragment length
  - Sequence numbering
  - Repeat ratio (infinite loop support)
- QR generation with:
  - Alphanumeric encoding (bytewords optimized)
  - Error correction levels (L/M/Q/H)
  - Configurable size and frame rate
- Animated QR canvas with play/pause/restart controls
- Export options: frames (ZIP), animated GIF
- Data forwarding from Converter tab

**Technical:**
- QR library: `qrcode-generator` (lightweight, full control)
- Canvas-based rendering
- Smooth animation (1-30 fps)

📄 **Details:** See [TASK-003-multi-ur-generator.md](.github/TASK-003-multi-ur-generator.md)

---

### Phase 3: QR Scanner & Fountain Decoder (TASK-004)
**Goal:** Scan animated QR codes and decode multi-part URs with progress visualization

**Features:**
- Camera access with permission handling
- Real-time QR scanning (jsQR or similar)
- UrFountainDecoder integration:
  - Progress tracking (% complete)
  - Parts received counter
  - Visual flow indicators
- Auto-forward decoded UR to Converter tab
- Error handling for incompatible/corrupt parts
- Mobile-optimized camera controls

**Technical:**
- Browser MediaDevices API (camera)
- UrFountainDecoder from bc-ur library
- Real-time canvas processing
- HTTPS required for camera access

📄 **Details:** TBD - [TASK-004-qr-scanner.md]

---

### Phase 4: Registry Developer Tools (TASK-005)
**Goal:** Interactive playground for CBOR registry development

**Features:**
- Registry browser:
  - List all registered items (tag, URType, CDDL)
  - Collapsible CDDL viewer with syntax highlighting
  - Links to documentation
- Interactive item creator:
  - Form-based: tag, URType, CDDL input
  - KeyMap builder (key→int mapping)
  - Live validation feedback
  - "Register & Test" workflow
- Developer console integration:
  - `window.registryPlayground` exposed object
  - Auto-log created instances
  - Expandable structure inspection
  - CDDL verification results (valid/invalid with reasons)

**Technical:**
- `registryItemFactory` from bc-ur
- Dynamic instance creation
- Console API for logging
- CDDL parsing (if available in library)

📄 **Details:** TBD - [TASK-005-registry-tools.md]

---

## 📊 Progress Tracking

### Completed Features ✅
- [x] UR/Bytewords/Hex/CBOR converter
- [x] Multi-part UR assembly (UrFountainDecoder)
- [x] Format auto-detection
- [x] Pipeline visualization
- [x] Conversion caching
- [x] Copy to clipboard
- [x] Example data buttons
- [x] UR type override with validation
- [x] Bytewords style selector (minimal/standard/uri)
- [x] Decoded CBOR variants (JSON/Diagnostic/Commented/JavaScript)

### In Development 🔨
- [ ] GitHub Pages deployment (TASK-001)

### Planned 📝
- [ ] Multi-tab architecture (TASK-002)
- [ ] Multi-UR generator (TASK-003)
- [ ] QR scanner (TASK-004)
- [ ] Registry tools (TASK-005)

---

## 🔧 Technical Debt & Improvements

### Code Quality
- [ ] Extract inline CSS to separate files
- [ ] Refactor FormatConverter into smaller modules
- [ ] Add JSDoc comments to all public methods
- [ ] Create shared utility library

### Performance
- [ ] Implement virtual scrolling for large multi-UR output
- [ ] Web Worker for QR generation (offload main thread)
- [ ] Service Worker for offline support (future)

### Accessibility
- [ ] Full keyboard navigation
- [ ] ARIA labels for all interactive elements
- [ ] Screen reader testing
- [ ] High contrast mode

### Testing
- [ ] Automated validation scripts
- [ ] Cross-browser compatibility matrix
- [ ] Performance benchmarks
- [ ] Visual regression tests

---

## 📚 Documentation TODO

### User Documentation
- [ ] Getting Started guide
- [ ] Feature tutorials (with screenshots)
- [ ] FAQ section
- [ ] Troubleshooting guide
- [ ] Mobile usage tips

### Developer Documentation
- [ ] Architecture overview diagram
- [ ] API reference (internal modules)
- [ ] Contributing guidelines
- [ ] Code style guide
- [ ] Release process

### Examples
- [ ] Common use cases
- [ ] Integration patterns
- [ ] Custom registry item examples
- [ ] QR scanning workflows

---

## 🎨 Design Enhancements (Future)

### UI/UX
- [ ] Dark mode toggle
- [ ] Customizable color themes
- [ ] Animations and transitions polish
- [ ] Loading states and skeletons
- [ ] Improved error messages with recovery actions

### Features
- [ ] Shareable links (URL-encoded state)
- [ ] Batch processing (file upload)
- [ ] History/undo functionality
- [ ] Preset configurations (save settings)
- [ ] Export/import workflows

---

## 🐛 Known Issues

### Current
- None (initial release)

### Future Monitoring
- [ ] Camera permission handling edge cases
- [ ] QR scanning in low light
- [ ] Large multi-UR performance (100+ parts)
- [ ] Mobile Safari quirks

---

## 📦 Dependencies

### Core Libraries (Pinned)
- `@ngraveio/bc-ur@2.0.0-beta.9` - UR encoding/decoding
- `qrcode-generator@1.4.4` - QR code generation (to be confirmed)
- `jsQR` - QR scanning (to be selected)

### Optional (Future)
- `JSZip` - Frame export as ZIP
- `gif.js` - Animated GIF export
- CDDL parser (if available)

---

## 🚢 Release Plan

### v0.1.0 - MVP (Current)
- ✅ Converter functionality
- 🔄 GitHub Pages deployment

### v0.2.0 - Multi-Tab Foundation
- Multi-tab architecture
- Enhanced navigation
- Mobile optimizations

### v0.3.0 - QR Features
- Multi-UR generator
- Animated QR display
- QR scanner & decoder

### v0.4.0 - Developer Tools
- Registry browser
- Interactive item creator
- Console integration

### v1.0.0 - Stable Release
- All core features complete
- Full documentation
- Cross-browser tested
- Performance optimized
- Accessibility compliant

---

## 🤝 Contribution Guidelines

### For AI Agents
1. **Always read the task file first** (TASK-XXX-*.md)
2. **Update this TODO list** when completing tasks
3. **Document decisions** in task files
4. **Run tests** before marking complete
5. **Update roadmap** if scope changes

### For Human Contributors
- Follow [CONTRIBUTING.md] (to be created)
- Reference task files in PRs
- Update relevant documentation
- Add tests for new features

---

## 📞 Support & Feedback

### Reporting Issues
- Use GitHub Issues with template
- Include browser/OS information
- Provide reproduction steps
- Attach screenshots if relevant

### Feature Requests
- Search existing issues first
- Describe use case clearly
- Explain expected behavior
- Suggest implementation (optional)

---

## 🏆 Success Metrics

### Performance Targets
- [ ] Conversion time < 100ms
- [ ] QR generation < 50ms per frame
- [ ] Tab switch < 100ms
- [ ] Lighthouse score > 90

### User Experience
- [ ] Zero-click workflows
- [ ] Mobile feature parity
- [ ] Error recovery paths
- [ ] Accessibility WCAG AA

### Reliability
- [ ] No console errors
- [ ] Graceful degradation
- [ ] Offline support (future)
- [ ] Cross-browser compatibility

---

**Last Updated:** 2025-10-07  
**Maintained By:** AI Agent + Project Owner  
**Status:** Active Development
