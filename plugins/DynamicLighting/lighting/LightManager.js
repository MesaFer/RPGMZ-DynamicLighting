/**
 * DynamicLighting - Light Manager
 * Manages light sources (events, player, custom lights)
 * @module DynamicLighting/lighting/LightManager
 */

(function() {
    'use strict';

    const Utils = window.DynamicLighting.Utils;
    const Config = window.DynamicLighting.Config;
    const Debug = window.DynamicLighting.Debug;

    /**
     * Light Manager class
     * Handles collection and management of light sources
     */
    class LightManager {
        constructor() {
            this._customLights = [];
            this._activeLights = [];
            this._playerLight = null;
        }

        /**
         * Create a light data object
         * @param {Object} options - Light options
         * @returns {Object} Light data object
         */
        createLight(options = {}) {
            const config = Config.getAll();
            const color = options.color || config.defaultColor;
            
            return {
                enabled: options.enabled !== false,
                x: options.x || 0,
                y: options.y || 0,
                radius: options.radius || config.defaultRadius,
                intensity: options.intensity || config.defaultIntensity,
                color: color,
                colorRgb: Utils.hexToRgb(color),
                isSpotlight: options.isSpotlight || false,
                direction: options.direction ? Utils.degToRad(options.direction) : 0,
                coneAngle: options.coneAngle ? Utils.degToRad(options.coneAngle / 2) : Math.PI,
                innerRadius: options.innerRadius || 0,
                followDirection: options.followDirection || false
            };
        }

        /**
         * Create a spotlight data object
         * @param {Object} options - Spotlight options
         * @returns {Object} Spotlight data object
         */
        createSpotlight(options = {}) {
            const light = this.createLight(options);
            light.isSpotlight = true;
            light.direction = Utils.degToRad(options.direction || 90);
            light.coneAngle = Utils.degToRad((options.coneAngle || 45) / 2);
            return light;
        }

        /**
         * Set player light
         * @param {boolean} enabled - Whether player light is enabled
         */
        setPlayerLight(enabled) {
            if (enabled) {
                this._playerLight = this.createLight({
                    enabled: true
                });
            } else {
                this._playerLight = null;
            }
        }

        /**
         * Set player light parameters
         * @param {number} radius - Light radius
         * @param {number} intensity - Light intensity
         * @param {string} color - Light color
         */
        setPlayerLightParams(radius, intensity, color) {
            if (!this._playerLight) {
                this.setPlayerLight(true);
            }
            if (radius !== undefined) this._playerLight.radius = radius;
            if (intensity !== undefined) this._playerLight.intensity = intensity;
            if (color !== undefined) {
                this._playerLight.color = color;
                this._playerLight.colorRgb = Utils.hexToRgb(color);
            }
        }

        /**
         * Set player light as spotlight
         * @param {number} direction - Direction in degrees
         * @param {number} coneAngle - Cone angle in degrees
         * @param {number} innerRadius - Inner radius
         * @param {boolean} followDirection - Follow player direction
         */
        setPlayerSpotlight(direction, coneAngle, innerRadius, followDirection) {
            if (!this._playerLight) {
                this.setPlayerLight(true);
            }
            this._playerLight.isSpotlight = true;
            this._playerLight.direction = Utils.degToRad(direction);
            this._playerLight.coneAngle = Utils.degToRad(coneAngle / 2);
            this._playerLight.innerRadius = innerRadius || 0;
            this._playerLight.followDirection = followDirection !== false;
        }

        /**
         * Convert player spotlight back to point light
         */
        setPlayerLightToPoint() {
            if (this._playerLight) {
                this._playerLight.isSpotlight = false;
                this._playerLight.coneAngle = Math.PI;
                this._playerLight.innerRadius = 0;
                this._playerLight.followDirection = false;
            }
        }

        /**
         * Get player light
         * @returns {Object|null} Player light data
         */
        getPlayerLight() {
            return this._playerLight;
        }

        /**
         * Add a custom light
         * @param {string} id - Unique light ID
         * @param {Object} options - Light options
         * @returns {Object} Light data object
         */
        addCustomLight(id, options) {
            const light = this.createLight(options);
            light.id = id;
            this._customLights.push(light);
            return light;
        }

        /**
         * Remove a custom light
         * @param {string} id - Light ID
         */
        removeCustomLight(id) {
            const index = this._customLights.findIndex(l => l.id === id);
            if (index >= 0) {
                this._customLights.splice(index, 1);
            }
        }

        /**
         * Get a custom light by ID
         * @param {string} id - Light ID
         * @returns {Object|null} Light data or null
         */
        getCustomLight(id) {
            return this._customLights.find(l => l.id === id) || null;
        }

        /**
         * Update a custom light
         * @param {string} id - Light ID
         * @param {Object} options - Light options to update
         */
        updateCustomLight(id, options) {
            const light = this.getCustomLight(id);
            if (light) {
                if (options.x !== undefined) light.x = options.x;
                if (options.y !== undefined) light.y = options.y;
                if (options.radius !== undefined) light.radius = options.radius;
                if (options.intensity !== undefined) light.intensity = options.intensity;
                if (options.color !== undefined) {
                    light.color = options.color;
                    light.colorRgb = Utils.hexToRgb(options.color);
                }
                if (options.enabled !== undefined) light.enabled = options.enabled;
            }
        }

        /**
         * Clear all custom lights
         */
        clearCustomLights() {
            this._customLights = [];
        }

        /**
         * Collect all active lights for rendering
         * @param {number} screenWidth - Screen width for culling
         * @param {number} screenHeight - Screen height for culling
         * @returns {Array} Array of active light data objects
         */
        collectLights(screenWidth, screenHeight) {
            this._activeLights = [];
            
            // Collect event lights
            if ($gameMap && $gameMap.events) {
                const events = $gameMap.events();
                for (const event of events) {
                    if (event && event.hasLight && event.hasLight()) {
                        const data = event.getLightData();
                        const x = event.screenX();
                        const y = event.screenY() - 24; // Offset for character center
                        const radius = data.radius;
                        
                        // Off-screen culling
                        if (x + radius < 0 || x - radius > screenWidth ||
                            y + radius < 0 || y - radius > screenHeight) {
                            continue;
                        }
                        
                        this._activeLights.push({
                            x: x,
                            y: y,
                            radius: radius,
                            intensity: data.intensity,
                            color: data.color,
                            colorRgb: data.colorRgb,
                            isSpotlight: data.isSpotlight,
                            direction: data.direction,
                            coneAngle: data.coneAngle,
                            innerRadius: data.innerRadius
                        });
                    }
                }
            }
            
            // Add player light
            if (this._playerLight && this._playerLight.enabled && $gamePlayer) {
                let direction = this._playerLight.direction;
                
                if (this._playerLight.isSpotlight && this._playerLight.followDirection) {
                    direction = Utils.degToRad(Utils.directionToAngle($gamePlayer.direction()));
                }
                
                this._activeLights.push({
                    x: $gamePlayer.screenX(),
                    y: $gamePlayer.screenY() - 24,
                    radius: this._playerLight.radius,
                    intensity: this._playerLight.intensity,
                    color: this._playerLight.color,
                    colorRgb: this._playerLight.colorRgb,
                    isSpotlight: this._playerLight.isSpotlight,
                    direction: direction,
                    coneAngle: this._playerLight.coneAngle,
                    innerRadius: this._playerLight.innerRadius
                });
            }
            
            // Add custom lights
            for (const light of this._customLights) {
                if (!light.enabled) continue;
                
                // Off-screen culling
                if (light.x + light.radius < 0 || light.x - light.radius > screenWidth ||
                    light.y + light.radius < 0 || light.y - light.radius > screenHeight) {
                    continue;
                }
                
                this._activeLights.push(light);
            }
            
            return this._activeLights;
        }

        /**
         * Get the last collected active lights
         * @returns {Array} Array of active lights
         */
        getActiveLights() {
            return this._activeLights;
        }
    }

    // Create singleton instance
    const instance = new LightManager();

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.LightManager = instance;
    window.DynamicLighting.LightManagerClass = LightManager;

})();
