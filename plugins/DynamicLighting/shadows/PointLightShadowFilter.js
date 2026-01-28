/**
 * DynamicLighting - Point Light Shadow Filter
 * Filter for generating 1D polar shadow maps for point lights
 * @module DynamicLighting/shadows/PointLightShadowFilter
 */

(function() {
    'use strict';

    const ShaderLoader = window.DynamicLighting.ShaderLoader;
    const Debug = window.DynamicLighting.Debug;

    /**
     * Generate point light shadow shader with dynamic MAX_LIGHTS
     * @param {number} maxLights - Maximum number of lights
     * @returns {string} GLSL fragment shader
     */
    function generateShader(maxLights) {
        const shaderSource = ShaderLoader.loadShaderSync('pointLightShadow.frag');
        return ShaderLoader.processShader(shaderSource, {
            MAX_LIGHTS: maxLights
        });
    }

    /**
     * Point Light Shadow Filter
     * Renders 1D shadow map for all point lights in a single pass
     * @extends PIXI.Filter
     */
    class PointLightShadowFilter extends PIXI.Filter {
        constructor(maxLights, resolution = 1536) {
            const fragmentShader = generateShader(maxLights);
            super(null, fragmentShader);
            
            this._maxLights = maxLights;
            
            // Initialize uniforms
            this.uniforms.uResolution = [resolution, maxLights];
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];
            this.uniforms.uDisplayOffsetInt = [0, 0];
            this.uniforms.uRegionMapSize = [20, 15];
            this.uniforms.uRegionMap = PIXI.Texture.WHITE;
            this.uniforms.uRegionPadding = 10;
            
            // Tile type map uniforms (for wall shadows)
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this.uniforms.uTileTypeMapSize = [20, 15];
            this.uniforms.uTileTypePadding = 2;
            this.uniforms.uWallShadowEnabled = false;
            
            // Light data arrays
            this.uniforms.uLightData = new Float32Array(maxLights * 4);
            this.uniforms.uSpotlightData = new Float32Array(maxLights * 4);
            this.uniforms.uActiveLightCount = 0;
            
            Debug.log('PointLightShadowFilter created for', maxLights, 'lights');
        }

        /**
         * Set region map texture
         * @param {PIXI.Texture} texture - Region map texture
         */
        setRegionMap(texture) {
            this.uniforms.uRegionMap = texture;
        }

        /**
         * Set display offset for coordinate conversion
         * @param {number} displayX - Full display X (including fractional part)
         * @param {number} displayY - Full display Y (including fractional part)
         * @param {number} tileWidth - Tile width in pixels
         * @param {number} tileHeight - Tile height in pixels
         */
        setDisplayOffset(displayX, displayY, tileWidth, tileHeight) {
            this.uniforms.uDisplayOffset = [displayX * tileWidth, displayY * tileHeight];
            this.uniforms.uDisplayOffsetInt = [Math.floor(displayX) * tileWidth, Math.floor(displayY) * tileHeight];
            this.uniforms.uTileSize = [tileWidth, tileHeight];
        }

        /**
         * Set region map size
         * @param {number} width - Width in tiles
         * @param {number} height - Height in tiles
         */
        setRegionMapSize(width, height) {
            this.uniforms.uRegionMapSize = [width, height];
        }

        /**
         * Set region padding
         * @param {number} padding - Padding in tiles
         */
        setRegionPadding(padding) {
            this.uniforms.uRegionPadding = padding;
        }

        /**
         * Set tile type map for wall shadow detection
         * @param {PIXI.Texture} texture - Tile type map texture
         * @param {number} width - Width in tiles
         * @param {number} height - Height in tiles
         * @param {number} padding - Padding in tiles
         */
        setTileTypeMap(texture, width, height, padding) {
            this.uniforms.uTileTypeMap = texture;
            this.uniforms.uTileTypeMapSize = [width, height];
            this.uniforms.uTileTypePadding = padding;
        }

        /**
         * Enable/disable wall shadow detection
         * @param {boolean} enabled - Whether wall shadows are enabled
         */
        setWallShadowEnabled(enabled) {
            this.uniforms.uWallShadowEnabled = enabled;
        }

        /**
         * Update light data for GPU shadow generation
         * @param {Array} lights - Array of light objects
         */
        updateLights(lights) {
            const count = Math.min(lights.length, this._maxLights);
            this.uniforms.uActiveLightCount = count;
            
            const lightData = this.uniforms.uLightData;
            const spotData = this.uniforms.uSpotlightData;
            
            for (let i = 0; i < count; i++) {
                const light = lights[i];
                const offset = i * 4;
                
                lightData[offset] = light.x;
                lightData[offset + 1] = light.y;
                lightData[offset + 2] = light.radius;
                lightData[offset + 3] = light.intensity || 1.0;
                
                spotData[offset] = light.direction || 0;
                spotData[offset + 1] = light.coneAngle || Math.PI;
                spotData[offset + 2] = light.innerRadius || 0;
                spotData[offset + 3] = light.isSpotlight ? 1.0 : 0.0;
            }
            
            // Zero out unused lights
            for (let i = count; i < this._maxLights; i++) {
                const offset = i * 4;
                lightData[offset + 3] = 0;
            }
        }
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.PointLightShadowFilter = PointLightShadowFilter;

})();
