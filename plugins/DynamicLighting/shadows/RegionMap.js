/**
 * DynamicLighting - Region Map Generator
 * Generates texture for obstacle detection
 * @module DynamicLighting/shadows/RegionMap
 */

(function() {
    'use strict';

    const Debug = window.DynamicLighting.Debug;
    const Config = window.DynamicLighting.Config;

    /**
     * Region Map Generator class
     * Creates a texture map of obstacles for shadow casting
     */
    class RegionMapGenerator {
        constructor(padding = 10) {
            this._padding = padding;
            this._canvas = null;
            this._ctx = null;
            this._pixels = null;
            this._texture = null;
            this._baseTexture = null;
            this._lastDisplayX = -1;
            this._lastDisplayY = -1;
            this._obstacleMode = 'tiledetector'; // 'regions', 'tiledetector', 'both'
            
            this._createTextures();
        }

        _createTextures() {
            this._canvas = document.createElement('canvas');
            // Size: screen tiles + padding on both sides + 2 for partial tiles
            this._canvas.width = Math.ceil(Graphics.width / 48) + 2 + this._padding * 2;
            this._canvas.height = Math.ceil(Graphics.height / 48) + 2 + this._padding * 2;
            this._ctx = this._canvas.getContext('2d');
            this._pixels = new Uint8Array(this._canvas.width * this._canvas.height * 4);
            
            this._baseTexture = PIXI.BaseTexture.from(this._canvas, {
                scaleMode: PIXI.SCALE_MODES.NEAREST
            });
            this._texture = new PIXI.Texture(this._baseTexture);
            
            Debug.log('RegionMap created:', this._canvas.width, 'x', this._canvas.height, 'padding:', this._padding);
        }

        /**
         * Set obstacle detection mode
         * @param {string} mode - 'regions', 'tiledetector', or 'both'
         */
        setObstacleMode(mode) {
            this._obstacleMode = mode;
        }

        /**
         * Update region map when camera moves
         */
        update() {
            if (!$dataMap) return;
            
            // Only update when integer tile position changes
            const displayX = Math.floor($gameMap.displayX());
            const displayY = Math.floor($gameMap.displayY());
            
            if (displayX === this._lastDisplayX && displayY === this._lastDisplayY) {
                return false;
            }
            
            this._lastDisplayX = displayX;
            this._lastDisplayY = displayY;
            
            const width = this._canvas.width;
            const height = this._canvas.height;
            const padding = this._padding;
            
            const mode = this._obstacleMode;
            const useRegions = (mode === 'regions' || mode === 'both');
            const useTileDetector = (mode === 'tiledetector' || mode === 'both');
            // Check for tile detector: either standalone plugin or modular DynamicLighting version
            const hasTileDetector = useTileDetector && $gameMap.isAnyWallTile;
            
            // Fill region map
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const tileX = displayX - padding + x;
                    const tileY = displayY - padding + y;
                    
                    let isObstacle = false;
                    
                    if (tileX >= 0 && tileX < $dataMap.width &&
                        tileY >= 0 && tileY < $dataMap.height) {
                        
                        // Check regions
                        if (useRegions) {
                            const region = $gameMap.regionId(tileX, tileY);
                            if (region > 0) {
                                isObstacle = true;
                            }
                        }
                        
                        // Check TileTypeDetector
                        // Only WALL_SIDE is obstacle for sun shadows
                        // WALL_TOP does not cast shadows
                        if (!isObstacle && hasTileDetector) {
                            if ($gameMap.isWallSideTile(tileX, tileY)) {
                                isObstacle = true;
                            }
                        }
                    }
                    
                    const idx = (y * width + x) * 4;
                    const value = isObstacle ? 255 : 0;
                    this._pixels[idx] = value;
                    this._pixels[idx + 1] = value;
                    this._pixels[idx + 2] = value;
                    this._pixels[idx + 3] = 255;
                }
            }
            
            const imageData = this._ctx.createImageData(width, height);
            imageData.data.set(this._pixels);
            this._ctx.putImageData(imageData, 0, 0);
            this._baseTexture.update();
            
            return true;
        }

        /**
         * Force update (ignore position cache)
         */
        forceUpdate() {
            this._lastDisplayX = -1;
            this._lastDisplayY = -1;
            return this.update();
        }

        /**
         * Destroy resources
         */
        destroy() {
            if (this._texture) {
                this._texture.destroy(true);
                this._texture = null;
            }
            if (this._baseTexture) {
                this._baseTexture.destroy();
                this._baseTexture = null;
            }
            this._canvas = null;
            this._ctx = null;
            this._pixels = null;
        }

        /**
         * Get the region map texture
         * @returns {PIXI.Texture} Region map texture
         */
        get texture() {
            return this._texture;
        }

        /**
         * Get canvas width in tiles
         * @returns {number} Width in tiles
         */
        get width() {
            return this._canvas.width;
        }

        /**
         * Get canvas height in tiles
         * @returns {number} Height in tiles
         */
        get height() {
            return this._canvas.height;
        }

        /**
         * Get padding in tiles
         * @returns {number} Padding
         */
        get padding() {
            return this._padding;
        }
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.RegionMapGenerator = RegionMapGenerator;

})();
