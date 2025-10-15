/**
 * BC-UR Playground - Format Converter (Tab 1)
 *
 * Provides real-time conversion between multiple BC-UR encoding formats:
 * - Multi-part UR (fountain-encoded QR codes)
 * - Single UR strings
 * - Bytewords (human-readable encoding)
 * - Hex (CBOR binary as hexadecimal)
 * - Decoded CBOR (4 formats: JSON, Diagnostic, Commented, JavaScript)
 *
 * Refactored from demo.js into modular architecture for multi-tab BC-UR playground.
 */

// Import BC-UR library components from CDN
import {
    UR,                    // Core UR class for encoding/decoding
    UrFountainDecoder,     // Multi-part UR decoder
    UrFountainEncoder,     // Multi-part UR encoder
    BytewordEncoding,      // Bytewords encoder with style support
    cbor2,                 // CBOR diagnostics (comment/diagnose)
    isRegistryItem,        // Registry item type guard
    UrRegistry             // Registry singleton for looking up classes
} from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';

// Import UR Registry packages - these auto-register types on import
// Each package's addToRegistry.js/ts runs automatically via side effects
import * as blockchainCommons from 'https://esm.sh/@ngraveio/ur-blockchain-commons@2.0.1-beta.2';
import * as coinIdentity from 'https://esm.sh/@ngraveio/ur-coin-identity@2.0.1-beta.2';
import * as urSync from 'https://esm.sh/@ngraveio/ur-sync@2.0.1-beta.2';
import * as hexString from 'https://esm.sh/@ngraveio/ur-hex-string@2.0.1-beta.2';
import * as urSign from 'https://esm.sh/@ngraveio/ur-sign@2.0.1-beta.2';
import * as urUuid from 'https://esm.sh/@ngraveio/ur-uuid@2.0.1-beta.2';

// Import QR code generation library
import QRCode from 'https://esm.sh/qrcode@1.5.3';

// Import shared utilities
import { LRUCache, updateStatus, handleError, clearOutput as clearOutputUtil } from './shared.js';

// Import registry item UI mixin
import { RegistryItemUIMixin } from './registry-item-ui.js';

// Extract cbor2 functions for CBOR diagnostic output
const { comment, diagnose } = cbor2;

// Log registry package loading status
console.log('%c[Registry] Loading UR Registry Packages', 'font-weight: bold; color: #2196F3');
console.log('  ✓ blockchain-commons:', blockchainCommons ? 'loaded' : 'failed');
console.log('  ✓ coin-identity:', coinIdentity ? 'loaded' : 'failed');
console.log('  ✓ ur-sync:', urSync ? 'loaded' : 'failed');
console.log('  ✓ hex-string:', hexString ? 'loaded' : 'failed');
console.log('  ✓ ur-sign:', urSign ? 'loaded' : 'failed');
console.log('  ✓ ur-uuid:', urUuid ? 'loaded' : 'failed');

// Make registry packages available globally for debugging
window.registryPackages = {
    blockchainCommons,
    coinIdentity,
    urSync,
    hexString,
    urSign,
    urUuid
};

// Expose UrRegistry singleton globally for console use
window.UrRegistry = UrRegistry;

// Expose UR class globally for console use
window.UR = UR;

// Expose bc-ur library classes globally for console use (FR-047)
window.BytewordEncoding = BytewordEncoding;
window.UrFountainEncoder = UrFountainEncoder;
window.UrFountainDecoder = UrFountainDecoder;

// Expose ur-registry classes on console (FR-048)
// Extract all registry item classes from packages and expose them individually
const registryClasses = {};
for (const [packageName, packageExports] of Object.entries(window.registryPackages)) {
    for (const [exportName, exportValue] of Object.entries(packageExports)) {
        // Registry item classes are constructors (functions with prototype)
        if (typeof exportValue === 'function' && exportValue.prototype) {
            window[exportName] = exportValue;
            registryClasses[exportName] = packageName;
        }
    }
}

console.log('%c[Registry] Packages available in window.registryPackages', 'color: #4CAF50');
console.log('%c[Registry] UrRegistry available in window.UrRegistry', 'color: #4CAF50');
console.log('%c[Registry] UR class available in window.UR', 'color: #4CAF50');
console.log('%c[Console] bc-ur library classes exposed:', 'color: #FF9800; font-weight: bold');
console.log('  • window.UR - Core UR class');
console.log('  • window.BytewordEncoding - Bytewords encoder/decoder');
console.log('  • window.UrFountainEncoder - Multi-part UR encoder');
console.log('  • window.UrFountainDecoder - Multi-part UR decoder');
console.log('%c[Console] Registry item classes exposed:', 'color: #9C27B0; font-weight: bold');
for (const [className, packageName] of Object.entries(registryClasses)) {
    console.log(`  • window.${className} (from ${packageName})`);
}

// Canonical ordered stages for pipeline visualization
const PIPELINE_STAGES = ['multiur', 'ur', 'bytewords', 'hex', 'decoded'];

/**
 * FormatConverter Class
 *
 * Manages the BC-UR format conversion interface for Tab 1, including:
 * - Format auto-detection
 * - Live conversion with debouncing
 * - Pipeline visualization
 * - Conversion caching for performance
 * - Multi-part UR assembly
 * - Console debug interface (window.$lastDecoded, window.$cbor.*)
 * - Cross-tab forwarding to Multi-UR Generator
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

        // Cache for conversions using LRUCache from shared.js
        this.conversionCache = new LRUCache(120);

        // UR Type UI elements
        this.urTypeContainer = document.getElementById('urTypeContainer');
        this.urTypeInput = document.getElementById('urTypeInput');
        this.urTypeHint = document.getElementById('urTypeHint');
        this.urTypeAutoBadge = document.getElementById('urTypeAutoBadge');
        this.urTypeIndicator = document.getElementById('urTypeIndicator');

        // Bytewords style selectors
        this.inputBytewordsStyle = document.getElementById('inputBytewordsStyle');
        this.outputBytewordsStyle = document.getElementById('outputBytewordsStyle');

        // Send to Multi-UR Generator button
        this.sendToMultiURBtn = document.getElementById('sendToMultiUR');

        // Initialize console debug interface
        this.initializeConsoleDebug();

        // Initialize registry item UI
        this.initializeRegistryItemUI();

        this.setupEventListeners();
        this.initializeExamples();

        // Check for forwarded data from other tabs (e.g., scanner)
        this.checkForwardedData();
    }
    
    /**
     * Check for Forwarded Data from Other Tabs
     * 
     * Checks sessionStorage for data forwarded from scanner or other tabs.
     * Injects the data into input and triggers conversion.
     */
    checkForwardedData() {
        try {
            // Check for scanner forwarded data
            const scannerData = sessionStorage.getItem('forward-scanner');
            if (scannerData) {
                const data = JSON.parse(scannerData);
                console.log('[Converter] Received forwarded data from scanner:', data);
                
                // Set input value
                this.inputElement.value = data.ur;
                
                // Set input format to UR
                this.inputFormatElement.value = 'ur';
                
                // Set output format to decoded-js (Decoded CBOR JavaScript)
                this.outputFormatElement.value = 'decoded-js';
                
                // Clear the forwarded data (consume it)
                sessionStorage.removeItem('forward-scanner');
                
                // Trigger conversion
                this.handleConversion();
            }
        } catch (error) {
            console.error('[Converter] Failed to process forwarded data:', error);
        }
    }

    /**
     * Initialize Console Debug Interface
     *
     * Sets up window.$lastDecoded, window.$decodedHistory, and window.$cbor namespace
     * for interactive CBOR inspection in browser console.
     */
    initializeConsoleDebug() {
        // Initialize decoded value history (max 10 entries, LRU)
        window.$decodedHistory = [];
        window.$lastDecoded = null;

        // Initialize $cbor namespace with helper methods
        window.$cbor = {
            /**
             * Pretty-print decoded value with CBOR tags highlighted
             * @param {*} value - Decoded JavaScript value
             * @returns {string} Formatted output
             */
            inspect: (value) => {
                if (!value) {
                    console.log('No value to inspect. Use window.$lastDecoded or window.$decodedHistory[index]');
                    return null;
                }

                console.log('%c=== CBOR Structure Inspection ===', 'color: #0066cc; font-weight: bold');

                if (value.cbor) {
                    console.log('%cCBOR Tags:', 'font-weight: bold', value.cbor.tags || []);
                    console.log('%cCBOR Major Types:', 'font-weight: bold', value.cbor.majorTypes || []);
                    console.log('%cCBOR Hex:', 'font-weight: bold', value.cbor.hex || 'N/A');
                    console.log('%cCBOR Diagnostic:', 'font-weight: bold');
                    console.log(value.cbor.diagnostic || 'N/A');
                }

                if (value.ur) {
                    console.log('%cUR Type:', 'font-weight: bold', value.ur.type);
                    console.log('%cUR String:', 'font-weight: bold', value.ur.urString);
                    console.log('%cRegistered:', 'font-weight: bold', value.ur.isRegistered ? '✓ Yes' : '✗ No');
                    if (value.ur.registryPackage) {
                        console.log('%cRegistry Package:', 'font-weight: bold', value.ur.registryPackage);
                    }
                }

                if (value.registry) {
                    console.log('%cRegistry Info:', 'font-weight: bold');
                    console.log('  Tag:', value.registry.tag);
                    console.log('  CDDL Schema:', value.registry.cddl ? 'Available' : 'N/A');
                    console.log('  Documentation:', value.registry.docLink || 'N/A');
                }

                console.log('%cStructure:', 'font-weight: bold');
                console.log('  Depth:', value.structure?.depth || 0);
                console.log('  Keys:', value.structure?.keys || []);
                console.log('  Types:', value.structure?.types || {});

                console.log('%cDecoded Value:', 'font-weight: bold');
                console.log(value.value);

                return value;
            },

            /**
             * Compare two decoded values from history
             * @param {number} index1 - First history index (default: 0 = most recent)
             * @param {number} index2 - Second history index (default: 1)
             */
            diff: (index1 = 0, index2 = 1) => {
                const val1 = window.$decodedHistory[index1];
                const val2 = window.$decodedHistory[index2];

                if (!val1 || !val2) {
                    console.error('Invalid history indices. Available:', window.$decodedHistory.length);
                    return;
                }

                console.log('%c=== Decoded Values Comparison ===', 'color: #0066cc; font-weight: bold');
                console.log(`%cValue ${index1}:`, 'font-weight: bold', val1.metadata);
                console.log(val1.value);
                console.log(`%cValue ${index2}:`, 'font-weight: bold', val2.metadata);
                console.log(val2.value);

                // Simple structure comparison
                const keys1 = val1.structure?.keys || [];
                const keys2 = val2.structure?.keys || [];
                const allKeys = [...new Set([...keys1, ...keys2])];

                console.log('%cStructure Differences:', 'font-weight: bold');
                allKeys.forEach(key => {
                    const in1 = keys1.includes(key);
                    const in2 = keys2.includes(key);
                    if (in1 && !in2) {
                        console.log(`  %c${key}: only in value ${index1}`, 'color: red');
                    } else if (!in1 && in2) {
                        console.log(`  %c${key}: only in value ${index2}`, 'color: red');
                    } else {
                        console.log(`  ${key}: in both`);
                    }
                });
            },

            /**
             * Export decoded value in specified format
             * @param {string} format - 'json' | 'diagnostic' | 'hex'
             * @param {number} index - History index (default: 0 = most recent)
             * @returns {string} Exported data
             */
            export: (format = 'json', index = 0) => {
                const val = window.$decodedHistory[index] || window.$lastDecoded;
                if (!val) {
                    console.error('No decoded value available');
                    return null;
                }

                switch (format) {
                    case 'json':
                        return JSON.stringify(val.value, null, 2);
                    case 'diagnostic':
                        return val.cbor?.diagnostic || 'N/A';
                    case 'hex':
                        return val.cbor?.hex || 'N/A';
                    default:
                        console.error('Unknown format. Use: json, diagnostic, or hex');
                        return null;
                }
            },

            /**
             * Find registry type information by UR type name
             * @param {string} urType - UR type (e.g., 'crypto-seed')
             * @returns {object|null} Registry type info
             */
            findType: (_urType) => {
                // TODO: Integrate with registry loader when US4 is implemented
                console.warn('Registry lookup not yet implemented. Will be available after US4 (Registry Browser)');
                return null;
            },

            /**
             * List all CBOR tags in current decoded value
             * @param {number} index - History index (default: 0 = most recent)
             * @returns {Array<number>} CBOR tag numbers
             */
            listTags: (index = 0) => {
                const val = window.$decodedHistory[index] || window.$lastDecoded;
                if (!val) {
                    console.error('No decoded value available');
                    return [];
                }
                return val.cbor?.tags || [];
            },

            /**
             * Clear decoded history
             */
            clear: () => {
                window.$decodedHistory = [];
                window.$lastDecoded = null;
                console.log('Decoded history cleared');
            }
        };
    }

    /**
     * Auto-expose decoded value to console
     *
     * Called whenever a value is decoded to "Decoded CBOR (JavaScript)" format.
     * Updates window.$lastDecoded and adds to window.$decodedHistory.
     *
     * @param {*} decodedValue - The decoded JavaScript value
     * @param {string} sourceFormat - Original input format
     * @param {string} urType - UR type (if available)
     * @param {string} hex - CBOR hex representation
     */
    exposeToConsole(decodedValue, sourceFormat, urType, hex) {
        // Check if it's a registry item using library function
        const itemIsRegistryItem = isRegistryItem(decodedValue);
        const registryItemType = itemIsRegistryItem ? decodedValue.constructor.name : null;
        
        // Analyze structure
        const structure = this.analyzeStructure(decodedValue);

        // Extract CBOR tags (from diagnostic notation)
        let tags = [];
        let diagnostic = '';
        try {
            const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            diagnostic = diagnose(bytes);
            // Simple tag extraction from diagnostic notation (looks for tag numbers)
            const tagMatches = diagnostic.match(/\b(\d+)\(/g);
            if (tagMatches) {
                tags = tagMatches.map(m => parseInt(m));
            }
        } catch (e) {
            console.warn('Failed to extract CBOR tags:', e);
        }

        // Determine if UR type is registered
        const isRegistered = itemIsRegistryItem || false; // Registry item means it's registered
        const registryPackage = null; // TODO: Determine package from type

        // Create exposed object
        const exposed = {
            value: decodedValue,
            isRegistryItem: itemIsRegistryItem,
            registryItemType: registryItemType,
            cbor: {
                hex: hex,
                diagnostic: diagnostic,
                tags: tags,
                majorTypes: this.detectMajorTypes(decodedValue)
            },
            ur: urType ? {
                type: urType,
                urString: `ur:${urType}/...`, // Simplified
                isRegistered: isRegistered,
                registryPackage: registryPackage
            } : null,
            registry: null, // TODO: Populate when US4 is implemented
            structure: structure,
            metadata: {
                decodedAt: Date.now(),
                source: 'converter',
                inputFormat: sourceFormat
            }
        };

        // Update global references
        window.$lastDecoded = exposed;

        // Also expose the raw registry item for easy access
        if (itemIsRegistryItem) {
            window.$lastRegistryItem = decodedValue;

            // Show registry item UI
            this.showRegistryItemUI(decodedValue);

            // Dispatch event for registry browser to highlight matching type
            const urType = exposed.ur?.type;
            if (urType) {
                window.dispatchEvent(new CustomEvent('bcur:typeDecoded', {
                    detail: {
                        urType: urType,
                        tag: decodedValue.getRegistryType?.()?.getTag?.() || 'unknown',
                        isRegistered: true
                    }
                }));
            }
        } else {
            // Hide registry item UI for non-registry items
            this.hideRegistryItemUI();

            // Check if we have a UR type for non-registry items (unregistered types)
            const urType = exposed.ur?.type;
            if (urType && urType !== 'unknown') {
                // Get tag from CBOR data if possible
                const tag = decodedValue?.getTag?.() || 'unknown';
                
                window.dispatchEvent(new CustomEvent('bcur:typeDecoded', {
                    detail: {
                        urType: urType,
                        tag: tag,
                        isRegistered: false
                    }
                }));
            }
        }

        // Add to history (LRU, max 10)
        window.$decodedHistory.unshift(exposed);
        if (window.$decodedHistory.length > 10) {
            window.$decodedHistory.pop();
        }

        // Log to console
        this.logToConsole(exposed);
    }

    /**
     * Analyze JavaScript value structure
     * @param {*} value - Value to analyze
     * @returns {object} Structure metadata
     */
    analyzeStructure(value) {
        const keys = [];
        const types = {};
        let depth = 0;

        const traverse = (obj, currentDepth = 0) => {
            if (currentDepth > depth) {
                depth = currentDepth;
            }

            if (obj && typeof obj === 'object') {
                Object.keys(obj).forEach(key => {
                    keys.push(key);
                    types[key] = typeof obj[key];
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        traverse(obj[key], currentDepth + 1);
                    }
                });
            }
        };

        traverse(value);

        return {
            depth: depth,
            keys: [...new Set(keys)], // Remove duplicates
            types: types
        };
    }

    /**
     * Detect CBOR major types in JavaScript value
     * @param {*} value - Decoded value
     * @returns {Array<string>} Major type names
     */
    detectMajorTypes(value) {
        const types = new Set();

        const traverse = (obj) => {
            if (Array.isArray(obj)) {
                types.add('array');
                obj.forEach(item => traverse(item));
            } else if (obj instanceof Uint8Array) {
                types.add('bytes');
            } else if (obj && typeof obj === 'object') {
                types.add('map');
                Object.values(obj).forEach(val => traverse(val));
            } else if (typeof obj === 'number') {
                types.add('uint');
            } else if (typeof obj === 'string') {
                types.add('text');
            }
        };

        traverse(value);
        return Array.from(types);
    }

    /**
     * Log decoded value to console with formatted output
     * @param {object} exposed - Exposed value object
     */
    logToConsole(exposed) {
        const isRegistered = exposed.ur?.isRegistered;
        const urType = exposed.ur?.type || 'unknown';
        const isRegistryItem = exposed.isRegistryItem;

        // Enhanced header for registry items
        if (isRegistryItem) {
            console.log(
                `%c🎯 Registry Item (ur:${urType})`,
                'color: #00cc66; font-weight: bold; font-size: 14px; background: #f0fff0; padding: 2px 6px'
            );
        } else {
            console.log(
                `%cℹ️ Decoded CBOR (ur:${urType})`,
                'color: #0066cc; font-weight: bold; font-size: 14px'
            );
        }

        console.log('┌─────────────────────────────────────────────────────────────');

        if (isRegistryItem) {
            console.log(`│ 🏷️  UR Type: ur:${urType} (Registry Item)`);
        }

        if (exposed.ur) {
            console.log(`│ UR Type: ${urType} ${isRegistered ? '(registered ✓)' : '(not registered ⚠️)'}`);
        }

        console.log(`│ CBOR Tags: [${exposed.cbor.tags.join(', ')}]`);

        if (exposed.ur?.registryPackage) {
            console.log(`│ Package: ${exposed.ur.registryPackage}`);
        } else {
            console.log(`│ Major Types: ${exposed.cbor.majorTypes.join(', ')}`);
        }

        console.log(`│ Structure: depth=${exposed.structure.depth}, keys=${exposed.structure.keys.length}`);
        console.log('│');
        console.log('│ 📋 Access via: window.$lastDecoded');

        if (isRegistryItem) {
            console.log('│ 🎯 Registry Item: window.$lastRegistryItem');
            console.log(`│    ↳ Query: window.UrRegistry.registry.get("${urType}")`);
            console.log('│    ↳ Type info: window.$lastRegistryItem.type');
            console.log('│    ↳ Try: window.$lastRegistryItem.toUR()');
        }

        if (exposed.registry?.cddl) {
            console.log('│ 📖 CDDL: window.$lastDecoded.registry.cddl');
        }

        console.log('│ 🔍 Inspect: window.$cbor.inspect(window.$lastDecoded.value)');
        console.log('└─────────────────────────────────────────────────────────────');

        if (isRegistryItem) {
            console.log(`%cur:${urType} Instance:`, 'font-weight: bold; color: #00cc66');
        }
        console.log('Value:', exposed.value);
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

        // Send to Multi-UR Generator button
        if (this.sendToMultiURBtn) {
            this.sendToMultiURBtn.addEventListener('click', () => this.sendToMultiURGenerator());
        }

        // Example buttons - load pre-configured examples
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const example = e.target.getAttribute('data-example');
                this.loadExample(example);
            });
        });
    }

    /**
     * Send to Multi-UR Generator
     *
     * Forwards current single UR output to Multi-UR Generator tab (Tab 2)
     * via sessionStorage and navigates to #multi-ur
     */
    sendToMultiURGenerator() {
        const outputFormat = this.outputFormatElement.value;
        const output = this.outputElement.value;

        if (!output) {
            updateStatus(this.statusElement, 'No output to send', 'error');
            return;
        }

        // Only allow forwarding UR strings (not multi-part, hex, bytewords, or decoded)
        if (outputFormat !== 'ur') {
            updateStatus(this.statusElement, 'Please convert to UR format first before sending to Multi-UR Generator', 'error');
            return;
        }

        // Validate UR format
        if (!output.trim().startsWith('ur:')) {
            updateStatus(this.statusElement, 'Output is not a valid UR string', 'error');
            return;
        }

        try {
            // Create forwarding payload
            const payload = {
                sourceTab: 'converter',
                targetTab: 'multi-ur',
                dataType: 'ur',
                payload: {
                    urString: output.trim()
                },
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000 // 5 minutes
            };

            // Store in sessionStorage
            sessionStorage.setItem('forward-multi-ur', JSON.stringify(payload));

            // Navigate to Multi-UR Generator tab
            window.location.hash = '#multi-ur';

            updateStatus(this.statusElement, 'Forwarding to Multi-UR Generator...', 'success');
        } catch (err) {
            handleError(this.statusElement, err, 'Failed to forward to Multi-UR Generator');
        }
    }

    initializeExamples() {
        // Add example data for testing
        this.examples = {
            hex: 'a2626964187b646e616d65684a6f686e20446f65',
            ur: 'ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl',
            bytewords: 'oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl',
            multiur: 'ur:crypto-psbt/1of2/lpadaxcfaxcywenbpljkhdcahkadaemeaortcxhhdmntdmaybbnyrdiyfnztdwvlhgfywtynlgolprfoycxvamdmdfhynfmpmolbbkwngyfx\nur:crypto-psbt/2of2/lpaoaxcfaxcywenbpljkhdcahkadaemeaortcxzmwkfglrsswnckurpabzpttohhlspfztdamhyrfzksnfdmutlzmhkkgmhkbdnyidfegy',
            'detailed-account': 'ur:detailed-account/oyadtantjlotadwkaxhdclaowdverokopdinhseeroisyalksaykctjshedprnuyjyfgrovawewftyghceglrpkgamtantjooyadlocsdwykcfadykykaeykaeykionnimfd',
            'portfolio': 'ur:portfolio/oeadlrtaoyrkoeadtaoyrhoeadayaocsfnaolytaoyrdoeadtantjlonadwkaxhdclaxdaaxtsuooxzmahmwwtfzgthfcslpfwoylgmnatlrfyeheestcmchluselynsfstyaahdcxtdqdinaeesjzmolfzsbbidlpiyhddlcximhltirfsptlvsmohscsamsgzoaxadwtamtantjooyadlncsdwykcsfnykaeykattantjooyadlraewklawkaolytaadatghnbroinmeswclluensettntgedmnnpftoenamwmfdtaoyrkoeadtaoyrhoeadayaocfadykaolytaoyrdoeadtantjlotadwkaxhdclaowdverokopdinhseeroisyalksaykctjshedprnuyjyfgrovawewftyghceglrpkgamtantjooyadlncsdwykcfadykykaeykaolyksdwfegdimfghgieieecfpkpiyjsgugujsihgteyjsglehksknkkidhsjofxetfleektfeflfljehtktkkghfyjyehkotaoyrkoeadtaoyrhotadayaocsfnaxlycsldaolytaoyrdoeadtantjlonadwkaxhdclaxdaaxtsuooxzmahmwwtfzgthfcslpfwoylgmnatlrfyeheestcmchluselynsfstyaahdcxtdqdinaeesjzmolfzsbbidlpiyhddlcximhltirfsptlvsmohscsamsgzoaxadwtamtantjooyadlncsdwykcsfnykaeykattantjooyadlraewkadwkaolytaadatghdimerfoywzuefghswelootbnnlosptfynypdfpjytaoyrkoeadtaoyrhoeadayaoaeaolytaoyrdoyadtantjyoeadioktjeisdefzdydtaolytantjlonadwkaxhdclaxwmfmdeiamecsdsemgtvsjzcncygrkowtrontzschgezokstswkkscfmklrtauteyaahdcxiehfonurdppfyntapejpproypegrdawkgmaewejlsfdtsrfybdehcaflmtrlbdhpamtantjooyadlncsdwykaeykaeykattantjooyadlraewkaewkaotaoyrfoxadgdbgeehfksbgeehfksaotaaagwotadcyjsaoidihjtaximehdmeydmehdpehdmjpiaaajeglflgmfphffecxhtfegmgwnyfplngl',
        };
    }

    loadExample(type) {
        const example = this.examples[type];
        if (example) {
            this.inputElement.value = example;
            // Set format based on example type
            if (type === 'multiur') {
                this.inputFormatElement.value = 'multiur';
            } else if (type === 'ur' || type === 'detailed-account' || type === 'portfolio') {
                this.inputFormatElement.value = 'ur';
            } else {
                this.inputFormatElement.value = 'auto';
            }
            this.handleConversion();
        }
    }

    copyToClipboard() {
        const text = this.outputElement.value;
        if (!text) {
            updateStatus(this.statusElement, 'No output to copy', 'error');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            handleError(this.statusElement, err, 'Failed to copy');
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
        if (trimmed.includes('\n') && trimmed.includes('ur:')) {
            const lines = trimmed.split('\n').filter(l => l.trim());
            if (lines.length > 1 && lines.every(l => l.includes('ur:'))) {
                return 'multiur';
            }
        }

        // Single line multi-part UR with part indicator
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
        const words = trimmed.toLowerCase().split(/\s+/);
        const bytewordsPattern = /^[a-z]{4}$/;
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
            clearOutputUtil(this.outputElement, this.statusElement, () => this.resetPipeline());
            this.updateUrTypeUI({ visible: false });
            this.hideRegistryItemUI();
            return;
        }

        const detected = this.inputFormatElement.value === 'auto' ? this.detectFormat(rawInput) : this.inputFormatElement.value;
        if (!detected) {
            this.outputElement.value = '';
            updateStatus(this.statusElement, 'Unable to detect input format. Please pick one.', 'error');
            this.updateUrTypeUI({ visible: false });
            return;
        }
        if (this.inputFormatElement.value === 'auto') {
            updateStatus(this.statusElement, 'Detected format: ' + this.getFormatLabel(detected), 'info');
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
            
            // Expose to console if decoded-js format and we have cached decoded value
            if (outputFormat === 'decoded-js' && cached.decodedValue && cached.hex) {
                this.exposeToConsole(cached.decodedValue, detected, cached.usedUrType, cached.hex);
            }
            
            updateStatus(this.statusElement, 'Conversion successful (cached)', 'success');
            return;
        }

        try {
            const { output, usedUrType, autoDetectedUrType, registryResolved, hex, decodedValue } = await this.performConversion({
                rawInput,
                fromFormat: detected,
                toFormat: outputFormat,
                urTypeOverride: this.urTypeInput?.value.trim() || '',
                inputBytewordsStyle: inputBwStyle,
                outputBytewordsStyle: outputBwStyle
            });

            // Auto-expose to console if output format is decoded-javascript
            if (outputFormat === 'decoded-js' && decodedValue && hex) {
                this.exposeToConsole(decodedValue, detected, usedUrType, hex);
            }

            // Cache and UI updates
            const urTypeUI = (outputFormat === 'ur') ? {
                visible: !registryResolved,
                value: usedUrType || '',
                auto: autoDetectedUrType,
                disabled: !!registryResolved
            } : { visible: false };

            this.conversionCache.set(cacheKey, { 
                output, 
                pipelineStatus: 'success', 
                urTypeUI,
                decodedValue,
                hex,
                usedUrType
            });

            this.outputElement.value = output;
            this.simplePipelineViz(detected, outputFormat, false);
            this.updateUrTypeUI(urTypeUI);
            updateStatus(this.statusElement, 'Conversion successful', 'success');
        } catch (err) {
            this.outputElement.value = '';
            this.simplePipelineViz(detected, outputFormat, true);
            updateStatus(this.statusElement, 'Error: ' + err.message, 'error');
            this.updateUrTypeUI({ visible: false });
            console.error(err);
        }
    }

    /**
     * Core conversion orchestrator
     *
     * Handles bidirectional conversion between all supported formats:
     * - Normalizes decoded-* formats to 'decoded'
     * - Parses input to canonical representation (UR, hex, or JS value)
     * - Derives intermediate representations as needed
     * - Renders output in target format
     * - Handles UR type resolution (auto-detect or manual override)
     *
     * @returns {object} { output, usedUrType, autoDetectedUrType, registryResolved, hex, decodedValue }
     */
    async performConversion({ rawInput, fromFormat, toFormat, urTypeOverride, inputBytewordsStyle = 'minimal', outputBytewordsStyle = 'minimal' }) {
        const norm = f => f.startsWith('decoded-') ? 'decoded' : f;
        const fromNorm = norm(fromFormat);
        const toNorm = norm(toFormat);

        // Guard: decoded diagnostic/commented/js cannot be a source for re-encoding
        if (fromFormat !== 'decoded-json' && fromNorm === 'decoded' && toNorm !== 'decoded') {
            throw new Error('Decoded (non-JSON view) cannot be source for re-encoding. Switch input format to Decoded JSON.');
        }

        let urInstance = null;
        let hex = null;
        let jsValue = null;
        let registryResolved = false;
        let usedUrType = null;
        let autoDetectedUrType = false;
        let decodedValue = null;

        // 1. Parse input according to fromNorm
        switch (fromNorm) {
            case 'multiur': {
                const assembled = this.assembleMultiUR(rawInput);
                urInstance = UR.fromString(assembled);
                break;
            }
            case 'ur': {
                urInstance = UR.fromString(rawInput.trim());
                break;
            }
            case 'bytewords': {
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
                try { jsValue = JSON.parse(rawInput); } catch (e) { throw new Error('Invalid JSON: ' + e.message); }
                break;
            }
            default:
                throw new Error('Unsupported source format: ' + fromFormat);
        }

        // 2. Derive hex if needed for target
        if (!hex && (toNorm === 'hex' || toNorm === 'bytewords' || toNorm === 'decoded' || toNorm === 'ur')) {
            if (urInstance) {
                hex = urInstance.getPayloadHex();
                usedUrType = urInstance.type;
            } else if (jsValue) {
                hex = UR.pipeline.encode(jsValue, { until: 'hex' });
            } else if (!hex) {
                throw new Error('Unable to derive CBOR payload');
            }
        }

        // 3. Produce target output
        if (toNorm === 'decoded') {
            // Special handling for decoded-js: try to get registry item from UR instance first
            if (toFormat === 'decoded-js' && urInstance) {
                try {
                    // Try to manually instantiate the registry item using the UR type
                    const urType = urInstance.type;
                    const RegistryClass = UrRegistry.queryByURType(urType);

                    if (RegistryClass) {
                        // Use fromHex to properly instantiate the class
                        const registryItem = RegistryClass.fromHex(hex);

                        // Verify it's a registry item
                        if (isRegistryItem(registryItem)) {
                            // It's a typed registry item! Pretty print it
                            const rendered = this.prettyPrintJS(registryItem, 0);
                            // Return with usedUrType so console exposure works correctly
                            return { output: rendered, hex, decodedValue: registryItem, isRegistryItem: true, usedUrType: urType };
                        }
                    }
                } catch (e) {
                    console.warn('Failed to decode to registry item, falling back to CBOR decode:', e);
                }
            }

            // Fall back to standard CBOR decode from hex
            const rendered = this.renderDecodedVariant(hex, toFormat);

            // Store decoded value if format is decoded-js
            if (toFormat === 'decoded-js') {
                try {
                    decodedValue = UR.pipeline.decode(hex, { from: 'hex' });
                } catch (e) {
                    console.warn('Failed to decode for console exposure:', e);
                }
            }

            return { output: rendered, hex, decodedValue, usedUrType };
        }
        if (toNorm === 'hex') {
            return { output: hex };
        }
        if (toNorm === 'bytewords') {
            const style = (['minimal','standard','uri'].includes(outputBytewordsStyle)) ? outputBytewordsStyle : 'minimal';
            const encoder = new BytewordEncoding(style);
            const bytewords = encoder.encode(hex);
            return { output: bytewords };
        }
        if (toNorm === 'ur') {
            // Reuse existing UR instance if available
            if (urInstance) {
                return { output: urInstance.toString(), registryResolved: true, usedUrType: urInstance.type };
            }
            // Attempt registry resolution from CBOR
            let decoded;
            try { decoded = UR.pipeline.decode(hex, { from: 'hex' }); } catch { decoded = null; }
            if (decoded && decoded.toUr) {
                const urString = decoded.toUr().toString();
                registryResolved = true;
                usedUrType = urString.slice(3, urString.indexOf('/', 3));
                autoDetectedUrType = true;
                return { output: urString, registryResolved, usedUrType, autoDetectedUrType };
            }
            // Need override or fallback
            usedUrType = (urTypeOverride && urTypeOverride.trim()) || 'unknown-tag';
            const encoder = new BytewordEncoding('minimal');
            const bytewords = encoder.encode(hex);
            const manualUr = `ur:${usedUrType}/${bytewords}`;
            return { output: manualUr, registryResolved: false, usedUrType };
        }
        throw new Error('Unsupported target format: ' + toFormat);
    }

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
     * Pretty-print JavaScript value with CBOR-specific formatting
     * 
     * Formats decoded CBOR values for human readability:
     * - Maps shown with clear key-value pairs
     * - Uint8Array/bytes shown as hex strings
     * - Tagged values shown with tag number
     * - Nested structures properly indented
     * 
     * @param {*} value - Decoded JavaScript value
     * @param {number} indent - Current indentation level
     * @returns {string} Pretty-printed representation
     */
    prettyPrintJS(value, indent = 0) {
        const INDENT = '  ';
        const currentIndent = INDENT.repeat(indent);
        const nextIndent = INDENT.repeat(indent + 1);

        // Handle null/undefined
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';

        // Handle primitives
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return String(value);

        // Handle Uint8Array (bytes) - convert to hex string
        if (value instanceof Uint8Array) {
            const hex = Array.from(value)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return `Bytes(0x${hex})`;
        }

        // Handle ArrayBuffer
        if (value instanceof ArrayBuffer) {
            const bytes = new Uint8Array(value);
            const hex = Array.from(bytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return `Bytes(0x${hex})`;
        }

        // Handle Map
        if (value instanceof Map) {
            if (value.size === 0) return 'Map {}';
            
            const entries = Array.from(value.entries()).map(([key, val]) => {
                const keyStr = this.prettyPrintJS(key, indent + 1);
                const valStr = this.prettyPrintJS(val, indent + 1);
                return `${nextIndent}${keyStr} => ${valStr}`;
            });
            
            return `Map {\n${entries.join(',\n')}\n${currentIndent}}`;
        }

        // Handle Set
        if (value instanceof Set) {
            if (value.size === 0) return 'Set {}';
            
            const items = Array.from(value).map(item => {
                return `${nextIndent}${this.prettyPrintJS(item, indent + 1)}`;
            });
            
            return `Set {\n${items.join(',\n')}\n${currentIndent}}`;
        }

        // Handle Array
        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            
            const items = value.map(item => {
                return `${nextIndent}${this.prettyPrintJS(item, indent + 1)}`;
            });
            
            return `[\n${items.join(',\n')}\n${currentIndent}]`;
        }

        // Handle CBOR Tagged values (objects with 'tag' and 'contents' properties)
        if (value && typeof value === 'object' && 'tag' in value && 'contents' in value) {
            const tagStr = `Tag(${value.tag})`;
            const contentsStr = this.prettyPrintJS(value.contents, indent + 1);
            
            // Single-line for simple contents
            if (value.contents === null || value.contents === undefined || 
                typeof value.contents === 'string' || typeof value.contents === 'number' ||
                typeof value.contents === 'boolean') {
                return `${tagStr} ${contentsStr}`;
            }
            
            return `${tagStr} ${contentsStr}`;
        }

        // Handle plain objects
        if (typeof value === 'object') {
            const constructorName = value.constructor.name;
            const keys = Object.keys(value);
            
            // Registry item or custom class - show constructor name
            const prefix = (constructorName && constructorName !== 'Object') ? `${constructorName} ` : '';
            
            if (keys.length === 0) return `${prefix}{}`;
            
            const pairs = keys.map(key => {
                const val = value[key];
                const valStr = this.prettyPrintJS(val, indent + 1);
                return `${nextIndent}${JSON.stringify(key)}: ${valStr}`;
            });
            
            return `${prefix}{\n${pairs.join(',\n')}\n${currentIndent}}`;
        }

        // Fallback
        return String(value);
    }

    /**
     * Decode CBOR to Various Formats
     *
     * Converts CBOR-encoded hex string to one of 4 output formats:
     * 1. decoded-json: Pretty-printed JSON (default)
     * 2. decoded-diagnostic: CBOR diagnostic notation
     * 3. decoded-commented: Diagnostic with comments
     * 4. decoded-js: JavaScript object representation (custom pretty-print)
     */
    decodeCBOR(hexInput, format = 'decoded-json') {
        try {
            const bytes = new Uint8Array(hexInput.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

            if (format === 'decoded-diagnostic') {
                return diagnose(bytes);
            } else if (format === 'decoded-commented') {
                return comment(bytes);
            } else if (format === 'decoded-js') {
                // Use custom pretty-printer for JavaScript representation
                const decoded = UR.pipeline.decode(hexInput, { from: 'hex' });
                return this.prettyPrintJS(decoded, 0);
            } else {
                // Default: JSON format (decoded-json)
                const decoded = UR.pipeline.decode(hexInput, { from: 'hex' });

                // If it's a registry item, extract data property
                if (decoded && typeof decoded === 'object' && decoded.data) {
                    return JSON.stringify(decoded.data, null, 2);
                }

                return JSON.stringify(decoded, null, 2);
            }
        } catch (error) {
            throw new Error('CBOR decode failed: ' + error.message);
        }
    }

    /** Render decoded variant */
    renderDecodedVariant(hex, variant) {
        return this.decodeCBOR(hex, variant);
    }

    /** Update UR Type input UI block */
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

    /** Sanitize UR type: lowercase, remove invalid chars, collapse hyphens */
    sanitizeUrType(value) {
        if (!value) return '';
        let v = value.toLowerCase();
        v = v.replace(/\s+/g, '-');
        v = v.replace(/[^a-z0-9-]+/g, '');
        v = v.replace(/-{2,}/g, '-');
        v = v.replace(/^-+/, '').replace(/-+$/, '');
        return v;
    }

    /** Check if UR type is valid */
    isValidUrType(value) {
        if (!value) return true;
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
    }

    /** Update hint + border styling */
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

    /** Simplified pipeline visualization with directional arrows */
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

        const arrows = this.pipelineElement.querySelectorAll('.pipeline-arrow');
        const isReversed = fromIdx > toIdx;
        arrows.forEach(arrow => {
            arrow.textContent = isReversed ? '←' : '→';
        });
    }

    /** Update pipeline step status */
    updatePipelineStep(step, status) {
        const element = this.pipelineElement.querySelector('[data-step="' + step + '"]');
        if (element) {
            const hasStart = element.classList.contains('start');
            const hasEnd = element.classList.contains('end');

            element.className = 'pipeline-step ' + status;

            if (hasStart) element.classList.add('start');
            if (hasEnd) element.classList.add('end');
        }
    }

    markPipelinePoint(format, type) {
        const element = this.pipelineElement.querySelector('[data-step="' + format + '"]');
        if (element) {
            element.classList.add(type);
        }
    }

    /** Reset pipeline visualization */
    resetPipeline() {
        const steps = this.pipelineElement.querySelectorAll('.pipeline-step');
        steps.forEach(step => {
            step.className = 'pipeline-step inactive';
        });
    }

    /** Clear output and reset state */
    clearOutput() {
        clearOutputUtil(this.outputElement, this.statusElement, () => this.resetPipeline());
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
            'decoded-js': 'Decoded CBOR (JavaScript)'
        };
        return labels[format] || format;
    }

    /** Toggle bytewords style selector visibility */
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

// Mix in Registry Item UI methods
Object.assign(FormatConverter.prototype, RegistryItemUIMixin);

// Initialize converter when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.converter = new FormatConverter();
        setupConverterTabListener();
    });
} else {
    window.converter = new FormatConverter();
    setupConverterTabListener();
}

// Listen for tab activation to check for forwarded data
function setupConverterTabListener() {
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash === 'converter' || hash === '') {
            // Converter tab activated - check for forwarded data
            if (window.converter) {
                window.converter.checkForwardedData();
            }
        }
    });
}

// Export for testing
export { FormatConverter };
