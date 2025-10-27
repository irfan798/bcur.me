/**
 * QR Scanner & Fountain Decoder (Tab 3)
 * 
 * User Story 3: Mobile users need to scan animated QR codes from wallets/devices 
 * using their phone camera to decode multi-part URs and understand what data is 
 * being transmitted.
 * 
 * Features:
 * - Camera access with permission handling
 * - Real-time QR code detection
 * - Fountain decoder integration for multi-part URs
 * - Progress visualization (decoded blocks grid)
 * - Auto-forward to converter on completion
 */

import { UrFountainDecoder, UR } from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9?dev';
import QrScanner from 'https://esm.sh/qr-scanner@1.4.2';
import { handleError, updateStatus } from './shared.js';

export class QRScanner {
  constructor() {
    // State per contracts/state-schema.md
    this.state = {
      // Camera state
      camera: {
        isActive: false,
        hasPermission: null,         // null=not requested, true=granted, false=denied
        stream: null,
        deviceId: null,
        hasTorch: false,
        isTorchOn: false
      },
      
      // Decoder state (from UrFountainDecoder)
      decoder: {
        instance: null,
        seenBlocks: [],              // Scanned fragments (may include redundant)
        decodedBlocks: [],           // Original blocks resolved
        expectedBlockCount: 0,
        progress: 0,                 // 0.0-1.0
        urType: null,
        isComplete: false,
        assembledUR: null
      },
      
      // Scan state
      scanning: {
        isScanning: false,
        lastScanTime: 0,
        totalScans: 0,               // Count of QR codes detected
        uniqueFragments: 0,          // Unique UR parts received
        scanStartTime: null,
        estimatedTimeRemaining: null // Seconds
      },
      
      // UI state
      ui: {
        videoPreview: null,
        blocksGrid: null,
        progressBar: null,
        errorMessage: null,
        showTroubleshooting: false,  // True if no QR detected after 10s
        typeMismatchWarning: null    // { detected, expected }
      }
    };
    
    // QR scanner instance (qr-scanner library)
    this.scanner = null;
    
    // No-QR timeout timer
    this.noQrTimer = null;
    
    // DOM references (initialized on tab activation)
    this.container = null;
    
    // Track if listeners have been set up to prevent duplicates
    this.listenersInitialized = false;
    
  }
  
  /**
   * Initialize scanner when tab becomes active
   * Called by router on tab activation
   */
  async init(container) {
    this.container = container;
    
    try {
      // Setup UI references
      this.setupUIReferences();
      
      // Initialize decoder
      this.resetDecoder();
      
      // Setup event listeners only once
      if (!this.listenersInitialized) {
        this.setupEventListeners();
        this.listenersInitialized = true;
      }
      
      
      // Auto-start camera when tab is activated
      await this.startCamera();
    } catch (error) {
      console.error('[QRScanner] Initialization error:', error);
      handleError(error, this.container, 'Scanner initialization failed');
    }
  }
  
  /**
   * Setup DOM references from container
   */
  setupUIReferences() {
    this.state.ui.videoPreview = this.container.querySelector('#scanner-video');
    this.state.ui.blocksGrid = this.container.querySelector('#blocks-grid');
    this.state.ui.progressBar = this.container.querySelector('#progress-bar');
    
    if (!this.state.ui.videoPreview) {
      throw new Error('Video preview element not found (#scanner-video)');
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Stop camera button
    const stopBtn = this.container.querySelector('#stop-camera');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopCamera());
    }
    
    // Reset button
    const resetBtn = this.container.querySelector('#reset-scanner');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetDecoder());
    }
    
    // Torch toggle (if supported)
    const torchBtn = this.container.querySelector('#toggle-torch');
    if (torchBtn) {
      torchBtn.addEventListener('click', () => this.toggleTorch());
    }
    
    // Copy assembled UR button
    const copyBtn = this.container.querySelector('#copy-assembled-ur');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyAssembledUR());
    }
  }
  
  /**
   * Start camera and QR scanning
   * FR-021: Request camera permission
   * FR-022: Display live camera preview
   */
  async startCamera() {
    
    try {
      // Check if camera is already active
      if (this.state.camera.isActive) {
        return;
      }
      
      // Initialize QR scanner with optimized settings for better detection
      if (!this.scanner) {
        this.scanner = new QrScanner(
          this.state.ui.videoPreview,
          (result) => this.handleQRDetected(result),
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera on mobile
            // Reduce scan rate for better processing per frame
            // maxScansPerSecond: 5,
            // Increase resolution for better QR detection (especially for high-density QR codes)
            calculateScanRegion: (video) => {
              // Use full video region for scanning with higher resolution
              return {
                x: 0,
                y: 0,
                width: video.videoWidth,
                height: video.videoHeight,
                downScaledWidth: 1280, // Higher resolution for better QR detection
                downScaledHeight: 720   // (was 640x480, now 1280x720)
              };
            }
          }
        );
      }
      
      // Start scanner (no arguments - browser handles camera constraints automatically)
      // The browser will automatically request highest available resolution
      await this.scanner.start();
      
      // Update state
      this.state.camera.isActive = true;
      this.state.camera.hasPermission = true;
      this.state.scanning.isScanning = true;
      this.state.scanning.scanStartTime = Date.now();
      
      // Start no-QR timeout (FR-030a: 10-second timeout)
      this.startNoQrTimeout();
      
      // Check torch support
      await this.checkTorchSupport();
      
      // Update UI
      this.updateUI();
      
    } catch (error) {
      console.error('[QRScanner] Camera start failed:', error);
      
      // Handle permission denial (FR-032)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.state.camera.hasPermission = false;
        this.showError('Camera access required for QR scanning. Please grant permission in browser settings.');
      } else if (error.name === 'NotFoundError') {
        // FR-033: No camera detected
        this.showError('No camera detected. Please use a mobile device or paste UR manually in the converter tab.');
      } else {
        this.showError(`Camera error: ${error.message}`);
      }
      
      this.updateUI();
    }
  }
  
  /**
   * Stop camera and scanning
   */
  stopCamera() {
    
    if (this.scanner) {
      this.scanner.stop();
    }
    
    // Clear no-QR timeout
    if (this.noQrTimer) {
      clearTimeout(this.noQrTimer);
      this.noQrTimer = null;
    }
    
    // Update state
    this.state.camera.isActive = false;
    this.state.scanning.isScanning = false;
    this.state.ui.showTroubleshooting = false;
    
    this.updateUI();
  }
  
  /**
   * Handle QR code detected
   * FR-023: Auto-detect and decode QR codes
   * FR-024: Use UrFountainDecoder to assemble multi-part URs
   */
  handleQRDetected(result) {
    const urString = result.data;
    
    // Reset no-QR timeout
    if (this.noQrTimer) {
      clearTimeout(this.noQrTimer);
      this.startNoQrTimeout();
    }
    
    // Update scan state
    this.state.scanning.lastScanTime = Date.now();
    this.state.scanning.totalScans++;
    this.state.ui.showTroubleshooting = false;
    
    try {
      // Validate UR string
      if (!urString.startsWith('ur:')) {
        console.warn('[QRScanner] Not a UR string:', urString);
        return;
      }
      
      // Parse UR to check if it's multi-part
      const ur = UR.fromString(urString);
      
      // Initialize decoder if not started
      if (!this.state.decoder.instance) {
        this.state.decoder.instance = new UrFountainDecoder();
      }
      
      // Check for type mismatch (FR-028)
      if (this.state.decoder.urType && ur.type !== this.state.decoder.urType) {
        this.state.ui.typeMismatchWarning = {
          detected: ur.type,
          expected: this.state.decoder.urType
        };
        this.updateUI();
        return;
      }
      
      // Receive part
      const wasAccepted = this.state.decoder.instance.receivePartUr(urString);
      
      if (wasAccepted) {
        this.state.scanning.uniqueFragments++;
        
        // Update decoder state from instance
        this.updateDecoderState();
        
        // Check if complete (FR-030)
        if (this.state.decoder.isComplete) {
          this.handleDecodingComplete();
        } else {
          // Update UI with progress
          this.updateUI();
        }
      }
    } catch (error) {
      console.error('[QRScanner] QR processing error:', error);
      this.showError(`QR processing error: ${error.message}`);
    }
  }
  
  /**
   * Update decoder state from UrFountainDecoder instance
   * FR-025: Display grid visualization
   * FR-026: Display progress
   * FR-027: Distinguish seen vs decoded blocks
   */
  updateDecoderState() {
    const decoder = this.state.decoder.instance;
    
    if (!decoder) {
      return;
    }
    
    // Check if decoder has completed (handles both single-part and multi-part URs)
    this.state.decoder.isComplete = decoder.isComplete();
    
    if (this.state.decoder.isComplete && decoder.resultUr) {
      // Single-part UR or completed multi-part UR
      this.state.decoder.assembledUR = decoder.resultUr.toString();
      this.state.decoder.urType = decoder.expectedType || decoder.resultUr.type;
      
      // For single-part URs, set progress to 100%
      this.state.decoder.progress = 1.0;
      
      
      return;
    }
    
    // Multi-part UR in progress
    if (decoder.started) {
      this.state.decoder.seenBlocks = [...decoder.seenBlocks];
      this.state.decoder.decodedBlocks = [...decoder.decodedBlocks];
      this.state.decoder.expectedBlockCount = decoder.expectedPartCount;
      this.state.decoder.progress = decoder.getProgress(); // 0.0-1.0
      this.state.decoder.urType = decoder.expectedType;
      
    }
  }
  
  /**
   * Handle decoding complete
   * FR-030: Auto-forward assembled UR to converter tab
   */
  handleDecodingComplete() {
    
    // Stop camera
    this.stopCamera();
    
    // Update UI
    this.updateUI();
    
    // Show success message in camera status element (not container!)
    const statusElement = this.container.querySelector('#camera-status');
    if (statusElement) {
      updateStatus(
        statusElement,
        `Successfully assembled ${this.state.decoder.expectedBlockCount}-part UR!`,
        'success'
      );
    }
    
    // Auto-forward to converter (via sessionStorage)
    try {
      sessionStorage.setItem('forward-scanner', JSON.stringify({
        ur: this.state.decoder.assembledUR,
        source: 'scanner',
        timestamp: Date.now()
      }));
      
      // Navigate to converter tab
      setTimeout(() => {
        window.location.hash = '#converter';
      }, 500); // 0.5s delay to show success message
    } catch (error) {
      console.error('[QRScanner] Forward failed:', error);
      this.showError('Failed to forward UR to converter');
    }
  }
  
  /**
   * Reset decoder state
   * FR-029: Provide manual reset button
   */
  resetDecoder() {
    
    if (this.state.decoder.instance) {
      this.state.decoder.instance.reset();
    }
    
    this.state.decoder = {
      instance: null,
      seenBlocks: [],
      decodedBlocks: [],
      expectedBlockCount: 0,
      progress: 0,
      urType: null,
      isComplete: false,
      assembledUR: null
    };
    
    this.state.scanning.uniqueFragments = 0;
    this.state.scanning.totalScans = 0;
    this.state.ui.typeMismatchWarning = null;
    
    this.updateUI();
  }
  
  /**
   * Start no-QR timeout (FR-031: 10-second timeout)
   */
  startNoQrTimeout() {
    // Clear existing timer
    if (this.noQrTimer) {
      clearTimeout(this.noQrTimer);
    }
    
    // Start 10-second timer
    this.noQrTimer = setTimeout(() => {
      if (this.state.scanning.totalScans === 0) {
        this.state.ui.showTroubleshooting = true;
        this.updateUI();
      }
    }, 10000); // 10 seconds
  }
  
  /**
   * Check torch/flashlight support
   */
  async checkTorchSupport() {
    if (this.scanner) {
      this.state.camera.hasTorch = await this.scanner.hasFlash();
    }
  }
  
  /**
   * Toggle torch/flashlight
   */
  async toggleTorch() {
    if (!this.scanner || !this.state.camera.hasTorch) {
      return;
    }
    
    try {
      if (this.state.camera.isTorchOn) {
        await this.scanner.turnFlashOff();
        this.state.camera.isTorchOn = false;
      } else {
        await this.scanner.turnFlashOn();
        this.state.camera.isTorchOn = true;
      }
      this.updateUI();
    } catch (error) {
      console.error('[QRScanner] Torch toggle failed:', error);
    }
  }
  
  /**
   * Copy assembled UR to clipboard
   * FR-036a: Copy-to-clipboard for scanned UR
   */
  async copyAssembledUR() {
    if (!this.state.decoder.assembledUR) {
      return;
    }
    
    try {
      await navigator.clipboard.writeText(this.state.decoder.assembledUR);
      
      // Visual feedback
      const btn = this.container.querySelector('#copy-assembled-ur');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('success');
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('success');
        }, 2000);
      }
    } catch (error) {
      console.error('[QRScanner] Copy failed:', error);
      this.showError('Failed to copy to clipboard');
    }
  }
  
  /**
   * Update UI based on current state
   */
  updateUI() {
    // Guard: Don't update UI if container doesn't exist or isn't visible
    if (!this.container || !document.body.contains(this.container)) {
      console.warn('[QRScanner] updateUI() called but container not in DOM - skipping');
      return;
    }
    
    // Guard: Don't update UI if scanner tab is not active
    if (this.container.classList.contains('hidden')) {
      console.warn('[QRScanner] updateUI() called but tab is hidden - skipping');
      return;
    }
    
    // Update camera status
    this.updateCameraStatus();
    
    // Update progress display
    this.updateProgressDisplay();
    
    // Update blocks grid
    this.updateBlocksGrid();
    
    // Update controls visibility
    this.updateControlsVisibility();
    
    // Show type mismatch warning
    this.updateTypeMismatchWarning();
    
    // Show troubleshooting tips
    this.updateTroubleshootingTips();
  }
  
  /**
   * Update camera status display
   */
  updateCameraStatus() {
    const statusEl = this.container.querySelector('#camera-status');
    if (!statusEl) return;
    
    if (this.state.camera.isActive) {
      statusEl.textContent = 'Camera: Active';
      statusEl.className = 'status success';
    } else if (this.state.camera.hasPermission === false) {
      statusEl.textContent = 'Camera: Permission Denied';
      statusEl.className = 'status error';
    } else {
      statusEl.textContent = 'Camera: Inactive';
      statusEl.className = 'status';
    }
  }
  
  /**
   * Update progress display
   * FR-026: Display progress with decoded/total blocks and percentage
   */
  updateProgressDisplay() {
    const progressEl = this.container.querySelector('#scan-progress');
    if (!progressEl) return;
    
    // Check if UR is complete
    if (this.state.decoder.isComplete) {
      progressEl.textContent = `✅ Complete: ${this.state.decoder.urType || 'UR'} successfully scanned`;
      progressEl.style.display = 'block';
      
      if (this.state.ui.progressBar) {
        this.state.ui.progressBar.style.width = '100%';
      }
    } else if (this.state.decoder.expectedBlockCount > 0) {
      // Multi-part UR in progress
      const decodedCount = this.state.decoder.decodedBlocks.filter(b => b === 1).length;
      const percentage = (this.state.decoder.progress * 100).toFixed(1);
      
      progressEl.textContent = `Progress: ${decodedCount}/${this.state.decoder.expectedBlockCount} blocks (${percentage}%)`;
      progressEl.style.display = 'block';
      
      // Update progress bar
      if (this.state.ui.progressBar) {
        this.state.ui.progressBar.style.width = `${percentage}%`;
      }
    } else {
      progressEl.textContent = 'Waiting for first QR code...';
      progressEl.style.display = 'block';
      
      if (this.state.ui.progressBar) {
        this.state.ui.progressBar.style.width = '0%';
      }
    }
  }
  
  /**
   * Update blocks grid visualization
   * FR-025: Grid showing decoded (green) vs pending (gray) blocks
   */
  updateBlocksGrid() {
    if (!this.state.ui.blocksGrid) return;
    
    // Clear existing grid
    this.state.ui.blocksGrid.innerHTML = '';
    
    if (this.state.decoder.expectedBlockCount === 0) {
      return;
    }
    
    // Create grid cells
    for (let i = 0; i < this.state.decoder.expectedBlockCount; i++) {
      const cell = document.createElement('div');
      cell.className = 'block-cell';
      
      const isDecoded = this.state.decoder.decodedBlocks[i] === 1;
      const isSeen = this.state.decoder.seenBlocks[i] === 1;
      
      if (isDecoded) {
        cell.classList.add('decoded'); // Green
        cell.title = `Block ${i + 1}: Decoded`;
      } else if (isSeen) {
        cell.classList.add('seen'); // Yellow (seen but not decoded)
        cell.title = `Block ${i + 1}: Seen (mixed fragment)`;
      } else {
        cell.classList.add('pending'); // Gray
        cell.title = `Block ${i + 1}: Pending`;
      }
      
      cell.textContent = i + 1;
      this.state.ui.blocksGrid.appendChild(cell);
    }
  }
  
  /**
   * Update controls visibility
   */
  updateControlsVisibility() {
    const stopBtn = this.container.querySelector('#stop-camera');
    const resetBtn = this.container.querySelector('#reset-scanner');
    const torchBtn = this.container.querySelector('#toggle-torch');
    const copyBtn = this.container.querySelector('#copy-assembled-ur');
    const assembledSection = this.container.querySelector('#assembled-ur-section');
    const assembledOutput = this.container.querySelector('#assembled-ur-output');
    
    if (stopBtn) {
      stopBtn.style.display = this.state.camera.isActive ? 'inline-block' : 'none';
    }
    
    if (resetBtn) {
      resetBtn.style.display = this.state.decoder.expectedBlockCount > 0 ? 'inline-block' : 'none';
    }
    
    if (torchBtn) {
      torchBtn.style.display = this.state.camera.hasTorch ? 'inline-block' : 'none';
      torchBtn.textContent = this.state.camera.isTorchOn ? '🔦 Torch: ON' : '🔦 Torch: OFF';
    }
    
    if (copyBtn) {
      copyBtn.style.display = this.state.decoder.isComplete ? 'inline-block' : 'none';
    }
    
    // Show assembled UR section when complete
    if (assembledSection) {
      assembledSection.style.display = this.state.decoder.isComplete ? 'block' : 'none';
    }
    
    // Populate assembled UR output
    if (assembledOutput && this.state.decoder.assembledUR) {
      assembledOutput.value = this.state.decoder.assembledUR;
    }
  }
  
  /**
   * Update type mismatch warning
   * FR-028: Detect UR type mismatch mid-scan
   */
  updateTypeMismatchWarning() {
    const warningEl = this.container.querySelector('#type-mismatch-warning');
    if (!warningEl) return;
    
    if (this.state.ui.typeMismatchWarning) {
      const { detected, expected } = this.state.ui.typeMismatchWarning;
      warningEl.textContent = `⚠️ Type mismatch: Expected '${expected}' but detected '${detected}'. Reset to scan new sequence.`;
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
    }
  }
  
  /**
   * Update troubleshooting tips
   * FR-031: Show tips if no QR detected after 10s
   */
  updateTroubleshootingTips() {
    const tipsEl = this.container.querySelector('#troubleshooting-tips');
    if (!tipsEl) return;
    
    if (this.state.ui.showTroubleshooting) {
      tipsEl.innerHTML = `
        <strong>Having trouble scanning? Try these tips:</strong>
        <ul>
          <li><strong>Distance:</strong> Hold device 6-12 inches (15-30cm) from QR code</li>
          <li><strong>Focus:</strong> Tap screen to trigger autofocus if QR looks blurry</li>
          <li><strong>Lighting:</strong> Ensure good lighting - avoid shadows and glare</li>
          <li><strong>Stability:</strong> Hold camera steady for 2-3 seconds</li>
          <li><strong>Size:</strong> QR should fill 40-60% of screen for best results</li>
          <li><strong>Angle:</strong> Hold camera perpendicular to QR code (not tilted)</li>
        </ul>
      `;
      tipsEl.style.display = 'block';
    } else {
      tipsEl.style.display = 'none';
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    this.state.ui.errorMessage = message;
    updateStatus(this.container, message, 'error');
  }
  
  /**
   * Cleanup on tab deactivation
   */
  destroy() {
    // Stop camera
    this.stopCamera();
    
    // Clear timers
    if (this.noQrTimer) {
      clearTimeout(this.noQrTimer);
      this.noQrTimer = null;
    }
    
    // Destroy scanner
    if (this.scanner) {
      this.scanner.stop();
      //this.scanner.destroy();
      this.scanner = null;
    }
  }
}

// Initialize scanner when DOM is ready
let scannerInstance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScanner);
} else {
  initScanner();
}

function initScanner() {
  // Listen for tab activation
  window.addEventListener('hashchange', handleHashChange);
  
  // Check initial hash
  handleHashChange();
}

function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const scannerTab = document.getElementById('scanner-tab');
  
  if (hash === 'scanner' && scannerTab) {
    // Tab activated - wait for tab to be fully visible before initializing
    // Small delay to ensure CSS transitions and DOM updates complete
    setTimeout(() => {
      // Verify tab is actually visible before initializing
      if (scannerTab && !scannerTab.classList.contains('hidden')) {
        if (!scannerInstance) {
          scannerInstance = new QRScanner();
        }
        scannerInstance.init(scannerTab);
      } else {
        // Retry once after another small delay if tab not visible yet
        setTimeout(() => {
          if (scannerTab && !scannerTab.classList.contains('hidden')) {
            if (!scannerInstance) {
              scannerInstance = new QRScanner();
            }
            scannerInstance.init(scannerTab);
          }
        }, 100);
      }
    }, 50);
  }
}
