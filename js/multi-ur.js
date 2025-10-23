/**
 * Multi-UR Generator & Animated QR (Tab 2)
 *
 * User Story 2: Developers and wallet creators need to generate fountain-encoded
 * multi-part URs with animated QR codes to test scanning functionality and understand
 * how data is distributed across fragments.
 *
 * Features:
 * - UR/Hex input handling (sessionStorage forward + manual entry)
 * - Encoder parameter configuration (min/max fragment length, repeat ratio)
 * - Multi-part UR generation via UrFountainEncoder
 * - Animated QR code display with configurable FPS
 * - Encoder blocks grid visualization (shows which original blocks each fragment contains)
 * - Advanced animation controls (play/pause/restart/speed/frame indicator/progress)
 * - Finite vs Infinite mode support
 * - Export as animated GIF (finite mode only)
 * - Copy-to-clipboard (individual part, all parts, current QR as PNG)
 */

import { UR, UrFountainEncoder, UrFountainDecoder } from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9?dev';
import QRCode from 'https://esm.sh/qrcode@1.5.3';
import { GIFEncoder, quantize, applyPalette } from 'https://unpkg.com/gifenc';
import { handleError, updateStatus } from './shared.js';

export class MultiURGenerator {
  constructor() {
    // State per contracts/state-schema.md
    this.state = {
      // Input state
      input: {
        urString: null,        // Input UR string
        source: null,          // 'converter' | 'manual'
        isValid: false,
        urType: null,
        hex: null
      },

      // Encoder state
      encoder: {
        instance: null,        // UrFountainEncoder instance
        maxFragmentLength: 90,
        minFragmentLength: 10,
        firstSeqNum: 0,
        repeatAfterRatio: 1.5,   // -1 = infinite, 0 = no redundancy, >0 = finite with redundancy
        parts: [],             // Generated UR parts (finite mode)
        totalParts: 0,
        isInfiniteMode: false,  // repeatAfterRatio === -1
        originalBlockCount: 0, // Number of original message blocks
        currentFragmentBlocks: [] // Which blocks are in current fragment [0,1,0,1,0] (1=included)
      },

      // Animation state
      animation: {
        isPlaying: false,
        fps: 5,                // Frames per second
        currentPartIndex: 0,   // Current frame index
        totalFrames: 0,
        animationFrameId: null,
        lastFrameTime: 0,
        frameDelay: 200        // ms between frames (1000/fps)
      },

      // QR code state
      qr: {
        canvasElement: null,
        qrSize: 600,           // px
        errorCorrectionLevel: 'L',
        currentQRDataURL: null,
        mode: 'alphanumeric'   // Alphanumeric encoding for compact QR
      },

      // UI state
      ui: {
        statusElement: null,
        partsListElement: null,
        controlsVisible: false,
        modeBadge: null,
        currentPartText: null,
        encoderBlocksGrid: null // Encoder blocks visualization
      }
    };

    // DOM references (initialized on tab activation)
    this.container = null;
    
    // Track if listeners have been set up to prevent duplicates
    this.listenersInitialized = false;

    console.log('[MultiURGenerator] Initialized');
  }

  /**
   * Initialize generator when tab becomes active
   * Called by router on tab activation
   */
  async init(container) {
    console.log('[MultiURGenerator] init() called');
    this.container = container;

    try {
      // Setup UI references
      this.setupUIReferences();

      // Setup event listeners only once
      if (!this.listenersInitialized) {
        this.setupEventListeners();
        this.listenersInitialized = true;
      }

      // Check for forwarded data from converter
      this.checkForwardedData();

      console.log('[MultiURGenerator] Initialization complete');
    } catch (error) {
      console.error('[MultiURGenerator] Initialization error:', error);
      handleError(error, this.container, 'Multi-UR Generator initialization failed');
    }
  }

  /**
   * Setup DOM references from container
   */
  setupUIReferences() {
    // Input elements
    this.inputTextarea = this.container.querySelector('#multi-ur-input');
    this.state.ui.statusElement = this.container.querySelector('#multi-ur-status');

    // Encoder parameter inputs
    this.maxFragmentInput = this.container.querySelector('#max-fragment-length');
    this.minFragmentInput = this.container.querySelector('#min-fragment-length');
    this.firstSeqNumInput = this.container.querySelector('#first-seq-num');
    this.repeatRatioInput = this.container.querySelector('#repeat-after-ratio');

    // QR canvas
    this.state.qr.canvasElement = this.container.querySelector('#multi-ur-qr-canvas');

    // Encoder blocks grid
    this.state.ui.encoderBlocksGrid = this.container.querySelector('#encoder-blocks-grid');

    // Controls
    this.playBtn = this.container.querySelector('#play-animation');
    this.pauseBtn = this.container.querySelector('#pause-animation');
    this.restartBtn = this.container.querySelector('#restart-animation');
    this.fpsSlider = this.container.querySelector('#fps-slider');
    this.fpsValue = this.container.querySelector('#fps-value');

    // Output elements
    this.state.ui.currentPartText = this.container.querySelector('#current-part-output');
    this.state.ui.partsListElement = this.container.querySelector('#parts-list-output');
    this.state.ui.modeBadge = this.container.querySelector('#mode-badge');
    this.frameIndicator = this.container.querySelector('#frame-indicator');
    this.progressBar = this.container.querySelector('#animation-progress-bar');

    if (!this.inputTextarea || !this.state.qr.canvasElement) {
      throw new Error('Required UI elements not found in multi-ur-tab');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Generate button
    const generateBtn = this.container.querySelector('#generate-multi-ur');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.handleGenerate());
    }

    // Parameter inputs - real-time validation
    if (this.maxFragmentInput) {
      this.maxFragmentInput.addEventListener('input', () => this.validateParameters());
    }
    if (this.minFragmentInput) {
      this.minFragmentInput.addEventListener('input', () => this.validateParameters());
    }
    if (this.repeatRatioInput) {
      this.repeatRatioInput.addEventListener('change', () => this.updateModeUI());
    }

    // Animation controls
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.startAnimation());
    }
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.stopAnimation());
    }
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.restartAnimation());
    }
    if (this.fpsSlider) {
      this.fpsSlider.addEventListener('input', (e) => {
        this.state.animation.fps = parseInt(e.target.value);
        this.state.animation.frameDelay = 1000 / this.state.animation.fps;
        if (this.fpsValue) {
          this.fpsValue.textContent = this.state.animation.fps;
        }
      });
    }

    // Copy buttons
    const copyCurrentBtn = this.container.querySelector('#copy-current-part');
    if (copyCurrentBtn) {
      copyCurrentBtn.addEventListener('click', () => this.copyCurrentPart());
    }

    const copyAllBtn = this.container.querySelector('#copy-all-parts');
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', () => this.copyAllParts());
    }

    const copyQRBtn = this.container.querySelector('#copy-qr-png');
    if (copyQRBtn) {
      copyQRBtn.addEventListener('click', () => this.copyQRAsPNG());
    }

    // Export GIF button
    const exportGIFBtn = this.container.querySelector('#export-gif');
    if (exportGIFBtn) {
      exportGIFBtn.addEventListener('click', () => this.exportAsGIF());
    }

    // Next Frame button (manual frame stepping)
    const nextFrameBtn = this.container.querySelector('#next-frame');
    if (nextFrameBtn) {
      nextFrameBtn.addEventListener('click', () => this.nextFrame());
    }

    // Previous Frame button (manual frame stepping - finite mode only)
    const previousFrameBtn = this.container.querySelector('#previous-frame');
    if (previousFrameBtn) {
      previousFrameBtn.addEventListener('click', () => this.previousFrame());
    }
  }

  /**
   * Check for Forwarded Data from Converter Tab
   *
   * Reads sessionStorage for data forwarded from converter tab.
   * Payload format: { sourceTab, targetTab, dataType, payload: { urString }, timestamp, ttl }
   */
  checkForwardedData() {
    try {
      const forwardData = sessionStorage.getItem('forward-multi-ur');
      if (forwardData) {
        const data = JSON.parse(forwardData);
        console.log('[MultiURGenerator] Received forwarded data:', data);

        // Validate TTL
        if (data.ttl && (Date.now() - data.timestamp > data.ttl)) {
          console.warn('[MultiURGenerator] Forwarded data expired');
          sessionStorage.removeItem('forward-multi-ur');
          return;
        }

        // Set input value
        if (this.inputTextarea && data.payload?.urString) {
          this.inputTextarea.value = data.payload.urString;
          this.state.input.source = 'converter';

          // Show success message
          if (this.state.ui.statusElement) {
            updateStatus(
              this.state.ui.statusElement,
              'UR received from Converter tab. Review parameters and click Generate.',
              'success'
            );
          }
        }

        // Clear forwarded data (consume it)
        sessionStorage.removeItem('forward-multi-ur');
      }
    } catch (error) {
      console.error('[MultiURGenerator] Failed to process forwarded data:', error);
    }
  }

  /**
   * Validate encoder parameters
   * FR-015: Parameter validation with error display
   */
  validateParameters() {
    const maxLen = parseInt(this.maxFragmentInput?.value || 150);
    const minLen = parseInt(this.minFragmentInput?.value || 10);

    let isValid = true;
    let errorMsg = '';

    // Check min < max (no auto-swap!)
    if (minLen >= maxLen) {
      isValid = false;
      errorMsg = 'Min fragment length must be less than max fragment length';
      this.minFragmentInput.style.borderColor = '#dc3545';
      this.maxFragmentInput.style.borderColor = '#dc3545';
    } else {
      this.minFragmentInput.style.borderColor = '#28a745';
      this.maxFragmentInput.style.borderColor = '#28a745';
    }

    // Check positive values
    if (minLen <= 0 || maxLen <= 0) {
      isValid = false;
      errorMsg = 'Fragment lengths must be positive';
    }

    // Display validation error
    const validationError = this.container.querySelector('#param-validation-error');
    if (validationError) {
      if (!isValid) {
        validationError.textContent = '⚠️ ' + errorMsg;
        validationError.style.display = 'block';
      } else {
        validationError.style.display = 'none';
      }
    }

    return isValid;
  }

  /**
   * Update mode UI badge (Finite vs Infinite)
   */
  updateModeUI() {
    const ratio = parseFloat(this.repeatRatioInput?.value || 0);
    this.state.encoder.isInfiniteMode = (ratio === -1);

    if (this.state.ui.modeBadge) {
      if (this.state.encoder.isInfiniteMode) {
        this.state.ui.modeBadge.textContent = '∞ Infinite Streaming Mode';
        this.state.ui.modeBadge.className = 'mode-badge infinite';
      } else {
        this.state.ui.modeBadge.textContent = '# Finite Mode';
        this.state.ui.modeBadge.className = 'mode-badge finite';
      }
    }

    // Enable/disable previous frame button based on mode
    const previousFrameBtn = this.container.querySelector('#previous-frame');
    if (previousFrameBtn) {
      if (this.state.encoder.isInfiniteMode) {
        previousFrameBtn.disabled = true;
        previousFrameBtn.style.opacity = '0.5';
        previousFrameBtn.style.cursor = 'not-allowed';
      } else {
        previousFrameBtn.disabled = false;
        previousFrameBtn.style.opacity = '1';
        previousFrameBtn.style.cursor = 'pointer';
      }
    }

    // Clear parts list when switching to infinite mode
    if (this.state.encoder.isInfiniteMode) {
      const partsListElement = this.container.querySelector('#parts-list');
      if (partsListElement) {
        partsListElement.innerHTML = '';
        partsListElement.style.display = 'none';
      }
      const placeholder = this.container.querySelector('#parts-list-placeholder');
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
  }

  /**
   * Handle Generate Button Click
   * FR-011: UR input handling
   * FR-012: Encoder parameter UI
   * FR-013: Multi-part UR generation
   */
  async handleGenerate() {
    console.log('[MultiURGenerator] handleGenerate() called');

    try {
      // Validate parameters first
      if (!this.validateParameters()) {
        return;
      }

      // Get input
      const input = this.inputTextarea.value.trim();
      if (!input) {
        updateStatus(this.state.ui.statusElement, 'Please enter a UR or hex string', 'error');
        return;
      }

      // Parse input (UR or hex)
      let ur;
      if (input.startsWith('ur:')) {
        // Parse UR
        ur = UR.fromString(input);
        this.state.input.urString = input;
        this.state.input.urType = ur.type;
        this.state.input.hex = ur.getPayloadHex();
      } else if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0) {
        // Parse hex
        const hexBytes = new Uint8Array(input.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        ur = UR.fromBuffer(hexBytes);
        this.state.input.hex = input;
        this.state.input.urType = 'bytes'; // Default type for raw hex
        this.state.input.urString = ur.toString();
      } else {
        updateStatus(this.state.ui.statusElement, 'Invalid input. Must be UR string (ur:...) or hex', 'error');
        return;
      }

      this.state.input.isValid = true;
      this.state.input.source = 'manual';

      // Read encoder parameters
      this.state.encoder.maxFragmentLength = parseInt(this.maxFragmentInput.value);
      this.state.encoder.minFragmentLength = parseInt(this.minFragmentInput.value);
      this.state.encoder.firstSeqNum = parseInt(this.firstSeqNumInput.value);
      this.state.encoder.repeatAfterRatio = parseFloat(this.repeatRatioInput.value);
      this.state.encoder.isInfiniteMode = (this.state.encoder.repeatAfterRatio === -1);

      // Initialize UrFountainEncoder
      this.state.encoder.instance = new UrFountainEncoder(
        ur,
        this.state.encoder.maxFragmentLength,
        this.state.encoder.minFragmentLength,
        this.state.encoder.firstSeqNum,
        this.state.encoder.repeatAfterRatio === -1 ? 0 : this.state.encoder.repeatAfterRatio  // Convert -1 to 0 for encoder
      );

      console.log('[MultiURGenerator] Encoder initialized:', {
        maxLen: this.state.encoder.maxFragmentLength,
        minLen: this.state.encoder.minFragmentLength,
        ratio: this.state.encoder.repeatAfterRatio,
        isInfinite: this.state.encoder.isInfiniteMode
      });

      // Get original block count (for encoder grid visualization)
      // This is the expected part count for pure fragments
      this.state.encoder.originalBlockCount = this.state.encoder.instance.getPureFragmentCount();

      // Generate parts
      if (this.state.encoder.isInfiniteMode) {
        // Infinite mode: Generate initial set of parts for display
        // We'll use nextPartUr() during animation
        this.state.encoder.parts = [];
        this.state.encoder.totalParts = Infinity;
        this.state.animation.totalFrames = Infinity;

        updateStatus(
          this.state.ui.statusElement,
          `Infinite mode: Generating streaming parts (${this.state.encoder.originalBlockCount} original blocks)`,
          'success'
        );
      } else {
        // Finite mode: Generate all parts upfront
        this.state.encoder.parts = this.state.encoder.instance.getAllPartsUr(this.state.encoder.repeatAfterRatio);
        this.state.encoder.totalParts = this.state.encoder.parts.length;
        this.state.animation.totalFrames = this.state.encoder.totalParts;

        updateStatus(
          this.state.ui.statusElement,
          `Generated ${this.state.encoder.totalParts} parts (${this.state.encoder.originalBlockCount} original blocks, ${this.state.encoder.repeatAfterRatio}x redundancy)`,
          'success'
        );

        // Display parts list (finite mode only)
        this.displayPartsList();
      }

      // Reset animation state
      this.state.animation.currentPartIndex = 0;
      this.state.animation.isPlaying = false;

      // Update mode UI
      this.updateModeUI();

      // Show controls
      this.showControls();

      // Render initial frame (frame 0)
      await this.renderCurrentFrame();

      // Auto-start animation
      this.startAnimation();

    } catch (error) {
      console.error('[MultiURGenerator] Generation error:', error);
      updateStatus(this.state.ui.statusElement, 'Error: ' + error.message, 'error');
    }
  }

  /**
   * Display parts list (finite mode shows all parts, infinite mode shows current UR)
   * FR-017: Finite parts display
   */
  displayPartsList() {
    const placeholder = this.container.querySelector('#parts-list-placeholder');

    if (!this.state.ui.partsListElement) {
      return;
    }

    if (this.state.encoder.isInfiniteMode) {
      // Infinite mode: Show current UR part only
      if (placeholder) placeholder.style.display = 'none';
      this.state.ui.partsListElement.style.display = 'block';
      
      const currentUR = this.getCurrentURPart();
      if (currentUR) {
        let html = '<div class="parts-list-header">Current Part:</div>';
        html += `<div class="part-item">
          <code class="part-ur">${currentUR}</code>
        </div>`;
        this.state.ui.partsListElement.innerHTML = html;
      }
      return;
    }

    // Finite mode: Show all parts
    if (this.state.encoder.parts.length === 0) {
      if (placeholder) placeholder.style.display = 'flex';
      this.state.ui.partsListElement.style.display = 'none';
      return;
    }

    // Hide placeholder, show list
    if (placeholder) placeholder.style.display = 'none';
    this.state.ui.partsListElement.style.display = 'block';

    let html = '<div class="parts-list-header">All Parts:</div>';
    this.state.encoder.parts.forEach((part, index) => {
      html += `<div class="part-item" data-index="${index}">
        <span class="part-number">Part ${index + 1}:</span>
        <code class="part-ur">${part}</code>
      </div>`;
    });

    this.state.ui.partsListElement.innerHTML = html;
  }

  /**
   * Get current UR part (handles both finite and infinite modes)
   */
  getCurrentURPart() {
    if (this.state.encoder.isInfiniteMode) {
      // Infinite mode: Generate next part on demand
      // Note: In infinite mode, we don't use currentPartIndex for sequencing
      // The encoder's internal state handles the sequence
      if (!this.state.encoder.instance) {
        return null;
      }
      const urPart = this.state.encoder.instance.nextPartUr();
      // Ensure we return a string - nextPartUr() returns a UR object
      return typeof urPart === 'string' ? urPart : urPart.toString();
    } else {
      // Finite mode: Get from parts array using currentPartIndex
      if (this.state.animation.currentPartIndex >= this.state.encoder.parts.length) {
        this.state.animation.currentPartIndex = 0; // Loop back
      }
      const urPart = this.state.encoder.parts[this.state.animation.currentPartIndex];
      // getAllPartsUr() should return strings, but ensure it's a string
      return typeof urPart === 'string' ? urPart : urPart.toString();
    }
  }

  /**
   * Render current frame (QR + text + encoder grid)
   * FR-014: QR generation with alphanumeric mode
   * FR-018: Infinite streaming preview
   */
  async renderCurrentFrame() {
    try {
      const currentPart = this.getCurrentURPart();
      if (!currentPart) {
        console.warn('[MultiURGenerator] No current part to render');
        return;
      }

      // Generate QR code
      await QRCode.toCanvas(
        this.state.qr.canvasElement,
        currentPart,
        {
          errorCorrectionLevel: this.state.qr.errorCorrectionLevel,
          width: this.state.qr.qrSize,
          margin: 2
          // Note: 'mode' option for alphanumeric is not directly supported in qrcode@1.5.3
          // The library auto-detects best encoding mode based on content
          // UR strings with bytewords will automatically use alphanumeric mode
        }
      );

      // Update current part text output
      if (this.state.ui.currentPartText) {
        this.state.ui.currentPartText.value = currentPart;
      }

      // Update frame indicator
      if (this.frameIndicator) {
        if (this.state.encoder.isInfiniteMode) {
          this.frameIndicator.textContent = `Streaming: Part ${this.state.animation.currentPartIndex + 1}`;
        } else {
          this.frameIndicator.textContent = `Part ${this.state.animation.currentPartIndex + 1} of ${this.state.encoder.totalParts}`;
        }
      }

      // Update progress bar (finite mode only)
      if (this.progressBar && !this.state.encoder.isInfiniteMode) {
        const progress = ((this.state.animation.currentPartIndex + 1) / this.state.encoder.totalParts) * 100;
        this.progressBar.style.width = `${progress}%`;
      }

      // Update encoder blocks grid
      await this.updateEncoderBlocksGrid(currentPart);

      // Update parts list display
      if (this.state.encoder.isInfiniteMode) {
        // In infinite mode, update the current part display
        this.displayPartsList();
      } else if (this.state.ui.partsListElement) {
        // Highlight current part in parts list (finite mode)
        const partItems = this.state.ui.partsListElement.querySelectorAll('.part-item');
        partItems.forEach((item, index) => {
          if (index === this.state.animation.currentPartIndex) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }

    } catch (error) {
      console.error('[MultiURGenerator] Render error:', error.message || error);
      console.error('[MultiURGenerator] Render error stack:', error.stack);
    }
  }

  /**
   * Update Encoder Blocks Grid
   *
   * Shows which original blocks are included in the current encoded fragment.
   * Similar to scanner's decoder grid but for encoding visualization.
   *
   * @param {string} urPart - Current UR part string
   */
  async updateEncoderBlocksGrid(urPart) {
    if (!this.state.ui.encoderBlocksGrid) {
      return;
    }

    try {
      // Extract which blocks this fragment contains
      // We need to parse the UR part to get fragment indexes
      const fragmentBlocks = await this.extractFragmentBlocks(urPart);

      this.state.encoder.currentFragmentBlocks = fragmentBlocks;

      // Clear existing grid
      this.state.ui.encoderBlocksGrid.innerHTML = '';

      // Add grid title
      const title = document.createElement('div');
      title.className = 'encoder-grid-title';
      const includedBlocks = fragmentBlocks
        .map((val, idx) => val === 1 ? idx : -1)
        .filter(idx => idx >= 0);
      title.textContent = `Fragment contains blocks: ${includedBlocks.length > 0 ? includedBlocks.join(', ') : 'None'}`;
      this.state.ui.encoderBlocksGrid.appendChild(title);

      // Create grid container
      const gridContainer = document.createElement('div');
      gridContainer.className = 'encoder-blocks-grid-container';

      // Create grid cells
      for (let i = 0; i < this.state.encoder.originalBlockCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'block-cell';

        const isIncluded = fragmentBlocks[i] === 1;

        if (isIncluded) {
          cell.classList.add('decoded'); // Green (reusing scanner styles)
          cell.title = `Block ${i}: Included in this fragment`;
        } else {
          cell.classList.add('pending'); // Gray (not included)
          cell.title = `Block ${i}: Not included`;
        }

        cell.textContent = i;
        gridContainer.appendChild(cell);
      }

      this.state.ui.encoderBlocksGrid.appendChild(gridContainer);

    } catch (error) {
      console.error('[MultiURGenerator] Failed to update encoder blocks grid:', error);
      // Non-critical error - don't break animation
    }
  }

  /**
   * Extract which original blocks are contained in a fragment
   *
   * Uses UrFountainDecoder to accurately determine which blocks are included.
   * The decoder tracks seenBlocks internally when processing each part.
   *
   * @param {string} urPart - UR part string (e.g., "ur:type/1-5/...")
   * @returns {Array<number>} Block bitmap [1,0,1,0,1] where 1=included, 0=not included
   */
  async extractFragmentBlocks(urPart) {
    try {
      // Parse UR to get metadata
      const ur = UR.fromString(urPart);

      // Check if it's a multi-part UR
      if (!ur.isFragment) {
        // Single-part UR - contains all blocks
        return new Array(this.state.encoder.originalBlockCount).fill(1);
      }

      // Create a fresh decoder instance for this part
      const tempDecoder = new UrFountainDecoder();
      
      // Feed the part to the decoder
      tempDecoder.receivePartUr(urPart);
      
      // The decoder's seenBlocks bitmap shows which original blocks are in this fragment
      // seenBlocks is an array where index i is 1 if block i is included, 0 otherwise
      const seenBlocks = tempDecoder.seenBlocks;

      // Ensure we have the right size bitmap
      if (seenBlocks.length !== this.state.encoder.originalBlockCount) {
        console.warn('[MultiURGenerator] seenBlocks length mismatch:', 
                     seenBlocks.length, 'vs expected', this.state.encoder.originalBlockCount);
        // Pad or truncate as needed
        const bitmap = new Array(this.state.encoder.originalBlockCount).fill(0);
        for (let i = 0; i < Math.min(seenBlocks.length, bitmap.length); i++) {
          bitmap[i] = seenBlocks[i];
        }
        return bitmap;
      }

      return seenBlocks;

    } catch (error) {
      console.error('[MultiURGenerator] extractFragmentBlocks error:', error.message || error);
      console.error('[MultiURGenerator] Error stack:', error.stack);
      // Fallback: Return empty bitmap
      return new Array(this.state.encoder.originalBlockCount).fill(0);
    }
  }

  /**
   * Start animation
   * FR-019: QR animation loop
   * FR-020: Animation controls
   */
  startAnimation() {
    console.log('[MultiURGenerator] startAnimation() called');

    if (this.state.animation.isPlaying) {
      console.log('[MultiURGenerator] Animation already playing');
      return;
    }

    if (!this.state.encoder.instance) {
      console.warn('[MultiURGenerator] No encoder instance - cannot start animation');
      return;
    }

    this.state.animation.isPlaying = true;
    this.state.animation.lastFrameTime = performance.now();

    // Update button visibility
    if (this.playBtn) this.playBtn.style.display = 'none';
    if (this.pauseBtn) this.pauseBtn.style.display = 'inline-block';

    // Start animation loop
    this.animate();
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    console.log('[MultiURGenerator] stopAnimation() called');

    this.state.animation.isPlaying = false;

    if (this.state.animation.animationFrameId) {
      cancelAnimationFrame(this.state.animation.animationFrameId);
      this.state.animation.animationFrameId = null;
    }

    // Update button visibility
    if (this.playBtn) this.playBtn.style.display = 'inline-block';
    if (this.pauseBtn) this.pauseBtn.style.display = 'none';
  }

  /**
   * Restart animation (reset to frame 0)
   */
  restartAnimation() {
    console.log('[MultiURGenerator] restartAnimation() called');

    this.stopAnimation();
    this.state.animation.currentPartIndex = 0;
    this.renderCurrentFrame();
    this.startAnimation();
  }

  /**
   * Animation loop using requestAnimationFrame
   */
  animate() {
    if (!this.state.animation.isPlaying) {
      return;
    }

    const currentTime = performance.now();
    const elapsed = currentTime - this.state.animation.lastFrameTime;

    // Check if enough time has passed for next frame
    if (elapsed >= this.state.animation.frameDelay) {
      if (this.state.encoder.isInfiniteMode) {
        // In infinite mode, just render the next frame
        // getCurrentURPart() will call nextPartUr() which handles sequencing
        this.renderCurrentFrame();
        
        // Increment display counter for UI purposes only
        this.state.animation.currentPartIndex++;
      } else {
        // In finite mode, increment the index and render
        this.state.animation.currentPartIndex++;
        
        // Loop back if we've reached the end
        if (this.state.animation.currentPartIndex >= this.state.encoder.totalParts) {
          this.state.animation.currentPartIndex = 0;
        }
        
        this.renderCurrentFrame();
      }

      // Update last frame time
      this.state.animation.lastFrameTime = currentTime;
    }

    // Schedule next frame
    this.state.animation.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Manually advance to next frame (when animation is paused)
   * Allows user to step through frames one at a time
   * Uses same logic as animate() to avoid double-advancing
   */
  nextFrame() {
    if (!this.state.encoder.instance) {
      console.warn('[MultiURGenerator] No encoder instance - cannot advance frame');
      return;
    }

    if (this.state.encoder.isInfiniteMode) {
      // In infinite mode, just render the next frame
      // getCurrentURPart() will call nextPartUr() which handles sequencing
      this.renderCurrentFrame();
      
      // Increment display counter for UI purposes only
      this.state.animation.currentPartIndex++;
    } else {
      // In finite mode, increment the index and render
      this.state.animation.currentPartIndex++;
      
      // Loop back if we've reached the end
      if (this.state.animation.currentPartIndex >= this.state.encoder.totalParts) {
        this.state.animation.currentPartIndex = 0;
      }
      
      this.renderCurrentFrame();
    }
  }

  /**
   * Manually go to previous frame (finite mode only)
   * Only available when not in infinite mode
   */
  previousFrame() {
    if (!this.state.encoder.instance) {
      console.warn('[MultiURGenerator] No encoder instance - cannot go to previous frame');
      return;
    }

    // Previous frame only works in finite mode
    if (this.state.encoder.isInfiniteMode) {
      console.warn('[MultiURGenerator] Previous frame not available in infinite mode');
      return;
    }

    // Decrement the index
    this.state.animation.currentPartIndex--;
    
    // Loop back if we've gone before the start
    if (this.state.animation.currentPartIndex < 0) {
      this.state.animation.currentPartIndex = this.state.encoder.totalParts - 1;
    }
    
    this.renderCurrentFrame();
  }

  /**
   * Show animation controls
   */
  showControls() {
    const controlsSection = this.container.querySelector('#animation-controls');
    if (controlsSection) {
      controlsSection.style.display = 'block';
    }

    const outputSection = this.container.querySelector('#multi-ur-output');
    if (outputSection) {
      outputSection.style.display = 'block';
    }

    const qrSection = this.container.querySelector('#qr-display-section');
    if (qrSection) {
      qrSection.style.display = 'block';
    }
  }

  /**
   * Copy current part to clipboard
   * FR-020: Copy-to-clipboard (individual part)
   */
  async copyCurrentPart() {
    const currentPart = this.getCurrentURPart();
    if (!currentPart) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentPart);

      const btn = this.container.querySelector('#copy-current-part');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('[MultiURGenerator] Copy failed:', error);
      updateStatus(this.state.ui.statusElement, 'Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Copy all parts to clipboard (finite mode only)
   * FR-020: Copy-to-clipboard (all parts)
   */
  async copyAllParts() {
    if (this.state.encoder.isInfiniteMode) {
      updateStatus(this.state.ui.statusElement, 'Cannot copy infinite parts. Use finite mode.', 'error');
      return;
    }

    if (this.state.encoder.parts.length === 0) {
      return;
    }

    try {
      const allPartsText = this.state.encoder.parts.join('\n');
      await navigator.clipboard.writeText(allPartsText);

      const btn = this.container.querySelector('#copy-all-parts');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('[MultiURGenerator] Copy failed:', error);
      updateStatus(this.state.ui.statusElement, 'Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Copy current QR as PNG
   * FR-020: Copy-to-clipboard (current QR as PNG)
   */
  async copyQRAsPNG() {
    try {
      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        this.state.qr.canvasElement.toBlob(resolve, 'image/png');
      });

      // Copy to clipboard using ClipboardItem
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      const btn = this.container.querySelector('#copy-qr-png');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('[MultiURGenerator] QR copy failed:', error);
      updateStatus(this.state.ui.statusElement, 'Failed to copy QR code', 'error');
    }
  }

  /**
   * Export as animated GIF (finite mode only)
   * FR-021: GIF export
   *
   * Uses gifenc library - a modern, lightweight GIF encoder.
   */
  async exportAsGIF() {
    if (this.state.encoder.isInfiniteMode) {
      updateStatus(
        this.state.ui.statusElement,
        'Cannot export infinite stream as GIF. Use finite mode (repeat ratio >= 0).',
        'error'
      );
      return;
    }

    if (this.state.encoder.parts.length === 0) {
      updateStatus(this.state.ui.statusElement, 'No parts to export', 'error');
      return;
    }

    try {
      console.log('[MultiURGenerator] Starting GIF export with gifenc...');

      // Calculate delay based on current FPS (in milliseconds for gifenc)
      const fps = this.state.animation.fps || 5;
      const delay = Math.round(1000 / fps); // Convert FPS to milliseconds
      console.log('[MultiURGenerator] FPS:', fps, 'Delay:', delay, 'ms');

      // Show progress
      updateStatus(
        this.state.ui.statusElement,
        `Generating GIF with ${this.state.encoder.parts.length} frames...`,
        'info'
      );

      // Create GIF encoder
      const gif = GIFEncoder();
      console.log('[MultiURGenerator] GIF encoder created');

      // Create temporary canvas for rendering frames
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.state.qr.qrSize;
      tempCanvas.height = this.state.qr.qrSize;
      const ctx = tempCanvas.getContext('2d');

      // Render each UR part to a frame
      for (let i = 0; i < this.state.encoder.parts.length; i++) {
        const urPart = this.state.encoder.parts[i];
        const urString = typeof urPart === 'string' ? urPart : urPart.toString();
        
        console.log(`[MultiURGenerator] Rendering frame ${i + 1}/${this.state.encoder.parts.length}`);
        
        // Generate QR code on temporary canvas
        await QRCode.toCanvas(
          tempCanvas,
          urString,
          {
            errorCorrectionLevel: this.state.qr.errorCorrectionLevel,
            width: this.state.qr.qrSize,
            margin: 2
          }
        );

        // Get image data from canvas
        const imageData = ctx.getImageData(0, 0, this.state.qr.qrSize, this.state.qr.qrSize);
        
        // Quantize colors to create palette (max 256 colors for GIF)
        const palette = quantize(imageData.data, 256);
        
        // Apply palette to get indexed frame data
        const index = applyPalette(imageData.data, palette);
        
        // Add frame to GIF
        gif.writeFrame(index, this.state.qr.qrSize, this.state.qr.qrSize, {
          palette,
          delay
        });

        // Update progress
        if (i % 5 === 0 || i === this.state.encoder.parts.length - 1) {
          updateStatus(
            this.state.ui.statusElement,
            `Encoding frame ${i + 1} of ${this.state.encoder.parts.length}...`,
            'info'
          );
        }
      }

      // Finish encoding
      gif.finish();
      console.log('[MultiURGenerator] GIF encoding finished');

      // Get the GIF buffer as Uint8Array
      const buffer = gif.bytes();
      
      // Create blob and download
      const blob = new Blob([buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multi-ur-qr-${this.state.encoder.parts.length}-frames-${fps}fps.gif`;
      a.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      console.log('[MultiURGenerator] GIF download triggered, size:', blob.size, 'bytes');
      
      updateStatus(
        this.state.ui.statusElement,
        `✅ GIF exported: ${this.state.encoder.parts.length} frames at ${fps} FPS (${(blob.size / 1024).toFixed(1)} KB)`,
        'success'
      );

    } catch (error) {
      console.error('[MultiURGenerator] GIF export failed:', error);
      console.error('[MultiURGenerator] Error message:', error.message);
      console.error('[MultiURGenerator] Error stack:', error.stack);
      updateStatus(this.state.ui.statusElement, 'GIF export failed: ' + (error.message || error.toString()), 'error');
    }
  }

  /**
   * Cleanup on tab deactivation
   */
  destroy() {
    console.log('[MultiURGenerator] destroy() called');

    // Stop animation
    this.stopAnimation();

    // Clear state
    this.state.encoder.instance = null;
    this.state.encoder.parts = [];
    this.state.input.isValid = false;
  }
}

// Initialize generator when DOM is ready
let generatorInstance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGenerator);
} else {
  initGenerator();
}

function initGenerator() {
  // Listen for tab activation
  window.addEventListener('hashchange', handleHashChange);

  // Check initial hash
  handleHashChange();
}

function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const multiURTab = document.getElementById('multi-ur-tab');

  if (hash === 'multi-ur' && multiURTab) {
    // Tab activated
    setTimeout(() => {
      if (multiURTab && !multiURTab.classList.contains('hidden')) {
        if (!generatorInstance) {
          generatorInstance = new MultiURGenerator();
        }
        generatorInstance.init(multiURTab);
      }
    }, 50);
  }
}
