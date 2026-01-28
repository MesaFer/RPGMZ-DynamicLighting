/**
 * DynamicLighting - Debug Utilities
 * @module DynamicLighting/core/Debug
 */

(function() {
    'use strict';

    let _debugEnabled = false;
    let _frameCount = 0;

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether debug mode is enabled
     */
    function setDebugEnabled(enabled) {
        _debugEnabled = enabled;
    }

    /**
     * Check if debug mode is enabled
     * @returns {boolean} Whether debug mode is enabled
     */
    function isDebugEnabled() {
        return _debugEnabled;
    }

    /**
     * Log a debug message
     * @param {...*} args - Arguments to log
     */
    function log(...args) {
        if (_debugEnabled) {
            console.log('[DynamicLighting]', ...args);
        }
    }

    /**
     * Log a warning message (always shown)
     * @param {...*} args - Arguments to log
     */
    function warn(...args) {
        console.warn('[DynamicLighting]', ...args);
    }

    /**
     * Log an error message (always shown)
     * @param {...*} args - Arguments to log
     */
    function error(...args) {
        console.error('[DynamicLighting]', ...args);
    }

    /**
     * Log a message only every N frames
     * @param {number} interval - Frame interval for logging
     * @param {...*} args - Arguments to log
     */
    function logThrottled(interval, ...args) {
        if (_debugEnabled && _frameCount % interval === 0) {
            console.log('[DynamicLighting]', ...args);
        }
    }

    /**
     * Increment frame counter (call once per frame)
     */
    function incrementFrame() {
        _frameCount++;
    }

    /**
     * Get current frame count
     * @returns {number} Current frame count
     */
    function getFrameCount() {
        return _frameCount;
    }

    /**
     * Reset frame counter
     */
    function resetFrameCount() {
        _frameCount = 0;
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.Debug = {
        setDebugEnabled,
        isDebugEnabled,
        log,
        warn,
        error,
        logThrottled,
        incrementFrame,
        getFrameCount,
        resetFrameCount
    };

})();
