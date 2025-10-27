# BC-UR.me

> A client-only playground for exploring BC-UR encoding (Uniform Resources) with real-time format conversion.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deploy](https://github.com/irfan798/bcur.me/actions/workflows/deploy.yml/badge.svg)](https://github.com/irfan798/bcur.me/actions/workflows/deploy.yml)

## 🌐 Live Demo

🚀 **[Try it now at bcur.me](https://bcur.me)** or [irfan798.github.io/bcur.me](https://irfan798.github.io/bcur.me/)

## ✨ Features

- **Multi-Format Conversion**: Seamlessly convert between UR, Bytewords (minimal/standard/uri), Hex, and CBOR
- **Multi-Part UR Assembly**: Automatic detection and reassembly of fountain-encoded multi-part URs with progress tracking
- **Format Auto-Detection**: Intelligent input format recognition (multi-part UR → single UR → hex → bytewords)
- **Pipeline Visualization**: Visual flow diagram showing conversion path with real-time status updates
- **CBOR Decoding**: Multiple output formats (JSON, Diagnostic, Commented, JavaScript, Registry Item)
- **Registry Item Decoding**: Automatic decoding to typed classes (e.g., `CryptoSeed`, `DetailedAccount`) with expandable property inspector
- **UR Type Management**: Auto-detection via registry with manual override support
- **Bytewords Styles**: Independent input/output style control (minimal/standard/uri)
- **Console Playground**: Interact with decoded Registry Items via `window.$lastRegistryItem` in browser DevTools
- **Conversion Caching**: Fast repeated conversions with intelligent cache management
- **Copy to Clipboard**: One-click copying with visual feedback

## 🚀 Quick Start

### Development

```bash
# Install dependencies
yarn install

# Start development server (opens browser at http://localhost:8000)
yarn dev
```

### Manual Setup

Alternatively, serve with any static server:

```bash
# Recommended: yarn dev (checks if port is free first)
yarn dev

# Check if server is already running
lsof -ti:8000  # If returns PID, server is running

```

Then open `http://localhost:8000` in your browser.

## 🎯 Usage

### Basic Conversion

1. Paste your input (UR, hex, bytewords, or multi-part UR)
2. Select desired output format
3. Copy the result with one click

### Multi-Part UR Decoding

Paste multiple UR parts (newline-separated):
```
ur:crypto-psbt/1-3/lpadbbcsenhsjzjzihjkjyaxihkkjkjlidinjkcxjlihiajljyihjkjycxjkihihjpjkhsjthsjk
ur:crypto-psbt/2-3/lpaobbcsenhsjzjzihjkjyaxihkkjkjlidinjkcxjlihiajljyihjkjycxjkihihjpjkhsjthsjk
ur:crypto-psbt/3-3/lpaxbbcsenhsjzjzihjkjyaxihkkjkjlidinjkcxjlihiajljyihjkjycxjkihihjpjkhsjthsjk
```

Progress tracking shows assembly status if parts are incomplete.

### UR Type Override

For untagged CBOR data, manually specify the UR type:
- Must match pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Examples: `crypto-psbt`, `crypto-account`, `unknown-tag`

### Registry Item Inspection

When decoding registered UR types, the converter automatically loads the appropriate registry package and decodes to a typed class instance:

**Supported Registry Types:**
- **blockchain-commons**: `crypto-seed`, `crypto-hdkey`, `crypto-psbt`, `crypto-account`, `crypto-output`, `crypto-eckey`
- **coin-identity**: `coin-identity`
- **sync**: `detailed-account`, `portfolio-coin`, `portfolio-metadata`, `portfolio`
- **hex-string**: `hex-string`
- **sign**: `sign-request`, `sign-response`
- **uuid**: `uuid`

**Example**: Decoding `ur:detailed-account/...` creates a `DetailedAccount` instance with:
- Expandable property tree (DevTools-style)
- Common methods: `.encode()`, `.getCbor()`, `.toDataItem()`
- Type-specific methods (toggle to show/hide)
- Console access via `window.$lastRegistryItem`

**Console Interaction:**
```javascript
// After decoding a Registry Item
window.$lastRegistryItem.encode()        // Returns UR string
window.$lastRegistryItem.getCbor()       // Returns CBOR bytes
window.$lastRegistryItem.toDataItem()    // Returns CBOR DataItem

// Compare with raw CBOR
window.$lastDecoded                      // Raw CBOR DataItem (always available)
```

## 🏗️ Architecture

### Client-Only Design
- **No Backend**: All processing happens in your browser
- **No Tracking**: Zero analytics, no data collection
- **Privacy First**: Your data never leaves your device

### Technology Stack
- **Pure Vanilla JS**: No frameworks, no build step
- **ES Modules**: Modern JavaScript imports from CDN
- **BC-UR Library**: [@ngraveio/bc-ur@2.0.0-beta.9](https://github.com/ngraveio/bc-ur-ts) (pinned version)
- **UR Registry Packages**: 6 registry packages loaded dynamically for typed decoding
  - `@ngraveio/ur-blockchain-commons` - BlockChain Commons types
  - `@ngraveio/ur-coin-identity` - Coin identity type
  - `@ngraveio/ur-sync` - Account/portfolio types
  - `@ngraveio/ur-hex-string` - Hex string encoding
  - `@ngraveio/ur-sign` - Sign request/response protocols
  - `@ngraveio/ur-uuid` - UUID type
- **Semantic HTML**: Accessible, standards-compliant markup

### Browser Support
- Chrome 90+ (desktop & mobile)
- Firefox 88+ (desktop & mobile)
- Safari 14+ (iOS & macOS)
- Requires: ES modules, Clipboard API, CSS Grid

## 📚 Core Principles

1. **Trust the Library**: Leverage BC-UR library's built-in pipeline (`UR.pipeline`, `UrFountainEncoder`, `UrFountainDecoder`)
2. **Simplicity Over Abstractions**: Vanilla JS with focused classes
3. **Explicit Errors**: Contextual UI messages, never silent failures
4. **Fast Feedback**: Debounced input (150ms typing, 10ms paste)
5. **No Dangerous Features**: No persistent storage, no key handling, no wallet functionality

## 🛠️ Development

### File Structure
```
bcur.me/
├── index.html           # Main UI shell with multi-tab navigation
├── js/
│   ├── converter.js     # Tab 1: Format Converter with Registry Item decoding
│   ├── multi-ur.js      # Tab 2: Multi-UR Generator & animated QR
│   ├── scanner.js       # Tab 3: QR Scanner with fountain decoder
│   ├── registry.js      # Tab 4: Registry Browser & console playground
│   ├── router.js        # Hash-based routing (#converter, #multi-ur, etc.)
│   └── shared.js        # Utilities (cache, debounce, errors)
├── css/
│   ├── main.css         # Global styles
│   └── tabs.css         # Tab-specific styles
├── package.json         # Dependencies & scripts
├── .gitignore           # Excluded files
└── README.md            # This file
```

### Key Components

**FormatConverter Class** (`js/converter.js`):
- `detectFormat(input)` - Pattern-based format detection
- `performConversion()` - Core conversion orchestrator
- `assembleMultiUR(input)` - Multi-part UR decoding
- `decodeToRegistryItem(cbor, urType)` - Registry Item class instantiation
- `renderRegistryItemView(item)` - Expandable tree UI renderer
- `simplePipelineViz()` - Visual pipeline updates
- Conversion caching (120 items max)
- Registry package preloading (background, silent)
- Debounced input handling


## 🗺️ Roadmap

### Current (v0.1.0)
- ✅ UR/Bytewords/Hex/CBOR converter
- ✅ Multi-part UR assembly
- ✅ Format auto-detection
- ✅ Pipeline visualization
- ✅ Registry Item decoding with typed classes
- ✅ Console playground (`window.$lastRegistryItem`)
- ✅ Multi-tab architecture (Converter, Multi-UR, Scanner, Registry)

### Next (v0.2.0+)
- 🔄 Animated QR code generation (fountain-encoded parts)
- 🔄 QR scanner with camera access (mobile-optimized)
- 🔄 Registry browser with CDDL viewer
- 🔄 Full registry console playground
- 🔄 Mobile touch optimizations

See [PROJECT_ROADMAP.md](.github/PROJECT_ROADMAP.md) for detailed plans.

## 🤝 Contributing

Contributions are welcome! Please read our planning documents first:

1. **[specs/002-bc-ur-playground/spec.md](specs/002-bc-ur-playground/spec.md)** - Feature specification with user stories
2. **[specs/002-bc-ur-playground/tasks.md](specs/002-bc-ur-playground/tasks.md)** - Implementation tasks
3. **[specs/002-bc-ur-playground/quickstart.md](specs/002-bc-ur-playground/quickstart.md)** - Developer setup guide
4. **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Project constitution & principles

### Development Workflow
1. Check task status in `specs/002-bc-ur-playground/tasks.md`
2. Read corresponding functional requirements in `spec.md`
3. Consult `reference_projects/bc-ur/README.md` for API usage
4. Implement following task specifications
5. Update task status when complete

### Key Principles
- **Trust the Library**: Use BC-UR library methods exclusively (never reimplement)
- **Client-First**: No backend, no analytics, privacy by design
- **Simplicity**: Vanilla JS, no frameworks unless justified
- **Explicit Errors**: Contextual UI messages, never silent failures

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

**This demo is for development & inspection only.** Not audited for handling secrets. Users are responsible for safeguarding sensitive material.

## 🔗 Related Projects

- **[BC-UR TypeScript](https://github.com/ngraveio/bc-ur-ts)** - Core encoding library
- **[BC-UR Registry](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-006-urtypes.md)** - Standard UR types
- **[Blockchain Commons](https://www.blockchaincommons.com/)** - UR specification authors

## 📧 Contact

- **Author**: irfan798
- **Issues**: [GitHub Issues](https://github.com/irfan798/bcur.me/issues)
- **Repository**: [github.com/irfan798/bcur.me](https://github.com/irfan798/bcur.me)

---

**Made with ❤️ for the Bitcoin & Blockchain Commons community**
