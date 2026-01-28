/**
 * DynamicLighting - Utility Functions
 * @module DynamicLighting/core/Utils
 */

(function() {
    'use strict';

    /**
     * Convert hex color string to RGB object (0-1 range)
     * @param {string} hex - Hex color string (e.g., "#ff6600" or "ff6600")
     * @returns {{r: number, g: number, b: number}} RGB object with values 0-1
     */
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 1, g: 1, b: 1 };
    }

    /**
     * Convert RGB object to hex color string
     * @param {number} r - Red component (0-1)
     * @param {number} g - Green component (0-1)
     * @param {number} b - Blue component (0-1)
     * @returns {string} Hex color string with # prefix
     */
    function rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    function radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * Get direction angle from RPG Maker direction (2,4,6,8)
     * @param {number} direction - RPG Maker direction (2=down, 4=left, 6=right, 8=up)
     * @returns {number} Angle in degrees (0=right, 90=down, 180=left, 270=up)
     */
    function directionToAngle(direction) {
        switch (direction) {
            case 2: return 90;   // Down
            case 4: return 180;  // Left
            case 6: return 0;    // Right
            case 8: return 270;  // Up
            default: return 90;  // Default down
        }
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Linear interpolation for RGB colors
     * @param {{r: number, g: number, b: number}} colorA - Start color
     * @param {{r: number, g: number, b: number}} colorB - End color
     * @param {number} t - Interpolation factor (0-1)
     * @returns {{r: number, g: number, b: number}} Interpolated color
     */
    function lerpColor(colorA, colorB, t) {
        return {
            r: lerp(colorA.r, colorB.r, t),
            g: lerp(colorA.g, colorB.g, t),
            b: lerp(colorA.b, colorB.b, t)
        };
    }

    /**
     * Smooth step interpolation (ease in/out)
     * @param {number} edge0 - Lower edge
     * @param {number} edge1 - Upper edge
     * @param {number} x - Value to interpolate
     * @returns {number} Smoothed value (0-1)
     */
    function smoothstep(edge0, edge1, x) {
        const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    // Export to global namespace
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.Utils = {
        hexToRgb,
        rgbToHex,
        degToRad,
        radToDeg,
        directionToAngle,
        clamp,
        lerp,
        lerpColor,
        smoothstep
    };

})();
