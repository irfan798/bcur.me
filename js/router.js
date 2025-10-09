/**
 * BC-UR Playground - Hash-based Router
 *
 * Manages tab navigation using window.location.hash.
 * Supports deep links, sessionStorage forwarding with TTL, and cleanup on unload.
 *
 * Valid tabs: #converter, #multi-ur, #scanner, #registry
 * Default: #converter (when hash is empty or invalid)
 */

/**
 * Router Class
 *
 * Handles hash-based tab switching with:
 * - Default routing (#converter when hash invalid/empty)
 * - Deep link support (direct navigation to specific tabs)
 * - hashchange event listening
 * - Tab button click handlers
 * - sessionStorage utilities for cross-tab data forwarding
 */
class Router {
    constructor() {
        this.validTabs = ['converter', 'multi-ur', 'scanner', 'registry'];
        this.defaultTab = 'converter';
        this.currentTab = null;

        // Tab UI elements (initialized in init())
        this.tabButtons = null;
        this.tabContents = null;
    }

    /**
     * Initialize Router
     *
     * Sets up event listeners and activates initial tab based on hash.
     * Call on DOMContentLoaded.
     *
     * Usage:
     *   const router = new Router();
     *   router.init();
     */
    init() {
        // Get tab UI elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Setup tab button click handlers
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = button.getAttribute('data-tab');
                this.navigateTo(tabId);
            });
        });

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Setup cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.clearOnUnload();
        });

        // Activate initial tab based on current hash
        this.handleHashChange();
    }

    /**
     * Handle Hash Change
     *
     * Extracts tab ID from hash and activates tab.
     * Falls back to default tab if hash is invalid.
     */
    handleHashChange() {
        // Extract tab ID from hash (remove # prefix)
        const hash = window.location.hash.slice(1);

        // Validate and fallback to default
        const tabId = this.validTabs.includes(hash) ? hash : this.defaultTab;

        // Activate tab
        this.activateTab(tabId);
    }

    /**
     * Navigate to Tab
     *
     * Updates hash to trigger navigation.
     * Use this method instead of directly setting window.location.hash.
     *
     * @param {string} tabId - Tab identifier (e.g., 'converter', 'multi-ur')
     */
    navigateTo(tabId) {
        if (!this.validTabs.includes(tabId)) {
            console.warn('Invalid tab ID:', tabId, '- falling back to', this.defaultTab);
            tabId = this.defaultTab;
        }

        // Update hash (triggers hashchange event)
        window.location.hash = tabId;
    }

    /**
     * Activate Tab
     *
     * Updates UI to show selected tab and hide others.
     * Updates button active states.
     *
     * @param {string} tabId - Tab identifier
     */
    activateTab(tabId) {
        // Skip if already active
        if (this.currentTab === tabId) {
            return;
        }

        this.currentTab = tabId;

        // Update tab content visibility
        this.tabContents.forEach(content => {
            const contentId = content.id.replace('-tab', '');
            if (contentId === tabId) {
                content.classList.remove('hidden');
                content.classList.add('active');
            } else {
                content.classList.add('hidden');
                content.classList.remove('active');
            }
        });

        // Update button active states
        this.tabButtons.forEach(button => {
            const buttonTab = button.getAttribute('data-tab');
            if (buttonTab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        console.log('Activated tab:', tabId);
    }

    /**
     * Get Current Tab
     *
     * @returns {string} Current tab identifier
     */
    getCurrentTab() {
        return this.currentTab || this.defaultTab;
    }

    /**
     * Clear Session Storage on Unload
     *
     * Removes all temporary cross-tab forwarding data when page unloads.
     * Follows constitution principle II: Client-First Architecture
     * (no persistent data retention)
     */
    clearOnUnload() {
        // Get all keys with our prefix
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith('bcur_')) {
                keys.push(key);
            }
        }

        // Remove all prefixed items
        keys.forEach(key => sessionStorage.removeItem(key));

        console.log('Session storage cleared on unload');
    }
}

/**
 * SessionStorage Utilities
 *
 * Helper functions for cross-tab data forwarding with Time-To-Live (TTL).
 * Data expires after 1 hour or on page unload (whichever comes first).
 *
 * Key format: bcur_{tabId}_{dataType}
 * Value format: { data, timestamp, ttl }
 */

/**
 * Set Session Storage Item with TTL
 *
 * Stores data with expiration timestamp.
 *
 * @param {string} key - Storage key (will be prefixed with 'bcur_')
 * @param {*} value - Value to store (will be JSON serialized)
 * @param {number} ttlMs - Time to live in milliseconds (default: 1 hour)
 */
export function setSessionItem(key, value, ttlMs = 3600000) {
    const item = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlMs
    };

    try {
        sessionStorage.setItem('bcur_' + key, JSON.stringify(item));
    } catch (err) {
        console.error('Failed to set session storage item:', err);
    }
}

/**
 * Get Session Storage Item with Expiration Check
 *
 * Retrieves data and removes if expired.
 *
 * @param {string} key - Storage key (will be prefixed with 'bcur_')
 * @returns {*} Stored value or null if not found/expired
 */
export function getSessionItem(key) {
    try {
        const itemStr = sessionStorage.getItem('bcur_' + key);

        if (!itemStr) {
            return null;
        }

        const item = JSON.parse(itemStr);

        // Check expiration
        const now = Date.now();
        const age = now - item.timestamp;

        if (age > item.ttl) {
            // Expired - remove and return null
            sessionStorage.removeItem('bcur_' + key);
            return null;
        }

        return item.data;
    } catch (err) {
        console.error('Failed to get session storage item:', err);
        return null;
    }
}

/**
 * Remove Session Storage Item
 *
 * @param {string} key - Storage key (will be prefixed with 'bcur_')
 */
export function removeSessionItem(key) {
    try {
        sessionStorage.removeItem('bcur_' + key);
    } catch (err) {
        console.error('Failed to remove session storage item:', err);
    }
}

/**
 * Forward Data to Tab
 *
 * Convenience function for cross-tab data forwarding.
 * Stores data in sessionStorage and navigates to target tab.
 *
 * Usage:
 *   // From converter tab: forward UR to multi-UR generator
 *   forwardToTab('multi-ur', 'input', urString);
 *
 * @param {string} targetTab - Target tab ID
 * @param {string} dataType - Data type identifier (e.g., 'input', 'result')
 * @param {*} data - Data to forward
 * @param {Router} router - Router instance for navigation
 */
export function forwardToTab(targetTab, dataType, data, router) {
    const key = targetTab + '_' + dataType;
    setSessionItem(key, data);

    if (router) {
        router.navigateTo(targetTab);
    }
}

// Export Router class
export default Router;
