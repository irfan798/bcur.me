/**
 * BC-UR Playground - Shared Utilities
 *
 * Common utilities extracted from demo.js for reuse across tabs:
 * - LRUCache: Least Recently Used cache with max size limit
 * - debounce: Function execution delay utility
 * - Error handling: User-facing error messaging with console logging
 */

/**
 * LRU Cache Implementation
 *
 * Maintains a cache with maximum size limit using Least Recently Used eviction policy.
 * When cache exceeds maxSize, the oldest entry is removed.
 *
 * Usage:
 *   const cache = new LRUCache(120);
 *   cache.set('key', { result: 'value' });
 *   const cached = cache.get('key'); // returns { result: 'value' }
 *   cache.has('key'); // returns true
 *   cache.clear(); // removes all entries
 */
export class LRUCache {
    /**
     * @param {number} maxSize - Maximum number of entries (default: 120)
     */
    constructor(maxSize = 120) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined if not found
     */
    get(key) {
        if (!this.cache.has(key)) {
            return undefined;
        }

        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    set(key, value) {
        // Remove if exists (to update position)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Add to end (most recently used)
        this.cache.set(key, value);

        // Evict oldest if over limit
        if (this.cache.size > this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get current cache size
     * @returns {number} Number of cached entries
     */
    get size() {
        return this.cache.size;
    }
}

/**
 * Debounce Function
 *
 * Creates a debounced function that delays execution until after
 * a specified delay has elapsed since the last invocation.
 *
 * Common delays:
 * - 150ms for typing input (reduces excessive conversions)
 * - 10ms for paste events (near-instant but avoids race conditions)
 *
 * Usage:
 *   const debouncedFn = debounce(() => console.log('executed'), 150);
 *   input.addEventListener('input', debouncedFn);
 *
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
    let timeoutId = null;

    return function(...args) {
        // Clear previous timeout
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        // Set new timeout
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
            timeoutId = null;
        }, delay);
    };
}

/**
 * Update Status Message
 *
 * Displays a status message with icon in a status element.
 * Extracted from demo.js FormatConverter.updateStatus()
 *
 * @param {HTMLElement} statusElement - Status display element
 * @param {string} message - Status message text
 * @param {string} type - Message type ('success', 'error', 'info')
 */
export function updateStatus(statusElement, message, type = 'info') {
    if (!statusElement) {
        console.warn('updateStatus called without statusElement');
        return;
    }

    const iconMap = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    statusElement.innerHTML = '<span class="status-icon">' + (iconMap[type] || iconMap.info) + '</span><span>' + message + '</span>';
    statusElement.className = 'status ' + type;
}

/**
 * Handle Error with User-Facing Message
 *
 * Displays error to user and logs to console for debugging.
 * Follows constitution principle IV: Explicit Errors
 *
 * Usage:
 *   try {
 *     // operation
 *   } catch (err) {
 *     handleError(statusElement, err, 'Failed to convert input');
 *   }
 *
 * @param {HTMLElement} statusElement - Status display element
 * @param {Error} error - Error object
 * @param {string} context - Contextual message for user
 */
export function handleError(statusElement, error, context = 'Operation failed') {
    const userMessage = error.message || 'Unknown error';
    const displayMessage = context + ': ' + userMessage;

    // User-facing message
    updateStatus(statusElement, displayMessage, 'error');

    // Console logging for debugging (preserves stack trace)
    console.error(context, error);
}

/**
 * Clear Output and Reset Status
 *
 * Utility for clearing output areas and showing ready state.
 * Extracted pattern from demo.js FormatConverter.clearOutput()
 *
 * @param {HTMLElement} outputElement - Output textarea/element
 * @param {HTMLElement} statusElement - Status display element
 * @param {Function} resetCallback - Optional callback for additional reset (e.g., pipeline viz)
 */
export function clearOutput(outputElement, statusElement, resetCallback = null) {
    if (outputElement) {
        outputElement.value = '';
    }

    if (resetCallback && typeof resetCallback === 'function') {
        resetCallback();
    }

    updateStatus(statusElement, 'Ready for input', 'info');
}
