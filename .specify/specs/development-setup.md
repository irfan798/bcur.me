# Development Setup Specification

**Purpose:** Define development vs production environment configurations for bc-ur.me

## Environment Separation

### Development Environment

**Package Management:** Yarn (local packages for faster iteration)

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
# or
yarn start
```

**Primary Dependency:**
```json
{
  "@ngraveio/bc-ur": "2.0.0-beta.9"
}
```

**Import Pattern (index.html for dev):**
```html
<!-- Development: local package via import map -->
<script type="importmap">
{
  "imports": {
    "@ngraveio/bc-ur": "/node_modules/@ngraveio/bc-ur/dist/index.js"
  }
}
</script>
<script type="module" src="./demo.js"></script>
```

**Benefits:**
- Offline development
- Faster reload (no CDN latency)
- Version locking via yarn.lock
- Package inspection in node_modules/

---

### Production Environment

**Deployment:** Direct file copy (index.html + demo.js only)

**Import Pattern (index.html for production):**
```html
<!-- Production: pinned CDN version -->
<script type="module">
import * as bcur from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';
// ... rest of code
</script>
```

**Benefits:**
- No node_modules in deployment
- Deterministic builds (pinned version)
- Browser caching (CDN)
- Zero build step

---

## Import Strategy

### Option 1: Import Map (Development)

Use import map to alias `@ngraveio/bc-ur` to local package:

```html
<script type="importmap">
{
  "imports": {
    "@ngraveio/bc-ur": "/node_modules/@ngraveio/bc-ur/dist/index.js"
  }
}
</script>
```

Then in `demo.js`:
```js
import { UR, BytewordEncoding, UrFountainEncoder } from '@ngraveio/bc-ur';
```

### Option 2: Conditional Import (Single Source)

Use environment detection:

```js
// demo.js
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const bcur = isDev
  ? await import('/node_modules/@ngraveio/bc-ur/dist/index.js')
  : await import('https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9');

const { UR, BytewordEncoding, UrFountainEncoder } = bcur;
```

### Option 3: Build Script Swap (Recommended)

Create `index.dev.html` and `index.prod.html`, copy during deployment:

```yaml
# .github/workflows/deploy.yml
- name: Prepare deployment
  run: |
    mkdir -p deploy
    cp index.prod.html deploy/index.html  # Use production version
    cp demo.js deploy/
```

**Recommended:** Option 3 (explicit separation, no runtime conditionals)

---

## Local Development Server

**Tool:** `live-server@1.2.1`

**Configuration (package.json):**
```json
{
  "scripts": {
    "dev": "live-server --port=8000 --no-browser",
    "start": "live-server"
  }
}
```

**IMPORTANT**: Always check if server is running before starting a new one:
```bash
# Check if port 8000 is in use
lsof -ti:8000  # If returns PID, server is running

# ALWAYS use yarn dev (preferred - checks port automatically)
yarn dev

# Manual alternatives (not recommended)
npx serve
npx http-server
```

**Never use Python's http.server** - it was removed from all documentation in favor of `yarn dev`.

---

## Dependency Management

### Adding New Dependencies

1. **Evaluate need:** Can vanilla JS solve this?
2. **Check bundle size:** Use bundlephobia.com
3. **Verify ESM support:** Must work as ES module
4. **Document rationale:** Update TASK file with why it's needed

### Version Pinning

- **yarn.lock:** Committed to repo (exact versions)
- **package.json:** Use exact versions (`2.0.0-beta.9`, not `^2.0.0-beta.9`)
- **CDN imports:** Always pin version (`@2.0.0-beta.9`, never `@latest`)

### Updating Dependencies

```bash
# Check outdated packages
yarn outdated

# Update specific package
yarn upgrade @ngraveio/bc-ur@2.0.0-beta.10

# Update CDN imports in index.prod.html to match
```

---

## Build Tools (Optional)

### When to Add Rollup

**Allowed when:**
- Bundle size reduction needed (tree-shaking)
- TypeScript adoption justified
- CSS preprocessing needed (modular styles)

**Not needed for:**
- Simple multi-file projects (ESM works fine)
- Single-page apps without complex dependencies
- When debugging simplicity > bundle optimization

### Example Rollup Config (Future)

```js
// rollup.config.js
export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es'
  },
  plugins: [
    // Only when needed
  ]
};
```

**Decision:** Defer until concrete need identified

---

## Testing Environment

### Browser Testing

**Primary:** Chrome 90+, Firefox 88+ (desktop + mobile)

**Required APIs:**
- ES modules (native)
- Clipboard API (copy functionality)
- MediaDevices API (QR scanner camera)
- CSS Grid (layout)

**Testing Checklist:**
- [ ] Chrome desktop (latest)
- [ ] Firefox desktop (latest)
- [ ] Chrome mobile (Android)
- [ ] Firefox mobile (Android)
- [ ] Safari desktop (optional)
- [ ] Safari iOS (optional)

### Local HTTPS (for Camera API)

Camera API requires HTTPS. For local testing:

```bash
# Option 1: mkcert (creates local CA)
mkcert -install
mkcert localhost 127.0.0.1

# Option 2: ngrok (tunnel to HTTPS)
ngrok http 8000

# Option 3: Caddy (auto HTTPS)
caddy file-server --listen localhost:8000
```

---

## Analytics & Monitoring (Optional)

### When to Add

**Allowed for:**
- Error monitoring (Sentry/Rollbar) if user-facing errors insufficient
- Performance tracking (Web Vitals) for optimization
- A/B testing (feature flags) for UX experiments

**Not allowed for:**
- User tracking/fingerprinting
- Behavioral analytics without consent
- Third-party data sharing

### Example: Lightweight Error Monitoring

```js
// Only send errors, no PII
window.addEventListener('error', (event) => {
  // Strip user data from error message
  const sanitized = event.message.replace(/ur:[a-z0-9:-]+/gi, 'ur:***');
  
  // Optional: send to error service
  if (userConsented) {
    fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({ message: sanitized, stack: event.error?.stack })
    });
  }
});
```

**Decision:** Defer until production deployment shows need

---

## Summary

| Aspect | Development | Production |
|--------|-------------|------------|
| **Packages** | Local (yarn) | CDN (esm.sh) |
| **bc-ur version** | `2.0.0-beta.9` | `2.0.0-beta.9` |
| **Import method** | Import map or local | Direct CDN URL |
| **Server** | live-server | GitHub Pages |
| **Build step** | None | None (direct copy) |
| **Analytics** | None | Optional (justified) |
| **Frameworks** | Vanilla JS | Vanilla JS (unless justified) |

**Philosophy:** Keep it simple until complexity is justified by measurable benefits.
