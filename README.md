# BC-UR Playground

> A browser-based playground for exploring Uniform Resources (URs), Bytewords encoding, and animated QR codes. Convert between formats, decode multi-part URs, and inspect CBOR registry types.

🚀 **[Live Demo](https://irfan798.github.io/bcur.me)**

## What is This?

A client-side tool for developers and users to understand and debug BC-UR encoded data. No backend, no tracking—all processing happens in your browser.

**Use Cases:**
- Convert between UR, Bytewords, Hex, and CBOR formats
- Decode and assemble multi-part animated QR codes (fountain-encoded URs)
- Inspect CBOR-encoded data structures
- Verify wallet QR codes don't leak sensitive data (seeds, private keys)
- Debug BC-UR library implementations

## What are URs, CBOR, and Bytewords?

### Uniform Resources (UR)

URs are a standardized format for encoding binary data as text or QR codes, designed for interoperability across cryptocurrency wallets and blockchain tools.

**Key Features:**
- Self-describing format with type information (`ur:crypto-seed/...`)
- Efficient binary encoding using CBOR
- Multi-part support for large data (animated QRs)
- Human-readable via Bytewords encoding
- Optimized for QR code transmission

**Example:**
```
ur:crypto-seed/oeadgdstaslplabghydrpfmkbggufgludprfgmaotpiecffltnlpqdenos
```

**Learn More:**
- [UR Specification (BCR-2020-005)](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md)
- [UR Type Registry (BCR-2020-006)](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-006-urtypes.md)
- [Blockchain Commons Research](https://github.com/BlockchainCommons/Research/blob/master/README.md)

### CBOR (Concise Binary Object Representation)

CBOR is a binary data format that URs use internally. It's similar to JSON but more compact and supports binary data natively.

**Why CBOR?**
- Smaller size than JSON (saves QR space)
- Supports binary data, dates, and tags
- Deterministic encoding (same data = same bytes)
- Extensible via registered tags

**Example (JSON vs CBOR):**
```javascript
// JSON: {"id": 123, "name": "John"}  →  25 bytes
// CBOR: a2626964187b646e616d65684a6f686e20446f65  →  20 bytes
```

**CDDL (Concise Data Definition Language):**

CDDL is a schema language for describing CBOR data structures. It's like TypeScript types or JSON Schema, but designed specifically for CBOR. UR registry types use CDDL to define their structure.

**Example CDDL:**
```cddl
crypto-seed = {
  payload: bytes,        ; The seed bytes
  ? birthdate: uint      ; Optional creation date
}
```

**Learn More:**
- [CBOR Playground & Tools](https://cbor.io/tools.html) - Online CBOR encoder/decoder and validator

### Bytewords

Bytewords is a method for encoding binary data as four-letter English words, making URs human-readable and easier to manually transcribe.

**Why Bytewords?**
- All words are exactly 4 letters (uniform length)
- Minimal encoding uses first+last letter (2 chars per byte)
- Built-in CRC32 checksum for error detection
- Carefully chosen words for memorability
- Optimized for QR code "alphanumeric mode" (smaller QR size)

**Example:**
```
Standard:  able acid also apex aqua arch atom aunt ...
Minimal:   aeadaoaxaaahatataaat ...
URI:       able-acid-also-apex-aqua-arch-atom-aunt ...
```

**Learn More:**
- [Bytewords Specification (BCR-2020-012)](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-012-bytewords.md)
- [Bytewords Overview](https://developer.blockchaincommons.com/bytewords/)

### Animated QRs (Multi-Part URs)

Large data that won't fit in a single QR code is split into multiple parts using **fountain codes** (Luby transform codes). Each QR frame contains a fragment, and the decoder can reassemble the original data even if some frames are missed.

**How It Works:**
1. Large UR is split into fragments
2. Fragments are encoded as QR frames
3. QR codes loop continuously (animated)
4. Decoder tracks received fragments
5. Original data reconstructed when enough fragments received

**Example:**
```
ur:crypto-psbt/1-3/lpadbb...  ← Frame 1 of 3
ur:crypto-psbt/2-3/lpaobb...  ← Frame 2 of 3
ur:crypto-psbt/3-3/lpaxbb...  ← Frame 3 of 3
```

**Learn More:**
- [Animated QRs Overview](https://developer.blockchaincommons.com/animated-qrs/)
- [Multipart UR Implementation Guide (BCR-2024-001)](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2024-001-multipart-ur.md)

## Features

### Tab 1: Format Converter
- Convert between UR, Bytewords (minimal/standard/uri), Hex, and CBOR
- Auto-detect input format
- Multi-part UR assembly with progress tracking
- Decode CBOR to JSON, Diagnostic notation, or Registry Items
- Visual pipeline showing conversion flow

### Tab 2: Multi-UR Generator
- Generate animated QR codes from URs
- Configure fountain encoder parameters
- Real-time QR animation
- Export parts as text or images

### Tab 3: QR Scanner
- Scan animated QR codes with device camera
- Real-time fountain decoder progress
- Block visualization (decoded vs pending)
- Auto-forward to converter when complete

### Tab 4: Registry Browser
- Browse registered UR types with CDDL schemas
- View type documentation
- Match decoded URs to registry

### Console Playground
- Interact with decoded data via `window.$lastRegistryItem`
- Inspect CBOR structures with `window.$cbor` utilities
- Access bc-ur library classes directly

## Quick Start

### Try the Live Demo
Visit **[irfan798.github.io/bcur.me](https://irfan798.github.io/bcur.me)** and paste a UR string to start exploring.

### Run Locally

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

Then open `http://localhost:8000` in your browser.



## Reference Implementations

This playground uses the following libraries:

- **[@ngraveio/bc-ur](https://github.com/ngraveio/bc-ur)** - TypeScript implementation of BC-UR
- **[@ngraveio/ur-registry](https://github.com/ngraveio/ur-registry)** - JavaScript UR registry packages

All libraries follow the official [Blockchain Commons Research specifications](https://github.com/BlockchainCommons/Research/blob/master/README.md).


## License

MIT License - See [LICENSE](LICENSE) for details.

## Links

**Specifications:**
- [UR Specification (BCR-2020-005)](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md)
- [Bytewords (BCR-2020-012)](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-012-bytewords.md)
- [Multipart UR (BCR-2024-001)](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2024-001-multipart-ur.md)
- [Blockchain Commons Research](https://github.com/BlockchainCommons/Research/blob/master/README.md)

**Developer Resources:**
- [Bytewords Overview](https://developer.blockchaincommons.com/bytewords/)
- [Animated QRs Overview](https://developer.blockchaincommons.com/animated-qrs/)
- [@ngraveio/bc-ur (TypeScript)](https://github.com/ngraveio/bc-ur)
- [@ngraveio/ur-registry (JavaScript)](https://github.com/ngraveio/ur-registry)

**Community:**
- [Blockchain Commons](https://www.blockchaincommons.com/)
- [GitHub Issues](https://github.com/irfan798/bcur.me/issues)

