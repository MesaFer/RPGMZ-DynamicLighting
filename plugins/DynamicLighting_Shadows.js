/*:
 * @target MZ
 * @plugindesc Dynamic Lighting Shadows v8.6 - Floor-Only Shadow Map
 * @author MesaFer
 * @base DynamicLighting
 * @orderAfter DynamicLighting
 * @orderAfter TileTypeDetector
 *
 * @param ShadowsEnabled
 * @text Shadows Enabled
 * @type boolean
 * @default true
 *
 * @param ObstacleDetectionMode
 * @text Obstacle Detection Mode
 * @type select
 * @option Regions (region > 0 = obstacle)
 * @value regions
 * @option TileTypeDetector (walls from tileset)
 * @value tiledetector
 * @option Both (regions OR walls)
 * @value both
 * @default tiledetector
 * @desc How to detect obstacles for shadow casting. TileTypeDetector uses wall tiles from A3/A4 tilesets.
 *
 * @param ShadowMapResolution
 * @text Shadow Map Resolution
 * @type number
 * @min 256
 * @max 4096
 * @default 1536
 * @desc Resolution of 1D shadow map (angles). Higher = smoother shadows, less jittering. 1024=fast, 1536=balanced, 2048=quality.
 *
 * @param ShadowSoftness
 * @text Shadow Softness
 * @type number
 * @decimals 1
 * @min 0
 * @max 30
 * @default 8
 * @desc Blur amount for soft shadow edges (PCF samples)
 *
 * @param WallShadowEnabled
 * @text Wall Geometry Shadows
 * @type boolean
 * @default true
 * @desc Enable wall-aware shadow rendering. Requires TileTypeDetector plugin.
 *
 * @help
 * ============================================================================
 * Dynamic Lighting Shadows v8.6 - Simplified Sun Shadow System
 * ============================================================================
 *
 * v8.6: Simplified sun shadow system
 *   - Removed obstacle-based shadow direction changes for sun shadows
 *   - Sun shadows now follow the sun direction consistently
 *   - Wall tops remain fully lit (they face upward toward the sun)
 *   - Wall sides are rendered fully lit in the shadow map
 *
 * v8.3: Fixed crash when transitioning between maps!
 *   - Fixed "Cannot read properties of null (reading 'parentTextureArray')" error
 *   - GPU textures are now properly destroyed when leaving a map
 *   - New shadow generator is created fresh for each map
 *   - Added validity checks to prevent using destroyed textures
 *
 * v8.2: Reduced shadow jittering with higher resolution!
 *   - Increased default shadow map resolution from 1024 to 1536
 *   - Higher resolution = more angles = smoother shadow transitions
 *   - Supports up to 4096 resolution for maximum quality
 *   - Recommended: 1024 (fast), 1536 (balanced), 2048+ (quality)
 *
 * v8.1: Fixed shadow jittering when light sources move!
 *   - Added epsilon offset to tile boundary calculations to prevent floating point issues
 *   - Sun shadow caching now uses fractional display positions for smooth updates
 *   - Improved coordinate synchronization between region map and shader
 *   - Shadows now move smoothly with light sources instead of "jumping" between tiles
 *
 * v7.8: Fixed vertical shadow projection on wall sides from point lights!
 *   - Wall sides now check if the FLOOR in front of them is in shadow
 *   - If the floor directly below the wall side is shadowed, the wall is also shadowed
 *   - This properly handles diagonal shadows continuing onto vertical walls
 *   - Works for obstacles at any angle, not just directly above
 *
 * v7.5: Fixed point light shadows on wall sides
 *   - Wall sides now properly receive shadows from obstacles blocking point lights
 *   - When an obstacle blocks light from reaching a wall side, the wall is shadowed
 *   - This fixes the issue where shadows on ground didn't continue onto walls
 *
 * v7.4: Fixed shadow continuation on wall sides (sun shadows)
 *   - Shadows from obstacles now properly continue onto wall sides
 *   - When tracing in sun direction hits an obstacle, shadow projects vertically on walls
 *   - Diagonal shadows on ground now correctly transition to vertical shadows on walls
 *
 * v7.3: Improved vertical shadow projection on wall sides
 *   - Wall Sides now properly receive vertical shadows from ALL obstacles above
 *   - Shadows from obstacles in adjacent columns are now correctly projected
 *   - Fixed issue where shadows from other obstacles weren't showing on walls
 *
 * v7.2: Initial shadow projection on wall sides
 *   - Wall Sides (vertical surfaces): Shadows now project VERTICALLY downward
 *   - Wall Tops (horizontal caps): Shadows still follow sun angle (diagonal)
 *   - This creates more realistic lighting where shadows on walls go straight down
 *
 * v7.1: Flexible obstacle detection! Choose how obstacles are detected:
 *   - Regions: Traditional region-based detection (region > 0 = obstacle)
 *   - TileTypeDetector: Automatic wall detection from A3/A4 tilesets
 *   - Both: Combine regions AND tile detection
 *
 * v7.0: Wall geometry-aware shadows! When TileTypeDetector plugin is
 * enabled, shadows now respect wall geometry:
 *   - Wall Sides (vertical surfaces): Shadows project VERTICALLY on walls
 *   - Wall Tops (horizontal caps): Shadows are ignored (lit from above)
 *
 * This creates more realistic lighting where shadows don't appear at wrong
 * angles on vertical wall surfaces.
 *
 * v5.0: Sun shadows GPU render-to-texture
 * v6.0: Point light shadows GPU render-to-texture (1D polar shadow maps)
 * v7.0: Wall geometry-aware shadows (TileTypeDetector integration)
 * v7.1: Flexible obstacle detection (regions, TileTypeDetector, or both)
 *
 * Uses 1D polar shadow maps for each light source.
 * Each row in the shadow map texture represents one light.
 * Each pixel stores the distance to the nearest obstacle at that angle.
 *
 * Supports both point lights and spotlights:
 * - Point lights: shadows cast in all directions
 * - Spotlights: shadows only cast within the cone angle
 * - Inner radius: shadows start from the inner radius distance
 *
 * === OBSTACLE DETECTION MODES ===
 *
 * Regions (default in older versions):
 *   Region 0 = ground (light passes through)
 *   Region 1+ = obstacles (blocks light)
 *   Use this if you want manual control over shadow-casting tiles.
 *
 * TileTypeDetector (recommended):
 *   Automatically detects walls from A3/A4 tilesets.
 *   No need to paint regions - walls cast shadows automatically!
 *   Requires TileTypeDetector plugin to be installed.
 *
 * Both:
 *   Combines both methods - a tile is an obstacle if it has
 *   region > 0 OR is detected as a wall by TileTypeDetector.
 *
 * === SUN SHADOW SETTINGS ===
 *
 * Sun Shadow Softness:
 *   0 = Sharp shadows (clear sunny day)
 *   10-20 = Slightly soft (light clouds)
 *   30-50 = Very soft/blurry (overcast/cloudy)
 *
 * Sun Shadow Precision:
 *   1-2 = High precision (sharp shadow edges, no gaps)
 *   4-8 = Medium precision (faster, slight softness)
 *   8-16 = Low precision (fastest, may have gaps)
 *
 * Sun Shadow Strength:
 *   0.0 = No shadows visible
 *   0.5 = Light shadows
 *   0.85 = Normal shadows (default)
 *   1.0 = Maximum darkness
 *
 * Sun Shadow Falloff:
 *   None = Sharp shadow edges (like midday sun)
 *   Linear = Gradual fade (morning/evening)
 *   Smooth = Soft gradual fade (cloudy day)
 *
 * Map Notes:
 *   <shadows:off>  - Disable shadows for this map
 *   <shadows:on>   - Enable shadows for this map
 *   <sunShadow:soft>   - Use soft/cloudy shadow preset
 *   <sunShadow:sharp>  - Use sharp/clear shadow preset
 *   <sunShadow:softness,precision,strength,length>
 *       Example: <sunShadow:20,2,0.7,4>
 *
 * @command SetShadowsEnabled
 * @text Set Shadows Enabled
 * @arg enabled
 * @type boolean
 * @default true
 *
 * @command SetSunShadowParams
 * @text Set Sun Shadow Parameters
 * @desc Configure sun shadow appearance
 *
 * @arg softness
 * @text Softness
 * @type number
 * @decimals 1
 * @min 0
 * @max 50
 * @default 0
 * @desc Blur amount. 0 = sharp, higher = blurry (cloudy)
 *
 * @arg precision
 * @text Precision
 * @type number
 * @min 1
 * @max 16
 * @default 2
 * @desc Step size. Lower = more precise shadows
 *
 * @arg strength
 * @text Strength
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.85
 * @desc Shadow darkness. 0 = none, 1 = black
 *
 * @arg length
 * @text Length
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 10
 * @default 3.0
 * @desc Shadow length in tiles
 *
 * @arg falloff
 * @text Falloff Type
 * @type select
 * @option None (Sharp)
 * @value none
 * @option Linear
 * @value linear
 * @option Smooth
 * @value smooth
 * @default smooth
 * @desc How shadows fade with distance
 *
 * @command SetSunShadowPreset
 * @text Set Sun Shadow Preset
 * @desc Apply a preset shadow configuration
 *
 * @arg preset
 * @text Preset
 * @type select
 * @option Clear Day (Sharp)
 * @value clear
 * @option Partly Cloudy
 * @value partlyCloudy
 * @option Overcast (Soft)
 * @value overcast
 * @option Morning/Evening
 * @value twilight
 * @default clear
 */

(() => {
    'use strict';

    const pluginName = 'DynamicLighting_Shadows';
    const parameters = PluginManager.parameters(pluginName);
    
    if (!window.DynamicLighting) {
        console.error('[DL_Shadows] Base plugin not found!');
        return;
    }

    const CONFIG = {
        enabled: parameters['ShadowsEnabled'] !== 'false',
        // Obstacle detection mode: 'regions', 'tiledetector', or 'both'
        obstacleDetectionMode: String(parameters['ObstacleDetectionMode'] || 'tiledetector'),
        shadowMapResolution: Number(parameters['ShadowMapResolution'] || 1024),
        shadowSoftness: Number(parameters['ShadowSoftness'] || 8),
        // Sun shadow settings
        sunShadowSoftness: Number(parameters['SunShadowSoftness'] || 0),
        sunShadowPrecision: Number(parameters['SunShadowPrecision'] || 2),
        sunShadowStrength: Number(parameters['SunShadowStrength'] || 0.85),
        sunShadowLength: Number(parameters['SunShadowLength'] || 3.0),
        sunShadowFalloff: String(parameters['SunShadowFalloff'] || 'smooth'),
        // Wall geometry settings
        wallShadowEnabled: parameters['WallShadowEnabled'] !== 'false'
    };

    // Tile type constants (matching TileTypeDetector)
    const TILE_TYPE = {
        NONE: 0,
        WALL_SIDE: 1,   // Vertical wall surfaces
        WALL_TOP: 2     // Horizontal wall caps
    };

    // Presets for quick configuration
    const SUN_SHADOW_PRESETS = {
        clear: {
            softness: 0,
            precision: 1,
            strength: 0.9,
            length: 4.0,
            falloff: 'none'
        },
        partlyCloudy: {
            softness: 15,
            precision: 2,
            strength: 0.7,
            length: 3.0,
            falloff: 'linear'
        },
        overcast: {
            softness: 40,
            precision: 4,
            strength: 0.4,
            length: 2.0,
            falloff: 'smooth'
        },
        twilight: {
            softness: 10,
            precision: 2,
            strength: 0.6,
            length: 6.0,
            falloff: 'smooth'
        }
    };

    const DEBUG = false;
    function log(...args) {
        if (DEBUG) console.log('[DL_Shadows]', ...args);
    }

    //==========================================================================
    // GPU 1D Shadow Map Generator for Point Lights
    //==========================================================================

    /**
     * 1D Shadow Map Generator Shader (GPU)
     *
     * This shader generates a 1D polar shadow map for point lights.
     * Each row represents one light source.
     * Each column represents an angle from -π to π.
     * The pixel value stores the normalized distance to the nearest obstacle.
     *
     * Input:
     *   - uRegionMap: Texture containing obstacle data (region > 0 = obstacle)
     *   - uLightData: Array of vec4(x, y, radius, intensity) for each light
     *   - uSpotlightData: Array of vec4(direction, coneAngle, innerRadius, isSpotlight)
     *
     * Output:
     *   - R channel: normalized distance to obstacle (0 = blocked, 1 = no obstacle)
     */
    /**
     * Generate the point light shadow map shader with the correct maxLights value
     * @param {number} maxLights - Maximum number of lights
     * @returns {string} GLSL shader code
     */
    function generatePointLightShadowMapShader(maxLights) {
        return `
        precision highp float;
        
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform sampler2D uRegionMap;
        
        uniform vec2 uResolution;           // Shadow map size (angles x lights)
        uniform vec2 uTileSize;
        uniform vec2 uDisplayOffset;        // Full camera offset in pixels (displayX * tileWidth)
        uniform vec2 uDisplayOffsetInt;     // Integer tile offset for region map (floor(displayX) * tileWidth)
        uniform vec2 uRegionMapSize;        // Region map dimensions in tiles
        uniform float uRegionPadding;       // Padding in tiles around the visible area
        
        #define MAX_LIGHTS ${maxLights}
        #define PI 3.14159265359
        #define TWO_PI 6.28318530718
        #define MAX_STEPS 128
        
        // Light data arrays
        uniform vec4 uLightData[MAX_LIGHTS];      // x, y, radius, intensity
        uniform vec4 uSpotlightData[MAX_LIGHTS];  // direction, coneAngle, innerRadius, isSpotlight
        uniform int uActiveLightCount;
        
        // Sample region map - returns 1.0 if obstacle, 0.0 if empty
        // worldPixelPos is in full world coordinates (realX * tileWidth)
        // Uses consistent floor() operation to avoid jittering at tile boundaries
        float sampleRegion(vec2 worldPixelPos) {
            // Region map is generated starting at (floor(displayX) - padding, floor(displayY) - padding)
            // uDisplayOffsetInt = floor(displayX) * tileWidth
            //
            // IMPORTANT: We use floor() consistently for both displayTile and tilePos
            // to ensure stable tile lookups regardless of sub-pixel positions.
            // The region map is tile-based, so we always want integer tile coordinates.
            vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
            
            // Add small epsilon to avoid floating point precision issues at tile boundaries
            // This prevents jittering when worldPixelPos is exactly on a tile boundary
            vec2 adjustedPos = worldPixelPos + 0.001;
            vec2 tilePos = floor(adjustedPos / uTileSize);
            
            // Add padding offset - region map starts 'padding' tiles before displayTile
            vec2 localTile = tilePos - displayTile + uRegionPadding;
            vec2 regionUV = (localTile + 0.5) / uRegionMapSize;
            
            if (regionUV.x < 0.0 || regionUV.x > 1.0 || regionUV.y < 0.0 || regionUV.y > 1.0) {
                return 0.0;
            }
            
            return texture2D(uRegionMap, regionUV).r > 0.5 ? 1.0 : 0.0;
        }
        
        // Calculate angle difference handling wrap-around (-PI to PI)
        float angleDiff(float a, float b) {
            float diff = a - b;
            diff = mod(diff + PI, TWO_PI) - PI;
            return abs(diff);
        }
        
        void main(void) {
            // Use gl_FragCoord to get actual pixel position in render texture
            // gl_FragCoord.x = pixel X (0 to resolution-1)
            // gl_FragCoord.y = pixel Y (0 to maxLights-1)
            
            // Calculate angle from X coordinate
            // X goes from 0 to resolution, we want angle from -PI to PI
            float angle = (gl_FragCoord.x / uResolution.x) * TWO_PI - PI;
            
            // Calculate light index from Y coordinate
            // Y goes from 0 to maxLights, each row is one light
            // gl_FragCoord.y is the pixel row (0.5 for first row, 1.5 for second, etc.)
            int targetLightIndex = int(floor(gl_FragCoord.y));
            
            // Clamp to valid range
            if (targetLightIndex < 0) targetLightIndex = 0;
            if (targetLightIndex >= MAX_LIGHTS) targetLightIndex = MAX_LIGHTS - 1;
            
            // Check if this light is active
            if (targetLightIndex >= uActiveLightCount) {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // No shadow
                return;
            }
            
            // Get light data using loop (WebGL ES 2.0 requires const index for arrays)
            vec4 lightData = vec4(0.0);
            vec4 spotData = vec4(0.0);
            
            for (int i = 0; i < MAX_LIGHTS; i++) {
                if (i == targetLightIndex) {
                    lightData = uLightData[i];
                    spotData = uSpotlightData[i];
                    break;
                }
            }
            
            vec2 lightPos = lightData.xy;
            float radius = lightData.z;
            float intensity = lightData.w;
            
            // Spotlight parameters
            float spotDirection = spotData.x;
            float coneAngle = spotData.y;      // Half-angle
            float innerRadius = spotData.z;
            float isSpotlight = spotData.w;
            
            // If light is disabled, return no shadow
            if (intensity <= 0.0 || radius <= 0.0) {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                return;
            }
            
            // For spotlights, check if angle is within cone
            if (isSpotlight > 0.5) {
                float angleFromCenter = angleDiff(angle, spotDirection);
                if (angleFromCenter > coneAngle) {
                    // Outside cone - blocked (no light)
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    return;
                }
            }
            
            // Ray direction
            vec2 rayDir = vec2(cos(angle), sin(angle));
            
            // Convert light position from screen coordinates to world coordinates
            // lightPos is in screen coordinates (from screenX/screenY)
            // screenX = (realX - displayX) * tileWidth
            // So: realX * tileWidth = screenX + displayX * tileWidth = screenX + uDisplayOffset
            vec2 lightWorldPos = lightPos + uDisplayOffset;
            
            // Ray march to find obstacle
            float hitDistance = 1.0; // 1.0 = no hit (full radius)
            
            // Step size - use smaller steps for more precise shadow boundaries
            // This reduces jittering when light sources move
            // Minimum step of 2 pixels provides good balance between precision and performance
            float stepSize = max(2.0, radius / float(MAX_STEPS));
            
            // Start from inner radius
            float startDist = innerRadius;
            
            // Track the last tile we checked to avoid redundant checks
            vec2 lastCheckedTile = floor(lightWorldPos / uTileSize);
            
            for (int i = 0; i < MAX_STEPS; i++) {
                float dist = startDist + float(i) * stepSize;
                
                if (dist >= radius) break;
                
                vec2 sampleWorldPos = lightWorldPos + rayDir * dist;
                vec2 currentTile = floor(sampleWorldPos / uTileSize);
                
                // Only check when we enter a new tile (optimization)
                if (currentTile != lastCheckedTile) {
                    lastCheckedTile = currentTile;
                    
                    if (sampleRegion(sampleWorldPos) > 0.5) {
                        // Hit obstacle - calculate precise distance to tile edge
                        // This provides smoother shadow transitions
                        vec2 tileMin = currentTile * uTileSize;
                        vec2 tileMax = tileMin + uTileSize;
                        
                        // Find the exact entry point into this tile
                        float tEntry = 0.0;
                        if (rayDir.x > 0.001) {
                            tEntry = max(tEntry, (tileMin.x - lightWorldPos.x) / rayDir.x);
                        } else if (rayDir.x < -0.001) {
                            tEntry = max(tEntry, (tileMax.x - lightWorldPos.x) / rayDir.x);
                        }
                        if (rayDir.y > 0.001) {
                            tEntry = max(tEntry, (tileMin.y - lightWorldPos.y) / rayDir.y);
                        } else if (rayDir.y < -0.001) {
                            tEntry = max(tEntry, (tileMax.y - lightWorldPos.y) / rayDir.y);
                        }
                        
                        // Use the precise entry distance for smoother shadows
                        hitDistance = max(tEntry, dist) / radius;
                        break;
                    }
                }
            }
            
            // Output: distance to first obstacle (1.0 = no obstacle within radius)
            gl_FragColor = vec4(hitDistance, hitDistance, hitDistance, 1.0);
        }
    `;
    }

    /**
     * GPU Point Light Shadow Map Filter
     * Renders 1D shadow map for all point lights in a single pass
     */
    class PointLightShadowFilter extends PIXI.Filter {
        constructor(maxLights) {
            // Generate shader with correct maxLights value
            const shaderCode = generatePointLightShadowMapShader(maxLights);
            super(null, shaderCode);
            
            this._maxLights = maxLights;
            
            // Initialize uniforms
            this.uniforms.uResolution = [CONFIG.shadowMapResolution, maxLights];
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];      // Full display offset (displayX * tileWidth)
            this.uniforms.uDisplayOffsetInt = [0, 0];   // Integer tile offset for region map
            this.uniforms.uRegionMapSize = [20, 15];
            this.uniforms.uRegionMap = PIXI.Texture.WHITE;
            this.uniforms.uRegionPadding = 10;          // Padding in tiles around visible area
            
            // Light data arrays
            this.uniforms.uLightData = new Float32Array(maxLights * 4);
            this.uniforms.uSpotlightData = new Float32Array(maxLights * 4);
            this.uniforms.uActiveLightCount = 0;
        }
        
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
            // Full display offset for screen-to-world conversion
            this.uniforms.uDisplayOffset = [displayX * tileWidth, displayY * tileHeight];
            // Integer tile offset for region map sampling (region map starts at floor(displayX))
            this.uniforms.uDisplayOffsetInt = [Math.floor(displayX) * tileWidth, Math.floor(displayY) * tileHeight];
            this.uniforms.uTileSize = [tileWidth, tileHeight];
        }
        
        setRegionMapSize(width, height) {
            this.uniforms.uRegionMapSize = [width, height];
        }
        
        setRegionPadding(padding) {
            this.uniforms.uRegionPadding = padding;
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
                
                // Light position (screen coordinates), radius, intensity
                lightData[offset] = light.x;
                lightData[offset + 1] = light.y;
                lightData[offset + 2] = light.radius;
                lightData[offset + 3] = light.intensity || 1.0;
                
                // Spotlight data
                spotData[offset] = light.direction || 0;
                spotData[offset + 1] = light.coneAngle || Math.PI;
                spotData[offset + 2] = light.innerRadius || 0;
                spotData[offset + 3] = light.isSpotlight ? 1.0 : 0.0;
            }
            
            // Zero out unused lights
            for (let i = count; i < this._maxLights; i++) {
                const offset = i * 4;
                lightData[offset + 3] = 0; // intensity = 0
            }
        }
    }

    //==========================================================================
    // GPU Sun Shadow System - 2D Shadow Map with Pixel-Perfect Tracing
    //==========================================================================

    /**
     * 2D Shadow Map Generator Shader with Wall Geometry Support
     *
     * This shader creates a 2D shadow map by tracing rays from each pixel
     * toward the sun direction. It works at PIXEL level, not tile level,
     * to produce smooth diagonal shadows.
     *
     * NEW: Wall geometry-aware shadows:
     *   - Wall Sides (R channel in tile type map): Shadows project VERTICALLY
     *   - Wall Tops (G channel in tile type map): Shadows are IGNORED (always lit)
     *   - Regular obstacles: Normal diagonal shadow projection
     *
     * The key insight: we sample the region map at sub-tile positions
     * and use the pixel's position within the tile to determine if it's
     * in shadow based on the obstacle's edge.
     */
    const SHADOW_MAP_GENERATE_SHADER = `
        precision highp float;
        
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform sampler2D uRegionMap;
        uniform sampler2D uTileTypeMap;     // Tile type map from TileTypeDetector
        
        uniform vec2 uResolution;
        uniform vec2 uTileSize;
        uniform vec2 uDisplayOffset;        // Full camera offset in pixels (displayX * tileWidth)
        uniform vec2 uDisplayOffsetInt;     // Integer tile offset for region map (floor(displayX) * tileWidth)
        uniform vec2 uRegionMapSize;
        uniform vec2 uTileTypeMapSize;      // Tile type map dimensions
        uniform float uRegionPadding;       // Padding in tiles around the visible area
        uniform float uTileTypePadding;     // Padding for tile type map
        
        uniform vec2 uSunDirection;       // Normalized direction vector (where light comes FROM)
        uniform float uShadowLength;      // Max shadow length in tiles
        uniform float uShadowStrength;    // Shadow darkness (0-1)
        uniform int uFalloffType;         // 0=none, 1=linear, 2=smooth
        uniform bool uWallShadowEnabled;  // Enable wall geometry-aware shadows
        
        // Tile type constants
        #define TILE_NONE 0
        #define TILE_WALL_SIDE 1
        #define TILE_WALL_TOP 2
        
        // Sample region map - returns 1.0 if obstacle, 0.0 if empty
        // Uses consistent floor() operation to avoid jittering at tile boundaries
        float sampleRegion(vec2 worldPixelPos) {
            // Region map is generated starting at (floor(displayX) - padding, floor(displayY) - padding)
            // uDisplayOffsetInt = floor(displayX) * tileWidth
            //
            // IMPORTANT: We use floor() consistently for both displayTile and tilePos
            // to ensure stable tile lookups regardless of sub-pixel positions.
            vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
            
            // Add small epsilon to avoid floating point precision issues at tile boundaries
            vec2 adjustedPos = worldPixelPos + 0.001;
            vec2 tilePos = floor(adjustedPos / uTileSize);
            
            // Add padding offset - region map starts 'padding' tiles before displayTile
            vec2 localTile = tilePos - displayTile + uRegionPadding;
            vec2 regionUV = (localTile + 0.5) / uRegionMapSize;
            
            if (regionUV.x < 0.0 || regionUV.x > 1.0 || regionUV.y < 0.0 || regionUV.y > 1.0) {
                return 0.0;
            }
            
            return texture2D(uRegionMap, regionUV).r > 0.5 ? 1.0 : 0.0;
        }
        
        // Sample tile type map - returns tile type (0=none, 1=wall_side, 2=wall_top)
        // R channel = wall side (255 = wall side, 0 = not wall side)
        // G channel = wall top (255 = wall top, 0 = not wall top)
        // B channel = unused (should be 0)
        // A channel = 255
        //
        // IMPORTANT: When no valid tile type map is provided, the default WHITE texture
        // has R=G=B=A=1.0, which would incorrectly detect everything as walls.
        // We detect this by checking if BOTH R and G are high (which is impossible
        // in a valid tile type map since a tile can't be both wall side AND wall top).
        //
        // Uses epsilon to avoid floating point precision issues at tile boundaries
        int sampleTileType(vec2 worldPixelPos) {
            vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
            // Add small epsilon to avoid jittering at tile boundaries
            vec2 adjustedPos = worldPixelPos + 0.001;
            vec2 tilePos = floor(adjustedPos / uTileSize);
            vec2 localTile = tilePos - displayTile + uTileTypePadding;
            vec2 tileTypeUV = (localTile + 0.5) / uTileTypeMapSize;
            
            if (tileTypeUV.x < 0.0 || tileTypeUV.x > 1.0 || tileTypeUV.y < 0.0 || tileTypeUV.y > 1.0) {
                return TILE_NONE;
            }
            
            vec4 tileType = texture2D(uTileTypeMap, tileTypeUV);
            
            // Detect invalid/default WHITE texture: if both R and G are high,
            // this is not a valid tile type map (a tile can't be both wall side AND wall top)
            if (tileType.r > 0.5 && tileType.g > 0.5) {
                return TILE_NONE;
            }
            
            // R channel = wall side (vertical surface)
            if (tileType.r > 0.5) return TILE_WALL_SIDE;
            // G channel = wall top (horizontal cap)
            if (tileType.g > 0.5) return TILE_WALL_TOP;
            
            return TILE_NONE;
        }
        
        // Get distance to obstacle edge along ray direction
        // Returns: distance in pixels to first obstacle hit, or -1 if no hit
        // Also returns the tile type of the hit obstacle via outTileType
        float traceRay(vec2 startPos, vec2 rayDir, float maxDist, out int outTileType) {
            outTileType = TILE_NONE;
            
            // Use sub-pixel stepping for accurate results
            // Step size of 0.5 pixels ensures we don't miss any tile boundaries
            float stepSize = 0.5;
            int maxSteps = int(maxDist / stepSize) + 1;
            
            // Limit max steps to prevent infinite loops
            if (maxSteps > 1024) maxSteps = 1024;
            
            for (int i = 1; i <= 1024; i++) {
                if (i > maxSteps) break;
                
                float dist = float(i) * stepSize;
                vec2 samplePos = startPos + rayDir * dist;
                
                // Check if this position is an obstacle
                if (sampleRegion(samplePos) > 0.5) {
                    // Hit an obstacle - get tile type if wall shadows enabled
                    if (uWallShadowEnabled) {
                        outTileType = sampleTileType(samplePos);
                    }
                    
                    // Return the distance to this hit
                    // Use the actual distance, not the tile entry point
                    // This provides smoother shadow edges
                    return dist;
                }
            }
            
            return -1.0; // No hit
        }
        
        void main(void) {
            vec2 pixelPos = vTextureCoord * uResolution;
            vec2 worldPos = pixelPos + uDisplayOffset;
            
            // Check if this pixel is ON an obstacle
            bool isOnObstacle = sampleRegion(worldPos) > 0.5;
            
            // Get tile type for wall geometry handling
            int tileType = TILE_NONE;
            if (uWallShadowEnabled) {
                tileType = sampleTileType(worldPos);
            }
            
            // Wall tops are always fully lit (they face upward toward the sun)
            if (tileType == TILE_WALL_TOP) {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                return;
            }
            
            // Wall sides: render as fully lit in shadow map
            // The actual shadow will be sampled from floor position in the main shader
            if (tileType == TILE_WALL_SIDE) {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                return;
            }
            
            // Regular obstacles (NOT wall sides or wall tops) are fully lit
            // They cast shadows, not receive them
            if (isOnObstacle && tileType == TILE_NONE) {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                return;
            }
            
            // For floor pixels, trace toward the sun to find blocking obstacles
            float maxDistPixels = uShadowLength * uTileSize.x;
            int hitTileType = TILE_NONE;
            float hitDist = traceRay(worldPos, uSunDirection, maxDistPixels, hitTileType);
            
            // Calculate shadow
            float shadow = 1.0; // 1.0 = fully lit
            
            if (hitDist > 0.0) {
                // Hit an obstacle - calculate shadow based on distance
                float normalizedDist = hitDist / maxDistPixels;
                
                if (uFalloffType == 0) {
                    // Sharp shadows - constant darkness
                    shadow = 1.0 - uShadowStrength;
                } else if (uFalloffType == 1) {
                    // Linear falloff - shadow fades with distance from obstacle
                    shadow = 1.0 - uShadowStrength * (1.0 - normalizedDist);
                } else {
                    // Smooth falloff (quadratic)
                    float falloff = normalizedDist * normalizedDist;
                    shadow = 1.0 - uShadowStrength * (1.0 - falloff);
                }
            }
            
            gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
        }
    `;

    /**
     * Gaussian blur shader for soft shadow edges
     */
    const SHADOW_BLUR_SHADER = `
        precision highp float;
        
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        
        uniform vec2 uResolution;
        uniform vec2 uBlurDirection;
        uniform float uBlurAmount;
        
        void main(void) {
            vec2 texelSize = 1.0 / uResolution;
            
            // 9-tap Gaussian blur
            float weights[5];
            weights[0] = 0.227027;
            weights[1] = 0.1945946;
            weights[2] = 0.1216216;
            weights[3] = 0.054054;
            weights[4] = 0.016216;
            
            vec3 result = texture2D(uSampler, vTextureCoord).rgb * weights[0];
            
            for (int i = 1; i < 5; i++) {
                vec2 offset = uBlurDirection * texelSize * float(i) * uBlurAmount;
                result += texture2D(uSampler, vTextureCoord + offset).rgb * weights[i];
                result += texture2D(uSampler, vTextureCoord - offset).rgb * weights[i];
            }
            
            gl_FragColor = vec4(result, 1.0);
        }
    `;

    /**
     * GPU-based sun shadow filter for 2D shadow map generation
     * Now with wall geometry support via TileTypeDetector integration
     */
    class SunShadowFilter extends PIXI.Filter {
        constructor() {
            super(null, SHADOW_MAP_GENERATE_SHADER);
            
            this.uniforms.uResolution = [Graphics.width, Graphics.height];
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];      // Full display offset (displayX * tileWidth)
            this.uniforms.uDisplayOffsetInt = [0, 0];   // Integer tile offset for region map
            this.uniforms.uRegionMapSize = [20, 15];
            this.uniforms.uRegionMap = PIXI.Texture.WHITE;
            this.uniforms.uRegionPadding = 10;          // Padding in tiles around visible area
            
            // Tile type map for wall geometry (from TileTypeDetector)
            // Default to WHITE texture, but wall shadows will be disabled until
            // a valid tile type map is provided
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this.uniforms.uTileTypeMapSize = [20, 15];
            this.uniforms.uTileTypePadding = 2;         // TileTypeDetector uses padding of 2
            // Start with wall shadows DISABLED - will be enabled when valid tile type map is set
            this.uniforms.uWallShadowEnabled = false;
            this._hasTileTypeMap = false;
            
            // Sun direction as normalized 2D vector
            this.uniforms.uSunDirection = [1, 0];
            this.uniforms.uShadowLength = 3.0;
            this.uniforms.uShadowStrength = 0.85;
            this.uniforms.uFalloffType = 2; // smooth
        }
        
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
            // Only enable if we have a valid tile type map
            this.uniforms.uWallShadowEnabled = enabled && this._hasTileTypeMap;
        }
        
        /**
         * Set sun direction from angle in radians
         * @param {number} direction - Angle in radians (where light comes FROM)
         *
         * SHADOW DIRECTION LOGIC:
         * The 'direction' parameter indicates where the sun IS in the sky.
         * For example: 315° means sun is in the top-right (east at sunrise).
         *
         * To find shadows, we trace FROM each pixel TOWARD the sun.
         * If there's an obstacle between the pixel and the sun, the pixel is in shadow.
         *
         * The tracing direction should point TOWARD the sun, which is the same as
         * the 'direction' parameter.
         *
         * However, in RPG Maker's coordinate system:
         * - 0° = right
         * - 90° = down
         * - 180° = left
         * - 270° = up
         *
         * So 315° = top-right (between up and right)
         *
         * When we trace toward the sun at 315°, we're tracing toward top-right.
         * Shadows will appear on the OPPOSITE side of obstacles (bottom-left).
         *
         * This is correct! The issue was elsewhere.
         */
        setSunDirection(direction) {
            // Convert angle to normalized direction vector
            //
            // CRITICAL FIX: The 'direction' parameter is where the sun IS (e.g., 315° = top-right).
            // To find shadows, we need to trace FROM each pixel TOWARD the sun.
            // If there's an obstacle between the pixel and the sun, the pixel is in shadow.
            //
            // The tracing direction should point TOWARD the sun.
            // Since 'direction' is the angle where the sun is located, we use it directly.
            //
            // Example: Sun at 315° (top-right)
            //   - cos(315°) ≈ 0.707 (positive X = right)
            //   - sin(315°) ≈ -0.707 (negative Y = up in screen coords)
            //   - So we trace toward top-right to find obstacles blocking the sun
            //   - Shadows appear on the OPPOSITE side (bottom-left) of obstacles
            //
            const dx = Math.cos(direction);
            const dy = Math.sin(direction);
            this.uniforms.uSunDirection = [dx, dy];
        }
        
        setShadowParams(length, strength, softness, falloff) {
            this.uniforms.uShadowLength = length;
            this.uniforms.uShadowStrength = strength;
            
            // Convert falloff string to int
            if (falloff === 'none') this.uniforms.uFalloffType = 0;
            else if (falloff === 'linear') this.uniforms.uFalloffType = 1;
            else this.uniforms.uFalloffType = 2; // smooth
        }
        
        updateDisplayOffset(displayX, displayY, tileWidth, tileHeight) {
            // Full display offset for screen-to-world conversion
            this.uniforms.uDisplayOffset = [displayX * tileWidth, displayY * tileHeight];
            // Integer tile offset for region map sampling (region map starts at floor(displayX))
            this.uniforms.uDisplayOffsetInt = [Math.floor(displayX) * tileWidth, Math.floor(displayY) * tileHeight];
            this.uniforms.uTileSize = [tileWidth, tileHeight];
        }
        
        setResolution(width, height) {
            this.uniforms.uResolution = [width, height];
        }
        
        setRegionMapSize(width, height) {
            this.uniforms.uRegionMapSize = [width, height];
        }
        
        setRegionPadding(padding) {
            this.uniforms.uRegionPadding = padding;
        }
    }

    /**
     * Blur filter for soft shadows
     */
    class ShadowBlurFilter extends PIXI.Filter {
        constructor() {
            super(null, SHADOW_BLUR_SHADER);
            
            this.uniforms.uResolution = [Graphics.width, Graphics.height];
            this.uniforms.uBlurDirection = [1, 0];
            this.uniforms.uBlurAmount = 2.0;
        }
        
        setResolution(width, height) {
            this.uniforms.uResolution = [width, height];
        }
        
        /**
         * Set blur direction perpendicular to sun direction
         * @param {number} sunDirection - Sun direction in radians
         */
        setBlurDirection(sunDirection) {
            // Perpendicular to sun direction
            const perpAngle = sunDirection + Math.PI / 2;
            this.uniforms.uBlurDirection = [Math.cos(perpAngle), Math.sin(perpAngle)];
        }
        
        setBlurAmount(amount) {
            this.uniforms.uBlurAmount = amount;
        }
    }

    //==========================================================================
    // 1D Shadow Map Generator with GPU Sun Shadows
    //==========================================================================

    class ShadowMapGenerator {
        constructor(resolution, maxLights) {
            this._resolution = resolution; // Width (angles)
            this._maxLights = maxLights;   // Height (one row per light)
            this._texture = null;
            this._destroyed = false;       // Track if generator has been destroyed
            
            // Region map for obstacle detection in shader
            this._regionTexture = null;
            this._regionCanvas = null;
            this._regionCtx = null;
            this._regionPixels = null;
            this._lastDisplayX = -1;
            this._lastDisplayY = -1;
            
            // Region map padding in tiles (to include off-screen obstacles)
            // This should be at least max light radius / tile size
            // Default: 10 tiles = 480 pixels at 48px tiles
            this._regionPadding = 10;
            
            // GPU Point Light shadow system (render-to-texture)
            this._pointLightShadowFilter = null;
            this._pointLightRenderTexture = null;
            this._pointLightSprite = null;
            this._pointLightContainer = null;
            this._pointLightInitialized = false;
            
            // GPU Sun shadow system (render-to-texture)
            this._sunShadowFilter = null;
            this._sunShadowRenderTexture = null;
            this._sunShadowSprite = null;
            this._sunShadowContainer = null;
            this._sunShadowInitialized = false;
            
            // Sun shadow caching - use fractional positions for smooth updates
            this._lastSunDisplayX = -999;
            this._lastSunDisplayY = -999;
            this._lastSunDirection = -999;
            this._lastSunSettings = null;
            this._sunShadowDirty = true;
            
            // Frame-based throttling
            this._frameCounter = 0;
            this._lastSunShadowFrame = 0;
            this._sunShadowMinInterval = 1;
            
            // Cache for light data comparison
            this._lastLightsHash = '';
            
            // Threshold for position change detection (in tiles)
            // Small threshold allows smooth updates while avoiding unnecessary redraws
            this._positionChangeThreshold = 0.01;
            
            this._createTextures();
        }
        
        /**
         * Destroy all GPU resources to prevent memory leaks and texture errors
         * Call this before creating a new ShadowMapGenerator (e.g., on map transition)
         */
        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            
            log('Destroying ShadowMapGenerator resources...');
            
            // Destroy point light shadow resources
            if (this._pointLightRenderTexture) {
                this._pointLightRenderTexture.destroy(true);
                this._pointLightRenderTexture = null;
            }
            if (this._pointLightSprite) {
                this._pointLightSprite.destroy({ children: true, texture: false });
                this._pointLightSprite = null;
            }
            if (this._pointLightContainer) {
                this._pointLightContainer.destroy({ children: true });
                this._pointLightContainer = null;
            }
            if (this._pointLightShadowFilter) {
                this._pointLightShadowFilter.destroy();
                this._pointLightShadowFilter = null;
            }
            this._pointLightInitialized = false;
            
            // Destroy sun shadow resources
            if (this._sunShadowRenderTexture) {
                this._sunShadowRenderTexture.destroy(true);
                this._sunShadowRenderTexture = null;
            }
            if (this._sunShadowSprite) {
                this._sunShadowSprite.destroy({ children: true, texture: false });
                this._sunShadowSprite = null;
            }
            if (this._sunShadowContainer) {
                this._sunShadowContainer.destroy({ children: true });
                this._sunShadowContainer = null;
            }
            if (this._sunShadowFilter) {
                this._sunShadowFilter.destroy();
                this._sunShadowFilter = null;
            }
            this._sunShadowInitialized = false;
            
            // Destroy region map texture
            if (this._regionTexture) {
                this._regionTexture.destroy(true);
                this._regionTexture = null;
            }
            if (this._regionBaseTexture) {
                this._regionBaseTexture.destroy();
                this._regionBaseTexture = null;
            }
            
            // Clear other references
            this._texture = null;
            this._regionCanvas = null;
            this._regionCtx = null;
            this._regionPixels = null;
            
            log('ShadowMapGenerator resources destroyed');
        }
        
        /**
         * Check if the generator is still valid (not destroyed)
         */
        isValid() {
            return !this._destroyed;
        }

        _createTextures() {
            // Create region map texture with padding for off-screen obstacles
            // The region map needs to extend beyond the screen by _regionPadding tiles
            // to properly detect obstacles that lights near the screen edge might hit
            this._regionCanvas = document.createElement('canvas');
            const padding = this._regionPadding;
            // Width: screen tiles + padding on both sides
            this._regionCanvas.width = Math.ceil(Graphics.width / 48) + 2 + padding * 2;
            // Height: screen tiles + padding on both sides
            this._regionCanvas.height = Math.ceil(Graphics.height / 48) + 2 + padding * 2;
            this._regionCtx = this._regionCanvas.getContext('2d');
            this._regionPixels = new Uint8Array(this._regionCanvas.width * this._regionCanvas.height * 4);
            
            this._regionBaseTexture = PIXI.BaseTexture.from(this._regionCanvas, {
                scaleMode: PIXI.SCALE_MODES.NEAREST
            });
            this._regionTexture = new PIXI.Texture(this._regionBaseTexture);
            
            log('Region map created with padding:', this._regionCanvas.width, 'x', this._regionCanvas.height, 'padding:', padding);
        }
        
        /**
         * Initialize GPU point light shadow system (called lazily when needed)
         */
        _initGPUPointLightSystem() {
            if (this._pointLightInitialized) return;
            
            const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
            if (!renderer) {
                log('Cannot initialize GPU point light shadows - renderer not ready');
                return;
            }
            
            try {
                // Create render texture for 1D shadow map
                // Width = resolution (angles), Height = maxLights (one row per light)
                this._pointLightRenderTexture = PIXI.RenderTexture.create({
                    width: this._resolution,
                    height: this._maxLights,
                    scaleMode: PIXI.SCALE_MODES.LINEAR,
                    resolution: 1 // Don't scale shadow map
                });
                
                if (!this._pointLightRenderTexture || !this._pointLightRenderTexture.baseTexture) {
                    throw new Error('Point light RenderTexture creation failed');
                }
                
                // Create sprite to render the shadow filter onto
                this._pointLightSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
                this._pointLightSprite.width = this._resolution;
                this._pointLightSprite.height = this._maxLights;
                
                // Create the point light shadow filter
                this._pointLightShadowFilter = new PointLightShadowFilter(this._maxLights);
                this._pointLightShadowFilter.setRegionMapSize(
                    this._regionCanvas.width,
                    this._regionCanvas.height
                );
                this._pointLightShadowFilter.setRegionPadding(this._regionPadding);
                
                // Apply filter to sprite
                this._pointLightSprite.filters = [this._pointLightShadowFilter];
                
                // Create container for rendering
                this._pointLightContainer = new PIXI.Container();
                this._pointLightContainer.addChild(this._pointLightSprite);
                
                // Use render texture as the shadow map texture
                this._texture = this._pointLightRenderTexture;
                
                this._pointLightInitialized = true;
                log('GPU Point light shadow system initialized:', this._resolution, 'x', this._maxLights);
            } catch (e) {
                console.error('[DL_Shadows] Failed to initialize GPU point light shadow system:', e);
                this._pointLightInitialized = false;
            }
        }
        
        /**
         * Initialize GPU sun shadow system (called lazily when needed)
         */
        _initGPUSunShadowSystem() {
            if (this._sunShadowInitialized) return;
            
            const width = Graphics.width || 816;
            const height = Graphics.height || 624;
            
            if (width <= 0 || height <= 0) {
                log('Cannot initialize GPU sun shadows - invalid dimensions:', width, 'x', height);
                return;
            }
            
            const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
            if (!renderer) {
                log('Cannot initialize GPU sun shadows - renderer not ready');
                return;
            }
            
            try {
                this._sunShadowRenderTexture = PIXI.RenderTexture.create({
                    width: width,
                    height: height,
                    scaleMode: PIXI.SCALE_MODES.LINEAR,
                    resolution: renderer.resolution || 1
                });
                
                if (!this._sunShadowRenderTexture || !this._sunShadowRenderTexture.baseTexture) {
                    throw new Error('Sun shadow RenderTexture creation failed');
                }
                
                this._sunShadowSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
                this._sunShadowSprite.width = width;
                this._sunShadowSprite.height = height;
                
                this._sunShadowFilter = new SunShadowFilter();
                this._sunShadowFilter.setRegionMapSize(
                    this._regionCanvas.width,
                    this._regionCanvas.height
                );
                this._sunShadowFilter.setRegionPadding(this._regionPadding);
                
                this._sunShadowSprite.filters = [this._sunShadowFilter];
                
                this._sunShadowContainer = new PIXI.Container();
                this._sunShadowContainer.addChild(this._sunShadowSprite);
                
                this._sunShadowInitialized = true;
                log('GPU Sun shadow system initialized:', width, 'x', height);
            } catch (e) {
                console.error('[DL_Shadows] Failed to initialize GPU sun shadow system:', e);
                this._sunShadowInitialized = false;
            }
        }

        /**
         * Update region map when camera moves
         * The region map includes padding tiles around the screen to detect
         * off-screen obstacles that lights near the edge might hit
         *
         * Obstacle detection modes:
         *   - 'regions': Use region IDs (region > 0 = obstacle)
         *   - 'tiledetector': Use TileTypeDetector (walls from A3/A4 tilesets)
         *   - 'both': Combine both methods (region > 0 OR wall tile = obstacle)
         *
         * NOTE: Region map is tile-based and only needs to update when the
         * integer tile position changes. The shader handles sub-tile precision
         * using uDisplayOffset (full fractional offset) and uDisplayOffsetInt
         * (integer tile offset for region map sampling).
         */
        updateRegionMap() {
            if (!$dataMap) return;
            
            // Region map is tile-based, so we only need to update when
            // the integer tile position changes
            const displayX = Math.floor($gameMap.displayX());
            const displayY = Math.floor($gameMap.displayY());
            
            // Only update if camera moved to a different tile
            if (displayX === this._lastDisplayX && displayY === this._lastDisplayY) {
                return;
            }
            this._lastDisplayX = displayX;
            this._lastDisplayY = displayY;
            
            const width = this._regionCanvas.width;
            const height = this._regionCanvas.height;
            const padding = this._regionPadding;
            
            // Get obstacle detection mode from config
            const detectionMode = CONFIG.obstacleDetectionMode;
            const useRegions = (detectionMode === 'regions' || detectionMode === 'both');
            const useTileDetector = (detectionMode === 'tiledetector' || detectionMode === 'both');
            
            // Check if TileTypeDetector is available
            const hasTileDetector = useTileDetector && window.TileTypeDetector && $gameMap.isAnyWallTile;
            
            // Log detection mode on first update
            if (this._lastDetectionModeLog !== detectionMode) {
                this._lastDetectionModeLog = detectionMode;
                log('Obstacle detection mode:', detectionMode,
                    '(regions:', useRegions, ', tiledetector:', hasTileDetector, ')');
            }
            
            // Fill region map
            // The region map starts at (displayX - padding, displayY - padding)
            // This allows detecting obstacles that are off-screen but within light range
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    // Tile position in world coordinates
                    // Subtract padding to start before the visible area
                    const tileX = displayX - padding + x;
                    const tileY = displayY - padding + y;
                    
                    let isObstacle = false;
                    
                    if (tileX >= 0 && tileX < $dataMap.width &&
                        tileY >= 0 && tileY < $dataMap.height) {
                        
                        // Check regions if enabled
                        if (useRegions) {
                            const region = $gameMap.regionId(tileX, tileY);
                            if (region > 0) {
                                isObstacle = true;
                            }
                        }
                        
                        // Check TileTypeDetector if enabled and not already an obstacle
                        if (!isObstacle && hasTileDetector) {
                            // isAnyWallTile returns true for both wall sides and wall tops
                            if ($gameMap.isAnyWallTile(tileX, tileY)) {
                                isObstacle = true;
                            }
                        }
                    }
                    
                    const idx = (y * width + x) * 4;
                    const obstacleValue = isObstacle ? 255 : 0;
                    this._regionPixels[idx] = obstacleValue;     // R
                    this._regionPixels[idx + 1] = obstacleValue; // G
                    this._regionPixels[idx + 2] = obstacleValue; // B
                    this._regionPixels[idx + 3] = 255;           // A
                }
            }
            
            const imageData = this._regionCtx.createImageData(width, height);
            imageData.data.set(this._regionPixels);
            this._regionCtx.putImageData(imageData, 0, 0);
            this._regionBaseTexture.update();
        }

        /**
         * Generate shadow map for all lights using GPU render-to-texture
         * @param {Array} lights - Array of light objects with spotlight support
         *   {x, y, radius, isSpotlight?, direction?, coneAngle?, innerRadius?}
         * @param {PIXI.Renderer} renderer - PIXI renderer for render-to-texture
         */
        generate(lights, renderer) {
            if (!$dataMap || !renderer || lights.length === 0) return;
            
            // Lazy initialization of GPU point light system
            if (!this._pointLightInitialized) {
                this._initGPUPointLightSystem();
            }
            
            // Check if initialization succeeded
            if (!this._pointLightShadowFilter || !this._pointLightRenderTexture) {
                return;
            }
            
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            
            // Get full display position (including fractional part)
            // The shader will handle both full offset (for screen-to-world conversion)
            // and integer offset (for region map sampling)
            const displayX = $gameMap.displayX();
            const displayY = $gameMap.displayY();
            
            // Update filter uniforms
            this._pointLightShadowFilter.setRegionMap(this._regionTexture);
            this._pointLightShadowFilter.setDisplayOffset(displayX, displayY, tileWidth, tileHeight);
            this._pointLightShadowFilter.setRegionMapSize(this._regionCanvas.width, this._regionCanvas.height);
            this._pointLightShadowFilter.updateLights(lights);
            
            // Render shadow map to texture using GPU
            try {
                // Try newer PIXI API first (options object)
                renderer.render(this._pointLightContainer, {
                    renderTexture: this._pointLightRenderTexture,
                    clear: true
                });
            } catch (e) {
                // Fallback to older PIXI API (positional arguments)
                try {
                    renderer.render(this._pointLightContainer, this._pointLightRenderTexture, true);
                } catch (e2) {
                    console.warn('[DL_Shadows] Failed to render point light shadows:', e2);
                }
            }
            
            log('GPU point light shadows rendered, lights:', lights.length);
        }

        /**
         * Increment frame counter (call once per frame)
         */
        incrementFrame() {
            this._frameCounter++;
        }

        /**
         * Mark sun shadows as dirty (needs regeneration)
         */
        invalidateSunShadows() {
            this._sunShadowDirty = true;
        }

        /**
         * Check if sun shadows need to be regenerated
         * Includes frame-based throttling to prevent excessive updates
         * Uses fractional display positions for smooth shadow movement
         */
        _needsSunShadowUpdate(sunDirection, settings) {
            // Frame-based throttling - don't update too frequently
            const framesSinceLastUpdate = this._frameCounter - this._lastSunShadowFrame;
            if (framesSinceLastUpdate < this._sunShadowMinInterval) {
                return false;
            }
            
            // Use fractional display position for smooth shadow updates
            const displayX = $gameMap.displayX();
            const displayY = $gameMap.displayY();
            
            // Check if camera moved (use threshold for smooth updates)
            const deltaX = Math.abs(displayX - this._lastSunDisplayX);
            const deltaY = Math.abs(displayY - this._lastSunDisplayY);
            if (deltaX > this._positionChangeThreshold || deltaY > this._positionChangeThreshold) {
                return true;
            }
            
            // Check if sun direction changed (use small threshold for smooth shadows)
            if (Math.abs(sunDirection - this._lastSunDirection) > 0.001) {
                return true;
            }
            
            // Check if settings changed
            if (!this._lastSunSettings ||
                settings.softness !== this._lastSunSettings.softness ||
                settings.precision !== this._lastSunSettings.precision ||
                settings.strength !== this._lastSunSettings.strength ||
                settings.length !== this._lastSunSettings.length ||
                settings.falloff !== this._lastSunSettings.falloff) {
                return true;
            }
            
            return this._sunShadowDirty;
        }

        /**
         * Generate sun shadow map using GPU render-to-texture
         * @param {number} sunDirection - Sun direction in radians (where light comes FROM)
         * @param {Object} settings - Shadow settings object
         * @param {PIXI.Renderer} renderer - PIXI renderer for render-to-texture
         */
        generateSunShadowsGPU(sunDirection, settings = {}, renderer) {
            if (!$dataMap || !renderer) return;
            
            // Lazy initialization of GPU sun shadow system
            if (!this._sunShadowInitialized) {
                this._initGPUSunShadowSystem();
            }
            
            // Check if initialization succeeded
            if (!this._sunShadowFilter || !this._sunShadowRenderTexture) {
                return;
            }
            
            // Get settings with defaults from CONFIG
            const shadowLength = settings.length !== undefined ? settings.length : CONFIG.sunShadowLength;
            const softness = settings.softness !== undefined ? settings.softness : CONFIG.sunShadowSoftness;
            const strength = settings.strength !== undefined ? settings.strength : CONFIG.sunShadowStrength;
            const falloff = settings.falloff !== undefined ? settings.falloff : CONFIG.sunShadowFalloff;
            
            const effectiveSettings = { softness, strength, length: shadowLength, falloff };
            
            // Check if we need to regenerate
            if (!this._needsSunShadowUpdate(sunDirection, effectiveSettings)) {
                return; // Use cached shadow map
            }
            
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            const displayX = $gameMap.displayX();
            const displayY = $gameMap.displayY();
            
            // Update cache keys and frame counter - use fractional positions for smooth tracking
            this._lastSunDisplayX = displayX;
            this._lastSunDisplayY = displayY;
            this._lastSunDirection = sunDirection;
            this._lastSunSettings = Object.assign({}, effectiveSettings);
            this._sunShadowDirty = false;
            this._lastSunShadowFrame = this._frameCounter;
            
            // Update filter uniforms
            this._sunShadowFilter.setRegionMap(this._regionTexture);
            this._sunShadowFilter.setSunDirection(sunDirection);
            this._sunShadowFilter.setShadowParams(shadowLength, strength, softness, falloff);
            this._sunShadowFilter.updateDisplayOffset(displayX, displayY, tileWidth, tileHeight);
            this._sunShadowFilter.setResolution(Graphics.width, Graphics.height);
            this._sunShadowFilter.setRegionMapSize(this._regionCanvas.width, this._regionCanvas.height);
            
            // Render to texture using GPU
            // Use try-catch to handle potential PIXI API differences
            try {
                // Try newer PIXI API first (options object)
                if (this._sunShadowRenderTexture && this._sunShadowRenderTexture.baseTexture) {
                    renderer.render(this._sunShadowContainer, {
                        renderTexture: this._sunShadowRenderTexture,
                        clear: true
                    });
                }
            } catch (e) {
                // Fallback to older PIXI API (positional arguments)
                try {
                    renderer.render(this._sunShadowContainer, this._sunShadowRenderTexture, true);
                } catch (e2) {
                    console.warn('[DL_Shadows] Failed to render sun shadows:', e2);
                }
            }
            
            log('GPU sun shadow rendered, dir:', (sunDirection * 180 / Math.PI).toFixed(1) + '°');
        }

        /**
         * Get the sun shadow filter for external access
         */
        get sunShadowFilter() { return this._sunShadowFilter; }
        
        get texture() { return this._texture; }
        get regionTexture() { return this._regionTexture; }
        get sunShadowTexture() { return this._sunShadowRenderTexture; }
        get resolution() { return this._resolution; }
    }

    //==========================================================================
    // Shadow System Integration
    //==========================================================================

    let shadowMapGenerator = null;

    /**
     * Clean up all shadow-related textures and reset filter uniforms
     * This should be called before transitioning away from a map scene
     */
    function cleanupShadowResources(spriteset) {
        log('Cleaning up shadow resources...');
        
        // Reset texture uniforms in the lighting filter to prevent PIXI errors
        if (spriteset && spriteset._lightingFilter) {
            const filter = spriteset._lightingFilter;
            log('Resetting lighting filter texture uniforms');
            
            // Reset all texture uniforms to safe WHITE texture
            filter.uniforms.uShadowMap = PIXI.Texture.WHITE;
            filter.uniforms.uRegionMap = PIXI.Texture.WHITE;
            filter.uniforms.uSunShadowMap = PIXI.Texture.WHITE;
            filter.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            filter.uniforms.uSpriteShadowMap = PIXI.Texture.WHITE;
            
            // Disable shadow features to prevent shader from using invalid textures
            filter.uniforms.uShadowsEnabled = false;
            filter.uniforms.uSunShadowsEnabled = false;
            filter.uniforms.uSpriteShadowsEnabled = false;
            filter.uniforms.uWallShadowEnabled = false;
        }
        
        // Destroy shadow map generator
        if (shadowMapGenerator) {
            shadowMapGenerator.destroy();
            shadowMapGenerator = null;
        }
        
        log('Shadow resources cleaned up');
    }

    // Hook into Scene_Map termination to clean up resources BEFORE scene transition
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        // Clean up shadow resources before the scene terminates
        if (this._spriteset) {
            cleanupShadowResources(this._spriteset);
        }
        
        _Scene_Map_terminate.call(this);
    };

    // Override the lighting filter creation
    const _Spriteset_Map_createLightingSystem = Spriteset_Map.prototype.createLightingSystem;
    Spriteset_Map.prototype.createLightingSystem = function() {
        // Shadow resources should already be cleaned up by Scene_Map.terminate()
        // But do a safety check in case createLightingSystem is called without scene termination
        if (shadowMapGenerator && shadowMapGenerator.isValid()) {
            log('Warning: Shadow generator still exists in createLightingSystem, cleaning up');
            cleanupShadowResources(this);
        }
        
        // Now call the original method which creates the new lighting filter
        _Spriteset_Map_createLightingSystem.call(this);
        
        // Create shadow map generator
        const maxLights = window.DynamicLighting.CONFIG.maxLights;
        shadowMapGenerator = new ShadowMapGenerator(CONFIG.shadowMapResolution, maxLights);
        
        // Update filter shader to use shadow map
        // DO NOT replace the filter - just add shadow-related uniforms to the existing filter
        if (this._lightingFilter) {
            // Add shadow map uniforms
            this._lightingFilter.uniforms.uShadowMap = shadowMapGenerator.texture;
            this._lightingFilter.uniforms.uRegionMap = shadowMapGenerator.regionTexture;
            this._lightingFilter.uniforms.uShadowMapResolution = CONFIG.shadowMapResolution;
            this._lightingFilter.uniforms.uShadowSoftness = CONFIG.shadowSoftness;
            this._lightingFilter.uniforms.uShadowsEnabled = CONFIG.enabled;
            this._lightingFilter.uniforms.uTileSize = [48, 48];
            this._lightingFilter.uniforms.uDisplayOffset = [0, 0];
            this._lightingFilter.uniforms.uDisplayOffsetInt = [0, 0];
            // Region map size includes padding on both sides
            const regionPadding = shadowMapGenerator._regionPadding;
            this._lightingFilter.uniforms.uRegionMapSize = [
                Math.ceil(Graphics.width / 48) + 2 + regionPadding * 2,
                Math.ceil(Graphics.height / 48) + 2 + regionPadding * 2
            ];
            
            // Tile type map uniforms for wall geometry-aware shadows
            this._lightingFilter.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this._lightingFilter.uniforms.uTileTypeMapSize = [20, 15];
            this._lightingFilter.uniforms.uTileTypePadding = 2.0;
            this._lightingFilter.uniforms.uWallShadowEnabled = false;
        }
        
        log('Shadow system initialized');
    };

    // Update shadow map each frame
    const _Spriteset_Map_updateLightingSystem = Spriteset_Map.prototype.updateLightingSystem;
    
    // Debug: check if the original method exists
    log('Original updateLightingSystem exists:', typeof _Spriteset_Map_updateLightingSystem === 'function');
    
    Spriteset_Map.prototype.updateLightingSystem = function() {
        // Call original method first
        if (typeof _Spriteset_Map_updateLightingSystem === 'function') {
            _Spriteset_Map_updateLightingSystem.call(this);
        } else {
            console.error('[DL_Shadows] Original updateLightingSystem is not a function!');
        }
        
        // Check if shadow generator exists and is valid (not destroyed)
        // This prevents texture errors when transitioning between maps
        if (!shadowMapGenerator || !shadowMapGenerator.isValid() || !this._lightingFilter) return;
        
        // Get PIXI renderer (used for both sun and point light shadows)
        const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
        
        // Increment frame counter for throttling
        shadowMapGenerator.incrementFrame();
        
        // Update region map (for obstacle detection in shader)
        shadowMapGenerator.updateRegionMap();
        
        // Update display offset for shader
        const tileWidth = $gameMap.tileWidth();
        const tileHeight = $gameMap.tileHeight();
        const displayXFull = $gameMap.displayX();
        const displayYFull = $gameMap.displayY();
        const displayX = displayXFull * tileWidth;
        const displayY = displayYFull * tileHeight;
        
        this._lightingFilter.uniforms.uDisplayOffset = [displayX, displayY];
        // Integer offset for region map sampling (region map starts at floor(displayX))
        this._lightingFilter.uniforms.uDisplayOffsetInt = [Math.floor(displayXFull) * tileWidth, Math.floor(displayYFull) * tileHeight];
        this._lightingFilter.uniforms.uTileSize = [tileWidth, tileHeight];
        this._lightingFilter.uniforms.uRegionMap = shadowMapGenerator.regionTexture;
        
        // Pass tile type map to main lighting filter for wall geometry-aware point light shadows
        if (CONFIG.wallShadowEnabled && window.TileTypeDetector) {
            const tileTypeGen = window.TileTypeDetector.tileTypeMapGenerator;
            if (tileTypeGen && tileTypeGen.texture) {
                const tileTypePadding = tileTypeGen._padding || 2;
                const tileTypeWidth = tileTypeGen._canvas ? tileTypeGen._canvas.width : 20;
                const tileTypeHeight = tileTypeGen._canvas ? tileTypeGen._canvas.height : 15;
                
                this._lightingFilter.uniforms.uTileTypeMap = tileTypeGen.texture;
                this._lightingFilter.uniforms.uTileTypeMapSize = [tileTypeWidth, tileTypeHeight];
                this._lightingFilter.uniforms.uTileTypePadding = tileTypePadding;
                this._lightingFilter.uniforms.uWallShadowEnabled = true;
            }
        } else {
            this._lightingFilter.uniforms.uWallShadowEnabled = false;
        }
        
        // SUN SHADOWS DISABLED - removed all sun shadow generation code
        // Sun lighting still works (intensity, color) but no shadows
        if (this._lightingFilter.setSunShadowMap) {
            this._lightingFilter.setSunShadowMap(null, false);
        }
        
        // IMPORTANT: Use the SAME light list as the main lighting system
        // to ensure shadow map indices match light indices in the shader.
        // The main plugin stores the filtered lights in this._activeLights
        // after calling updateLights(), which happens in the original method.
        //
        // If _activeLights is not available, collect lights ourselves
        // using the EXACT same order as the main plugin.
        let lights = this._activeLights;
        
        if (!lights || lights.length === 0) {
            // Fallback: collect lights in the same order as main plugin
            lights = [];
            const screenWidth = Graphics.width;
            const screenHeight = Graphics.height;
            
            // First: event lights (same order as main plugin)
            const events = $gameMap.events();
            for (const event of events) {
                if (event && event.hasLight && event.hasLight()) {
                    const data = event.getLightData();
                    const x = event.screenX();
                    const y = event.screenY() - 24;
                    const radius = data.radius;
                    
                    // Off-screen culling (same as main plugin)
                    if (x + radius < 0 || x - radius > screenWidth ||
                        y + radius < 0 || y - radius > screenHeight) {
                        continue;
                    }
                    
                    lights.push({
                        x: x,
                        y: y,
                        radius: radius,
                        intensity: data.intensity,
                        isSpotlight: data.isSpotlight || false,
                        direction: data.direction || 0,
                        coneAngle: data.coneAngle || Math.PI,
                        innerRadius: data.innerRadius || 0
                    });
                }
            }
            
            // Second: player light (same order as main plugin)
            if ($gameMap._playerLight && $gameMap._playerLight.enabled) {
                const pl = $gameMap._playerLight;
                let direction = pl.direction || 0;
                
                // Update direction based on player facing if followDirection is enabled
                if (pl.isSpotlight && pl.followDirection && window.DynamicLighting.directionToAngle) {
                    direction = window.DynamicLighting.degToRad(
                        window.DynamicLighting.directionToAngle($gamePlayer.direction())
                    );
                }
                
                lights.push({
                    x: $gamePlayer.screenX(),
                    y: $gamePlayer.screenY() - 24,
                    radius: pl.radius,
                    intensity: pl.intensity,
                    isSpotlight: pl.isSpotlight || false,
                    direction: direction,
                    coneAngle: pl.coneAngle || Math.PI,
                    innerRadius: pl.innerRadius || 0
                });
            }
        }
        
        // Debug: log light positions and indices
        if (this._shadowDebugFrame % 60 === 1) {
            log('=== SHADOW DEBUG ===');
            log('lights count:', lights.length);
            for (let i = 0; i < Math.min(lights.length, 5); i++) {
                const l = lights[i];
                log(`Light ${i}: x=${Math.round(l.x)}, y=${Math.round(l.y)}, r=${l.radius}`);
            }
            log('maxLights:', window.DynamicLighting.CONFIG.maxLights);
            log('shadowMapGenerator._maxLights:', shadowMapGenerator._maxLights);
        }
        
        // Only generate point light shadows if we have lights and renderer
        if (lights.length > 0 && renderer) {
            shadowMapGenerator.generate(lights, renderer);
        }
        
        // Check if shadows should be enabled
        const shadowsEnabled = $gameMap.areShadowsEnabled ? $gameMap.areShadowsEnabled() : CONFIG.enabled;
        
        // Update uniforms for point light shadows
        this._lightingFilter.uniforms.uShadowMap = shadowMapGenerator.texture;
        this._lightingFilter.uniforms.uShadowsEnabled = shadowsEnabled && lights.length > 0;
        
        // Debug logging
        if (this._shadowDebugFrame === undefined) this._shadowDebugFrame = 0;
        this._shadowDebugFrame++;
        
        const logInterval = this._shadowDebugFrame < 300 ? 60 : 300;
        if (this._shadowDebugFrame % logInterval === 1) {
            log('Shadow update - frame:', this._shadowDebugFrame, 'lights:', lights.length, 'enabled:', shadowsEnabled);
            if ($gameMap._sunLight && $gameMap._sunLight.enabled) {
                log('Sun shadows: GPU render-to-texture active');
            }
        }
    };

    //==========================================================================
    // Game_Map Extensions
    //==========================================================================

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this._shadowsEnabled = CONFIG.enabled;
        
        // Initialize sun shadow settings with defaults
        this._sunShadowSettings = {
            softness: CONFIG.sunShadowSoftness,
            precision: CONFIG.sunShadowPrecision,
            strength: CONFIG.sunShadowStrength,
            length: CONFIG.sunShadowLength,
            falloff: CONFIG.sunShadowFalloff
        };
        
        if ($dataMap && $dataMap.note) {
            // Parse shadows on/off
            if ($dataMap.note.match(/<shadows\s*:\s*off>/i)) {
                this._shadowsEnabled = false;
            } else if ($dataMap.note.match(/<shadows\s*:\s*on>/i)) {
                this._shadowsEnabled = true;
            }
            
            // Parse sun shadow presets
            const presetMatch = $dataMap.note.match(/<sunShadow\s*:\s*(clear|sharp|partlyCloudy|overcast|soft|twilight)>/i);
            if (presetMatch) {
                const presetName = presetMatch[1].toLowerCase();
                // Map 'sharp' to 'clear' and 'soft' to 'overcast'
                const mappedPreset = presetName === 'sharp' ? 'clear' :
                                     presetName === 'soft' ? 'overcast' : presetName;
                if (SUN_SHADOW_PRESETS[mappedPreset]) {
                    Object.assign(this._sunShadowSettings, SUN_SHADOW_PRESETS[mappedPreset]);
                    log('Sun shadow preset applied:', mappedPreset);
                }
            }
            
            // Parse custom sun shadow parameters: <sunShadow:softness,precision,strength,length,falloff>
            const customMatch = $dataMap.note.match(/<sunShadow\s*:\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*(?:,\s*(none|linear|smooth))?>/i);
            if (customMatch) {
                this._sunShadowSettings.softness = parseFloat(customMatch[1]);
                this._sunShadowSettings.precision = parseFloat(customMatch[2]);
                this._sunShadowSettings.strength = parseFloat(customMatch[3]);
                if (customMatch[4]) this._sunShadowSettings.length = parseFloat(customMatch[4]);
                if (customMatch[5]) this._sunShadowSettings.falloff = customMatch[5].toLowerCase();
                log('Custom sun shadow settings:', this._sunShadowSettings);
            }
        }
        
        log('Map setup, shadows:', this._shadowsEnabled, 'sunShadow:', this._sunShadowSettings);
    };

    Game_Map.prototype.areShadowsEnabled = function() {
        return this._shadowsEnabled !== false;
    };

    Game_Map.prototype.setShadowsEnabled = function(enabled) {
        this._shadowsEnabled = enabled;
    };

    /**
     * Set sun shadow parameters
     * @param {number} softness - Blur amount (0 = sharp, higher = blurry)
     * @param {number} precision - Step size (lower = more precise)
     * @param {number} strength - Shadow darkness (0-1)
     * @param {number} length - Shadow length in tiles
     * @param {string} falloff - Falloff type ('none', 'linear', 'smooth')
     */
    Game_Map.prototype.setSunShadowParams = function(softness, precision, strength, length, falloff) {
        if (!this._sunShadowSettings) {
            this._sunShadowSettings = {};
        }
        if (softness !== undefined) this._sunShadowSettings.softness = softness;
        if (precision !== undefined) this._sunShadowSettings.precision = precision;
        if (strength !== undefined) this._sunShadowSettings.strength = strength;
        if (length !== undefined) this._sunShadowSettings.length = length;
        if (falloff !== undefined) this._sunShadowSettings.falloff = falloff;
        
        log('Sun shadow params updated:', this._sunShadowSettings);
    };

    /**
     * Apply a sun shadow preset
     * @param {string} presetName - Preset name ('clear', 'partlyCloudy', 'overcast', 'twilight')
     */
    Game_Map.prototype.setSunShadowPreset = function(presetName) {
        const preset = SUN_SHADOW_PRESETS[presetName];
        if (preset) {
            this._sunShadowSettings = Object.assign({}, preset);
            log('Sun shadow preset applied:', presetName, this._sunShadowSettings);
        } else {
            console.warn('[DL_Shadows] Unknown preset:', presetName);
        }
    };

    /**
     * Get current sun shadow settings
     * @returns {Object} Current sun shadow settings
     */
    Game_Map.prototype.getSunShadowSettings = function() {
        return this._sunShadowSettings || {};
    };

    //==========================================================================
    // Plugin Commands
    //==========================================================================

    PluginManager.registerCommand(pluginName, 'SetShadowsEnabled', args => {
        $gameMap.setShadowsEnabled(args.enabled === 'true');
    });

    PluginManager.registerCommand(pluginName, 'SetSunShadowParams', args => {
        $gameMap.setSunShadowParams(
            Number(args.softness),
            Number(args.precision),
            Number(args.strength),
            Number(args.length),
            String(args.falloff)
        );
    });

    PluginManager.registerCommand(pluginName, 'SetSunShadowPreset', args => {
        $gameMap.setSunShadowPreset(String(args.preset));
    });

    //==========================================================================
    // Export
    //==========================================================================

    window.DynamicLighting.Shadows = {
        CONFIG,
        PRESETS: SUN_SHADOW_PRESETS,
        generator: () => shadowMapGenerator,
        // Expose functions for script calls
        setSunShadowParams: (softness, precision, strength, length, falloff) => {
            if ($gameMap) $gameMap.setSunShadowParams(softness, precision, strength, length, falloff);
        },
        setSunShadowPreset: (presetName) => {
            if ($gameMap) $gameMap.setSunShadowPreset(presetName);
        }
    };

    log('Plugin loaded v8.6 - Simplified Sun Shadow System');

})();
