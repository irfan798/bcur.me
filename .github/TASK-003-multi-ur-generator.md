# Task: Multi-UR Generator & Animated QR Display

## Priority: HIGH
## Status: BLOCKED (requires TASK-002 completion)
## Assignee: Agent
## Estimated Time: 6-8 hours

---

## Objective
Implement Tab 2: Multi-UR generator with fountain encoding controls and animated QR code display with configurable parameters.

---

## Prerequisites
- [x] Multi-tab architecture (TASK-002)
- [ ] QR library selected and integrated
- [ ] UrFountainEncoder patterns studied from reference

---

## Reference Implementation
**Source:** `reference_projects/bc-ur/src/classes/UrFountainEncoder.ts`

**Key Parameters:**
```typescript
constructor(
  input: RegistryItem | UR,
  maxFragmentLength: number = 100,
  minFragmentLength: number = 10,
  firstSeqNum: number = 0,
  repeatAfterRatio = 2  // 0 = infinite loop
)
```

**Key Methods:**
- `nextPartUr()` - Get next fountain-encoded fragment as UR
- `getAllPartsUr(fountainRatio)` - Get all parts at once
- `isSinglePart()` - Check if message fits in single UR

---

## Task Breakdown

### 1. QR Library Selection & Integration

#### 1.1 Evaluate QR Libraries

**Candidate: `qrcode-generator` (Recommended)**
- ✅ Explicit control over encoding mode (Alphanumeric)
- ✅ Error correction levels (L/M/Q/H)
- ✅ Size control (module count)
- ✅ Lightweight (~15KB)
- ✅ No dependencies
- ✅ Canvas output

**Installation (CDN):**
```html
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
```

**Alternative: `qrcode` package**
- Larger bundle (~40KB)
- More features than needed
- Less granular mode control

**Decision Criteria:**
- [ ] Alphanumeric mode explicit
- [ ] Works with bytewords (uppercase letters + numbers)
- [ ] Canvas rendering for animation
- [ ] Browser-compatible (no Node.js)

#### 1.2 QR Generation Test
```javascript
// Test alphanumeric encoding with bytewords
import qrcode from 'qrcode-generator';

const testUr = 'ur:crypto-seed/oyadgdlflflflflflfhdkoonfgvdld';
const qr = qrcode(0, 'L'); // type 0 = auto, error correction L
qr.addData(testUr, 'Alphanumeric');
qr.make();

const canvas = document.createElement('canvas');
qr.renderCanvas2D(canvas, 10); // 10 = module size
```

**Validation:**
- [ ] UR encodes successfully
- [ ] Alphanumeric mode used (verify in data)
- [ ] Scannable by mobile QR apps
- [ ] Canvas output renders correctly

---

### 2. HTML Structure (`index.html` - Tab 2)

#### 2.1 Multi-UR Tab Content
```html
<div id="multi-ur-tab" class="tab-content">
  <div class="multi-ur-container">
    <!-- Input Section -->
    <section class="input-section">
      <h2>Input UR</h2>
      <textarea 
        id="multiur-input" 
        placeholder="Paste single UR here or receive from Converter tab..."
        class="text-area"
      ></textarea>
      <div class="input-actions">
        <button id="multiur-clear-btn" class="btn-secondary">Clear</button>
        <button id="multiur-generate-btn" class="btn-primary">Generate Multi-UR</button>
      </div>
    </section>

    <!-- Fountain Encoder Settings -->
    <section class="encoder-settings">
      <h3>Fountain Encoder Settings</h3>
      
      <div class="setting-group">
        <label for="max-fragment-length">
          Max Fragment Length
          <span class="info-tooltip" data-tooltip="Maximum bytes per fragment (10-200)">ℹ️</span>
        </label>
        <input type="range" id="max-fragment-length" min="10" max="200" value="100" step="10">
        <span class="setting-value">100</span>
      </div>

      <div class="setting-group">
        <label for="min-fragment-length">
          Min Fragment Length
          <span class="info-tooltip" data-tooltip="Minimum bytes per fragment (5-50)">ℹ️</span>
        </label>
        <input type="range" id="min-fragment-length" min="5" max="50" value="10" step="5">
        <span class="setting-value">10</span>
      </div>

      <div class="setting-group">
        <label for="first-seq-num">First Sequence Number</label>
        <input type="number" id="first-seq-num" min="0" value="0">
      </div>

      <div class="setting-group">
        <label for="repeat-ratio">
          Repeat After Ratio
          <span class="info-tooltip" data-tooltip="Reset after N × fragment count. 0 = infinite">ℹ️</span>
        </label>
        <input type="number" id="repeat-ratio" min="0" max="10" value="2" step="0.5">
        <span class="setting-note">(0 = infinite loop)</span>
      </div>
    </section>

    <!-- QR Display Settings -->
    <section class="qr-settings">
      <h3>QR Code Settings</h3>
      
      <div class="setting-group">
        <label for="qr-framerate">
          Frame Rate (FPS)
          <span class="info-tooltip" data-tooltip="Animation speed: 1-30 fps">ℹ️</span>
        </label>
        <input type="range" id="qr-framerate" min="1" max="30" value="5" step="1">
        <span class="setting-value">5 fps</span>
      </div>

      <div class="setting-group">
        <label for="qr-size">QR Code Size (px)</label>
        <input type="range" id="qr-size" min="200" max="800" value="400" step="50">
        <span class="setting-value">400px</span>
      </div>

      <div class="setting-group">
        <label for="qr-error-correction">Error Correction Level</label>
        <select id="qr-error-correction">
          <option value="L" selected>L - Low (~7%)</option>
          <option value="M">M - Medium (~15%)</option>
          <option value="Q">Q - Quartile (~25%)</option>
          <option value="H">H - High (~30%)</option>
        </select>
      </div>

      <div class="setting-info">
        <p><strong>Encoding Mode:</strong> Alphanumeric (optimized for bytewords)</p>
      </div>
    </section>

    <!-- QR Display -->
    <section class="qr-display">
      <h3>Animated QR Code</h3>
      
      <div class="qr-canvas-container">
        <canvas id="qr-canvas" width="400" height="400"></canvas>
        
        <div class="qr-overlay">
          <div class="part-indicator">
            <span id="current-part">1</span> / <span id="total-parts">1</span>
          </div>
          <div class="animation-controls">
            <button id="qr-play-pause" class="icon-btn">▶️</button>
            <button id="qr-restart" class="icon-btn">🔄</button>
          </div>
        </div>
      </div>

      <div class="qr-actions">
        <button id="download-frames-btn" class="btn-secondary">📦 Download Frames (ZIP)</button>
        <button id="download-gif-btn" class="btn-secondary">🎬 Download GIF</button>
      </div>
    </section>

    <!-- Multi-UR Text Output -->
    <section class="multiur-output">
      <h3>Multi-UR Text Output</h3>
      <textarea 
        id="multiur-output-text" 
        readonly 
        class="text-area"
        placeholder="Generated multi-part URs will appear here..."
      ></textarea>
      <div class="output-actions">
        <button id="multiur-copy-btn" class="btn-primary">📋 Copy All</button>
        <button id="multiur-download-btn" class="btn-secondary">💾 Download TXT</button>
      </div>
    </section>
  </div>
</div>
```

---

### 3. JavaScript Implementation (`js/multi-ur.js`)

#### 3.1 MultiURGenerator Class
```javascript
import { UR, UrFountainEncoder } from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';
import { state } from './state.js';
import { showError, showSuccess } from './shared.js';

class MultiURGenerator {
  constructor() {
    this.encoder = null;
    this.animationFrame = null;
    this.currentPartIndex = 0;
    this.allParts = [];
    this.isPlaying = false;
    
    this.initElements();
    this.setupEventListeners();
    this.checkForwardedData();
  }

  initElements() {
    // Input
    this.inputElement = document.getElementById('multiur-input');
    this.generateBtn = document.getElementById('multiur-generate-btn');
    this.clearBtn = document.getElementById('multiur-clear-btn');
    
    // Settings
    this.maxFragmentLength = document.getElementById('max-fragment-length');
    this.minFragmentLength = document.getElementById('min-fragment-length');
    this.firstSeqNum = document.getElementById('first-seq-num');
    this.repeatRatio = document.getElementById('repeat-ratio');
    
    this.qrFramerate = document.getElementById('qr-framerate');
    this.qrSize = document.getElementById('qr-size');
    this.qrErrorCorrection = document.getElementById('qr-error-correction');
    
    // Display
    this.qrCanvas = document.getElementById('qr-canvas');
    this.ctx = this.qrCanvas.getContext('2d');
    this.currentPartSpan = document.getElementById('current-part');
    this.totalPartsSpan = document.getElementById('total-parts');
    
    this.playPauseBtn = document.getElementById('qr-play-pause');
    this.restartBtn = document.getElementById('qr-restart');
    
    // Output
    this.outputText = document.getElementById('multiur-output-text');
    this.copyBtn = document.getElementById('multiur-copy-btn');
    this.downloadBtn = document.getElementById('multiur-download-btn');
  }

  setupEventListeners() {
    // Settings value display updates
    this.maxFragmentLength.addEventListener('input', (e) => {
      e.target.nextElementSibling.textContent = e.target.value;
    });
    
    this.minFragmentLength.addEventListener('input', (e) => {
      e.target.nextElementSibling.textContent = e.target.value;
    });
    
    this.qrFramerate.addEventListener('input', (e) => {
      e.target.nextElementSibling.textContent = e.target.value + ' fps';
      if (this.isPlaying) {
        this.stopAnimation();
        this.startAnimation();
      }
    });
    
    this.qrSize.addEventListener('input', (e) => {
      const size = e.target.value;
      e.target.nextElementSibling.textContent = size + 'px';
      this.qrCanvas.width = size;
      this.qrCanvas.height = size;
      if (this.allParts.length > 0) {
        this.renderCurrentPart();
      }
    });
    
    // Generate button
    this.generateBtn.addEventListener('click', () => this.generate());
    
    // Clear button
    this.clearBtn.addEventListener('click', () => {
      this.inputElement.value = '';
      this.stopAnimation();
      this.clearDisplay();
    });
    
    // Animation controls
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.restartBtn.addEventListener('click', () => this.restart());
    
    // Output actions
    this.copyBtn.addEventListener('click', () => this.copyOutput());
    this.downloadBtn.addEventListener('click', () => this.downloadOutput());
  }

  checkForwardedData() {
    const data = state.receive('ur-data');
    if (data && data.ur) {
      this.inputElement.value = data.ur;
      showSuccess(document.querySelector('.input-section'), 
        'UR received from Converter tab');
      // Auto-generate after a brief delay
      setTimeout(() => this.generate(), 500);
    }
  }

  async generate() {
    const urString = this.inputElement.value.trim();
    
    if (!urString) {
      showError(document.querySelector('.input-section'), 
        'Please provide a UR string');
      return;
    }

    try {
      // Parse UR
      const ur = UR.fromString(urString);
      
      // Create fountain encoder with settings
      this.encoder = new UrFountainEncoder(
        ur,
        parseInt(this.maxFragmentLength.value),
        parseInt(this.minFragmentLength.value),
        parseInt(this.firstSeqNum.value),
        parseFloat(this.repeatRatio.value)
      );
      
      // Check if single part (no fragmentation needed)
      if (this.encoder.isSinglePart()) {
        showError(document.querySelector('.encoder-settings'), 
          'UR is small enough for single part. No multi-UR needed.');
        this.allParts = [ur];
        this.displaySinglePart(ur);
        return;
      }
      
      // Generate all parts (pure fragments, no fountain yet)
      this.allParts = this.encoder.getAllPartsUr(0);
      
      // Update UI
      this.totalPartsSpan.textContent = this.allParts.length;
      this.currentPartIndex = 0;
      this.currentPartSpan.textContent = 1;
      
      // Display multi-UR text
      this.outputText.value = this.allParts
        .map(part => part.toString())
        .join('\n');
      
      // Start QR animation
      this.renderCurrentPart();
      this.startAnimation();
      
      showSuccess(document.querySelector('.encoder-settings'), 
        `Generated ${this.allParts.length} parts successfully`);
      
    } catch (error) {
      showError(document.querySelector('.input-section'), 
        'Error: ' + error.message);
      console.error(error);
    }
  }

  renderCurrentPart() {
    if (this.allParts.length === 0) return;
    
    const part = this.allParts[this.currentPartIndex];
    const urString = part.toString();
    
    // Generate QR code
    const qr = qrcode(0, this.qrErrorCorrection.value);
    qr.addData(urString, 'Alphanumeric');
    qr.make();
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.qrCanvas.width, this.qrCanvas.height);
    
    // Render QR to canvas
    const moduleCount = qr.getModuleCount();
    const cellSize = this.qrCanvas.width / moduleCount;
    
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          this.ctx.fillStyle = '#000';
          this.ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Update part indicator
    this.currentPartSpan.textContent = this.currentPartIndex + 1;
  }

  startAnimation() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playPauseBtn.textContent = '⏸️';
    
    const fps = parseInt(this.qrFramerate.value);
    const interval = 1000 / fps;
    
    const animate = () => {
      if (!this.isPlaying) return;
      
      this.currentPartIndex = (this.currentPartIndex + 1) % this.allParts.length;
      this.renderCurrentPart();
      
      this.animationFrame = setTimeout(animate, interval);
    };
    
    animate();
  }

  stopAnimation() {
    this.isPlaying = false;
    this.playPauseBtn.textContent = '▶️';
    if (this.animationFrame) {
      clearTimeout(this.animationFrame);
      this.animationFrame = null;
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  restart() {
    this.stopAnimation();
    this.currentPartIndex = 0;
    this.renderCurrentPart();
  }

  displaySinglePart(ur) {
    this.allParts = [ur];
    this.totalPartsSpan.textContent = '1';
    this.currentPartIndex = 0;
    this.outputText.value = ur.toString();
    this.renderCurrentPart();
  }

  clearDisplay() {
    this.allParts = [];
    this.currentPartIndex = 0;
    this.totalPartsSpan.textContent = '0';
    this.currentPartSpan.textContent = '0';
    this.outputText.value = '';
    this.ctx.clearRect(0, 0, this.qrCanvas.width, this.qrCanvas.height);
  }

  copyOutput() {
    navigator.clipboard.writeText(this.outputText.value).then(() => {
      showSuccess(document.querySelector('.multiur-output'), 
        'Copied to clipboard');
    }).catch(err => {
      showError(document.querySelector('.multiur-output'), 
        'Failed to copy: ' + err.message);
    });
  }

  downloadOutput() {
    const blob = new Blob([this.outputText.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multi-ur.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize when tab is loaded
export const multiURGenerator = new MultiURGenerator();
```

**Validation:**
- [ ] UrFountainEncoder creates correct fragments
- [ ] QR codes encode in Alphanumeric mode
- [ ] Animation smoothly cycles through parts
- [ ] Settings update encoder behavior
- [ ] Text output matches QR content

---

### 4. Styling (`css/multi-ur.css`)

#### 4.1 Layout & Components
```css
.multi-ur-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.multi-ur-container section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.multi-ur-container h2,
.multi-ur-container h3 {
  margin-bottom: 16px;
  color: #24292e;
}

/* Settings */
.setting-group {
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: 200px 1fr auto;
  align-items: center;
  gap: 12px;
}

.setting-group label {
  font-weight: 500;
  color: #586069;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-tooltip {
  cursor: help;
  font-size: 14px;
  position: relative;
}

.info-tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #24292e;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
}

.setting-value,
.setting-note {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.setting-note {
  color: #586069;
  font-weight: normal;
  font-style: italic;
}

/* QR Display */
.qr-canvas-container {
  position: relative;
  display: inline-block;
  background: #f6f8fa;
  padding: 20px;
  border-radius: 8px;
}

#qr-canvas {
  display: block;
  border: 2px solid #e1e4e8;
  border-radius: 4px;
  background: white;
}

.qr-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.part-indicator {
  background: rgba(102, 126, 234, 0.95);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.animation-controls {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: white;
  border: 2px solid #e1e4e8;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.icon-btn:hover {
  border-color: #667eea;
  transform: scale(1.1);
}

/* Actions */
.input-actions,
.qr-actions,
.output-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: white;
  color: #586069;
  border: 2px solid #e1e4e8;
}

.btn-secondary:hover {
  border-color: #667eea;
  color: #667eea;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .setting-group {
    grid-template-columns: 1fr;
  }
  
  .setting-value {
    text-align: right;
  }
  
  .qr-canvas-container {
    width: 100%;
    padding: 12px;
  }
  
  #qr-canvas {
    width: 100%;
    height: auto;
  }
  
  .input-actions,
  .qr-actions,
  .output-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
```

---

### 5. Advanced Features (Stretch Goals)

#### 5.1 Download Frames as ZIP
```javascript
// Requires JSZip library (optional)
async downloadFrames() {
  const zip = new JSZip();
  
  for (let i = 0; i < this.allParts.length; i++) {
    this.currentPartIndex = i;
    this.renderCurrentPart();
    
    const dataUrl = this.qrCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    zip.file(`frame-${String(i + 1).padStart(3, '0')}.png`, base64, {base64: true});
  }
  
  const blob = await zip.generateAsync({type: 'blob'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qr-frames.zip';
  a.click();
  URL.revokeObjectURL(url);
}
```

#### 5.2 Download as Animated GIF
```javascript
// Requires gif.js library (optional)
async downloadGIF() {
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: this.qrCanvas.width,
    height: this.qrCanvas.height,
    workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
  });
  
  const delay = 1000 / parseInt(this.qrFramerate.value);
  
  for (let i = 0; i < this.allParts.length; i++) {
    this.currentPartIndex = i;
    this.renderCurrentPart();
    gif.addFrame(this.ctx, {copy: true, delay});
  }
  
  gif.on('finished', (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animated-qr.gif';
    a.click();
    URL.revokeObjectURL(url);
  });
  
  gif.render();
}
```

---

### 6. Testing Checklist

#### 6.1 Functional Tests
- [ ] Generate multi-UR from single UR
- [ ] All encoder settings affect output correctly
- [ ] QR animation plays/pauses/restarts
- [ ] Frame rate changes take effect immediately
- [ ] QR size adjustment works
- [ ] Error correction levels generate valid QR codes
- [ ] Copy/download text output works
- [ ] Data forwarded from Tab 1 auto-generates

#### 6.2 Edge Cases
- [ ] Single-part UR (no fragmentation needed)
- [ ] Very small fragment size (many parts)
- [ ] Very large fragment size (few parts)
- [ ] Infinite loop (repeatRatio = 0)
- [ ] Invalid UR input (error displayed)
- [ ] Empty input (error displayed)

#### 6.3 QR Validation
- [ ] QR codes scannable by mobile apps
- [ ] Alphanumeric mode confirmed (check QR data)
- [ ] All parts decode to correct UR strings
- [ ] Error correction works (partially obscured QR still scans)

#### 6.4 Performance
- [ ] Smooth animation at 30 fps
- [ ] No memory leaks during long animations
- [ ] Large multi-UR (50+ parts) handles well
- [ ] Canvas rendering < 50ms per frame

---

## Success Criteria
- ✅ UrFountainEncoder integrated with all parameters exposed
- ✅ QR codes generated in Alphanumeric mode
- ✅ Smooth animation at configurable frame rates
- ✅ All settings functional and validated
- ✅ Data forwarding from Tab 1 works seamlessly
- ✅ Mobile-responsive with touch controls
- ✅ QR codes scannable by standard apps

---

## Deliverables
1. `js/multi-ur.js` - MultiURGenerator class
2. `css/multi-ur.css` - Tab 2 specific styles
3. Updated `index.html` - Tab 2 HTML structure
4. QR library integration (CDN import)
5. Test suite for multi-UR generation
6. Documentation for encoder parameters

---

## Notes for Agent
- **QR Encoding:** Ensure Alphanumeric mode explicitly set (bytewords are uppercase alphanumeric)
- **Performance:** Use requestAnimationFrame for smoother animation if needed
- **Memory:** Clear canvas between renders to prevent leaks
- **Error Handling:** Validate all settings before encoder creation
- **Mobile:** Test QR scanning on actual mobile devices with camera

---

## Related Tasks
- Depends on: [TASK-002-multi-tab-architecture.md]
- Integrates with: [TASK-001-deploy-github-pages.md] (QR library CDN)
- Leads to: [TASK-004-qr-scanner.md] (scanning these generated QRs)

---

## Completion Checklist
- [ ] QR library selected and tested
- [ ] Multi-UR generator functional
- [ ] All encoder settings working
- [ ] QR animation smooth and controllable
- [ ] Text output and downloads working
- [ ] Data forwarding from Tab 1 tested
- [ ] Mobile testing complete
- [ ] Documentation updated
