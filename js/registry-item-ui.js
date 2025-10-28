/**
 * Registry Item UI Enhancement Methods
 *
 * These methods are mixed into the FormatConverter class to provide
 * expandable tree views, methods panels, console hints, and copy options
 * for decoded registry items.
 */

export const RegistryItemUIMixin = {
    /**
     * Initialize Registry Item UI Elements
     * Call this in the constructor after other DOM elements are initialized
     */
    initializeRegistryItemUI() {
        // Registry Item UI panel elements
        this.registryItemUI = document.getElementById('registry-item-ui');
        this.treeViewContent = document.getElementById('tree-view-content');
        this.methodsContent = document.getElementById('methods-content');
        this.copyOptionsBtns = document.querySelectorAll('.copy-option-btn');
        this.copyHintBtns = document.querySelectorAll('.copy-hint-btn');

        // State for UI
        this.currentRegistryItem = null;
        this.currentTreeState = {}; // Track collapsed/expanded nodes
        this.showAllProperties = false; // Toggle for showing all properties vs just .data
        this.showFunctions = false; // Toggle for showing functions in tree view (default: hidden)

        // Setup event listeners for registry item UI
        this.setupRegistryItemListeners();
    },

    /**
     * Setup Event Listeners for Registry Item UI
     */
    setupRegistryItemListeners() {
        // Copy option buttons
        this.copyOptionsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.getAttribute('data-format');
                this.copyRegistryItem(format);
            });
        });

        // Copy hint buttons
        this.copyHintBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const hint = e.target.getAttribute('data-hint');
                this.copyHintToClipboard(hint);
            });
        });
    },

    /**
     * Show Registry Item UI
     * Called when a registry item is decoded
     */
    showRegistryItemUI(registryItem) {
        if (!this.registryItemUI || !registryItem) return;

        this.currentRegistryItem = registryItem;
        this.registryItemUI.style.display = 'block';

        // Render tree view with integrated methods
        this.renderTreeView(registryItem);
    },

    /**
     * Hide Registry Item UI
     * Called when output format changes or non-registry item decoded
     */
    hideRegistryItemUI() {
        if (!this.registryItemUI) return;
        this.registryItemUI.style.display = 'none';
        this.currentRegistryItem = null;
    },

    /**
     * Render Expandable Tree View
     * Creates a DevTools-style collapsible property inspector with integrated methods
     */
    renderTreeView(registryItem) {
        if (!this.treeViewContent) return;

        const commonMethods = this.getCommonRegistryMethods();
        const typeMethods = this.getTypeSpecificMethods(registryItem);
        
        // Get registry type info for display
        const registryType = registryItem.type;
        const urType = registryType?.URType || 'unknown';
        const tag = registryType?.tag || 'N/A';
        
        let html = `
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 12px;">
                <strong>💡 Quick Tip:</strong> Click <kbd style="background: #e1e4e8; padding: 2px 5px; border-radius: 3px; font-size: 11px;">▶️</kbd> to execute methods. 
                Results appear inline. Nested registry items are fully explorable.
            </div>
            
            <!-- Inspector Controls -->
            <div class="inspector-controls" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px; background: #f6f8fa; border-radius: 6px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;">
                        <input type="checkbox" id="show-all-properties" ${this.showAllProperties ? 'checked' : ''}>
                        <span>Show All Properties</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;">
                        <input type="checkbox" id="show-functions" ${this.showFunctions ? 'checked' : ''}>
                        <span>Show Functions</span>
                    </label>
                </div>
                <div class="registry-type-badge" style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: white; border: 1px solid #667eea; border-radius: 6px; font-size: 11px; cursor: pointer;" data-ur-type="${urType}" data-tag="${tag}" title="Click for CDDL schema">
                    <span style="color: #667eea; font-weight: 600;">ur:${urType}</span>
                    <span style="color: #586069;">tag: ${tag}</span>
                </div>
            </div>
            
            <div class="tree-section">
                <div class="tree-section-header">📦 Properties</div>
                ${this.renderRegistryItemTree(registryItem, 'root')}
            </div>

            <div class="tree-section" style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #e1e4e8;">
                <div class="tree-section-header">⚡ Methods</div>
                <div class="tree-methods-grid">
        `;

        // Render common methods
        commonMethods.forEach(method => {
            html += `
                <button class="tree-method-btn" data-method-name="${method.name}" title="${method.description}">
                    <span class="method-icon">▶️</span>
                    <span class="method-name">${method.name}()</span>
                    <span class="method-badge">COMMON</span>
                </button>
            `;
        });

        // Render type-specific methods
        typeMethods.forEach(method => {
            html += `
                <button class="tree-method-btn" data-method-name="${method}" title="Type-specific method">
                    <span class="method-icon">▶️</span>
                    <span class="method-name">${method}()</span>
                    <span class="method-badge type-specific">TYPE</span>
                </button>
            `;
        });

        html += `
                </div>
            </div>
        `;

        this.treeViewContent.innerHTML = html;

        // Attach toggle handlers for inspector controls
        const showAllPropsCheckbox = document.getElementById('show-all-properties');
        const showFunctionsCheckbox = document.getElementById('show-functions');
        
        if (showAllPropsCheckbox) {
            showAllPropsCheckbox.addEventListener('change', (e) => {
                this.showAllProperties = e.target.checked;
                this.renderTreeView(this.currentRegistryItem); // Re-render
            });
        }

        if (showFunctionsCheckbox) {
            showFunctionsCheckbox.addEventListener('change', (e) => {
                this.showFunctions = e.target.checked;
                this.renderTreeView(this.currentRegistryItem); // Re-render
            });
        }

        // Attach click handlers for expand/collapse
        this.treeViewContent.querySelectorAll('.tree-node-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const parent = header.closest('.tree-node');
                const children = parent.querySelector('.tree-children');
                const icon = header.querySelector('.tree-expand-icon');

                if (children) {
                    children.classList.toggle('collapsed');
                    if (icon) {
                        icon.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
                    }
                }
            });
        });

        // Attach click handlers for function execution in tree
        this.treeViewContent.querySelectorAll('.tree-function-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const methodKey = header.getAttribute('data-method-key');
                const methodPath = header.getAttribute('data-method-path');
                this.executeTreeFunction(methodKey, methodPath, header);
            });
        });

        // Attach method execution handlers for method buttons
        this.treeViewContent.querySelectorAll('.tree-method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const methodName = btn.getAttribute('data-method-name');
                this.executeMethodToConsole(methodName);
            });
        });

        // Attach click handlers for registry type badges to show CDDL tooltip
        this.treeViewContent.querySelectorAll('.registry-type-badge, .registry-type-tag').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                const urType = badge.getAttribute('data-ur-type');
                const tag = badge.getAttribute('data-tag');
                this.showCDDLTooltip(e, urType, tag);
            });
        });
    },

    /**
     * Render Registry Item Tree
     * Shows constructor name as root with filtered properties and methods
     */
    renderRegistryItemTree(registryItem, path) {
        const registryType = registryItem.type;
        const urType = registryType?.URType || 'unknown';
        const tag = registryType?.tag || 'N/A';
        const constructorName = registryItem.constructor.name;

        return `
            <div class="tree-node">
                <div class="tree-node-header">
                    <span class="tree-expand-icon">▼</span>
                    <span class="tree-key">${constructorName}</span>
                    <span class="registry-type-tag" style="cursor: pointer;" data-ur-type="${urType}" data-tag="${tag}" title="Click for CDDL schema">
                        <span class="tag-badge">tag:${tag}</span>
                        <span class="ur-type">ur:${urType}</span>
                    </span>
                </div>
                <div class="tree-children">
                    ${this.renderTreeChildren(registryItem, path, 0)}
                </div>
            </div>
        `;
    },

    /**
     * Render Tree Children Recursively
     * Handles both regular objects and registry items
     * For registry items: shows .data property + type-specific methods
     * For regular objects: shows all properties (with filtering based on showAllProperties)
     */
    renderTreeChildren(obj, path, depth = 0) {
        if (depth > 50) return '<span class="tree-value">[Max depth reached]</span>';

        const items = [];

        // Common registry methods to filter out (unless overridden by type)
        const commonRegistryMethods = ['toUr', 'toHex', 'toCBOR', 'toBytes', 'preCBOR', 'encodeKeys', 'decodeKeys'];

        // Internal properties to filter out when not showing all
        const internalProps = ['keyMap', 'allowKeysNotInMap'];

        // Check if this is a registry item (has .data and .type.URType)
        const isRegistryItem = obj && obj.data && obj.type && typeof obj.type === 'object' && obj.type.URType;

        // Collect keys to render
        let keys = [];

        if (isRegistryItem) {
            // For registry items: show .data property explicitly (not its contents directly)
            keys.push({ key: 'data', fromData: false });

            // Add type-specific methods by walking the prototype chain
            const methodSet = new Set();
            let current = obj;
            let prototypeDepth = 0;

            while (current && current !== Object.prototype && prototypeDepth < 10) {
                Object.getOwnPropertyNames(current).forEach(key => {
                    const value = obj[key];
                    if (typeof value === 'function' && 
                        !commonRegistryMethods.includes(key) &&
                        !key.startsWith('_') && 
                        key !== 'constructor' && 
                        key !== 'verifyInput') {
                        methodSet.add(key);
                    }
                });
                current = Object.getPrototypeOf(current);
                prototypeDepth++;
            }

            // Add methods to keys array
            Array.from(methodSet).sort().forEach(methodName => {
                keys.push({ key: methodName, fromData: false });
            });
        } else {
            // For regular objects: show all keys with filtering
            keys = Object.keys(obj).filter(key => {
                // Skip internal properties unless showAllProperties is enabled
                if (!this.showAllProperties && internalProps.includes(key)) return false;

                // Skip common methods unless showAllProperties is enabled
                const value = obj[key];
                if (!this.showAllProperties && typeof value === 'function' && commonRegistryMethods.includes(key)) return false;

                return true;
            }).map(k => ({ key: k, fromData: false }));
        }

        // Render each key
        keys.forEach(({ key, fromData }) => {
            const value = fromData ? obj.data[key] : obj[key];
            const valuePath = fromData ? `${path}.data.${key}` : `${path}.${key}`;

            const isFunction = typeof value === 'function';
            const isNestedRegistryItem = value && typeof value === 'object' && value.type && typeof value.type === 'object' && value.type.URType;

            if (isFunction) {
                // Skip functions if showFunctions is false
                if (!this.showFunctions) return;
                
                // Render function as clickable item with execute button
                const methodId = `method-${valuePath.replace(/\./g, '-')}`;
                // Build executable path by appending function call to parent path
                const executablePath = `${valuePath}()`;
                items.push(`
                    <div class="tree-node tree-node-function" id="${methodId}">
                        <div class="tree-function-header" 
                             data-method-path="${path}" 
                             data-method-key="${key}"
                             data-executable-path="${executablePath}">
                            <span class="tree-function-icon">▶️</span>
                            <span class="tree-key">${key}()</span>
                            <span class="tree-type">function</span>
                        </div>
                        <div class="tree-function-result" style="display: none; margin-left: 24px; margin-top: 4px;">
                            <!-- Result will be inserted here -->
                        </div>
                    </div>
                `);
            } else if (isNestedRegistryItem) {
                // Render nested registry item with type badge and its full structure (data + methods)
                const registryType = value.type;
                const urType = registryType.URType;
                const tag = registryType.tag;
                const icon = this.currentTreeState[valuePath] === 'collapsed' ? '▶' : '▼';
                const childrenClass = this.currentTreeState[valuePath] === 'collapsed' ? 'collapsed' : '';

                items.push(`
                    <div class="tree-node">
                        <div class="tree-node-header">
                            <span class="tree-expand-icon">${icon}</span>
                            <span class="tree-key">${key}</span>
                            <span class="registry-type-tag" style="cursor: pointer;" data-ur-type="${urType}" data-tag="${tag}" title="Click for CDDL schema">
                                <span class="tag-badge">tag:${tag}</span>
                                <span class="ur-type">ur:${urType}</span>
                            </span>
                        </div>
                        <div class="tree-children ${childrenClass}">
                            ${this.renderTreeChildren(value, valuePath, depth + 1)}
                        </div>
                    </div>
                `);
            } else if (this.isExpandableValue(value)) {
                // Regular expandable object/array
                const valueType = this.getValueType(value);
                const icon = this.currentTreeState[valuePath] === 'collapsed' ? '▶' : '▼';
                const childrenClass = this.currentTreeState[valuePath] === 'collapsed' ? 'collapsed' : '';

                items.push(`
                    <div class="tree-node">
                        <div class="tree-node-header">
                            <span class="tree-expand-icon">${icon}</span>
                            <span class="tree-key">${key}</span>
                            <span class="tree-type">${valueType}</span>
                        </div>
                        <div class="tree-children ${childrenClass}">
                            ${this.renderTreeChildren(value, valuePath, depth + 1)}
                        </div>
                    </div>
                `);
            } else {
                // Primitive value (string, number, boolean, etc.)
                const valueType = this.getValueType(value);
                const formattedValue = this.formatTreeValue(value);
                items.push(`
                    <div class="tree-node">
                        <span class="tree-key">${key}:</span>
                        <span class="tree-value ${valueType.toLowerCase()}">${formattedValue}</span>
                        <span class="tree-type">${valueType}</span>
                    </div>
                `);
            }
        });

        return items.join('');
    },

    /**
     * Get Value Type for Display
     */
    getValueType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return `Array(${value.length})`;
        if (value instanceof Uint8Array) return `Bytes(${value.length})`;
        if (value instanceof Map) return `Map(${value.size})`;
        if (value instanceof Set) return `Set(${value.size})`;
        if (typeof value === 'object') return `Object(${Object.keys(value).length})`;
        return typeof value;
    },

    /**
     * Check if Value is Expandable (has children)
     */
    isExpandableValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value !== 'object') return false;
        if (value instanceof Uint8Array) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (value instanceof Map) return value.size > 0;
        if (value instanceof Set) return value.size > 0;
        return Object.keys(value).length > 0;
    },

    /**
     * Format Tree Value for Display
     */
    formatTreeValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return String(value);
        if (value instanceof Uint8Array) {
            // Show full hex without truncation
            const hex = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
            return `0x${hex}`;
        }
        return String(value);
    },

    /**
     * Render Methods Display Panel
     * Shows common and type-specific methods with execute buttons
     */
    renderMethods(registryItem) {
        if (!this.methodsContent) return;

        const commonMethods = this.getCommonRegistryMethods();
        const typeMethods = this.getTypeSpecificMethods(registryItem);

        let html = '<div class="methods-list">';

        // Console hint message with documentation links
        html += `
            <div class="console-hint-message">
                <div class="hint-header">
                    💡 <strong>Console Playground Tips</strong>
                </div>
                <div class="hint-body">
                    <p>Click ▶️ to execute methods and see results in the browser console. Press <kbd>F12</kbd> or <kbd>Ctrl+Shift+I</kbd> to open DevTools.</p>
                    <div class="docs-links">
                        <strong>📚 Documentation:</strong>
                        <ul>
                            <li><a href="https://github.com/ngraveio/bc-ur-ts" target="_blank" rel="noopener noreferrer">BC-UR Library (bc-ur-ts)</a></li>
                            <li><a href="https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-006-urtypes.md" target="_blank" rel="noopener noreferrer">UR Types Specification (BCR-2020-006)</a></li>
                            <li><a href="https://www.blockchaincommons.com/" target="_blank" rel="noopener noreferrer">Blockchain Commons</a></li>
                            <li><a href="https://cbor.io/" target="_blank" rel="noopener noreferrer">CBOR Specification</a></li>
                        </ul>
                    </div>
                    <div class="console-examples">
                        <strong>💻 Quick Examples:</strong>
                        <ul>
                            <li><code>window.$lastRegistryItem.toUr().toString()</code> - Get UR string</li>
                            <li><code>window.$lastDecoded</code> - View raw CBOR data</li>
                            <li><code>window.UrRegistry.registry</code> - Access registry instance</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Common methods
        commonMethods.forEach(method => {
            html += `
                <div class="method-item" data-method="${method.name}">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                        <span class="method-name">${method.name}()</span>
                        <span class="method-badge common">COMMON</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="execute-method-btn" data-method-name="${method.name}" title="Execute method and log result to console">▶️</button>
                        <button class="copy-method-btn" data-method-call="window.$lastRegistryItem.${method.name}()" title="Copy method call to clipboard">📋</button>
                    </div>
                </div>
            `;
        });

        // Type-specific methods - always show
        if (typeMethods.length > 0) {
            typeMethods.forEach(method => {
                html += `
                    <div class="method-item" data-method="${method}">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            <span class="method-name">${method}()</span>
                            <span class="method-badge type-specific">TYPE-SPECIFIC</span>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button class="execute-method-btn" data-method-name="${method}" title="Execute method and log result to console">▶️</button>
                            <button class="copy-method-btn" data-method-call="window.$lastRegistryItem.${method}()" title="Copy method call to clipboard">📋</button>
                        </div>
                    </div>
                `;
            });
        }

        html += '</div>';

        this.methodsContent.innerHTML = html;

        // Attach execute method button handlers
        this.methodsContent.querySelectorAll('.execute-method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const methodName = btn.getAttribute('data-method-name');
                this.executeMethodToConsole(methodName);
            });
        });

        // Attach copy method button handlers
        this.methodsContent.querySelectorAll('.copy-method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const methodCall = btn.getAttribute('data-method-call');
                this.copyToClipboardWithFeedback(methodCall, 'Method call copied!');
            });
        });

        // Attach hover handlers for tooltips
        this.methodsContent.querySelectorAll('.method-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                const methodName = item.getAttribute('data-method');
                this.showMethodTooltip(e, methodName);
            });
            item.addEventListener('mouseleave', () => {
                this.hideMethodTooltip();
            });
        });
    },

    /**
     * Get Common Registry Methods
     * Methods available on all registry items
     */
    getCommonRegistryMethods() {
        return [
            { name: 'toUr', description: 'Convert to UR string', signature: 'toUr(): UR' },
            { name: 'toHex', description: 'Encode to hex string', signature: 'toHex(): string' },
            { name: 'toCBOR', description: 'Encode to CBOR bytes', signature: 'toCBOR(): Uint8Array' },
            { name: 'toBytes', description: 'Get payload bytes', signature: 'toBytes(): Uint8Array' }
        ];
    },

    /**
     * Get Type-Specific Methods
     * Methods specific to this registry item type
     * Walks the full prototype chain to find all methods
     */
    getTypeSpecificMethods(registryItem) {
        const methodSet = new Set();
        const commonMethodNames = this.getCommonRegistryMethods().map(m => m.name);

        // Walk the full prototype chain
        let current = registryItem;
        let depth = 0;

        while (current && current !== Object.prototype && depth < 10) {
            Object.getOwnPropertyNames(current).forEach(name => {
                if (
                    typeof registryItem[name] === 'function' &&
                    !commonMethodNames.includes(name) &&
                    !name.startsWith('_') &&
                    name !== 'constructor' &&
                    name !== 'encodeKeys' &&
                    name !== 'decodeKeys' &&
                    name !== 'verifyInput' &&
                    name !== 'toString' &&
                    name !== 'toJSON' &&
                    name !== 'preCBOR' &&
                    name !== 'toUr' &&
                    name !== 'toBytes'
                ) {
                    methodSet.add(name);
                }
            });
            current = Object.getPrototypeOf(current);
            depth++;
        }

        return Array.from(methodSet).sort();
    },

    /**
     * Show Method Tooltip
     */
    showMethodTooltip(event, methodName) {
        const method = this.getCommonRegistryMethods().find(m => m.name === methodName);
        if (!method) return;

        // Create tooltip if it doesn't exist
        let tooltip = document.querySelector('.method-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'method-tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.innerHTML = `
            <div class="method-tooltip-signature">${method.signature}</div>
            <div class="method-tooltip-description">${method.description}</div>
        `;

        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.classList.add('visible');
    },

    /**
     * Hide Method Tooltip
     */
    hideMethodTooltip() {
        const tooltip = document.querySelector('.method-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    },

    /**
     * Show CDDL Tooltip Modal
     * Displays CDDL schema in a modal/tooltip when UR type badge is clicked
     */
    showCDDLTooltip(_event, urType, tag) {
        try {
            // Get the registry class by UR type from the global registry
            const RegistryClass = window.UrRegistry?.registry?.get(urType);

            if (!RegistryClass) {
                console.error(`Registry class not found for UR type: ${urType}`);
                this.showCopyFeedback(`Registry class not found for ${urType}`, false);
                return;
            }

            const cddl = RegistryClass.CDDL || 'No CDDL schema available';
            const className = RegistryClass.name;

            // Find package name - check all exports in each package
            let packageName = 'unknown';
            if (window.registryPackages) {
                for (const [pkg, packageExports] of Object.entries(window.registryPackages)) {
                    // Check if this package exports the class
                    const allExports = Object.values(packageExports);
                    if (allExports.includes(RegistryClass)) {
                        // Map internal package names to friendly names
                        const pkgMap = {
                            'blockchainCommons': 'blockchain-commons',
                            'coinIdentity': 'coin-identity',
                            'urSync': 'ur-sync',
                            'hexString': 'hex-string',
                            'urSign': 'ur-sign',
                            'urUuid': 'ur-uuid'
                        };
                        packageName = pkgMap[pkg] || pkg;
                        break;
                    }
                }
            }

            // Remove existing tooltip if any
            const existingTooltip = document.getElementById('cddl-tooltip-modal');
            if (existingTooltip) {
                existingTooltip.remove();
            }

            // Use registry browser's highlightCDDL function if available
            const highlightedCDDL = window.registryBrowser ?
                window.registryBrowser.highlightCDDL(cddl) :
                this.highlightCDDLForModal(cddl);

            // Escape CDDL for data attribute
            const escapedCDDL = cddl.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

            // Create tooltip modal with registry browser styling
            const modal = document.createElement('div');
            modal.id = 'cddl-tooltip-modal';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid #667eea;
                border-radius: 12px;
                padding: 24px;
                max-width: 800px;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            modal.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <div class="type-name" style="font-weight: 600; color: #24292e; font-size: 18px; margin-bottom: 8px;">${urType}</div>
                        <div class="type-meta" style="display: flex; gap: 16px; font-size: 13px; color: #586069;">
                            <span class="type-tag">Tag: ${tag}</span>
                            <span class="type-class">Class: ${className}</span>
                            <span class="type-package">Package: ${packageName}</span>
                        </div>
                    </div>
                    <button id="close-cddl-modal" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #586069; line-height: 1; padding: 0; margin-left: 16px; transition: color 0.2s;">×</button>
                </div>

                <div class="cddl-viewer" style="margin-bottom: 16px;">
                    <div class="cddl-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 13px; color: #24292e;">CDDL Schema</strong>
                        <button class="copy-cddl-btn" data-cddl="${escapedCDDL}" style="padding: 4px 8px; background: white; border: 1px solid #e1e4e8; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s;">Copy</button>
                    </div>
                    <pre class="cddl-code" style="background: #24292e; color: #e1e4e8; padding: 12px; border: 1px solid #1b1f23; border-radius: 4px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace; font-size: 12px; line-height: 1.5; overflow-x: auto; white-space: pre; max-height: 400px; overflow-y: auto;">${highlightedCDDL}</pre>
                </div>

                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button id="view-in-registry-btn" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s;">
                        📘 View in Registry Browser
                    </button>
                </div>
            `;

            // Create backdrop
            const backdrop = document.createElement('div');
            backdrop.id = 'cddl-tooltip-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                z-index: 9999;
            `;

            // Append to body
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);

            // Close handlers
            const closeModal = () => {
                modal.remove();
                backdrop.remove();
            };

            const closeBtn = document.getElementById('close-cddl-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeModal);
                closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = '#dc3545');
                closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = '#586069');
            }

            backdrop.addEventListener('click', closeModal);

            // ESC key to close
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Copy CDDL handler
            const copyBtn = modal.querySelector('.copy-cddl-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    const cddlText = escapedCDDL.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                    navigator.clipboard.writeText(cddlText).then(() => {
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = '✓ Copied!';
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy CDDL:', err);
                    });
                });

                copyBtn.addEventListener('mouseenter', () => copyBtn.style.background = '#e1e4e8');
                copyBtn.addEventListener('mouseleave', () => copyBtn.style.background = 'white');
            }

            // View in Registry Browser handler - with URL hash support
            const viewBtn = document.getElementById('view-in-registry-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    closeModal();
                    // First navigate to registry tab, then update hash with type parameter
                    // Use setTimeout to ensure tab navigation happens first
                    window.location.hash = '#registry';
                    setTimeout(() => {
                        window.location.hash = `#registry?type=${urType}`;
                    }, 100);
                });

                viewBtn.addEventListener('mouseenter', () => viewBtn.style.background = '#5568d3');
                viewBtn.addEventListener('mouseleave', () => viewBtn.style.background = '#667eea');
            }

            // Handle clickable CDDL tag references in modal
            modal.querySelectorAll('.cddl-tag-ref.clickable').forEach(tagRef => {
                tagRef.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tag = tagRef.getAttribute('data-tag');
                    const typeName = tagRef.getAttribute('data-type');

                    if (typeName) {
                        closeModal();
                        // Navigate to registry tab first, then to specific type
                        window.location.hash = '#registry';
                        setTimeout(() => {
                            window.location.hash = `#registry?type=${typeName}`;
                        }, 100);
                    } else if (tag) {
                        // Open IANA registry
                        window.open('https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml', '_blank');
                    }
                });
            });

        } catch (err) {
            console.error('Error showing CDDL tooltip:', err);
            this.showCopyFeedback('Failed to load CDDL schema', false);
        }
    },

    /**
     * Highlight CDDL for Modal (fallback if registry browser not available)
     * Uses registry browser's color scheme
     */
    highlightCDDLForModal(cddl) {
        if (!cddl || cddl === 'No CDDL schema available') {
            return '<span style="color: #8b949e; font-style: italic;">; No CDDL schema available</span>';
        }

        // Escape HTML first
        let highlighted = this.escapeHtml(cddl);

        // Apply highlighting in specific order with dark theme colors
        // 1. Highlight comments first (gray)
        highlighted = highlighted.replace(/;(.*)$/gm, '<span class="cddl-comment" style="color: #8b949e; font-style: italic;">;$1</span>');

        // 2. Highlight CBOR tags with type references (blue)
        highlighted = highlighted.replace(/#6\.(\d+)(\(([a-z0-9-]+)\))?/g, (_match, tag, _withParen, typeName) => {
            if (typeName) {
                return `<span class="cddl-tag-ref clickable" data-tag="${tag}" data-type="${typeName}" style="color: #58a6ff; font-weight: 600; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;" title="Click to view ${typeName} definition">#6.${tag}(${typeName})</span>`;
            } else {
                return `<span class="cddl-tag-ref clickable" data-tag="${tag}" style="color: #58a6ff; font-weight: 600; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;" title="Click to lookup tag ${tag} in IANA registry">#6.${tag}</span>`;
            }
        });

        // 3. Highlight keywords (cyan)
        const keywords = ['tagged', 'uint', 'int', 'bytes', 'text', 'bool', 'null', 'array', 'map', 'size', 'default', 'ne', 'true', 'false'];
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b(${keyword})\\b(?![^<]*>)`, 'g');
            highlighted = highlighted.replace(regex, '<span class="cddl-keyword" style="color: #79c0ff; font-weight: 600;">$1</span>');
        }

        // 4. Highlight numbers (orange)
        highlighted = highlighted.replace(/\b(\d+)(?![^<]*>)\b/g, '<span class="cddl-number" style="color: #ffa657;">$1</span>');

        return highlighted;
    },

    /**
     * Escape HTML for Safe Display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },


    /**
     * Copy Registry Item in Different Formats
     */
    async copyRegistryItem(format) {
        if (!this.currentRegistryItem) {
            this.showCopyFeedback('No registry item available', false);
            return;
        }

        try {
            let text = '';

            switch (format) {
                case 'json':
                    // Convert to JSON-serializable object
                    text = JSON.stringify(this.currentRegistryItem, null, 2);
                    break;

                case 'hex':
                    // Encode to hex
                    text = this.currentRegistryItem.toHex ? this.currentRegistryItem.toHex() : '';
                    break;

                case 'ur':
                    // Convert to UR string
                    const ur = this.currentRegistryItem.toUr ? this.currentRegistryItem.toUr() : null;
                    text = ur ? ur.toString() : '';
                    break;

                case 'code':
                    // Generate JavaScript code to recreate this registry item
                    const hex = this.currentRegistryItem.toHex ? this.currentRegistryItem.toHex() : '';

                    // Get registry type info from .type property
                    const registryType = this.currentRegistryItem.type;
                    const urType = registryType?.URType || 'unknown';
                    const urString = this.currentRegistryItem.toUr?.().toString() || `ur:${urType}/...`;

                    text = `// Registry Item Type: ur:${urType}
// Access via: window.UrRegistry.registry.get("${urType}")

// Method 1: Reconstruct from hex
const RegistryClass = window.UrRegistry.registry.get("${urType}");
const item = RegistryClass.fromHex('${hex}');

// Method 2: Reconstruct from UR string
// const ur = window.UR.fromString('${urString}');
// const item = RegistryClass.fromUR(ur);

// Method 3: Query and decode
// const item = window.UrRegistry.queryByURType("${urType}").fromHex('${hex}');

console.log('Decoded registry item:', item);
console.log('UR type:', item.type.URType); // Access via .type property
console.log('UR string:', item.toUr().toString());`;
                    break;

                default:
                    throw new Error('Unknown copy format');
            }

            if (!text) {
                throw new Error('Failed to generate output for format: ' + format);
            }

            await navigator.clipboard.writeText(text);
            this.showCopyFeedback(`Copied as ${format.toUpperCase()}!`);
        } catch (err) {
            console.error('Copy failed:', err);
            this.showCopyFeedback('Copy failed: ' + err.message, false);
        }
    },

    /**
     * Copy Hint to Clipboard
     */
    async copyHintToClipboard(hint) {
        try {
            await navigator.clipboard.writeText(hint);
            this.showCopyFeedback('Copied to clipboard!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showCopyFeedback('Copy failed', false);
        }
    },

    /**
     * Copy to Clipboard with Feedback
     */
    async copyToClipboardWithFeedback(text, message = 'Copied!') {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopyFeedback(message);
        } catch (err) {
            console.error('Copy failed:', err);
            this.showCopyFeedback('Copy failed', false);
        }
    },

    /**
     * Execute Function Chain from Path String
     * Parses path like "root.getMetadata().getData()" and executes each step
     * 
     * @param {string} path - Executable path (e.g., "root.getMetadata().getData()")
     * @returns {Object|null} - Resolved object or null if chain fails
     */
    executeFunctionChain(path) {
        // Split by dots, preserving function calls with "()"
        const parts = path.split('.');
        
        let current = this.currentRegistryItem;
        
        console.log(`%c🔗 Executing function chain: ${path}`, 'color: #8b5cf6; font-weight: bold;');
        
        // Skip "root" (first part, index 0)
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            
            if (part.endsWith('()')) {
                // Function call - execute it
                const methodName = part.slice(0, -2); // Remove "()"
                const method = current[methodName];
                
                if (typeof method !== 'function') {
                    console.error(`  ✗ ${methodName} is not a function on:`, current);
                    return null;
                }
                
                console.log(`  ↳ Executing: ${methodName}()`);
                
                try {
                    current = method.call(current);
                } catch (error) {
                    console.error(`  ✗ ${methodName}() failed:`, error);
                    return null;
                }
                
                if (!current) {
                    console.error(`  ✗ ${methodName}() returned null/undefined`);
                    return null;
                }
                
                console.log(`  ✓ Result:`, current.constructor?.name || typeof current);
            } else {
                // Property access (e.g., "data")
                current = current[part];
                
                if (!current) {
                    console.error(`  ✗ Property ${part} not found`);
                    return null;
                }
                
                console.log(`  ↳ Accessed property: ${part}`);
            }
        }
        
        console.log(`%c✓ Chain resolved successfully`, 'color: #10b981; font-weight: bold;');
        return current;
    },

    /**
     * Execute Tree Function
     * Executes a function directly from the tree view and shows result inline
     * Integrates TypeScript definition parameter forms (T078-T083)
     */
    async executeTreeFunction(methodKey, methodPath, headerElement) {
        if (!this.currentRegistryItem) {
            console.error('No registry item available');
            return;
        }

        try {
            // Execute function chain to resolve target object
            let targetObject;
            
            if (methodPath === 'root') {
                // Root level - use current registry item directly
                targetObject = this.currentRegistryItem;
            } else {
                // Parse and execute function chain to get target object
                // methodPath examples:
                // - "root.getMetadata()" → execute getMetadata() on root
                // - "root.getMetadata().getData()" → execute getMetadata() then getData()
                targetObject = this.executeFunctionChain(methodPath);
            }

            if (!targetObject) {
                console.error('Could not resolve path:', methodPath);
                return;
            }

            // Get the method from the resolved object
            const method = targetObject[methodKey];

            if (typeof method !== 'function') {
                console.error(`${methodKey} is not a function on ${methodPath}`);
                return;
            }

            // Get parameter count
            const paramCount = method.length;

            // If method requires parameters, show simple parameter input form
            if (paramCount > 0) {
                await this.showTreeParameterInputForm(methodKey, methodPath, targetObject, method, headerElement);
                return;
            }

            // Try to execute the method (no parameters)
            // Methods with optional parameters (e.g., toString(hardenedFlag?)) have length=0
            const fullPath = `${methodPath}.${methodKey}()`;
            let result;

            try {
                console.log(`%c▶️ Executing: ${fullPath}`, 'color: #667eea; font-weight: bold;');
                result = method.call(targetObject);
            } catch (error) {
                // Method execution failed
                console.warn(`%c⚠️ ${methodKey}() execution failed`, 'color: #f59e0b; font-weight: bold;');
                console.error(error);
                const cleanPath = methodPath.replace('root.', '');
                console.log(`Try: window.$lastRegistryItem${cleanPath ? '.' + cleanPath : ''}.${methodKey}()`);

                // Visual feedback
                headerElement.style.background = '#fff3cd';
                setTimeout(() => { headerElement.style.background = ''; }, 500);
                return;
            }
            
            console.log('%c✓ Result:', 'color: #10b981; font-weight: bold;');
            console.log(result);

            // Get the result container
            const parent = headerElement.closest('.tree-node-function');
            const resultContainer = parent.querySelector('.tree-function-result');

            if (!resultContainer) return;

            // Check if result is a registry item (for recursive display)
            const isResultRegistryItem = result && typeof result === 'object' && 
                result.type && typeof result.type === 'object' && result.type.URType;

            // Build new path for nested results by appending this function call
            const resultPath = `${methodPath}.${methodKey}()`;

            // Format and display the result
            let resultHtml = '';
            
            if (isResultRegistryItem) {
                // Render as nested registry item tree with new executable path
                resultHtml = `
                    <div class="tree-function-result-header" data-result-toggle="${resultPath}">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="result-toggle-icon" style="cursor: pointer; user-select: none;">▼</span>
                            <span class="result-icon">✓</span>
                            <span class="result-label">Result (Registry Item):</span>
                            <span class="result-type">${result.constructor.name}</span>
                        </div>
                    </div>
                    <div class="tree-function-result-value" data-result-content="${resultPath}">
                        ${this.renderTreeChildren(result, resultPath, 0)}
                    </div>
                `;
            } else {
                // Regular result
                const formattedResult = this.formatTreeValue(result);
                const resultType = this.getValueType(result);
                
                resultHtml = `
                    <div class="tree-function-result-header" data-result-toggle="${resultPath}">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="result-toggle-icon" style="cursor: pointer; user-select: none;">▼</span>
                            <span class="result-icon">✓</span>
                            <span class="result-label">Result:</span>
                            <span class="result-type">${resultType}</span>
                        </div>
                    </div>
                    <div class="tree-function-result-value" data-result-content="${resultPath}">
                        <pre style="margin: 0; font-family: inherit; white-space: pre-wrap;">${formattedResult}</pre>
                    </div>
                `;
            }

            resultContainer.innerHTML = resultHtml;
            resultContainer.style.display = 'block';

            // Attach toggle handler for result minimize/expand
            const resultToggleHeader = resultContainer.querySelector(`[data-result-toggle="${resultPath}"]`);
            const resultContent = resultContainer.querySelector(`[data-result-content="${resultPath}"]`);
            const resultToggleIcon = resultToggleHeader?.querySelector('.result-toggle-icon');
            
            if (resultToggleHeader && resultContent && resultToggleIcon) {
                resultToggleHeader.style.cursor = 'pointer';
                resultToggleHeader.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isHidden = resultContent.style.display === 'none';
                    resultContent.style.display = isHidden ? 'block' : 'none';
                    resultToggleIcon.textContent = isHidden ? '▼' : '▶';
                });
            }

            // If result is expandable object/array, attach expand/collapse handlers
            if (isResultRegistryItem || (result && typeof result === 'object')) {
                resultContainer.querySelectorAll('.tree-node-header').forEach(header => {
                    header.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const parent = header.closest('.tree-node');
                        const children = parent.querySelector('.tree-children');
                        const icon = header.querySelector('.tree-expand-icon');

                        if (children) {
                            children.classList.toggle('collapsed');
                            if (icon) {
                                icon.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
                            }
                        }
                    });
                });

                // Recursively attach function handlers if result has functions
                resultContainer.querySelectorAll('.tree-function-header').forEach(funcHeader => {
                    funcHeader.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const key = funcHeader.getAttribute('data-method-key');
                        const path = funcHeader.getAttribute('data-method-path');
                        
                        // Use the same executeTreeFunction to handle nested paths
                        this.executeTreeFunction(key, path, funcHeader);
                    });
                });
            }

            // Visual feedback - change icon temporarily
            const icon = headerElement.querySelector('.tree-function-icon');
            if (icon) {
                icon.textContent = '✓';
                icon.style.color = '#10b981';
                setTimeout(() => {
                    icon.textContent = '▶️';
                    icon.style.color = '';
                }, 1000);
            }

        } catch (error) {
            console.error(`Error executing ${methodKey}:`, error);
            
            const parent = headerElement.closest('.tree-node-function');
            const resultContainer = parent.querySelector('.tree-function-result');
            
            if (resultContainer) {
                resultContainer.innerHTML = `
                    <div style="color: #dc2626; padding: 8px; background: #fee2e2; border-radius: 4px; border-left: 3px solid #dc2626;">
                        <strong>Error:</strong> ${error.message}
                    </div>
                `;
                resultContainer.style.display = 'block';
            }
        }
    },

    /**
     * Execute Nested Function
     * For functions on result objects (recursive execution)
     */
    executeNestedFunction(obj, methodKey, _methodPath, headerElement) {
        try {
            const method = obj[methodKey];
            
            if (typeof method !== 'function') {
                console.error(`${methodKey} is not a function`);
                return;
            }

            const paramCount = method.length;

            if (paramCount > 0) {
                console.warn(`%c⚠️ ${methodKey}() requires ${paramCount} parameter(s)`, 'color: #f59e0b; font-weight: bold;');
                return;
            }

            console.log(`%c▶️ Executing nested: ${methodKey}()`, 'color: #667eea; font-weight: bold;');
            const result = method.call(obj);
            
            console.log('%c✓ Result:', 'color: #10b981; font-weight: bold;');
            console.log(result);

            const parent = headerElement.closest('.tree-node-function');
            const resultContainer = parent.querySelector('.tree-function-result');

            if (!resultContainer) return;

            const formattedResult = this.formatTreeValue(result);
            const resultType = this.getValueType(result);
            
            resultContainer.innerHTML = `
                <div class="tree-function-result-header">
                    <span class="result-icon">✓</span>
                    <span class="result-label">Result:</span>
                    <span class="result-type">${resultType}</span>
                </div>
                <div class="tree-function-result-value">
                    <pre style="margin: 0; font-family: inherit; white-space: pre-wrap;">${formattedResult}</pre>
                </div>
            `;
            resultContainer.style.display = 'block';

        } catch (error) {
            console.error(`Error executing ${methodKey}:`, error);
        }
    },

    /**
     * Execute Method (Inline or Console Hint)
     * FR-042: No-param methods execute directly, results expand in-place in tree view
     * FR-043: Parameterized methods show console hint with signature
     */
    async executeMethodToConsole(methodName) {
        if (!this.currentRegistryItem) {
            console.error('No registry item available');
            this.showCopyFeedback('No registry item available', false);
            return;
        }

        try {
            const method = this.currentRegistryItem[methodName];
            if (typeof method !== 'function') {
                console.error(`Method ${methodName} is not a function`);
                this.showCopyFeedback(`${methodName} is not a function`, false);
                return;
            }

            // Get method parameter count (length excludes this)
            const paramCount = method.length;

            if (paramCount === 0) {
                // No parameters - execute inline and display result in tree view (FR-042)
                console.log(`%c🔧 Executing: $lastRegistryItem.${methodName}()`, 'color: #667eea; font-weight: bold; font-size: 13px;');
                const result = method.call(this.currentRegistryItem);

                // Log the result with formatting
                console.log('%c📤 Result:', 'color: #10b981; font-weight: bold;');
                console.log(result);

                // Show inline result in tree view
                this.showInlineMethodResult(methodName, result);

                this.showCopyFeedback(`✓ ${methodName}() executed - result shown below`);
            } else {
                // Show console hint (FR-043) for methods with parameters
                const signature = this.getMethodSignature(methodName, method);
                const hint = `window.$lastRegistryItem.${methodName}(${this.getPlaceholderParams(paramCount)}) // Copy to console and fill parameters`;

                console.log(`%c💡 Method requires ${paramCount} parameter(s)`, 'color: #f59e0b; font-weight: bold; font-size: 13px;');
                console.log(`%c${signature}`, 'color: #8b5cf6; font-size: 12px;');
                console.log(`%cCopy this to console:`, 'color: #6366f1; font-weight: bold;');
                console.log(hint);

                this.showConsoleHint(methodName, hint, signature);
                this.showCopyFeedback('Method call hint shown - see console');
            }
        } catch (err) {
            console.error(`Error executing ${methodName}:`, err);
            this.showCopyFeedback(`Error: ${err.message}`, false);
        }
    },

    /**
     * Get Method Signature
     * Attempt to extract parameter names from function toString()
     */
    getMethodSignature(methodName, method) {
        try {
            const fnStr = method.toString();
            const paramMatch = fnStr.match(/\(([^)]*)\)/);
            if (paramMatch && paramMatch[1].trim()) {
                return `${methodName}(${paramMatch[1].trim()})`;
            }
        } catch (e) {
            // Fallback if toString fails
        }
        return `${methodName}(...)`;
    },

    /**
     * Get Placeholder Parameters
     */
    getPlaceholderParams(count) {
        const placeholders = [];
        for (let i = 0; i < count; i++) {
            placeholders.push(`param${i + 1}`);
        }
        return placeholders.join(', ');
    },

    /**
     * Show Inline Method Result (FR-042)
     * Display result in-place in the tree view
     */
    showInlineMethodResult(methodName, result) {
        // Find or create result container for this method
        let resultContainer = document.getElementById(`method-result-${methodName}`);
        
        if (!resultContainer) {
            // Create new result container after the method item
            const methodItem = this.methodsContent.querySelector(`[data-method="${methodName}"]`);
            if (methodItem) {
                resultContainer = document.createElement('div');
                resultContainer.id = `method-result-${methodName}`;
                resultContainer.className = 'method-result-container';
                methodItem.after(resultContainer);
            } else {
                // Fallback: create in tree view
                resultContainer = document.createElement('div');
                resultContainer.id = `method-result-${methodName}`;
                resultContainer.className = 'method-result-container';
                this.treeViewContent.appendChild(resultContainer);
            }
        }

        // Check if result is a registry item (FR-044 - recursive inspector)
        // Use the isRegistryItem function from bc-ur library (imported in converter.js)
        const isResultRegistryItem = result && typeof result === 'object' && 
            result.type && typeof result.type === 'object' && result.type.URType;

        if (isResultRegistryItem) {
            // Render as nested tree view (recursive inspector - T064)
            resultContainer.innerHTML = `
                <div class="method-result-header">
                    <span class="result-label">Result of ${methodName}():</span>
                    <span class="result-type">${result.constructor.name}</span>
                </div>
                <div class="nested-tree-view">
                    ${this.renderTreeChildren(result, `result-${methodName}`)}
                </div>
            `;
        } else {
            // Render as simple value
            resultContainer.innerHTML = `
                <div class="method-result-header">
                    <span class="result-label">Result of ${methodName}():</span>
                    <span class="result-type">${typeof result}</span>
                </div>
                <div class="method-result-value">
                    <pre>${this.formatTreeValue(result)}</pre>
                </div>
            `;
        }
    },

    /**
     * Show Console Hint (FR-043)
     * Display hint for parameterized methods
     */
    showConsoleHint(methodName, hint, signature) {
        // Find or create hint container
        let hintContainer = document.getElementById(`console-hint-${methodName}`);

        if (!hintContainer) {
            const methodItem = this.methodsContent.querySelector(`[data-method="${methodName}"]`);
            if (methodItem) {
                hintContainer = document.createElement('div');
                hintContainer.id = `console-hint-${methodName}`;
                hintContainer.className = 'console-hint-container';
                methodItem.after(hintContainer);
            }
        }

        if (hintContainer) {
            hintContainer.innerHTML = `
                <div class="console-hint">
                    <div class="hint-header">
                        <span class="hint-icon">💡</span>
                        <span class="hint-text">Method requires parameters:</span>
                        <code class="hint-signature">${signature}</code>
                    </div>
                    <div class="hint-code">
                        <code>${hint}</code>
                        <button class="copy-hint-btn" data-hint="${hint.replace(/"/g, '&quot;')}">📋 Copy</button>
                    </div>
                </div>
            `;

            // Attach copy handler
            const copyBtn = hintContainer.querySelector('.copy-hint-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copyToClipboardWithFeedback(hint, 'Hint copied to clipboard!');
                });
            }
        }
    },

    /**
     * Show Parameter Input Form (T081 integration)
     * Renders the parameter input form and attaches event handlers
     */
    async showParameterInputForm(methodName, params) {
        // Find or create form container
        let formContainer = document.getElementById(`param-form-${methodName}`);

        if (!formContainer) {
            const methodItem = this.methodsContent.querySelector(`[data-method="${methodName}"]`);
            if (methodItem) {
                formContainer = document.createElement('div');
                formContainer.id = `param-form-${methodName}`;
                formContainer.className = 'param-form-container';
                methodItem.after(formContainer);
            } else {
                // Fallback: create in tree view
                formContainer = document.createElement('div');
                formContainer.id = `param-form-${methodName}`;
                formContainer.className = 'param-form-container';
                this.treeViewContent.appendChild(formContainer);
            }
        }

        // Render the form
        const formHtml = await this.renderParameterInputForm(this.currentRegistryItem, methodName, params);
        formContainer.innerHTML = formHtml;

        // Attach event handlers
        const executeBtn = formContainer.querySelector('.execute-with-params-btn');
        const cancelBtn = formContainer.querySelector('.cancel-params-btn');

        if (executeBtn) {
            executeBtn.addEventListener('click', async () => {
                await this.executeMethodWithParameters(methodName, params, formContainer);
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                formContainer.remove();
            });
        }
    },

    /**
     * Execute Method With Parameters (T082 integration)
     * Collects input values, validates them, and executes the method
     */
    async executeMethodWithParameters(methodName, params, formContainer) {
        try {
            // Collect input values
            const inputValues = [];
            params.forEach((param, index) => {
                const inputId = `param-${methodName}-${index}`;
                const input = document.getElementById(inputId);
                if (input) {
                    inputValues.push(input.value);
                }
            });

            // Validate inputs (T082)
            const errors = this.validateParameterInput(params, inputValues);
            if (errors.length > 0) {
                console.error('Validation errors:', errors);
                this.showCopyFeedback(`Validation error: ${errors[0]}`, false);
                return;
            }

            // Convert input values to appropriate types
            const typedValues = params.map((param, index) => {
                const value = inputValues[index];
                const type = param.type.toLowerCase();

                // Skip optional empty values
                if ((!value || value.trim() === '') && (param.optional || param.defaultValue)) {
                    return undefined;
                }

                // Convert to appropriate type
                if (type.includes('number')) {
                    return Number(value);
                } else if (type.includes('boolean')) {
                    return value === 'true';
                } else {
                    return value;
                }
            }).filter(v => v !== undefined);

            // Execute the method
            const method = this.currentRegistryItem[methodName];
            console.log(`%c🔧 Executing: $lastRegistryItem.${methodName}(${typedValues.map(v => JSON.stringify(v)).join(', ')})`, 'color: #667eea; font-weight: bold; font-size: 13px;');
            const result = method.apply(this.currentRegistryItem, typedValues);

            // Log the result
            console.log('%c📤 Result:', 'color: #10b981; font-weight: bold;');
            console.log(result);

            // Show inline result
            this.showInlineMethodResult(methodName, result);

            // Remove form container
            formContainer.remove();

            this.showCopyFeedback(`✓ ${methodName}() executed successfully`);
        } catch (err) {
            console.error(`Error executing ${methodName} with parameters:`, err);
            this.showCopyFeedback(`Error: ${err.message}`, false);
        }
    },


    /**
     * Show Tree Parameter Input Form
     * Simple parameter form for tree view methods (no TypeScript definitions)
     */
    async showTreeParameterInputForm(methodKey, methodPath, targetObject, method, headerElement) {
        const parent = headerElement.closest('.tree-node-function');
        const resultContainer = parent.querySelector('.tree-function-result');

        if (!resultContainer) return;

        const paramCount = method.length;

        // Generate simple parameter input form
        let formHtml = '<div class="param-input-form" style="margin: 12px 0; padding: 12px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8;">';
        formHtml += `<div style="font-weight: 600; margin-bottom: 8px; font-size: 12px;">Parameters for ${methodKey}()</div>`;

        for (let i = 0; i < paramCount; i++) {
            const inputId = `param-${methodKey}-${i}`;
            formHtml += `
                <div style="margin-bottom: 8px;">
                    <label for="${inputId}" style="display: block; font-size: 11px; margin-bottom: 4px; color: #586069;">
                        param${i + 1}
                    </label>
                    <input type="text" id="${inputId}" data-param-index="${i}" style="width: 100%; padding: 4px 8px; border: 1px solid #e1e4e8; border-radius: 4px; font-size: 11px;" placeholder="Enter value">
                </div>
            `;
        }

        formHtml += `
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="execute-with-params-btn" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    ▶️ Execute
                </button>
                <button class="cancel-params-btn" style="padding: 6px 12px; background: #e1e4e8; color: #24292e; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;

        formHtml += '</div>';

        resultContainer.innerHTML = formHtml;
        resultContainer.style.display = 'block';

        // Attach event handlers
        const executeBtn = resultContainer.querySelector('.execute-with-params-btn');
        const cancelBtn = resultContainer.querySelector('.cancel-params-btn');

        if (executeBtn) {
            executeBtn.addEventListener('click', async () => {
                // Collect input values
                const inputValues = [];
                for (let i = 0; i < paramCount; i++) {
                    const inputId = `param-${methodKey}-${i}`;
                    const input = document.getElementById(inputId);
                    if (input) {
                        let value = input.value.trim();

                        // Try to parse as JSON for objects/arrays, otherwise use as string
                        if (value.startsWith('{') || value.startsWith('[')) {
                            try {
                                value = JSON.parse(value);
                            } catch (e) {
                                // Keep as string if JSON parse fails
                            }
                        } else if (value === 'true' || value === 'false') {
                            value = value === 'true';
                        } else if (!isNaN(value) && value !== '') {
                            value = Number(value);
                        }

                        inputValues.push(value);
                    }
                }

                try {
                    // Execute the method
                    const fullPath = `${methodPath}.${methodKey}()`;
                    console.log(`%c🔧 Executing: ${fullPath} with ${inputValues.map(v => JSON.stringify(v)).join(', ')}`, 'color: #667eea; font-weight: bold;');
                    const result = method.apply(targetObject, inputValues);

                    // Log the result
                    console.log('%c📤 Result:', 'color: #10b981; font-weight: bold;');
                    console.log(result);

                    // Check if result is a registry item
                    const isResultRegistryItem = result && typeof result === 'object' &&
                        result.type && typeof result.type === 'object' && result.type.URType;

                    // Format and display the result
                    let resultHtml = '';

                    if (isResultRegistryItem) {
                        resultHtml = `
                            <div class="tree-function-result-header">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span class="result-icon">✓</span>
                                    <span class="result-label">Result (Registry Item):</span>
                                    <span class="result-type">${result.constructor.name}</span>
                                </div>
                            </div>
                            <div class="tree-function-result-value">
                                ${this.renderTreeChildren(result, `${methodPath}-result`, 0)}
                            </div>
                        `;
                    } else {
                        const formattedResult = this.formatTreeValue(result);
                        const resultType = this.getValueType(result);

                        resultHtml = `
                            <div class="tree-function-result-header">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span class="result-icon">✓</span>
                                    <span class="result-label">Result:</span>
                                    <span class="result-type">${resultType}</span>
                                </div>
                            </div>
                            <div class="tree-function-result-value">
                                <pre style="margin: 0; font-family: inherit; white-space: pre-wrap;">${formattedResult}</pre>
                            </div>
                        `;
                    }

                    resultContainer.innerHTML = resultHtml;
                    resultContainer.style.display = 'block';

                    // Visual feedback
                    const icon = headerElement.querySelector('.tree-function-icon');
                    if (icon) {
                        icon.textContent = '✓';
                        icon.style.color = '#10b981';
                        setTimeout(() => {
                            icon.textContent = '▶️';
                            icon.style.color = '';
                        }, 1000);
                    }

                    this.showCopyFeedback(`✓ ${methodKey}() executed successfully`);
                } catch (err) {
                    console.error(`Error executing ${methodKey} with parameters:`, err);
                    resultContainer.innerHTML = `
                        <div style="color: #dc2626; padding: 8px; background: #fee2e2; border-radius: 4px; border-left: 3px solid #dc2626;">
                            <strong>Error:</strong> ${err.message}
                        </div>
                    `;
                    resultContainer.style.display = 'block';
                    this.showCopyFeedback(`Error: ${err.message}`, false);
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                resultContainer.innerHTML = '';
                resultContainer.style.display = 'none';
            });
        }
    },

    /**
     * Show Copy Feedback Toast
     */
    showCopyFeedback(message, success = true) {
        // Remove existing feedback
        const existing = document.querySelector('.copy-feedback');
        if (existing) {
            existing.remove();
        }

        // Create feedback toast
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.textContent = message;
        feedback.style.background = success ? '#28a745' : '#dc3545';
        document.body.appendChild(feedback);

        // Remove after 2 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }
};
