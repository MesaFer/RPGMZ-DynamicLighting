/**
 * DynamicLighting - Shader Loader
 * Loads and compiles GLSL shaders from external files
 * @module DynamicLighting/shaders/ShaderLoader
 */

(function() {
    'use strict';

    const SHADER_PATH = 'js/plugins/DynamicLighting/shaders/';
    
    // Cache for loaded shaders
    const _shaderCache = {};
    
    // Pending shader loads
    const _pendingLoads = {};

    /**
     * Load a shader file asynchronously
     * @param {string} filename - Shader filename (e.g., 'lighting.frag')
     * @returns {Promise<string>} Shader source code
     */
    function loadShaderAsync(filename) {
        // Return from cache if available
        if (_shaderCache[filename]) {
            return Promise.resolve(_shaderCache[filename]);
        }
        
        // Return existing promise if already loading
        if (_pendingLoads[filename]) {
            return _pendingLoads[filename];
        }
        
        // Create new load promise
        const promise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', SHADER_PATH + filename, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        _shaderCache[filename] = xhr.responseText;
                        delete _pendingLoads[filename];
                        resolve(xhr.responseText);
                    } else {
                        delete _pendingLoads[filename];
                        reject(new Error('Failed to load shader: ' + filename + ' (status: ' + xhr.status + ')'));
                    }
                }
            };
            xhr.onerror = function() {
                delete _pendingLoads[filename];
                reject(new Error('Network error loading shader: ' + filename));
            };
            xhr.send();
        });
        
        _pendingLoads[filename] = promise;
        return promise;
    }

    /**
     * Load a shader file synchronously (blocking)
     * @param {string} filename - Shader filename
     * @returns {string} Shader source code
     */
    function loadShaderSync(filename) {
        // Return from cache if available
        if (_shaderCache[filename]) {
            return _shaderCache[filename];
        }
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', SHADER_PATH + filename, false); // Synchronous
        xhr.send();
        
        if (xhr.status === 200) {
            _shaderCache[filename] = xhr.responseText;
            return xhr.responseText;
        } else {
            throw new Error('Failed to load shader: ' + filename);
        }
    }

    /**
     * Preload multiple shaders
     * @param {string[]} filenames - Array of shader filenames
     * @returns {Promise<Object>} Object with filename -> source mapping
     */
    function preloadShaders(filenames) {
        const promises = filenames.map(filename => 
            loadShaderAsync(filename).then(source => ({ filename, source }))
        );
        
        return Promise.all(promises).then(results => {
            const shaders = {};
            results.forEach(({ filename, source }) => {
                shaders[filename] = source;
            });
            return shaders;
        });
    }

    /**
     * Process shader source - replace template variables
     * @param {string} source - Shader source code
     * @param {Object} replacements - Object with variable replacements (e.g., { MAX_LIGHTS: 50 })
     * @returns {string} Processed shader source
     */
    function processShader(source, replacements) {
        let processed = source;
        
        for (const [key, value] of Object.entries(replacements)) {
            // Replace ${KEY} style placeholders
            const regex = new RegExp('\\$\\{' + key + '\\}', 'g');
            processed = processed.replace(regex, String(value));
        }
        
        return processed;
    }

    /**
     * Clear the shader cache
     */
    function clearCache() {
        for (const key in _shaderCache) {
            delete _shaderCache[key];
        }
    }

    /**
     * Get a cached shader
     * @param {string} filename - Shader filename
     * @returns {string|null} Shader source or null if not cached
     */
    function getCached(filename) {
        return _shaderCache[filename] || null;
    }

    /**
     * Check if a shader is cached
     * @param {string} filename - Shader filename
     * @returns {boolean} True if shader is cached
     */
    function isCached(filename) {
        return filename in _shaderCache;
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.ShaderLoader = {
        loadShaderAsync,
        loadShaderSync,
        preloadShaders,
        processShader,
        clearCache,
        getCached,
        isCached,
        SHADER_PATH
    };

})();
