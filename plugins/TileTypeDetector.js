/*:
 * @target MZ
 * @plugindesc Tile Type Detector v1.1 - Automatic wall and wall-top detection with GL visualization
 * @author MesaFer
 *
 * @param Enabled
 * @text Enable Visualization
 * @type boolean
 * @default true
 * @desc Enable or disable the tile type visualization overlay
 *
 * @param WallSideColor
 * @text Wall Side Color
 * @type text
 * @default #ff0000
 * @desc Color for wall side tiles (hex format) - vertical wall surfaces
 *
 * @param WallSideOpacity
 * @text Wall Side Opacity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.4
 * @desc Opacity of wall side overlay (0.0 - 1.0)
 *
 * @param WallTopColor
 * @text Wall Top Color
 * @type text
 * @default #0000ff
 * @desc Color for wall top tiles (hex format) - horizontal caps on walls
 *
 * @param WallTopOpacity
 * @text Wall Top Opacity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.4
 * @desc Opacity of wall top overlay (0.0 - 1.0)
 *
 * @param ToggleKey
 * @text Toggle Key
 * @type text
 * @default F7
 * @desc Key to toggle the visualization on/off (F1-F12, or letter keys)
 *
 * @help
 * ============================================================================
 * Tile Type Detector v1.1
 * ============================================================================
 *
 * This plugin automatically detects and visualizes wall tile types:
 *   - Wall Sides (red) - Vertical wall surfaces from A3/A4 tilesets
 *   - Wall Tops (blue) - Horizontal caps on top of walls from A4 tileset
 *
 * Decorative objects (lamps, etc.) are IGNORED - only autotile walls are detected.
 *
 * The visualization uses a WebGL shader for efficient rendering.
 *
 * === TILE DETECTION ===
 *
 * Wall Side Detection (RED):
 *   - A3 tiles with autotile kind % 16 >= 8
 *   - A4 tiles with autotile kind % 16 >= 8
 *   These are the vertical brick/stone surfaces of walls.
 *
 * Wall Top Detection (BLUE):
 *   - A4 tiles with autotile kind % 16 < 8
 *   These are the horizontal "caps" or tops of wall blocks.
 *
 * === CONTROLS ===
 *
 * Press the configured toggle key (default: F7) to show/hide the overlay.
 *
 * === MAP NOTES ===
 *
 * <tileDetector:off>  - Disable visualization for this map
 * <tileDetector:on>   - Enable visualization for this map
 *
 * === PLUGIN COMMANDS ===
 *
 * @command ToggleVisualization
 * @text Toggle Visualization
 * @desc Toggle the tile type visualization on/off
 *
 * @command SetEnabled
 * @text Set Enabled
 * @desc Enable or disable the visualization
 *
 * @arg enabled
 * @text Enabled
 * @type boolean
 * @default true
 *
 * @command SetWallSideColor
 * @text Set Wall Side Color
 * @desc Change the wall side tile color
 *
 * @arg color
 * @text Color
 * @type text
 * @default #ff0000
 *
 * @arg opacity
 * @text Opacity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.4
 *
 * @command SetWallTopColor
 * @text Set Wall Top Color
 * @desc Change the wall top tile color
 *
 * @arg color
 * @text Color
 * @type text
 * @default #0000ff
 *
 * @arg opacity
 * @text Opacity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.4
 */

(() => {
    'use strict';

    const pluginName = 'TileTypeDetector';
    const parameters = PluginManager.parameters(pluginName);
    
    const CONFIG = {
        enabled: parameters['Enabled'] !== 'false',
        wallSideColor: String(parameters['WallSideColor'] || '#ff0000'),
        wallSideOpacity: Number(parameters['WallSideOpacity'] || 0.4),
        wallTopColor: String(parameters['WallTopColor'] || '#0000ff'),
        wallTopOpacity: Number(parameters['WallTopOpacity'] || 0.4),
        toggleKey: String(parameters['ToggleKey'] || 'F7')
    };

    const DEBUG = true;
    function log(...args) {
        if (DEBUG) console.log('[TileTypeDetector]', ...args);
    }

    /**
     * Convert hex color to RGB object
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
        } : { r: 1, g: 0, b: 0 };
    }

    /**
     * Get key code from key name
     */
    function getKeyCode(keyName) {
        const keyMap = {
            'F1': 112, 'F2': 113, 'F3': 114, 'F4': 115,
            'F5': 116, 'F6': 117, 'F7': 118, 'F8': 119,
            'F9': 120, 'F10': 121, 'F11': 122, 'F12': 123
        };
        if (keyMap[keyName.toUpperCase()]) {
            return keyMap[keyName.toUpperCase()];
        }
        // Single letter key
        if (keyName.length === 1) {
            return keyName.toUpperCase().charCodeAt(0);
        }
        return 118; // Default to F7
    }

    //==========================================================================
    // Tile Type Map Generator
    //==========================================================================

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
            
            log('Tile type map created:', tilesX, 'x', tilesY);
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

        get texture() { return this._texture; }
        get width() { return this._canvas.width; }
        get height() { return this._canvas.height; }
        get padding() { return this._padding; }
    }

    //==========================================================================
    // Tile Type Visualization Filter (WebGL)
    //==========================================================================

    /**
     * WebGL shader for tile type visualization
     * Overlays colored highlights on detected tile types
     */
    const TILE_TYPE_SHADER = `
        precision highp float;
        
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform sampler2D uTileTypeMap;
        
        uniform vec2 uResolution;
        uniform vec2 uTileSize;
        uniform vec2 uDisplayOffset;
        uniform vec2 uTileMapSize;
        uniform float uPadding;
        
        // Colors and opacities
        uniform vec3 uWallSideColor;
        uniform float uWallSideOpacity;
        uniform vec3 uWallTopColor;
        uniform float uWallTopOpacity;
        
        uniform bool uEnabled;
        
        void main(void) {
            vec4 texColor = texture2D(uSampler, vTextureCoord);
            
            if (!uEnabled) {
                gl_FragColor = texColor;
                return;
            }
            
            // Convert screen position to tile position
            vec2 pixelPos = vTextureCoord * uResolution;
            vec2 worldPos = pixelPos + uDisplayOffset;
            vec2 tilePos = floor(worldPos / uTileSize);
            
            // Convert to tile map UV coordinates
            // Tile map starts at (floor(displayX) - padding, floor(displayY) - padding)
            vec2 displayTile = floor(uDisplayOffset / uTileSize);
            vec2 localTile = tilePos - displayTile + uPadding;
            vec2 tileMapUV = (localTile + 0.5) / uTileMapSize;
            
            // Check bounds
            if (tileMapUV.x < 0.0 || tileMapUV.x > 1.0 || tileMapUV.y < 0.0 || tileMapUV.y > 1.0) {
                gl_FragColor = texColor;
                return;
            }
            
            // Sample tile type map
            vec4 tileType = texture2D(uTileTypeMap, tileMapUV);
            
            // Apply color overlays based on tile type
            vec3 overlayColor = vec3(0.0);
            float overlayAlpha = 0.0;
            
            // Wall Side (R channel) - vertical wall surfaces
            if (tileType.r > 0.5) {
                overlayColor = uWallSideColor;
                overlayAlpha = uWallSideOpacity;
            }
            
            // Wall Top (G channel) - horizontal caps on walls
            if (tileType.g > 0.5) {
                overlayColor = uWallTopColor;
                overlayAlpha = uWallTopOpacity;
            }
            
            // Blend overlay with original color
            vec3 finalColor = mix(texColor.rgb, overlayColor, overlayAlpha);
            
            gl_FragColor = vec4(finalColor, texColor.a);
        }
    `;

    /**
     * Tile Type Visualization Filter
     */
    class TileTypeFilter extends PIXI.Filter {
        constructor() {
            super(null, TILE_TYPE_SHADER);
            
            // Initialize uniforms
            this.uniforms.uResolution = [Graphics.width, Graphics.height];
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];
            this.uniforms.uTileMapSize = [20, 15];
            this.uniforms.uPadding = 2;
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            
            // Colors
            const wallSideRgb = hexToRgb(CONFIG.wallSideColor);
            const wallTopRgb = hexToRgb(CONFIG.wallTopColor);
            
            this.uniforms.uWallSideColor = [wallSideRgb.r, wallSideRgb.g, wallSideRgb.b];
            this.uniforms.uWallSideOpacity = CONFIG.wallSideOpacity;
            this.uniforms.uWallTopColor = [wallTopRgb.r, wallTopRgb.g, wallTopRgb.b];
            this.uniforms.uWallTopOpacity = CONFIG.wallTopOpacity;
            
            this.uniforms.uEnabled = CONFIG.enabled;
        }

        setTileTypeMap(texture) {
            this.uniforms.uTileTypeMap = texture;
        }

        setTileMapSize(width, height) {
            this.uniforms.uTileMapSize = [width, height];
        }

        setPadding(padding) {
            this.uniforms.uPadding = padding;
        }

        setDisplayOffset(x, y) {
            this.uniforms.uDisplayOffset = [x, y];
        }

        setTileSize(width, height) {
            this.uniforms.uTileSize = [width, height];
        }

        setResolution(width, height) {
            this.uniforms.uResolution = [width, height];
        }

        setEnabled(enabled) {
            this.uniforms.uEnabled = enabled;
        }

        setWallSideColor(hex, opacity) {
            const rgb = hexToRgb(hex);
            this.uniforms.uWallSideColor = [rgb.r, rgb.g, rgb.b];
            if (opacity !== undefined) {
                this.uniforms.uWallSideOpacity = opacity;
            }
        }

        setWallTopColor(hex, opacity) {
            const rgb = hexToRgb(hex);
            this.uniforms.uWallTopColor = [rgb.r, rgb.g, rgb.b];
            if (opacity !== undefined) {
                this.uniforms.uWallTopOpacity = opacity;
            }
        }
    }

    //==========================================================================
    // Integration with Spriteset_Map
    //==========================================================================

    let tileTypeMapGenerator = null;
    let visualizationEnabled = CONFIG.enabled;

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._createTileTypeDetector();
    };

    Spriteset_Map.prototype._createTileTypeDetector = function() {
        try {
            // Create tile type map generator
            tileTypeMapGenerator = new TileTypeMapGenerator();
            
            // Create visualization filter
            this._tileTypeFilter = new TileTypeFilter();
            this._tileTypeFilter.setTileTypeMap(tileTypeMapGenerator.texture);
            this._tileTypeFilter.setTileMapSize(tileTypeMapGenerator.width, tileTypeMapGenerator.height);
            this._tileTypeFilter.setPadding(tileTypeMapGenerator.padding);
            
            // Check map notes for enable/disable
            if ($dataMap && $dataMap.note) {
                if ($dataMap.note.match(/<tileDetector\s*:\s*off>/i)) {
                    visualizationEnabled = false;
                } else if ($dataMap.note.match(/<tileDetector\s*:\s*on>/i)) {
                    visualizationEnabled = true;
                }
            }
            
            this._tileTypeFilter.setEnabled(visualizationEnabled);
            
            // Add filter to baseSprite
            if (!this._baseSprite.filters) {
                this._baseSprite.filters = [];
            }
            this._baseSprite.filters.push(this._tileTypeFilter);
            
            log('Tile type detector initialized');
        } catch (e) {
            console.error('[TileTypeDetector] Failed to initialize:', e);
        }
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this._updateTileTypeDetector();
    };

    Spriteset_Map.prototype._updateTileTypeDetector = function() {
        if (!this._tileTypeFilter || !tileTypeMapGenerator) return;
        
        // Update tile type map
        tileTypeMapGenerator.update();
        
        // Update filter uniforms
        const tileWidth = $gameMap.tileWidth();
        const tileHeight = $gameMap.tileHeight();
        const displayX = $gameMap.displayX() * tileWidth;
        const displayY = $gameMap.displayY() * tileHeight;
        
        this._tileTypeFilter.setDisplayOffset(displayX, displayY);
        this._tileTypeFilter.setTileSize(tileWidth, tileHeight);
        this._tileTypeFilter.setResolution(Graphics.width, Graphics.height);
        this._tileTypeFilter.setEnabled(visualizationEnabled);
    };

    //==========================================================================
    // Keyboard Toggle
    //==========================================================================

    const toggleKeyCode = getKeyCode(CONFIG.toggleKey);

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this._updateTileTypeToggle();
    };

    Scene_Map.prototype._updateTileTypeToggle = function() {
        if (Input.isTriggered('tileTypeToggle')) {
            visualizationEnabled = !visualizationEnabled;
            log('Visualization toggled:', visualizationEnabled);
        }
    };

    // Add custom key mapping
    const _Input_onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function(event) {
        _Input_onKeyDown.call(this, event);
        if (event.keyCode === toggleKeyCode) {
            this._currentState['tileTypeToggle'] = true;
        }
    };

    const _Input_onKeyUp = Input._onKeyUp;
    Input._onKeyUp = function(event) {
        _Input_onKeyUp.call(this, event);
        if (event.keyCode === toggleKeyCode) {
            this._currentState['tileTypeToggle'] = false;
        }
    };

    //==========================================================================
    // Game_Map Extensions
    //==========================================================================

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        
        // Reset visualization state based on map notes
        visualizationEnabled = CONFIG.enabled;
        
        if ($dataMap && $dataMap.note) {
            if ($dataMap.note.match(/<tileDetector\s*:\s*off>/i)) {
                visualizationEnabled = false;
            } else if ($dataMap.note.match(/<tileDetector\s*:\s*on>/i)) {
                visualizationEnabled = true;
            }
        }
        
        log('Map setup, visualization:', visualizationEnabled);
    };

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
    // Plugin Commands
    //==========================================================================

    PluginManager.registerCommand(pluginName, 'ToggleVisualization', args => {
        visualizationEnabled = !visualizationEnabled;
        log('Visualization toggled via command:', visualizationEnabled);
    });

    PluginManager.registerCommand(pluginName, 'SetEnabled', args => {
        visualizationEnabled = args.enabled === 'true';
        log('Visualization set via command:', visualizationEnabled);
    });

    PluginManager.registerCommand(pluginName, 'SetWallSideColor', args => {
        CONFIG.wallSideColor = String(args.color);
        CONFIG.wallSideOpacity = Number(args.opacity);
        
        // Update filter if exists
        const spriteset = SceneManager._scene._spriteset;
        if (spriteset && spriteset._tileTypeFilter) {
            spriteset._tileTypeFilter.setWallSideColor(CONFIG.wallSideColor, CONFIG.wallSideOpacity);
        }
    });

    PluginManager.registerCommand(pluginName, 'SetWallTopColor', args => {
        CONFIG.wallTopColor = String(args.color);
        CONFIG.wallTopOpacity = Number(args.opacity);
        
        // Update filter if exists
        const spriteset = SceneManager._scene._spriteset;
        if (spriteset && spriteset._tileTypeFilter) {
            spriteset._tileTypeFilter.setWallTopColor(CONFIG.wallTopColor, CONFIG.wallTopOpacity);
        }
    });

    //==========================================================================
    // Export
    //==========================================================================

    window.TileTypeDetector = {
        CONFIG,
        TILE_TYPE,
        isEnabled: () => visualizationEnabled,
        setEnabled: (enabled) => { visualizationEnabled = enabled; },
        toggle: () => { visualizationEnabled = !visualizationEnabled; },
        getTileType: (x, y) => $gameMap ? $gameMap.getTileType(x, y) : TILE_TYPE.NONE,
        isWallSide: (x, y) => $gameMap ? $gameMap.isWallSideTile(x, y) : false,
        isWallTop: (x, y) => $gameMap ? $gameMap.isWallTopTile(x, y) : false,
        isAnyWall: (x, y) => $gameMap ? $gameMap.isAnyWallTile(x, y) : false,
        // Expose the tile type map generator for other plugins (e.g., DynamicLighting_Shadows)
        get tileTypeMapGenerator() { return tileTypeMapGenerator; }
    };

    log('Plugin loaded v1.1 - Tile Type Detector');

})();