/**
 * DynamicLighting - Sun Shadow Filter
 * Filter for generating 2D sun shadow map
 * @module DynamicLighting/shadows/SunShadowFilter
 */

(function() {
    'use strict';

    const ShaderLoader = window.DynamicLighting.ShaderLoader;
    const Debug = window.DynamicLighting.Debug;

    /**
     * Sun Shadow Filter
     * Generates 2D shadow map by ray tracing toward sun direction
     * @extends PIXI.Filter
     */
    class SunShadowFilter extends PIXI.Filter {
        constructor() {
            const fragmentShader = ShaderLoader.loadShaderSync('sunShadow.frag');
            super(null, fragmentShader);
            
            // Initialize uniforms
            this.uniforms.uResolution = [Graphics.width, Graphics.height];
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];
            this.uniforms.uDisplayOffsetInt = [0, 0];
            this.uniforms.uRegionMapSize = [20, 15];
            this.uniforms.uRegionMap = PIXI.Texture.WHITE;
            this.uniforms.uRegionPadding = 10;
            
            // Tile type map for wall geometry
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this.uniforms.uTileTypeMapSize = [20, 15];
            this.uniforms.uTileTypePadding = 2;
            this.uniforms.uWallShadowEnabled = false;
            this._hasTileTypeMap = false;
            
            // Sun direction as normalized 2D vector
            this.uniforms.uSunDirection = [1, 0];
            this.uniforms.uShadowLength = 3.0;
            this.uniforms.uShadowStrength = 0.85;
            this.uniforms.uStepSize = 1.0; // Step size for ray marching (precision)
            this.uniforms.uFalloffType = 2; // 0=none, 1=linear, 2=smooth
            
            Debug.log('SunShadowFilter created');
        }

        /**
         * Set region map texture
         * @param {PIXI.Texture} texture - Region map texture
         */
        setRegionMap(texture) {
            this.uniforms.uRegionMap = texture;
        }

        /**
         * Set tile type map from TileTypeDetector
         * @param {PIXI.Texture} texture - Tile type map texture
         * @param {number} width - Map width in tiles
         * @param {number} height - Map height in tiles
         * @param {number} padding - Padding in tiles
         */
        setTileTypeMap(texture, width, height, padding) {
            if (texture && texture !== PIXI.Texture.WHITE) {
                this.uniforms.uTileTypeMap = texture;
                this._hasTileTypeMap = true;
            }
            if (width !== undefined && height !== undefined) {
                this.uniforms.uTileTypeMapSize = [width, height];
            }
            if (padding !== undefined) {
                this.uniforms.uTileTypePadding = padding;
            }
        }

        /**
         * Enable or disable wall geometry-aware shadows
         * @param {boolean} enabled - Whether wall shadows are enabled
         */
        setWallShadowEnabled(enabled) {
            this.uniforms.uWallShadowEnabled = enabled && this._hasTileTypeMap;
        }

        /**
         * Set sun direction from angle in radians
         * @param {number} direction - Angle in radians (where light comes FROM)
         */
        setSunDirection(direction) {
            const dx = Math.cos(direction);
            const dy = Math.sin(direction);
            this.uniforms.uSunDirection = [dx, dy];
        }

        /**
         * Set shadow parameters
         * @param {number} length - Shadow length in tiles
         * @param {number} strength - Shadow darkness (0-1)
         * @param {number} precision - Step size for ray marching (lower = more precise)
         * @param {string} falloff - Falloff type ('none', 'linear', 'smooth')
         */
        setShadowParams(length, strength, precision, falloff) {
            this.uniforms.uShadowLength = length;
            this.uniforms.uShadowStrength = strength;
            // Step size: lower precision value = more precise (smaller steps)
            // precision 1 = step 1 pixel, precision 2 = step 2 pixels, etc.
            this.uniforms.uStepSize = Math.max(0.5, precision || 1.0);
            
            if (falloff === 'none') this.uniforms.uFalloffType = 0;
            else if (falloff === 'linear') this.uniforms.uFalloffType = 1;
            else this.uniforms.uFalloffType = 2;
        }

        /**
         * Update display offset for screen-to-world conversion
         * @param {number} displayX - Display X position
         * @param {number} displayY - Display Y position
         * @param {number} tileWidth - Tile width in pixels
         * @param {number} tileHeight - Tile height in pixels
         */
        updateDisplayOffset(displayX, displayY, tileWidth, tileHeight) {
            this.uniforms.uDisplayOffset = [displayX * tileWidth, displayY * tileHeight];
            this.uniforms.uDisplayOffsetInt = [Math.floor(displayX) * tileWidth, Math.floor(displayY) * tileHeight];
            this.uniforms.uTileSize = [tileWidth, tileHeight];
        }

        /**
         * Set resolution
         * @param {number} width - Screen width
         * @param {number} height - Screen height
         */
        setResolution(width, height) {
            this.uniforms.uResolution = [width, height];
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
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.SunShadowFilter = SunShadowFilter;

})();
