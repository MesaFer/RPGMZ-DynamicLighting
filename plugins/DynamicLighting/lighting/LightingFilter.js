/**
 * DynamicLighting - Main Lighting Filter
 * @module DynamicLighting/lighting/LightingFilter
 */

(function() {
    'use strict';

    const Utils = window.DynamicLighting.Utils;
    const Config = window.DynamicLighting.Config;
    const Debug = window.DynamicLighting.Debug;
    const ShaderLoader = window.DynamicLighting.ShaderLoader;

    /**
     * Generate fragment shader with dynamic MAX_LIGHTS
     * Loads shader from external .frag file
     * @param {number} maxLights - Maximum number of lights
     * @returns {string} GLSL fragment shader
     */
    function generateFragmentShader(maxLights) {
        const shaderSource = ShaderLoader.loadShaderSync('lighting.frag');
        return ShaderLoader.processShader(shaderSource, {
            MAX_LIGHTS: maxLights
        });
    }

    /**
     * Dynamic Lighting Filter class
     * @extends PIXI.Filter
     */
    class DynamicLightingFilter extends PIXI.Filter {
        constructor(maxLights) {
            const config = Config.getAll();
            maxLights = maxLights || config.maxLights || 50;
            
            const fragmentShader = generateFragmentShader(maxLights);
            super(null, fragmentShader);
            
            this._maxLights = maxLights;
            
            // Initialize uniforms
            this.uniforms.uAmbientColor = [0.1, 0.1, 0.18];
            this.uniforms.uAmbientIntensity = config.ambientIntensity;
            this.uniforms.uResolution = [Graphics.width, Graphics.height];
            this.uniforms.uActiveLightCount = 0;
            
            // Light arrays
            this.uniforms.uLightData = new Float32Array(maxLights * 4);
            this.uniforms.uLightColors = new Float32Array(maxLights * 3);
            this.uniforms.uSpotlightData = new Float32Array(maxLights * 4);
            
            // Shadow map uniforms
            this.uniforms.uShadowMap = PIXI.Texture.WHITE;
            this.uniforms.uShadowMapResolution = 360;
            this.uniforms.uShadowSoftness = 5.0;
            this.uniforms.uShadowsEnabled = false;
            
            // Region map uniforms
            this.uniforms.uRegionMap = PIXI.Texture.WHITE;
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];
            this.uniforms.uDisplayOffsetInt = [0, 0];
            this.uniforms.uRegionMapSize = [20, 15];
            
            // Tile type map uniforms
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this.uniforms.uTileTypeMapSize = [20, 15];
            this.uniforms.uTileTypePadding = 2.0;
            this.uniforms.uWallShadowEnabled = false;
            
            // Debug mode
            this.uniforms.uDebugMode = 0;
            
            // Sun light uniforms
            this.uniforms.uSunEnabled = false;
            this.uniforms.uSunDirection = Utils.degToRad(config.sunDirection);
            this.uniforms.uSunIntensity = config.sunIntensity;
            const sunRgb = Utils.hexToRgb(config.sunColor);
            this.uniforms.uSunColor = [sunRgb.r, sunRgb.g, sunRgb.b];
            this.uniforms.uSunShadowMap = PIXI.Texture.WHITE;
            this.uniforms.uSunShadowsEnabled = false;
            
            // Sprite shadow uniforms
            this.uniforms.uSpriteShadowMap = PIXI.Texture.WHITE;
            this.uniforms.uSpriteShadowsEnabled = false;
            
            Debug.log('DynamicLightingFilter created with max', maxLights, 'lights');
        }

        /**
         * Set ambient light color
         * @param {string} hexColor - Hex color string
         */
        setAmbientColor(hexColor) {
            const rgb = Utils.hexToRgb(hexColor);
            this.uniforms.uAmbientColor = [rgb.r, rgb.g, rgb.b];
        }

        /**
         * Set ambient light intensity
         * @param {number} intensity - Intensity (0.0-1.0)
         */
        setAmbientIntensity(intensity) {
            this.uniforms.uAmbientIntensity = intensity;
        }

        /**
         * Set shadow map texture
         * @param {PIXI.Texture} texture - Shadow map texture
         */
        setShadowMap(texture) {
            if (texture) {
                this.uniforms.uShadowMap = texture;
            }
        }

        /**
         * Set shadow parameters
         * @param {number} resolution - Shadow map resolution
         * @param {number} softness - Shadow softness
         * @param {boolean} enabled - Whether shadows are enabled
         */
        setShadowParams(resolution, softness, enabled) {
            this.uniforms.uShadowMapResolution = resolution;
            this.uniforms.uShadowSoftness = softness;
            this.uniforms.uShadowsEnabled = enabled;
        }

        /**
         * Set sun enabled state
         * @param {boolean} enabled - Whether sun is enabled
         */
        setSunEnabled(enabled) {
            this.uniforms.uSunEnabled = enabled;
        }

        /**
         * Set sun direction
         * @param {number} direction - Direction in radians
         */
        setSunDirection(direction) {
            this.uniforms.uSunDirection = direction;
        }

        /**
         * Set sun intensity
         * @param {number} intensity - Intensity (0.0-2.0)
         */
        setSunIntensity(intensity) {
            this.uniforms.uSunIntensity = intensity;
        }

        /**
         * Set sun color
         * @param {string} hexColor - Hex color string
         */
        setSunColor(hexColor) {
            const rgb = Utils.hexToRgb(hexColor);
            this.uniforms.uSunColor = [rgb.r, rgb.g, rgb.b];
        }

        /**
         * Set all sun parameters
         * @param {boolean} enabled - Whether sun is enabled
         * @param {number} direction - Direction in radians
         * @param {number} intensity - Intensity
         * @param {string|Object} color - Hex color or RGB object
         */
        setSunParams(enabled, direction, intensity, color) {
            this.uniforms.uSunEnabled = enabled;
            this.uniforms.uSunDirection = direction;
            this.uniforms.uSunIntensity = intensity;
            if (color) {
                if (typeof color === 'object' && color.r !== undefined) {
                    this.uniforms.uSunColor = [color.r, color.g, color.b];
                } else {
                    const rgb = Utils.hexToRgb(color);
                    this.uniforms.uSunColor = [rgb.r, rgb.g, rgb.b];
                }
            }
        }

        /**
         * Set sun shadow map
         * @param {PIXI.Texture} texture - Sun shadow map texture
         * @param {boolean} enabled - Whether sun shadows are enabled
         */
        setSunShadowMap(texture, enabled) {
            if (texture) {
                this.uniforms.uSunShadowMap = texture;
            }
            this.uniforms.uSunShadowsEnabled = enabled;
        }

        /**
         * Update all lights in a single batch
         * @param {Array} lights - Array of light objects
         * @param {number} screenWidth - Screen width
         * @param {number} screenHeight - Screen height
         */
        updateLights(lights, screenWidth, screenHeight) {
            const count = Math.min(lights.length, this._maxLights);
            
            this.uniforms.uActiveLightCount = count;
            this.uniforms.uResolution = [screenWidth || Graphics.width, screenHeight || Graphics.height];
            
            const lightData = this.uniforms.uLightData;
            const lightColors = this.uniforms.uLightColors;
            const spotlightData = this.uniforms.uSpotlightData;
            
            for (let i = 0; i < count; i++) {
                const light = lights[i];
                const rgb = light.colorRgb || Utils.hexToRgb(light.color);
                
                const dataOffset = i * 4;
                lightData[dataOffset] = light.x;
                lightData[dataOffset + 1] = light.y;
                lightData[dataOffset + 2] = light.radius;
                lightData[dataOffset + 3] = light.intensity;
                
                const colorOffset = i * 3;
                lightColors[colorOffset] = rgb.r;
                lightColors[colorOffset + 1] = rgb.g;
                lightColors[colorOffset + 2] = rgb.b;
                
                const spotOffset = i * 4;
                spotlightData[spotOffset] = light.direction || 0;
                spotlightData[spotOffset + 1] = light.coneAngle || Math.PI;
                spotlightData[spotOffset + 2] = light.innerRadius || 0;
                spotlightData[spotOffset + 3] = light.isSpotlight ? 1.0 : 0.0;
            }
            
            // Zero out unused lights
            for (let i = count; i < this._maxLights; i++) {
                const dataOffset = i * 4;
                lightData[dataOffset + 3] = 0;
            }
        }

        /**
         * Get maximum lights
         * @returns {number} Maximum lights
         */
        get maxLights() {
            return this._maxLights;
        }
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.LightingFilter = DynamicLightingFilter;

})();
