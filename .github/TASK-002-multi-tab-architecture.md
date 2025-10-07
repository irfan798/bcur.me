# Task: Implement Multi-Tab Architecture

## Priority: MEDIUM
## Status: BLOCKED (requires TASK-001 completion)
## Assignee: Agent
## Estimated Time: 4-6 hours

---

## Objective
Restructure the single-page application into a multi-tabbed interface with client-side routing, maintaining all existing converter functionality while enabling data flow to future tabs.

---

## Prerequisites
- [x] Phase 0 deployed (TASK-001)
- [ ] QR library selected and tested
- [ ] Router pattern decided (hash-based vs history API)

---

## Architecture Decisions

### Routing Strategy: Hash-Based Navigation
**Rationale:** Works on GitHub Pages without server config, compatible with static hosting

**URL Patterns:**
- `/#converter` (default) - UR/Bytewords/Hex converter
- `/#multi-ur` - Multi-UR generator & animated QR
- `/#scanner` - QR scanner & fountain decoder
- `/#registry` - Registry developer tools

### State Management: URL Params + SessionStorage
**Data Forwarding Example:**
```javascript
// Tab 1 → Tab 2
const ur = outputElement.value;
window.location.hash = `#multi-ur?ur=${encodeURIComponent(ur)}`;

// Tab 3 → Tab 1
sessionStorage.setItem('decoded-ur', multiUrString);
window.location.hash = '#converter';
```

---

## Task Breakdown

### 1. File Structure Reorganization

#### 1.1 Create New Directory Structure
```
/js
  ├── converter.js      # Refactored from demo.js (Tab 1)
  ├── multi-ur.js       # New (Tab 2)
  ├── scanner.js        # New (Tab 3)
  ├── registry.js       # New (Tab 4)
  ├── router.js         # New (navigation logic)
  ├── shared.js         # New (common utilities)
  └── state.js          # New (cross-tab state management)

/css
  ├── main.css          # Global styles (extracted from index.html)
  ├── tabs.css          # Tab navigation styles
  ├── converter.css     # Tab 1 specific
  ├── multi-ur.css      # Tab 2 specific
  ├── scanner.css       # Tab 3 specific
  └── registry.css      # Tab 4 specific
```

**Action Items:**
- [ ] Create directories: `js/`, `css/`
- [ ] Move existing inline CSS to `css/main.css`
- [ ] Extract `FormatConverter` class to `js/converter.js`
- [ ] Update `index.html` imports

---

### 2. Router Implementation (`js/router.js`)

#### 2.1 Hash-Based Router
```javascript
class Router {
  constructor() {
    this.routes = new Map();
    this.currentTab = null;
    
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  register(path, handler) {
    this.routes.set(path, handler);
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'converter';
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString);
    
    const handler = this.routes.get(path);
    if (handler) {
      this.hideAllTabs();
      handler(params);
      this.currentTab = path;
    } else {
      window.location.hash = '#converter'; // fallback
    }
  }

  hideAllTabs() {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = 'none';
    });
  }
}

export const router = new Router();
```

**Validation:**
- [ ] Navigation works without page reload
- [ ] Back/forward buttons work correctly
- [ ] URL params preserved during navigation
- [ ] Direct URL access works (deep linking)

---

### 3. Tab Navigation UI

#### 3.1 Update `index.html` Structure
```html
<div class="container">
  <!-- Tab Navigation -->
  <nav class="tab-nav">
    <a href="#converter" class="tab-btn active" data-tab="converter">
      🔄 Converter
    </a>
    <a href="#multi-ur" class="tab-btn" data-tab="multi-ur">
      📚 Multi-UR & QR
    </a>
    <a href="#scanner" class="tab-btn" data-tab="scanner">
      📷 QR Scanner
    </a>
    <a href="#registry" class="tab-btn" data-tab="registry">
      🔧 Registry Tools
    </a>
  </nav>

  <!-- Tab Content Containers -->
  <div id="converter-tab" class="tab-content active">
    <!-- Existing converter HTML -->
  </div>

  <div id="multi-ur-tab" class="tab-content">
    <!-- Multi-UR generator (TASK-003) -->
  </div>

  <div id="scanner-tab" class="tab-content">
    <!-- QR Scanner (TASK-004) -->
  </div>

  <div id="registry-tab" class="tab-content">
    <!-- Registry tools (TASK-005) -->
  </div>
</div>
```

#### 3.2 Tab Navigation Styles (`css/tabs.css`)
```css
.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e1e4e8;
  overflow-x: auto; /* mobile scroll */
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  color: #586069;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #24292e;
  background: #f6f8fa;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .tab-nav {
    justify-content: flex-start;
  }
  
  .tab-btn {
    font-size: 14px;
    padding: 10px 16px;
  }
}
```

**Validation:**
- [ ] Tab switching smooth (no flicker)
- [ ] Active tab visually indicated
- [ ] Mobile: horizontal scroll works
- [ ] Keyboard accessible (Tab key navigation)

---

### 4. State Management (`js/state.js`)

#### 4.1 Cross-Tab State Manager
```javascript
class StateManager {
  constructor() {
    // Session storage for temporary cross-tab data
    this.storage = window.sessionStorage;
  }

  // Set data to forward to another tab
  forward(key, data) {
    this.storage.setItem(`forward:${key}`, JSON.stringify(data));
  }

  // Get and clear forwarded data
  receive(key) {
    const item = this.storage.getItem(`forward:${key}`);
    if (item) {
      this.storage.removeItem(`forward:${key}`);
      return JSON.parse(item);
    }
    return null;
  }

  // Check if data is waiting
  hasData(key) {
    return this.storage.getItem(`forward:${key}`) !== null;
  }

  // Clear all forwarded data (on tab close)
  clear() {
    Object.keys(this.storage).forEach(key => {
      if (key.startsWith('forward:')) {
        this.storage.removeItem(key);
      }
    });
  }
}

export const state = new StateManager();

// Auto-clear on page unload
window.addEventListener('beforeunload', () => state.clear());
```

**Usage Example:**
```javascript
// In converter.js (Tab 1)
state.forward('ur-data', { ur: urString, type: 'crypto-seed' });
window.location.hash = '#multi-ur';

// In multi-ur.js (Tab 2)
const data = state.receive('ur-data');
if (data) {
  inputElement.value = data.ur;
  generateMultiUR();
}
```

**Validation:**
- [ ] Data persists during tab switch
- [ ] Data cleared after retrieval
- [ ] No data leakage between sessions
- [ ] Works with browser back button

---

### 5. Converter Tab Enhancements (Tab 1)

#### 5.1 Add "Forward to Multi-UR" Button
```javascript
// In js/converter.js
class FormatConverter {
  // ... existing code ...

  setupEventListeners() {
    // ... existing listeners ...

    // Forward button (appears when output is single UR)
    this.forwardBtn = document.getElementById('forwardBtn');
    this.forwardBtn?.addEventListener('click', () => {
      const output = this.outputElement.value;
      const outputFormat = this.outputFormatElement.value;
      
      if (outputFormat === 'ur' && output.startsWith('ur:')) {
        state.forward('ur-data', { ur: output });
        window.location.hash = '#multi-ur';
      }
    });
  }

  handleConversion() {
    // ... existing logic ...

    // Show/hide forward button based on output
    if (this.outputFormatElement.value === 'ur' && !hasError) {
      this.forwardBtn.style.display = 'inline-block';
    } else {
      this.forwardBtn.style.display = 'none';
    }
  }
}
```

#### 5.2 Update HTML
```html
<!-- In converter tab -->
<div class="output-actions">
  <button id="copyBtn" class="action-btn">📋 Copy</button>
  <button id="forwardBtn" class="action-btn" style="display:none;">
    ➡️ Create Multi-UR
  </button>
</div>
```

**Validation:**
- [ ] Forward button appears only for single UR output
- [ ] Clicking forwards to Tab 2 with pre-filled data
- [ ] Tab 2 auto-generates multi-UR on receive

---

### 6. Shared Utilities (`js/shared.js`)

#### 6.1 Common Functions
```javascript
// Debounce utility
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Format validation
export function isValidUR(str) {
  return /^ur:[a-z0-9-]+\/[a-z]+$/.test(str);
}

export function isValidHex(str) {
  return /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;
}

// Error display
export function showError(container, message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `
    <span class="error-icon">❌</span>
    <span>${message}</span>
  `;
  container.appendChild(errorEl);
  
  setTimeout(() => errorEl.remove(), 5000);
}

// Success notification
export function showSuccess(container, message) {
  const successEl = document.createElement('div');
  successEl.className = 'success-message';
  successEl.innerHTML = `
    <span class="success-icon">✅</span>
    <span>${message}</span>
  `;
  container.appendChild(successEl);
  
  setTimeout(() => successEl.remove(), 3000);
}
```

**Validation:**
- [ ] Utilities work across all tabs
- [ ] No code duplication
- [ ] Consistent error/success styling

---

### 7. Lazy Loading (Performance Optimization)

#### 7.1 Load Tab Content on First Access
```javascript
// In router.js
class Router {
  constructor() {
    this.routes = new Map();
    this.loadedTabs = new Set();
    // ... existing code ...
  }

  async handleRoute() {
    const [path] = hash.split('?');
    
    // Lazy load tab module if not loaded
    if (!this.loadedTabs.has(path)) {
      await this.loadTab(path);
      this.loadedTabs.add(path);
    }
    
    // ... existing routing logic ...
  }

  async loadTab(path) {
    switch(path) {
      case 'multi-ur':
        await import('./multi-ur.js');
        break;
      case 'scanner':
        await import('./scanner.js');
        break;
      case 'registry':
        await import('./registry.js');
        break;
      // converter already loaded in main
    }
  }
}
```

**Validation:**
- [ ] First tab load faster (only loads converter)
- [ ] Subsequent tabs load on demand
- [ ] No duplicate module loading
- [ ] Smooth transition (no visible loading delay)

---

### 8. Mobile Responsive Enhancements

#### 8.1 Touch-Friendly Tab Navigation
```css
/* css/tabs.css */
@media (max-width: 768px) {
  .tab-nav {
    position: sticky;
    top: 0;
    background: white;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .tab-btn {
    min-width: 80px;
    touch-action: manipulation; /* prevent zoom on double-tap */
  }

  .tab-content {
    padding: 16px 12px; /* more compact on mobile */
  }
}
```

#### 8.2 Viewport Meta Tag (in index.html)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**Validation:**
- [ ] Tab switching works on touch
- [ ] No accidental zoom on tap
- [ ] Sticky navigation on scroll
- [ ] Content readable without zooming

---

### 9. Testing Checklist

#### 9.1 Functional Tests
- [ ] Tab navigation works (all 4 tabs)
- [ ] URL params preserved
- [ ] Back/forward browser buttons work
- [ ] Data forwarding (Tab 1 → Tab 2)
- [ ] Data forwarding (Tab 3 → Tab 1)
- [ ] Direct URL access (e.g., `/#multi-ur`)
- [ ] Refresh preserves tab state

#### 9.2 Cross-Browser Tests
- [ ] Chrome (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Safari (iOS)
- [ ] Edge (desktop)

#### 9.3 Performance Tests
- [ ] First tab load < 1s
- [ ] Tab switch < 100ms
- [ ] No memory leaks (monitor DevTools)
- [ ] Lazy loading reduces initial bundle

---

### 10. Migration from Single Page

#### 10.1 Backward Compatibility
```javascript
// Handle old bookmarks (no hash)
if (!window.location.hash) {
  window.location.hash = '#converter';
}
```

#### 10.2 CSS Migration
- [ ] Extract all inline styles from `index.html`
- [ ] Organize by component (tabs, converter, etc.)
- [ ] Maintain visual consistency
- [ ] No regression in styling

---

## Success Criteria
- ✅ Four tabs accessible via hash navigation
- ✅ Converter functionality unchanged
- ✅ Data flows between tabs via URL/sessionStorage
- ✅ Mobile responsive with sticky navigation
- ✅ No performance regression
- ✅ Browser back/forward works correctly
- ✅ All existing tests pass

---

## Deliverables
1. Refactored file structure (`js/`, `css/` directories)
2. `js/router.js` - Hash-based navigation
3. `js/state.js` - Cross-tab state management
4. `js/shared.js` - Common utilities
5. `css/tabs.css` - Tab navigation styles
6. Updated `index.html` - Multi-tab structure
7. Enhanced `js/converter.js` - Forward button

---

## Notes for Agent
- **Preserve existing functionality:** Converter must work exactly as before
- **Mobile-first:** Test on actual devices, not just DevTools
- **Performance:** Use lazy loading, avoid unnecessary re-renders
- **State cleanup:** Clear sessionStorage on unload
- **Error boundaries:** Catch errors per tab, don't crash entire app

---

## Related Tasks
- Depends on: [TASK-001-deploy-github-pages.md]
- Enables: [TASK-003-multi-ur-generator.md]
- Enables: [TASK-004-qr-scanner.md]
- Enables: [TASK-005-registry-tools.md]

---

## Completion Checklist
- [ ] Router implemented and tested
- [ ] All tabs navigable
- [ ] State management working
- [ ] Converter refactored without regression
- [ ] Mobile responsive
- [ ] Performance optimized (lazy loading)
- [ ] Documentation updated
- [ ] Tests passing
