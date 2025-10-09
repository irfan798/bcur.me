/**
 * BC-UR Live Format Converter - Demo Page JavaScript
 * 
 * Provides real-time conversion between multiple BC-UR encoding formats:
 * - Multi-part UR (fountain-encoded QR codes)
 * - Single UR strings
 * - Bytewords (human-readable encoding)
 * - Hex (CBOR binary as hexadecimal)
 * - Decoded CBOR (4 formats: JSON, Diagnostic, Commented, JavaScript)
 */

// Import BC-UR library components directly from CDN (esm.sh)
// This demonstrates external consumption without relying on local ./dist/web build output.
// For offline or air‑gapped scenarios you can revert to: './dist/web/bc-ur.js'
import { 
    UR,                    // Core UR class for encoding/decoding
    UrFountainDecoder,     // Multi-part UR decoder for multi-part UR strings
    BytewordEncoding,      // Bytewords encoder with style support
    cbor2                  // CBOR diagnostics (comment/diagnose)
} from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';

// Extract cbor2 functions for CBOR diagnostic output
const { comment, diagnose } = cbor2;

// Canonical ordered stages for visualization (decoded-* collapses to 'decoded')
const PIPELINE_STAGES = ['multiur', 'ur', 'bytewords', 'hex', 'decoded'];

/**
 * FormatConverter Class
 * 
 * Manages the BC-UR format conversion interface, including:
 * - Format auto-detection
 * - Live conversion with debouncing
 * - Pipeline visualization
 * - Conversion caching for performance
 * - Multi-part UR assembly
 */
class FormatConverter {
    constructor() {
        // DOM element references
        this.inputElement = document.getElementById('inputText');
        this.outputElement = document.getElementById('outputText');
        this.inputFormatElement = document.getElementById('inputFormat');
        this.outputFormatElement = document.getElementById('outputFormat');
        this.statusElement = document.getElementById('status');
        this.pipelineElement = document.getElementById('pipeline');
        this.copyBtn = document.getElementById('copyBtn');
        
        // Debounce timer - prevents excessive conversions during typing
        this.conversionTimer = null;
        
        // Cache for conversions - stores previous results for instant retrieval
        // Key: input + inputFormat + outputFormat
        // Value: { output, pipeline }
        this.conversionCache = new Map();
        
        // UR Type UI elements (added dynamically in HTML)
        this.urTypeContainer = document.getElementById('urTypeContainer');
        this.urTypeInput = document.getElementById('urTypeInput');
        this.urTypeHint = document.getElementById('urTypeHint');
        this.urTypeAutoBadge = document.getElementById('urTypeAutoBadge');
        this.urTypeIndicator = document.getElementById('urTypeIndicator');
        
        // Bytewords style selectors
        this.inputBytewordsStyle = document.getElementById('inputBytewordsStyle');
        this.outputBytewordsStyle = document.getElementById('outputBytewordsStyle');

        this.setupEventListeners();
        this.initializeExamples();
    }

    /**
     * Setup Event Listeners
     * Attaches handlers for user interactions
     */
    setupEventListeners() {
        // Live conversion with debouncing (150ms delay after typing stops)
        this.inputElement.addEventListener('input', () => {
            clearTimeout(this.conversionTimer);
            this.conversionTimer = setTimeout(() => this.handleConversion(), 150);
        });
        
        // Format dropdown changes trigger immediate conversion
        this.inputFormatElement.addEventListener('change', () => {
            this.toggleBytewordsStyleSelector('input');
            this.handleConversion();
        });
        this.outputFormatElement.addEventListener('change', () => {
            this.toggleBytewordsStyleSelector('output');
            this.handleConversion();
        });
        
        // Bytewords style changes
        if (this.inputBytewordsStyle) {
            this.inputBytewordsStyle.addEventListener('change', () => this.handleConversion());
        }
        if (this.outputBytewordsStyle) {
            this.outputBytewordsStyle.addEventListener('change', () => this.handleConversion());
        }
        if (this.urTypeInput) {
            // Real-time validation & debounced conversion
            this.urTypeInput.addEventListener('input', (e) => {
                const original = this.urTypeInput.value;
                const sanitized = this.sanitizeUrType(original);
                if (sanitized !== original) {
                    const pos = this.urTypeInput.selectionStart;
                    this.urTypeInput.value = sanitized;
                    // Adjust caret (best-effort; keep at end if mismatch)
                    try { this.urTypeInput.setSelectionRange(pos - (original.length - sanitized.length), pos - (original.length - sanitized.length)); } catch {}
                }
                // Update hint dynamically (without waiting for conversion)
                this.refreshUrTypeHint();
                clearTimeout(this.conversionTimer);
                this.conversionTimer = setTimeout(() => this.handleConversion(), 220);
            });
        }
        
        // Paste handler - shorter delay for better UX
        this.inputElement.addEventListener('paste', () => {
            setTimeout(() => this.handleConversion(), 10);
        });

        // Copy button - copies output to clipboard
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        // Example buttons - load pre-configured examples
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const example = e.target.getAttribute('data-example');
                this.loadExample(example);
            });
        });
    }

    initializeExamples() {
        // Add example data for testing
        this.examples = {
            hex: 'a2626964187b646e616d65684a6f686e20446f65',
            ur: 'ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl',
            bytewords: 'oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl',
            multiur: 'ur:crypto-psbt/1of2/lpadaxcfaxcywenbpljkhdcahkadaemeaortcxhhdmntdmaybbnyrdiyfnztdwvlhgfywtynlgolprfoycxvamdmdfhynfmpmolbbkwngyfx\nur:crypto-psbt/2of2/lpaoaxcfaxcywenbpljkhdcahkadaemeaortcxzmwkfglrsswnckurpabzpttohhlspfztdamhyrfzksnfdmutlzmhkkgmhkbdnyidfegy'
        };
    }

    loadExample(type) {
        const example = this.examples[type];
        if (example) {
            this.inputElement.value = example;
            this.inputFormatElement.value = type === 'ur' || type === 'multiur' ? type : 'auto';
            this.handleConversion();
        }
    }

    copyToClipboard() {
        const text = this.outputElement.value;
        if (!text) {
            this.updateStatus('⚠️ No output to copy', 'error');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            this.updateStatus('❌ Failed to copy: ' + err.message, 'error');
        });
    }

    /**
     * Auto-detect Input Format
     * 
     * Analyzes input string to determine format type using pattern matching.
     * Detection order: multiur → ur → hex → bytewords → decoded-json
     * 
     * @param {string} input - Raw input string
     * @returns {string|null} - Detected format name or null if unknown
     */
    detectFormat(input) {
        const trimmed = input.trim();
        
        // Empty input
        if (!trimmed) return null;
        
        // Multi-part UR detection (multiple lines with ur: or part indicators)
        // Example: "ur:crypto-psbt/1of2/..."
        if (trimmed.includes('\n') && trimmed.includes('ur:')) {
            const lines = trimmed.split('\n').filter(l => l.trim());
            if (lines.length > 1 && lines.every(l => l.includes('ur:'))) {
                return 'multiur';
            }
        }
        
        // Single line multi-part UR with part indicator (e.g., "ur:bytes/1of9/...")
        if (/^ur:[\w-]+\/\d+of\d+\//.test(trimmed)) {
            return 'multiur';
        }
        
        // Single UR - starts with "ur:" prefix
        if (trimmed.startsWith('ur:')) {
            return 'ur';
        }
        
        // Hex detection - only hex characters (0-9a-fA-F) and even length
        if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
            return 'hex';
        }
        
        // Bytewords detection - space-separated 4-letter words OR minimal 2-char pairs
        // Example: "tuna acid draw oboe" (standard) or "taaddroe" (minimal)
        const words = trimmed.toLowerCase().split(/\s+/);
        const bytewordsPattern = /^[a-z]{4}$/;
        const minimalPattern = /^[a-z]{2}$/;
        if (words.length > 0 && words.every(w => bytewordsPattern.test(w))) {
            return 'bytewords';
        }
        // Minimal bytewords (continuous 2-char pairs)
        if (/^[a-z]+$/.test(trimmed) && trimmed.length % 2 === 0 && trimmed.length >= 4) {
            return 'bytewords';
        }
        
        return null;
    }

    async handleConversion() {
        const rawInput = this.inputElement.value;
        if (!rawInput.trim()) {
            this.clearOutput();
            this.updateUrTypeUI({ visible: false });
            return;
        }

        const detected = this.inputFormatElement.value === 'auto' ? this.detectFormat(rawInput) : this.inputFormatElement.value;
        if (!detected) {
            this.outputElement.value = '';
            this.updateStatus('Unable to detect input format. Please pick one.', 'error');
            this.updateUrTypeUI({ visible: false });
            return;
        }
        if (this.inputFormatElement.value === 'auto') {
            this.updateStatus('Detected format: ' + this.getFormatLabel(detected), 'info');
        }

        const outputFormat = this.outputFormatElement.value;
        const inputBwStyle = this.inputBytewordsStyle?.value || 'minimal';
        const outputBwStyle = this.outputBytewordsStyle?.value || 'minimal';
        const cacheKey = [rawInput, detected, outputFormat, (this.urTypeInput?.value || ''), inputBwStyle, outputBwStyle].join('|');
        if (this.conversionCache.has(cacheKey)) {
            const cached = this.conversionCache.get(cacheKey);
            this.outputElement.value = cached.output;
            this.simplePipelineViz(detected, outputFormat, cached.pipelineStatus === 'error');
            this.updateUrTypeUI(cached.urTypeUI || { visible: false });
            this.updateStatus('✓ Conversion successful (cached)', 'success');
            return;
        }

        try {
            const { output, usedUrType, autoDetectedUrType, registryResolved } = await this.performConversion({
                rawInput,
                fromFormat: detected,
                toFormat: outputFormat,
                urTypeOverride: this.urTypeInput?.value.trim() || '',
                inputBytewordsStyle: inputBwStyle,
                outputBytewordsStyle: outputBwStyle
            });

            // Cache and UI updates
            const urTypeUI = (outputFormat === 'ur') ? {
                visible: !registryResolved,
                value: usedUrType || '',
                auto: autoDetectedUrType,
                disabled: !!registryResolved
            } : { visible: false };

            this.conversionCache.set(cacheKey, { output, pipelineStatus: 'success', urTypeUI });
            if (this.conversionCache.size > 120) {
                const first = this.conversionCache.keys().next().value; this.conversionCache.delete(first);
            }

            this.outputElement.value = output;
            this.simplePipelineViz(detected, outputFormat, false);
            this.updateUrTypeUI(urTypeUI);
            this.updateStatus('✓ Conversion successful', 'success');
        } catch (err) {
            this.outputElement.value = '';
            this.simplePipelineViz(detected, outputFormat, true);
            this.updateStatus('✗ Error: ' + err.message, 'error');
            this.updateUrTypeUI({ visible: false });
            console.error(err);
        }
    }

    /**
     * Core conversion orchestrator (simplified vs previous pipeline replication)
     * Strategy:
     *  - Normalize decoded-* group to 'decoded'
     *  - Parse input to canonical artifact for its stage (UR instance, hex string, JS value)
     *  - Progressively derive required representations for target
     *  - Render decoded variants via renderDecodedVariant
     *  - Handle UR type resolution when producing UR string from raw CBOR / value
     */
    async performConversion({ rawInput, fromFormat, toFormat, urTypeOverride, inputBytewordsStyle = 'minimal', outputBytewordsStyle = 'minimal' }) {
        const norm = f => f.startsWith('decoded-') ? 'decoded' : f;
        const fromNorm = norm(fromFormat);
        const toNorm = norm(toFormat);

        // Guard: decoded diagnostic/commented/js cannot be a source for re-encoding
        if (fromFormat !== 'decoded-json' && fromNorm === 'decoded' && toNorm !== 'decoded') {
            throw new Error('Decoded (non-JSON view) cannot be source for re-encoding. Switch input format to Decoded JSON.');
        }

        let urInstance = null; // When source or intermediate is a UR
        let hex = null;        // CBOR hex string
        let jsValue = null;    // Decoded JS value (for decoded-json input)
        let registryResolved = false; // Did we auto-resolve via registry item?
        let usedUrType = null; // Chosen or auto-detected UR type
        let autoDetectedUrType = false;

        // 1. Parse input according to fromNorm
        switch (fromNorm) {
            case 'multiur': {
                const assembled = this.assembleMultiUR(rawInput); // returns single UR string
                urInstance = UR.fromString(assembled);
                break;
            }
            case 'ur': {
                urInstance = UR.fromString(rawInput.trim());
                break;
            }
            case 'bytewords': {
                // Convert bytewords → hex using BytewordEncoding with selected style (enum string values)
                const style = (['minimal','standard','uri'].includes(inputBytewordsStyle)) ? inputBytewordsStyle : 'minimal';
                const encoder = new BytewordEncoding(style);
                hex = encoder.decode(rawInput.trim());
                break;
            }
            case 'hex': {
                hex = rawInput.trim();
                if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
                    throw new Error('Invalid hex input');
                }
                break;
            }
            case 'decoded': {
                // Only decoded-json allowed through earlier guard
                try { jsValue = JSON.parse(rawInput); } catch (e) { throw new Error('Invalid JSON: ' + e.message); }
                break;
            }
            default:
                throw new Error('Unsupported source format: ' + fromFormat);
        }

        // 2. Derive hex if needed for target (and not already present)
        if (!hex && (toNorm === 'hex' || toNorm === 'bytewords' || toNorm === 'decoded' || toNorm === 'ur')) {
            if (urInstance) {
                hex = urInstance.getPayloadHex();
            } else if (jsValue) {
                hex = UR.pipeline.encode(jsValue, { until: 'hex' });
            } else if (hex) {
                // already have
            } else {
                throw new Error('Unable to derive CBOR payload');
            }
        }

        // 3. Produce target output
        if (toNorm === 'decoded') {
            // Provide variant rendering
            const rendered = this.renderDecodedVariant(hex, toFormat);
            return { output: rendered };
        }
        if (toNorm === 'hex') {
            return { output: hex };
        }
        if (toNorm === 'bytewords') {
            // Use BytewordEncoding with selected style (minimal | standard | uri)
            const style = (['minimal','standard','uri'].includes(outputBytewordsStyle)) ? outputBytewordsStyle : 'minimal';
            const encoder = new BytewordEncoding(style);
            const bytewords = encoder.encode(hex);
            return { output: bytewords };
        }
        if (toNorm === 'ur') {
            // If original was UR (or multiur), reuse original (unless user supplied override - we ignore override for existing UR)
            if (urInstance) {
                return { output: urInstance.toString(), registryResolved: true };
            }
            // Attempt registry resolution from CBOR
            let decoded;
            try { decoded = UR.pipeline.decode(hex, { from: 'hex' }); } catch { decoded = null; }
            if (decoded && decoded.toUr) {
                const urString = decoded.toUr().toString();
                registryResolved = true;
                // Extract type from UR string prefix
                usedUrType = urString.slice(3, urString.indexOf('/', 3));
                autoDetectedUrType = true;
                return { output: urString, registryResolved, usedUrType, autoDetectedUrType };
            }
            // Need override or fallback
            usedUrType = (urTypeOverride && urTypeOverride.trim()) || 'unknown-tag';
            const encoder = new BytewordEncoding('minimal'); // UR spec uses minimal style
            const bytewords = encoder.encode(hex);
            const manualUr = `ur:${usedUrType}/${bytewords}`;
            return { output: manualUr, registryResolved: false, usedUrType };
        }
        throw new Error('Unsupported target format: ' + toFormat);
    }

    /**
     * Build Conversion Pipeline
     * 
     * Constructs the sequence of conversion steps needed to transform
     * from input format to output format.
     * 
     * Pipeline order: multiur → ur → bytewords → hex → decoded
     * 
     * @param {string} from - Source format
     * @param {string} to - Target format
     * @returns {object} - { steps: string[], direction: 'forward'|'reverse'|'none' }
     */
    /** Simplified pipeline visualization with directional arrows. */
    simplePipelineViz(fromFormat, toFormat, isError) {
        const norm = f => f.startsWith('decoded-') ? 'decoded' : f;
        const fromNorm = norm(fromFormat);
        const toNorm = norm(toFormat);
        this.resetPipeline();
        const stages = PIPELINE_STAGES;
        const fromIdx = stages.indexOf(fromNorm);
        const toIdx = stages.indexOf(toNorm);
        if (fromIdx === -1 || toIdx === -1) return;
        const [start, end] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
        for (let i = start; i <= end; i++) {
            const step = stages[i];
            this.updatePipelineStep(step, isError ? 'error' : 'success');
        }
        this.markPipelinePoint(fromNorm, 'start');
        this.markPipelinePoint(toNorm, 'end');
        
        // Update arrow direction based on conversion direction
        const arrows = this.pipelineElement.querySelectorAll('.pipeline-arrow');
        const isReversed = fromIdx > toIdx;
        arrows.forEach(arrow => {
            arrow.textContent = isReversed ? '←' : '→';
        });
    }

    /**
     * Execute Single Conversion Step
     * 
     * Performs one step in the conversion pipeline using UR.pipeline API.
     * Handles both forward and reverse conversions.
     * 
     * @param {string} input - Input data for this step
     * @param {string} step - Step name (e.g., 'hex', 'bytewords_reverse')
     * @param {string} outputFormat - Final output format (for decoded variants)
     * @returns {Promise<string>} - Converted output
     */
    // Removed executeStep (legacy multi-hop orchestration)

    assembleMultiUR(input) {
        const lines = input.trim().split('\n').map(l => l.trim()).filter(l => l);
        
        if (lines.length === 1) {
            const line = lines[0];
            if (/^ur:[\w-]+\/\d+of\d+\//.test(line)) {
                const decoder = new UrFountainDecoder();
                decoder.receivePartUr(line);
                if (decoder.isComplete()) {
                    return decoder.resultUr.toString();
                }
                throw new Error('Incomplete multi-part UR (only one part provided)');
            }
            return line;
        }
        
        const decoder = new UrFountainDecoder();
        
        for (const part of lines) {
            if (!part.startsWith('ur:')) {
                throw new Error('Invalid UR part: ' + part);
            }
            
            decoder.receivePartUr(part);
            
            if (decoder.isComplete()) {
                return decoder.resultUr.toString();
            }
        }
        
        if (!decoder.isComplete()) {
            const progress = decoder.getProgress();
            throw new Error('Incomplete multi-part UR. Progress: ' + (progress * 100).toFixed(1) + '%');
        }
        
        return decoder.resultUr.toString();
    }

    /**
     * Decode CBOR to Various Formats
     * 
     * Converts CBOR-encoded hex string to one of 4 output formats:
     * 1. decoded-json: Pretty-printed JSON (default)
     * 2. decoded-diagnostic: CBOR diagnostic notation (hex + structure)
     * 3. decoded-commented: Diagnostic with human-readable comments
     * 4. decoded-js: JavaScript object representation
     * 
     * Uses cbor2 library functions: diagnose(), comment()
     * 
     * @param {string} hexInput - Hex-encoded CBOR data
     * @param {string} format - Output format variant (default: 'decoded-json')
     * @returns {string} - Formatted CBOR output
     */
    decodeCBOR(hexInput, format = 'decoded-json') {
        try {
            // Convert hex string to Uint8Array for cbor2 functions
            // Example: "a101" → [0xa1, 0x01]
            const bytes = new Uint8Array(hexInput.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            
            // Handle different output formats
            if (format === 'decoded-diagnostic') {
                // CBOR diagnostic notation - shows hex bytes with structure
                // Example: "a1 01" (Map with 1 pair)
                return diagnose(bytes);
            } else if (format === 'decoded-commented') {
                // Commented diagnostic notation with descriptions
                // Example: "a1  -- Map (Length: 1 pair)"
                return comment(bytes);
            } else if (format === 'decoded-js') {
                // JavaScript representation
                // Example: "Map(1) { 1 => ... }"
                // TODO: use "node-inspect-extracted" package and then decode cbor via inspect(decode(buf, state.decodeOpts)
                return comment(bytes, { format: 'js' });
            } else {
                // Default: JSON format (decoded-json)
                // Uses UR.pipeline to decode and handle registry items
                const decoded = UR.pipeline.decode(hexInput, { from: 'hex' });
                
                // If it's a registry item (RegistryItem instance), extract data property
                if (decoded && typeof decoded === 'object' && decoded.data) {
                    return JSON.stringify(decoded.data, null, 2);
                }
                
                // Otherwise, stringify the decoded value directly
                return JSON.stringify(decoded, null, 2);
            }
        } catch (error) {
            throw new Error('CBOR decode failed: ' + error.message);
        }
    }

    /**
     * Encode JSON to CBOR Hex
     * 
     * Converts JSON string to CBOR-encoded hex string.
     * Reverse operation of decodeCBOR with decoded-json format.
     * 
     * Pipeline: JSON string → parse → JavaScript object → CBOR → Hex
     * 
     * @param {string} jsonInput - JSON string to encode
     * @returns {string} - Hex-encoded CBOR
     */
    encodeToCBOR(jsonInput) {
        try {
            // Parse JSON input to JavaScript object
            const data = JSON.parse(jsonInput);
            
            // Encode to CBOR then to hex using UR.pipeline
            // Pipeline: data → CBOR → hex string
            const hexOutput = UR.pipeline.encode(data, { until: 'hex' });
            
            return hexOutput;
        } catch (error) {
            throw new Error('JSON parse/CBOR encode failed: ' + error.message);
        }
    }

    /** Render decoded variant (delegates to existing decodeCBOR for consistency). */
    renderDecodedVariant(hex, variant) {
        return this.decodeCBOR(hex, variant);
    }

    /** Update UR Type input UI block. */
    updateUrTypeUI({ visible, value = '', auto = false, disabled = false }) {
        if (!this.urTypeContainer) return;
        if (!visible) {
            this.urTypeContainer.style.display = 'none';
            this.urTypeAutoBadge.style.display = 'none';
            this.urTypeInput.disabled = false;
            return;
        }
        this.urTypeContainer.style.display = 'block';
        if (value && this.urTypeInput.value !== value) {
            this.urTypeInput.value = value;
        }
        this.urTypeInput.disabled = disabled;
        this.urTypeAutoBadge.style.display = auto ? 'inline-block' : 'none';
        this.refreshUrTypeHint(auto);
    }

    /** Sanitize a UR type candidate: lowercase, remove invalid chars, collapse/truncate hyphens. */
    sanitizeUrType(value) {
        if (!value) return '';
        let v = value.toLowerCase();
        // Replace any whitespace with hyphen
        v = v.replace(/\s+/g, '-');
        // Allow only a-z, 0-9, hyphen
        v = v.replace(/[^a-z0-9-]+/g, '');
        // Collapse multiple hyphens
        v = v.replace(/-{2,}/g, '-');
        // Trim leading/trailing hyphens
        v = v.replace(/^-+/, '').replace(/-+$/, '');
        return v;
    }

    /** Return validity of UR type (empty ok). */
    isValidUrType(value) {
        if (!value) return true; // empty means fallback unknown-tag later
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
    }

    /** Update hint + border styling (without triggering conversion). */
    refreshUrTypeHint(auto = false) {
        if (!this.urTypeInput) return;
        const val = this.urTypeInput.value.trim();
        const valid = this.isValidUrType(val);
        if (auto) {
            this.urTypeHint.textContent = 'UR type auto-detected from CBOR tag';
            this.urTypeInput.style.borderColor = '#28a745';
            if (this.urTypeIndicator) { this.urTypeIndicator.style.display = 'none'; }
            return;
        }
        if (!val) {
            this.urTypeHint.textContent = 'Allowed: lowercase a-z, 0-9, single hyphens between segments. Empty = unknown-tag.';
            this.urTypeInput.style.borderColor = '#e1e4e8';
            if (this.urTypeIndicator) { this.urTypeIndicator.style.display = 'none'; }
            return;
        }
        if (valid) {
            this.urTypeHint.textContent = 'Allowed: lowercase a-z, 0-9, single hyphens between segments.';
            this.urTypeInput.style.borderColor = '#28a745';
            if (this.urTypeIndicator) { this.urTypeIndicator.textContent = '✓'; this.urTypeIndicator.style.color = '#28a745'; this.urTypeIndicator.style.display = 'block'; }
        } else {
            this.urTypeHint.textContent = 'Invalid pattern. Use lowercase alphanumerics separated by single hyphens';
            this.urTypeInput.style.borderColor = '#dc3545';
            if (this.urTypeIndicator) { this.urTypeIndicator.textContent = '✗'; this.urTypeIndicator.style.color = '#dc3545'; this.urTypeIndicator.style.display = 'block'; }
        }
    }

    /**
     * Update Pipeline Step Visual Status
     * 
     * Updates the CSS class of a pipeline step element to reflect its status.
     * Preserves 'start' and 'end' marker classes (for underline styling).
     * 
     * Status classes:
     * - 'success': Green background (step completed successfully)
     * - 'error': Red background (step failed)
     * - 'inactive': Gray background (step not executed)
     * 
     * @param {string} step - Step name (e.g., 'hex', 'bytewords')
     * @param {string} status - Status class ('success', 'error', 'inactive')
     */
    updatePipelineStep(step, status) {
        const element = this.pipelineElement.querySelector('[data-step="' + step + '"]');
        if (element) {
            // Preserve start/end markers before updating
            // These add underline styling to start and end points
            const hasStart = element.classList.contains('start');
            const hasEnd = element.classList.contains('end');
            
            // Update the class (this removes all previous classes)
            element.className = 'pipeline-step ' + status;
            
            // Re-add start/end markers if they were present
            if (hasStart) {
                element.classList.add('start');
            }
            if (hasEnd) {
                element.classList.add('end');
            }
        }
    }

    markPipelinePoint(format, type) {
        const element = this.pipelineElement.querySelector('[data-step="' + format + '"]');
        if (element) {
            element.classList.add(type);
        }
    }

    updatePipelineFromCache(states) {
        Object.entries(states).forEach(([step, status]) => {
            this.updatePipelineStep(step, status);
        });
    }

    /**
     * Reset Pipeline Visualization
     * 
     * Resets all pipeline steps to inactive state (gray).
     * Called before starting a new conversion.
     */
    resetPipeline() {
        const steps = this.pipelineElement.querySelectorAll('.pipeline-step');
        steps.forEach(step => {
            step.className = 'pipeline-step inactive';
        });
    }

    /**
     * Update Status Message
     * 
     * Displays a status message with icon in the status bar.
     * 
     * @param {string} message - Status message text
     * @param {string} type - Message type ('success', 'error', 'info')
     */
    updateStatus(message, type) {
        const iconMap = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };
        
        this.statusElement.innerHTML = '<span class="status-icon">' + (iconMap[type] || iconMap.info) + '</span><span>' + message + '</span>';
        this.statusElement.className = 'status ' + type;
    }

    /**
     * Clear Output and Reset State
     * 
     * Clears output textarea, resets pipeline, and shows ready message.
     */
    clearOutput() {
        this.outputElement.value = '';
        this.resetPipeline();
        this.updateStatus('ℹ️ Ready for input', 'success');
    }

    getFormatLabel(format) {
        const labels = {
            multiur: 'Multi-part UR',
            ur: 'Single UR',
            bytewords: 'Bytewords',
            hex: 'Hex (CBOR)',
            decoded: 'Decoded CBOR',
            'decoded-json': 'Decoded CBOR (JSON)',
            'decoded-diagnostic': 'Decoded CBOR (Diagnostic)',
            'decoded-commented': 'Decoded CBOR (Commented)',
            'decoded-js': 'Decoded CBOR (JavaScript)',
            ur_reverse: 'UR (reverse)',
            bytewords_reverse: 'Bytewords (reverse)',
            hex_reverse: 'Hex (reverse)',
            multiur_reverse: 'Multi-UR (reverse)'
        };
        return labels[format] || format;
    }
    
    /** Toggle bytewords style selector visibility based on format selection. */
    toggleBytewordsStyleSelector(side) {
        if (side === 'input') {
            const format = this.inputFormatElement.value;
            if (this.inputBytewordsStyle) {
                this.inputBytewordsStyle.style.display = (format === 'bytewords') ? 'inline-block' : 'none';
            }
        } else if (side === 'output') {
            const format = this.outputFormatElement.value;
            if (this.outputBytewordsStyle) {
                this.outputBytewordsStyle.style.display = (format === 'bytewords') ? 'inline-block' : 'none';
            }
        }
    }
}

// Initialize converter when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.converter = new FormatConverter();
    });
} else {
    window.converter = new FormatConverter();
}

// Export for testing
export { FormatConverter };
