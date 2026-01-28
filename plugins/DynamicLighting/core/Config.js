/**
 * DynamicLighting - Configuration Manager
 * @module DynamicLighting/core/Config
 */

(function() {
    'use strict';

    const pluginName = 'DynamicLighting';

    /**
     * Default configuration values
     */
    const DEFAULTS = {
        // Ambient light
        ambientColor: '#1a1a2e',
        ambientIntensity: 0.2,
        
        // Default light properties
        defaultRadius: 150,
        defaultIntensity: 1.0,
        defaultColor: '#ffffff',
        maxLights: 50,
        
        // Sun light
        sunDirection: 135,
        sunIntensity: 0.8,
        sunColor: '#fffae0',
        
        // Shadows
        shadowsEnabled: true,
        shadowMapResolution: 1536,
        shadowSoftness: 8,
        
        // Sun shadows
        sunShadowSoftness: 0,
        sunShadowPrecision: 2,
        sunShadowStrength: 0.85,
        sunShadowLength: 3.0,
        sunShadowFalloff: 'smooth',
        
        // Obstacle detection
        obstacleDetectionMode: 'tiledetector', // 'regions', 'tiledetector', 'both'
        wallShadowEnabled: true,
        
        // Debug
        debug: false
    };

    /**
     * Configuration manager class
     */
    class ConfigManager {
        constructor() {
            this._config = Object.assign({}, DEFAULTS);
            this._initialized = false;
        }

        /**
         * Initialize configuration from plugin parameters
         * @param {string} pluginName - Name of the plugin to read parameters from
         */
        initialize(pluginName) {
            if (this._initialized) return;
            
            const parameters = PluginManager.parameters(pluginName);
            
            // Parse all parameters
            this._config.ambientColor = String(parameters['AmbientColor'] || DEFAULTS.ambientColor);
            this._config.ambientIntensity = Number(parameters['AmbientIntensity'] || DEFAULTS.ambientIntensity);
            this._config.defaultRadius = Number(parameters['DefaultLightRadius'] || DEFAULTS.defaultRadius);
            this._config.defaultIntensity = Number(parameters['DefaultLightIntensity'] || DEFAULTS.defaultIntensity);
            this._config.defaultColor = String(parameters['DefaultLightColor'] || DEFAULTS.defaultColor);
            this._config.maxLights = Number(parameters['MaxLights'] || DEFAULTS.maxLights);
            
            // Sun light
            this._config.sunDirection = Number(parameters['DefaultSunDirection'] || DEFAULTS.sunDirection);
            this._config.sunIntensity = Number(parameters['DefaultSunIntensity'] || DEFAULTS.sunIntensity);
            this._config.sunColor = String(parameters['DefaultSunColor'] || DEFAULTS.sunColor);
            
            this._initialized = true;
        }

        /**
         * Get a configuration value
         * @param {string} key - Configuration key
         * @returns {*} Configuration value
         */
        get(key) {
            return this._config[key];
        }

        /**
         * Set a configuration value
         * @param {string} key - Configuration key
         * @param {*} value - Configuration value
         */
        set(key, value) {
            this._config[key] = value;
        }

        /**
         * Get all configuration as object
         * @returns {Object} Full configuration object
         */
        getAll() {
            return Object.assign({}, this._config);
        }

        /**
         * Get defaults
         * @returns {Object} Default configuration
         */
        getDefaults() {
            return Object.assign({}, DEFAULTS);
        }
    }

    // Create singleton instance
    const instance = new ConfigManager();

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.Config = instance;
    window.DynamicLighting.CONFIG_DEFAULTS = DEFAULTS;

})();
