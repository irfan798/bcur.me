/**
 * BC-UR Playground - Registry Package Loader
 *
 * Dynamic ESM import wrapper for ur-registry packages.
 * Loads packages on-demand to avoid blocking initial page load.
 *
 * Supported packages (6 total):
 * - blockchain-commons: Core BC registry types (crypto-seed, crypto-hdkey, etc.)
 * - coin-identity: Coin identity type
 * - sync: Account and portfolio types
 * - hex-string: Hex string encoding type
 * - sign: Sign request/response protocol types
 * - uuid: UUID type
 */

/**
 * Package Configuration
 *
 * Maps package keys to CDN URLs with version pinning.
 * All packages use @ngraveio scope and esm.sh CDN.
 */
const PACKAGE_CONFIG = {
    'blockchain-commons': {
        name: '@ngraveio/ur-blockchain-commons',
        version: '2.0.1-beta.2',
        description: 'BlockChain Commons types (crypto-seed, crypto-hdkey, crypto-psbt, etc.)'
    },
    'coin-identity': {
        name: '@ngraveio/ur-coin-identity',
        version: '2.0.1-beta.2',
        description: 'Coin identity type'
    },
    'sync': {
        name: '@ngraveio/ur-sync',
        version: '2.0.1-beta.2',
        description: 'Account and portfolio sync types'
    },
    'hex-string': {
        name: '@ngraveio/ur-hex-string',
        version: '2.0.1-beta.2',
        description: 'Hex string encoding type'
    },
    'sign': {
        name: '@ngraveio/ur-sign',
        version: '2.0.1-beta.2',
        description: 'Sign request and response protocol types'
    },
    'uuid': {
        name: '@ngraveio/ur-uuid',
        version: '2.0.1-beta.2',
        description: 'UUID type'
    }
};

/**
 * Build CDN URL
 *
 * Constructs esm.sh URL with version pinning.
 *
 * @param {string} packageName - NPM package name
 * @param {string} version - Package version
 * @returns {string} CDN URL
 */
function buildCdnUrl(packageName, version) {
    return `https://esm.sh/${packageName}@${version}?dev`;
}

/**
 * Package Cache
 *
 * Stores loaded packages to avoid re-importing.
 * Key: package key (e.g., 'blockchain-commons')
 * Value: { module, timestamp, status }
 */
const packageCache = new Map();

/**
 * Load Registry Package
 *
 * Dynamically imports a ur-registry package via CDN.
 * Returns cached version if already loaded.
 *
 * Usage:
 *   const bcModule = await loadRegistryPackage('blockchain-commons');
 *   const { CryptoSeed } = bcModule;
 *
 * @param {string} packageKey - Package key from PACKAGE_CONFIG
 * @returns {Promise<Object>} Package module exports
 * @throws {Error} If package key invalid or import fails
 */
export async function loadRegistryPackage(packageKey) {
    // Validate package key
    if (!PACKAGE_CONFIG[packageKey]) {
        throw new Error(`Invalid package key: ${packageKey}. Valid keys: ${Object.keys(PACKAGE_CONFIG).join(', ')}`);
    }

    // Check cache
    if (packageCache.has(packageKey)) {
        const cached = packageCache.get(packageKey);

        // If loading failed previously, try again
        if (cached.status === 'error') {
            console.warn(`Retrying failed package: ${packageKey}`);
        } else if (cached.status === 'loaded') {
            console.log(`Using cached package: ${packageKey}`);
            return cached.module;
        }
    }

    const config = PACKAGE_CONFIG[packageKey];
    const url = buildCdnUrl(config.name, config.version);

    console.log(`Loading registry package: ${packageKey} from ${url}`);

    try {
        // Dynamic import from CDN
        const module = await import(url);

        // Cache successful load
        packageCache.set(packageKey, {
            module,
            timestamp: Date.now(),
            status: 'loaded',
            config
        });

        console.log(`Successfully loaded: ${packageKey}`);
        return module;

    } catch (err) {
        console.error(`Failed to load package ${packageKey}:`, err);

        // Cache error status (but allow retry)
        packageCache.set(packageKey, {
            module: null,
            timestamp: Date.now(),
            status: 'error',
            error: err.message,
            config
        });

        throw new Error(`Failed to load registry package "${packageKey}": ${err.message}`);
    }
}

/**
 * Load All Registry Packages
 *
 * Loads all 6 ur-registry packages in parallel.
 * Useful for registry browser tab initialization.
 *
 * @returns {Promise<Object>} Map of package keys to loaded modules
 * @throws {Error} If any package fails to load
 */
export async function loadAllRegistryPackages() {
    console.log('Loading all registry packages...');

    const packageKeys = Object.keys(PACKAGE_CONFIG);
    const promises = packageKeys.map(key => loadRegistryPackage(key));

    try {
        const modules = await Promise.all(promises);

        // Build result map
        const result = {};
        packageKeys.forEach((key, index) => {
            result[key] = modules[index];
        });

        console.log('All registry packages loaded successfully');
        return result;

    } catch (err) {
        console.error('Failed to load all registry packages:', err);
        throw err;
    }
}

/**
 * Get Package Info
 *
 * Returns package configuration and load status.
 * Useful for UI display in registry browser.
 *
 * @param {string} packageKey - Package key
 * @returns {Object|null} Package info or null if invalid key
 */
export function getPackageInfo(packageKey) {
    const config = PACKAGE_CONFIG[packageKey];
    if (!config) {
        return null;
    }

    const cached = packageCache.get(packageKey);

    return {
        key: packageKey,
        ...config,
        url: buildCdnUrl(config.name, config.version),
        loaded: cached?.status === 'loaded',
        loadedAt: cached?.timestamp,
        error: cached?.error
    };
}

/**
 * Get All Package Info
 *
 * Returns configuration for all packages.
 *
 * @returns {Array<Object>} Array of package info objects
 */
export function getAllPackageInfo() {
    return Object.keys(PACKAGE_CONFIG).map(key => getPackageInfo(key));
}

/**
 * Clear Package Cache
 *
 * Removes all cached packages (forces reload on next request).
 * Useful for testing or recovery from errors.
 */
export function clearPackageCache() {
    packageCache.clear();
    console.log('Registry package cache cleared');
}

/**
 * Preload Packages
 *
 * Starts loading packages in background without blocking.
 * Returns immediately (does not wait for completion).
 *
 * Usage:
 *   // Start loading in background when app initializes
 *   preloadPackages(['blockchain-commons', 'uuid']);
 *
 * @param {Array<string>} packageKeys - Package keys to preload
 */
export function preloadPackages(packageKeys = Object.keys(PACKAGE_CONFIG)) {
    console.log('Preloading registry packages:', packageKeys);

    packageKeys.forEach(key => {
        loadRegistryPackage(key).catch(err => {
            console.warn(`Preload failed for ${key}:`, err.message);
        });
    });
}

// Export package list for external use
export const AVAILABLE_PACKAGES = Object.keys(PACKAGE_CONFIG);
