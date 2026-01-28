/**
 * ============================================================================
 * TileTypeDetector Module for DynamicLighting
 * ============================================================================
 * 
 * Detects wall tile types from the tileset for shadow casting.
 * Extracted from standalone TileTypeDetector plugin.
 */

(function() {
    'use strict';

    const DL = window.DynamicLighting;
    if (!DL) {
        console.error('[TileTypeDetector] DynamicLighting not found!');
        return;
    }

    const Debug = DL.Debug;

    /**
     * Tile Type constants
     */
    const TILE_TYPE = {
        NONE: 0,
        WALL_SIDE: 1,   // Vertical wall surfaces (A3/A4 with kind % 16 >= 8)
        WALL_TOP: 2     // Horizontal wall caps (A4 with kind % 16 < 8)
    };

    /**
     * Generates a tile type map for the visible area
     * Returns a 2D texture where each pixel represents a tile's type
     */
    class TileTypeMapGenerator {
        constructor() {
            this._canvas = null;
            this._ctx = null;
            this._texture = null;
            this._baseTexture = null;
            this._lastDisplayX = -1;
            this._lastDisplayY = -1;
            this._padding = 2; // Extra tiles around visible area
            
            this._createTexture();
        }

        _createTexture() {
            // Create canvas for tile type map
            // Size: visible tiles + padding on each side
            const tilesX = Math.ceil(Graphics.width / 48) + 2 + this._padding * 2;
            const tilesY = Math.ceil(Graphics.height / 48) + 2 + this._padding * 2;
            
            this._canvas = document.createElement('canvas');
            this._canvas.width = tilesX;
            this._canvas.height = tilesY;
            this._ctx = this._canvas.getContext('2d');
            
            this._baseTexture = PIXI.BaseTexture.from(this._canvas, {
                scaleMode: PIXI.SCALE_MODES.NEAREST
            });
            this._texture = new PIXI.Texture(this._baseTexture);
            
            Debug.log('Tile type map created:', tilesX, 'x', tilesY);
        }

        /**
         * Update the tile type map when camera moves
         */
        update() {
            if (!$dataMap || !$gameMap) return;
            
            const displayX = Math.floor($gameMap.displayX());
            const displayY = Math.floor($gameMap.displayY());
            
            // Only update if camera moved
            if (displayX === this._lastDisplayX && displayY === this._lastDisplayY) {
                return;
            }
            this._lastDisplayX = displayX;
            this._lastDisplayY = displayY;
            
            this._generateMap(displayX, displayY);
        }

        /**
         * Force update (used when map changes)
         */
        forceUpdate() {
            this._lastDisplayX = -1;
            this._lastDisplayY = -1;
            this.update();
        }

        /**
         * Generate the tile type map
         */
        _generateMap(displayX, displayY) {
            const width = this._canvas.width;
            const height = this._canvas.height;
            const padding = this._padding;
            
            // Create image data
            const imageData = this._ctx.createImageData(width, height);
            const data = imageData.data;
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    // World tile position
                    const tileX = displayX - padding + x;
                    const tileY = displayY - padding + y;
                    
                    // Get tile type
                    const tileType = this._getTileType(tileX, tileY);
                    
                    // Encode tile type in pixel
                    // R = wall side (0 or 255)
                    // G = wall top (0 or 255)
                    // B = unused
                    // A = 255
                    const idx = (y * width + x) * 4;
                    
                    data[idx] = (tileType === TILE_TYPE.WALL_SIDE) ? 255 : 0;     // R - Wall Side
                    data[idx + 1] = (tileType === TILE_TYPE.WALL_TOP) ? 255 : 0;  // G - Wall Top
                    data[idx + 2] = 0;   // B - unused
                    data[idx + 3] = 255; // A
                }
            }
            
            this._ctx.putImageData(imageData, 0, 0);
            this._baseTexture.update();
        }

        /**
         * Get the tile type at a specific position
         * Only detects autotile walls from A3/A4 tilesets
         */
        _getTileType(x, y) {
            if (!$gameMap.isValid(x, y)) {
                return TILE_TYPE.NONE;
            }
            
            // Get all tile IDs at this position (4 layers)
            const tileId0 = $gameMap.tileId(x, y, 0); // Ground layer
            const tileId1 = $gameMap.tileId(x, y, 1); // Ground decoration
            const tileId2 = $gameMap.tileId(x, y, 2); // Upper layer 1
            const tileId3 = $gameMap.tileId(x, y, 3); // Upper layer 2
            
            // Check all layers for wall tiles
            const tileIds = [tileId0, tileId1, tileId2, tileId3];
            
            for (const tileId of tileIds) {
                if (tileId === 0) continue;
                
                // Check if wall side (vertical wall surface)
                // A3 or A4 tiles with autotile kind % 16 >= 8
                if (Tilemap.isWallSideTile(tileId)) {
                    return TILE_TYPE.WALL_SIDE;
                }
                
                // Check if wall top (horizontal cap on wall)
                // A4 tiles with autotile kind % 16 < 8
                if (Tilemap.isWallTopTile(tileId)) {
                    return TILE_TYPE.WALL_TOP;
                }
            }
            
            return TILE_TYPE.NONE;
        }

        /**
         * Destroy resources
         */
        destroy() {
            if (this._texture) {
                this._texture.destroy(true);
                this._texture = null;
            }
            this._baseTexture = null;
            this._canvas = null;
            this._ctx = null;
        }

        get texture() { return this._texture; }
        get width() { return this._canvas ? this._canvas.width : 0; }
        get height() { return this._canvas ? this._canvas.height : 0; }
        get padding() { return this._padding; }
    }

    //==========================================================================
    // Game_Map Extensions for tile type queries
    //==========================================================================

    /**
     * Get tile type at position
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @returns {number} Tile type constant
     */
    Game_Map.prototype.getTileType = function(x, y) {
        if (!this.isValid(x, y)) {
            return TILE_TYPE.NONE;
        }
        
        const tileIds = [
            this.tileId(x, y, 0),
            this.tileId(x, y, 1),
            this.tileId(x, y, 2),
            this.tileId(x, y, 3)
        ];
        
        for (const tileId of tileIds) {
            if (tileId === 0) continue;
            
            // Check if wall side (vertical wall surface)
            if (Tilemap.isWallSideTile(tileId)) {
                return TILE_TYPE.WALL_SIDE;
            }
            
            // Check if wall top (horizontal cap)
            if (Tilemap.isWallTopTile(tileId)) {
                return TILE_TYPE.WALL_TOP;
            }
        }
        
        return TILE_TYPE.NONE;
    };

    /**
     * Check if tile is a wall side (vertical surface)
     */
    Game_Map.prototype.isWallSideTile = function(x, y) {
        return this.getTileType(x, y) === TILE_TYPE.WALL_SIDE;
    };

    /**
     * Check if tile is a wall top (horizontal cap)
     */
    Game_Map.prototype.isWallTopTile = function(x, y) {
        return this.getTileType(x, y) === TILE_TYPE.WALL_TOP;
    };

    /**
     * Check if tile is any wall type
     */
    Game_Map.prototype.isAnyWallTile = function(x, y) {
        const type = this.getTileType(x, y);
        return type === TILE_TYPE.WALL_SIDE || type === TILE_TYPE.WALL_TOP;
    };

    //==========================================================================
    // Export
    //==========================================================================

    DL.TILE_TYPE = TILE_TYPE;
    DL.TileTypeMapGenerator = TileTypeMapGenerator;

    Debug.log('TileTypeDetector module loaded');

})();
