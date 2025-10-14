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

        // Render all panels
        this.renderTreeView(registryItem);
        this.renderMethods(registryItem);
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
     * Creates a DevTools-style collapsible property inspector
     */
    renderTreeView(registryItem) {
        if (!this.treeViewContent) return;

        const constructorName = registryItem.constructor.name;
        const html = `
            <div class="tree-node">
                <div class="tree-node-header">
                    <span class="tree-key">${constructorName}</span>
                    <span class="tree-type">(Registry Item)</span>
                </div>
                <div class="tree-children">
                    ${this.renderTreeChildren(registryItem, 'root')}
                </div>
            </div>
        `;

        this.treeViewContent.innerHTML = html;

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
    },

    /**
     * Render Tree Children Recursively
     */
    renderTreeChildren(obj, path, depth = 0) {
        if (depth > 10) return '<span class="tree-value">[Max depth reached]</span>'; // Prevent infinite recursion

        const items = [];
        const keys = Object.keys(obj);

        keys.forEach(key => {
            const value = obj[key];
            const valuePath = `${path}.${key}`;
            const valueType = this.getValueType(value);
            const isExpandable = this.isExpandableValue(value);

            if (isExpandable) {
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
            const hex = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
            return `0x${hex.substring(0, 20)}${hex.length > 20 ? '...' : ''}`;
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

        // Console hint message
        html += `
            <div class="console-hint-message">
                💡 <strong>Tip:</strong> Click ▶️ to execute methods and see results in the browser console.
                Press <kbd>F12</kbd> or <kbd>Ctrl+Shift+I</kbd> to open DevTools.
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
            { name: 'toUR', description: 'Convert to UR string', signature: 'toUR(): UR' },
            { name: 'getRegistryType', description: 'Get registry type info', signature: 'getRegistryType(): RegistryType' },
            { name: 'toCBOR', description: 'Encode to CBOR bytes', signature: 'toCBOR(): Uint8Array' },
            { name: 'toHex', description: 'Encode to hex string', signature: 'toHex(): string' }
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
                    const ur = this.currentRegistryItem.toUR ? this.currentRegistryItem.toUR() : null;
                    text = ur ? ur.toString() : '';
                    break;

                case 'code':
                    // Generate JavaScript code to recreate this registry item
                    const hex = this.currentRegistryItem.toHex ? this.currentRegistryItem.toHex() : '';

                    // Get registry type info if available
                    const registryType = this.currentRegistryItem.getRegistryType?.();
                    const urType = registryType?.URType || 'unknown';
                    const urString = this.currentRegistryItem.toUR?.().toString() || `ur:${urType}/...`;

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
console.log('UR type:', item.getRegistryType());
console.log('UR string:', item.toUR().toString());`;
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
     * Execute Method and Log to Console
     * Executes a registry item method and displays the result in the browser console
     */
    executeMethodToConsole(methodName) {
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

            // Execute the method
            console.log(`%c🔧 Executing: $lastRegistryItem.${methodName}()`, 'color: #667eea; font-weight: bold; font-size: 13px;');
            const result = method.call(this.currentRegistryItem);

            // Log the result with formatting
            console.log('%c📤 Result:', 'color: #10b981; font-weight: bold;');
            console.log(result);
            console.log(''); // Empty line for spacing

            this.showCopyFeedback(`✓ ${methodName}() executed - check console!`);
        } catch (err) {
            console.error(`Error executing ${methodName}:`, err);
            this.showCopyFeedback(`Error: ${err.message}`, false);
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
