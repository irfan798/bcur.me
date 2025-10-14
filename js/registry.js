/**
 * BC-UR Playground - Registry Browser & Console Playground (Tab 4)
 *
 * Provides registry type browsing and interactive console API:
 * - Browse all registered UR types from ur-registry packages
 * - View CDDL schemas with syntax highlighting
 * - Match decoded URs against registry types
 * - Console playground API (window.registryPlayground)
 *
 * Implements US4 (Registry Browser) and US5 (Console Playground)
 */

// Import BC-UR library components
import {
    UR,
    UrRegistry,
    isRegistryItem
} from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';

// Import UR Registry packages
import * as blockchainCommons from 'https://esm.sh/@ngraveio/ur-blockchain-commons@2.0.1-beta.2';
import * as coinIdentity from 'https://esm.sh/@ngraveio/ur-coin-identity@2.0.1-beta.2';
import * as urSync from 'https://esm.sh/@ngraveio/ur-sync@2.0.1-beta.2';
import * as hexString from 'https://esm.sh/@ngraveio/ur-hex-string@2.0.1-beta.2';
import * as urSign from 'https://esm.sh/@ngraveio/ur-sign@2.0.1-beta.2';
import * as urUuid from 'https://esm.sh/@ngraveio/ur-uuid@2.0.1-beta.2';

// Import shared utilities
import { updateStatus, handleError } from './shared.js';

/**
 * RegistryBrowser Class
 *
 * Manages the registry browser interface for Tab 4, including:
 * - Package enumeration and grouping
 * - Type list display with metadata
 * - CDDL viewer with syntax highlighting
 * - Documentation links
 * - Type matching against decoded URs
 * - Console playground API
 */
class RegistryBrowser {
    constructor() {
        // DOM element references
        this.registryListElement = document.getElementById('registryList');
        this.searchInput = document.getElementById('registrySearch');
        this.statusElement = document.getElementById('registryStatus');

        // State
        this.registryPackages = {
            'blockchain-commons': blockchainCommons,
            'coin-identity': coinIdentity,
            'sync': urSync,
            'hex-string': hexString,
            'sign': urSign,
            'uuid': urUuid
        };

        this.registryTypes = []; // Will be populated during enumeration
        this.expandedTypes = new Set(); // Track which types are expanded
        this.collapsedPackages = new Set(); // Track which packages are collapsed

        // Initialize console playground
        this.initializeConsolePlayground();

        // Setup event listeners
        this.setupEventListeners();

        // Enumerate registry types
        this.enumerateRegistryTypes();

        // Render initial UI
        this.renderRegistryList();
    }

    /**
     * Setup Event Listeners
     */
    setupEventListeners() {
        // Search input with debouncing
        if (this.searchInput) {
            let searchTimer = null;
            this.searchInput.addEventListener('input', () => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => this.filterRegistryList(), 300);
            });
        }

        // Delegate click events for expand/collapse
        if (this.registryListElement) {
            this.registryListElement.addEventListener('click', (e) => {
                // Don't collapse if user is selecting text
                if (window.getSelection().toString().length > 0) {
                    return;
                }

                // Don't collapse if clicking on links or buttons
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    return;
                }

                // Don't collapse if clicking inside CDDL code viewer (allow text selection)
                if (e.target.closest('.cddl-code')) {
                    return;
                }

                // Handle type row click (only on header, not details)
                const typeHeader = e.target.closest('.type-header');
                if (typeHeader) {
                    const typeRow = typeHeader.closest('.type-row');
                    if (typeRow) {
                        const urType = typeRow.getAttribute('data-ur-type');
                        if (urType) {
                            this.toggleTypeExpansion(urType);
                        }
                    }
                    return;
                }

                // Handle package header click
                const packageHeader = e.target.closest('.package-header');
                if (packageHeader) {
                    const packageKey = packageHeader.getAttribute('data-package');
                    if (packageKey) {
                        this.togglePackageExpansion(packageKey);
                    }
                }
            });

            // Handle copy CDDL button clicks
            this.registryListElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-cddl-btn')) {
                    const escapedCDDL = e.target.getAttribute('data-cddl');
                    if (escapedCDDL) {
                        // Unescape HTML entities for clipboard
                        const cddlText = escapedCDDL.replace(/&quot;/g, '"').replace(/&#39;/g, "'");

                        navigator.clipboard.writeText(cddlText).then(() => {
                            const originalText = e.target.textContent;
                            e.target.textContent = '✓ Copied!';
                            setTimeout(() => {
                                e.target.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy CDDL:', err);
                        });
                    }
                }
            });

            // Handle CDDL tag reference clicks
            this.registryListElement.addEventListener('click', async (e) => {
                const tagRef = e.target.closest('.cddl-tag-ref');
                if (tagRef) {
                    e.stopPropagation(); // Don't trigger row collapse

                    const tag = tagRef.getAttribute('data-tag');
                    const typeName = tagRef.getAttribute('data-type');

                    if (typeName) {
                        // Navigate to internal type definition (pass tag for fallback)
                        await this.navigateToType(typeName, tag);
                    } else if (tag) {
                        // Lookup external tag in IANA registry
                        await this.lookupIANATag(tag);
                    }
                }
            });
        }
    }

    /**
     * Enumerate Registry Types
     *
     * Extracts all registered UR types from loaded packages
     * and stores metadata (tag, URType, CDDL, etc.)
     */
    enumerateRegistryTypes() {
        console.log('[Registry] Enumerating registry types...');

        this.registryTypes = [];
        const packageMapping = {
            'blockchain-commons': blockchainCommons,
            'coin-identity': coinIdentity,
            'sync': urSync,
            'hex-string': hexString,
            'sign': urSign,
            'uuid': urUuid
        };

        // Iterate through each package and extract registry item classes
        for (const [packageKey, packageExports] of Object.entries(packageMapping)) {
            if (!packageExports) {
                console.warn(`[Registry] Package ${packageKey} not loaded`);
                continue;
            }

            // Extract all exported classes that have registry metadata
            for (const [exportName, exportValue] of Object.entries(packageExports)) {
                // Check if this is a registry item class (has static tag and URType properties)
                if (exportValue && typeof exportValue === 'function' &&
                    'tag' in exportValue && 'URType' in exportValue) {

                    const RegistryClass = exportValue;

                    this.registryTypes.push({
                        package: packageKey,
                        className: exportName,
                        urType: RegistryClass.URType,
                        tag: RegistryClass.tag,
                        cddl: RegistryClass.CDDL || '',
                        registryClass: RegistryClass,
                        description: this.getTypeDescription(RegistryClass.URType)
                    });
                }
            }
        }

        // Sort by package, then by UR type
        this.registryTypes.sort((a, b) => {
            if (a.package !== b.package) {
                return a.package.localeCompare(b.package);
            }
            return a.urType.localeCompare(b.urType);
        });

        console.log(`[Registry] Found ${this.registryTypes.length} registered types`);
        console.table(this.registryTypes.map(t => ({
            Package: t.package,
            Class: t.className,
            'UR Type': t.urType,
            Tag: t.tag
        })));
    }

    /**
     * Get Type Description
     *
     * Returns a human-readable description for known UR types
     * @param {string} urType - UR type string
     * @returns {string} Description
     */
    getTypeDescription(urType) {
        const descriptions = {
            'crypto-seed': 'Cryptographic seed value',
            'crypto-hdkey': 'Hierarchical Deterministic Key',
            'crypto-keypath': 'Key derivation path',
            'crypto-coininfo': 'Cryptocurrency coin information',
            'crypto-eckey': 'Elliptic Curve Key',
            'crypto-address': 'Cryptocurrency address',
            'crypto-output': 'Transaction output descriptor',
            'crypto-psbt': 'Partially Signed Bitcoin Transaction',
            'crypto-account': 'Account descriptor',
            'detailed-account': 'Detailed account with metadata',
            'portfolio': 'Multi-coin portfolio',
            'portfolio-coin': 'Single coin in portfolio',
            'portfolio-metadata': 'Portfolio metadata',
            'coin-identity': 'Unique coin identifier',
            'hex-string': 'Hex-encoded string',
            'sign-request': 'Signature request',
            'sign-response': 'Signature response',
            'uuid': 'Universally Unique Identifier'
        };

        return descriptions[urType] || 'Registry type';
    }

    /**
     * Render Registry List
     *
     * Renders the full registry type list grouped by package
     */
    renderRegistryList() {
        if (!this.registryListElement) {
            console.warn('[Registry] Registry list element not found');
            return;
        }

        if (this.registryTypes.length === 0) {
            this.registryListElement.innerHTML = '<p class="empty-state">No registry types found</p>';
            return;
        }

        // Group types by package
        const packageGroups = {};
        for (const type of this.registryTypes) {
            if (!packageGroups[type.package]) {
                packageGroups[type.package] = [];
            }
            packageGroups[type.package].push(type);
        }

        // Render grouped list
        let html = '';
        for (const [packageKey, types] of Object.entries(packageGroups)) {
            html += this.renderPackageSection(packageKey, types);
        }

        this.registryListElement.innerHTML = html;

        updateStatus(this.statusElement, `Loaded ${this.registryTypes.length} registry types`, 'success');
    }

    /**
     * Render Package Section
     *
     * Renders a collapsible package section with its types
     * @param {string} packageKey - Package identifier
     * @param {Array} types - Array of type metadata objects
     * @returns {string} HTML string
     */
    renderPackageSection(packageKey, types) {
        const packageNames = {
            'blockchain-commons': 'Blockchain Commons',
            'coin-identity': 'Coin Identity',
            'sync': 'Multi-Layer Sync',
            'hex-string': 'Hex String',
            'sign': 'Sign Request/Response',
            'uuid': 'UUID'
        };

        const packageName = packageNames[packageKey] || packageKey;
        const isExpanded = !this.collapsedPackages || !this.collapsedPackages.has(packageKey);

        let html = `
            <div class="package-section ${isExpanded ? 'expanded' : 'collapsed'}">
                <div class="package-header" data-package="${packageKey}">
                    <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    <strong>${packageName}</strong>
                    <span class="type-count">(${types.length} types)</span>
                </div>
                <div class="package-types" style="display: ${isExpanded ? 'block' : 'none'}">
        `;

        for (const type of types) {
            html += this.renderTypeRow(type);
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render Type Row
     *
     * Renders a single type row with expandable CDDL viewer
     * @param {object} type - Type metadata
     * @returns {string} HTML string
     */
    renderTypeRow(type) {
        const isExpanded = this.expandedTypes.has(type.urType);

        let html = `
            <div class="type-row ${isExpanded ? 'expanded' : ''}" data-ur-type="${type.urType}">
                <div class="type-header">
                    <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    <div class="type-info">
                        <div class="type-name">${type.urType}</div>
                        <div class="type-meta">
                            <span class="type-tag">Tag: ${type.tag}</span>
                            <span class="type-class">Class: ${type.className}</span>
                        </div>
                        <div class="type-description">${type.description}</div>
                    </div>
                </div>
        `;

        if (isExpanded) {
            html += `
                <div class="type-details">
                    ${this.renderCDDLViewer(type)}
                    ${this.renderDocumentationLink(type)}
                </div>
            `;
        }

        html += `</div>`;

        return html;
    }

    /**
     * Render CDDL Viewer
     *
     * Renders CDDL schema with CSS-based syntax highlighting
     * @param {object} type - Type metadata
     * @returns {string} HTML string
     */
    renderCDDLViewer(type) {
        if (!type.cddl || !type.cddl.trim()) {
            return '<div class="cddl-viewer"><em>No CDDL schema available</em></div>';
        }

        // Apply syntax highlighting via CSS classes
        const highlighted = this.highlightCDDL(type.cddl);

        // Escape the CDDL for the data attribute (double escape for HTML attribute)
        const escapedCDDL = type.cddl.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        return `
            <div class="cddl-viewer">
                <div class="cddl-header">
                    <strong>CDDL Schema</strong>
                    <button class="copy-cddl-btn" data-cddl="${escapedCDDL}">Copy</button>
                </div>
                <pre class="cddl-code">${highlighted}</pre>
            </div>
        `;
    }

    /**
     * Highlight CDDL
     *
     * Applies CSS-based syntax highlighting to CDDL text with clickable tags
     * @param {string} cddl - CDDL text
     * @returns {string} Highlighted HTML
     */
    highlightCDDL(cddl) {
        // Escape HTML first
        let highlighted = this.escapeHtml(cddl);

        // Apply highlighting in specific order to avoid conflicts
        // 1. Highlight comments first (entire line from ; onwards)
        highlighted = highlighted.replace(/;(.*)$/gm, '<span class="cddl-comment">;$1</span>');

        // 2. Highlight CBOR tags #6.xxxxx with type references - make them clickable
        // Match patterns like: #6.41402(detailed-account) or just #6.41402
        highlighted = highlighted.replace(/#6\.(\d+)(\(([a-z0-9-]+)\))?/g, (match, tag, withParen, typeName) => {
            if (typeName) {
                // Tag with type name - make both clickable
                return `<span class="cddl-tag-ref clickable" data-tag="${tag}" data-type="${typeName}" title="Click to view ${typeName} definition">#6.${tag}(${typeName})</span>`;
            } else {
                // Just tag - make it clickable for IANA lookup
                return `<span class="cddl-tag-ref clickable" data-tag="${tag}" title="Click to lookup tag ${tag} in IANA registry">#6.${tag}</span>`;
            }
        });

        // 3. Highlight keywords (only outside of spans)
        const keywords = ['tagged', 'uint', 'int', 'bytes', 'text', 'bool', 'null', 'array', 'map', 'size', 'default', 'ne', 'true', 'false'];
        for (const keyword of keywords) {
            // Use negative lookahead to avoid matching inside existing spans
            const regex = new RegExp(`\\b(${keyword})\\b(?![^<]*>)`, 'g');
            highlighted = highlighted.replace(regex, '<span class="cddl-keyword">$1</span>');
        }

        // 4. Highlight numbers (avoid those already in spans)
        highlighted = highlighted.replace(/\b(\d+)(?![^<]*>)\b/g, '<span class="cddl-number">$1</span>');

        return highlighted;
    }

    /**
     * Render Documentation Link
     *
     * Renders link to official documentation if available
     * @param {object} type - Type metadata
     * @returns {string} HTML string
     */
    renderDocumentationLink(type) {
        const docLinks = {
            'crypto-seed': 'https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-006-urtypes.md#seed-type',
            'crypto-hdkey': 'https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-007-hdkey.md',
            'crypto-keypath': 'https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-007-hdkey.md#keypath',
            'crypto-coininfo': 'https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-007-hdkey.md#coin-info',
            'crypto-psbt': 'https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-006-urtypes.md#psbt-type',
            'crypto-account': 'https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-015-account.md',
            'detailed-account': 'https://github.com/ngraveio/Research/blob/main/papers/nbcr-2023-002-multi-layer-sync.md',
            'portfolio': 'https://github.com/ngraveio/Research/blob/main/papers/nbcr-2023-002-multi-layer-sync.md'
        };

        const docLink = docLinks[type.urType];

        if (!docLink) {
            return '';
        }

        return `
            <div class="doc-link">
                <a href="${docLink}" target="_blank" rel="noopener noreferrer">
                    📖 View Official Documentation →
                </a>
            </div>
        `;
    }

    /**
     * Escape HTML
     *
     * Escapes HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Filter Registry List
     *
     * Filters displayed types based on search input
     */
    filterRegistryList() {
        const query = this.searchInput?.value.toLowerCase().trim() || '';

        if (!query) {
            this.renderRegistryList();
            return;
        }

        // Filter types that match the query
        const filteredTypes = this.registryTypes.filter(type => {
            return type.urType.toLowerCase().includes(query) ||
                   type.className.toLowerCase().includes(query) ||
                   type.description.toLowerCase().includes(query) ||
                   type.tag.toString().includes(query) ||
                   type.package.toLowerCase().includes(query);
        });

        if (filteredTypes.length === 0) {
            this.registryListElement.innerHTML = '<p class="empty-state">No types found matching "' + this.escapeHtml(query) + '"</p>';
            updateStatus(this.statusElement, `No types found matching "${query}"`, 'error');
            return;
        }

        // Group filtered types by package
        const packageGroups = {};
        for (const type of filteredTypes) {
            if (!packageGroups[type.package]) {
                packageGroups[type.package] = [];
            }
            packageGroups[type.package].push(type);
        }

        // Render filtered groups
        let html = '';
        for (const [packageKey, types] of Object.entries(packageGroups)) {
            html += this.renderPackageSection(packageKey, types);
        }

        this.registryListElement.innerHTML = html;
        updateStatus(this.statusElement, `Found ${filteredTypes.length} types matching "${query}"`, 'success');
    }

    /**
     * Toggle Type Expansion
     *
     * Shows/hides CDDL viewer for a specific type
     * @param {string} urType - UR type string
     */
    toggleTypeExpansion(urType) {
        if (this.expandedTypes.has(urType)) {
            this.expandedTypes.delete(urType);
        } else {
            this.expandedTypes.add(urType);
        }

        this.renderRegistryList();
    }

    /**
     * Toggle Package Expansion
     *
     * Shows/hides types for a package
     * @param {string} packageKey - Package key
     */
    togglePackageExpansion(packageKey) {
        if (this.collapsedPackages.has(packageKey)) {
            this.collapsedPackages.delete(packageKey);
        } else {
            this.collapsedPackages.add(packageKey);
        }

        this.renderRegistryList();
    }

    /**
     * Navigate to Type Definition
     *
     * Scrolls to and expands the specified registry type
     * @param {string} typeName - UR type name (e.g., 'detailed-account')
     * @param {string} fallbackTag - Optional tag number to lookup in IANA if type not found
     */
    async navigateToType(typeName, fallbackTag = null) {
        // Find the type in registry
        const type = this.registryTypes.find(t => t.urType === typeName);

        if (!type) {
            // Type not found in registry - fall back to IANA lookup
            if (fallbackTag) {
                await this.lookupIANATag(fallbackTag);
                return;
            }
            updateStatus(this.statusElement, `Type "${typeName}" not found in registry`, 'error');
            return;
        }

        // Clear search to show all types
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.renderRegistryList();

        // Expand the type
        this.expandedTypes.add(typeName);

        // Make sure package is expanded
        this.collapsedPackages.delete(type.package);

        // Re-render to show expanded state
        this.renderRegistryList();

        // Wait for render to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Find and scroll to the type row
        const typeRow = document.querySelector(`[data-ur-type="${typeName}"]`);
        if (typeRow) {
            typeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add highlight effect
            typeRow.style.transition = 'background-color 0.5s';
            typeRow.style.backgroundColor = '#fff3cd';

            setTimeout(() => {
                typeRow.style.backgroundColor = '';
            }, 2000);

            updateStatus(this.statusElement, `Navigated to ${typeName}`, 'success');
        }
    }

    /**
     * Lookup IANA Tag
     *
     * Fetches IANA CBOR tags registry and opens the documentation for the tag
     * @param {string} tag - CBOR tag number
     */
    async lookupIANATag(tag) {
        // Check if tag is in our registry first
        const registryType = this.registryTypes.find(t => t.tag.toString() === tag);

        if (registryType) {
            // It's a registered type - navigate to it
            await this.navigateToType(registryType.urType);
            return;
        }

        // Open IANA registry page
        const ianaUrl = 'https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml';

        updateStatus(this.statusElement, `Opening IANA registry for tag ${tag}...`, 'success');

        // Open in new tab with referrer
        window.open(ianaUrl, '_blank');

        // Show info message
        setTimeout(() => {
            updateStatus(this.statusElement, `Opened IANA CBOR Tags registry (search for tag ${tag})`, 'success');
        }, 500);
    }

    /**
     * Initialize Console Playground
     *
     * Sets up window.registryPlayground API for interactive testing
     */
    initializeConsolePlayground() {
        window.registryPlayground = {
            /**
             * Create a registry item from type name and data
             * @param {string} typeName - Registry type name (e.g., 'crypto-seed')
             * @param {object} data - Data for the registry item
             * @returns {object} Registry item instance
             */
            createItem: (_typeName, _data) => {
                // TODO: Implement in T062-T063
                console.error('[Registry Playground] createItem() not yet implemented');
                return null;
            },

            /**
             * Create registry item from last decoded value
             * @returns {object} Registry item instance
             */
            createFromDecoded: () => {
                // TODO: Implement in T064
                console.error('[Registry Playground] createFromDecoded() not yet implemented');
                return null;
            },

            /**
             * Encode registry item to CBOR formats
             * @param {object} item - Registry item instance
             * @returns {object} Encoded representations
             */
            encode: (_item) => {
                // TODO: Implement in T065
                console.error('[Registry Playground] encode() not yet implemented');
                return null;
            },

            /**
             * Decode CBOR hex to JavaScript object
             * @param {string} hex - CBOR hex string
             * @returns {object} Decoded JavaScript object
             */
            decode: (_hex) => {
                // TODO: Implement in T066
                console.error('[Registry Playground] decode() not yet implemented');
                return null;
            },

            /**
             * Validate registry item against CDDL schema
             * @param {object} item - Registry item instance
             * @returns {object} Validation result
             */
            validate: (_item) => {
                // TODO: Implement in T067
                console.warn('[Registry Playground] validate() - CDDL validation post-MVP');
                return { valid: null, errors: ['CDDL validation not yet implemented'] };
            },

            /**
             * List all available registry types
             * @returns {Array<string>} Array of UR type names
             */
            listTypes: () => {
                return this.registryTypes.map(t => t.urType);
            },

            /**
             * Get information about a specific type
             * @param {string} urType - UR type name
             * @returns {object|null} Type metadata
             */
            getType: (urType) => {
                return this.registryTypes.find(t => t.urType === urType) || null;
            }
        };

        console.log('%c[Registry Playground] API available at window.registryPlayground', 'color: #4CAF50; font-weight: bold');
        console.log('  Available methods: createItem, createFromDecoded, encode, decode, validate, listTypes, getType');
    }
}

// Initialize registry browser when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.registryBrowser = new RegistryBrowser();
    });
} else {
    window.registryBrowser = new RegistryBrowser();
}

// Export for testing
export { RegistryBrowser };
