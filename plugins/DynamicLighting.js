/*:
 * @target MZ
 * @plugindesc Dynamic Lighting System v3.5 - Sun Shadows Floor Projection
 * @author MesaFer
 *
 * @param AmbientColor
 * @text Ambient Light Color
 * @type text
 * @default #1a1a2e
 * @desc Default ambient light color in hex format (e.g., #1a1a2e)
 *
 * @param AmbientIntensity
 * @text Ambient Light Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.2
 * @desc Default ambient light intensity (0.0 - 1.0)
 *
 * @param DefaultLightRadius
 * @text Default Light Radius
 * @type number
 * @min 1
 * @default 150
 * @desc Default radius for point lights in pixels
 *
 * @param DefaultLightIntensity
 * @text Default Light Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 1.0
 * @desc Default intensity for point lights (0.0 - 2.0)
 *
 * @param DefaultLightColor
 * @text Default Light Color
 * @type text
 * @default #ffffff
 * @desc Default color for point lights in hex format
 *
 * @param MaxLights
 * @text Maximum Lights
 * @type number
 * @min 1
 * @max 100
 * @default 50
 * @desc Maximum number of simultaneous lights (affects performance)
 *
 * @param DefaultSunDirection
 * @text Default Sun Direction
 * @type number
 * @min 0
 * @max 360
 * @default 135
 * @desc Default sun direction in degrees (0=right, 90=down, 180=left, 270=up)
 *
 * @param DefaultSunIntensity
 * @text Default Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.8
 * @desc Default sun light intensity (0.0 - 2.0)
 *
 * @param DefaultSunColor
 * @text Default Sun Color
 * @type text
 * @default #fffae0
 * @desc Default sun light color in hex format (warm yellow-white)
 *
 * @help
 * ============================================================================
 * Dynamic Lighting System v3.1
 * ============================================================================
 *
 * Features:
 *   - Dynamic shader generation based on MaxLights parameter
 *   - Efficient for loop instead of branching in shader
 *   - Off-screen light culling for performance
 *   - Unlimited lights (configurable via MaxLights)
 *   - Point light with quadratic falloff
 *   - Spotlight/directional light with cone angle
 *   - Inner radius support (light starts from a plane, not a point)
 *   - Sun light - global directional light covering entire map
 *
 * Event Note Tags:
 *   POINT LIGHTS:
 *   <light>                    - Default point light
 *   <light:200>                - Light with radius 200
 *   <light:200,1.5>            - Light with radius 200, intensity 1.5
 *   <light:200,1.5,#ff6600>    - Light with radius, intensity, color
 *
 *   SPOTLIGHTS (directional):
 *   <spotlight:200,1.5,#ffffff,90,45>
 *       - radius 200, intensity 1.5, color white, direction 90°, cone 45°
 *
 *   Direction: 0=right, 90=down, 180=left, 270=up (clockwise from right)
 *   Cone angle: total spread angle in degrees (45 = ±22.5° from direction)
 *
 *   INNER RADIUS (for point lights too):
 *   <light:200,1.5,#ffffff,inner:30>
 *       - Point light with inner radius 30 (light starts 30px from center)
 *
 * Map Note Tags:
 *   <ambient:#1a1a2e,0.3>      - Set ambient light
 *   <sun:135,0.8,#fffae0>      - Set sun light (direction, intensity, color)
 *   <sun:135>                  - Sun with default intensity and color
 *   <sun:off>                  - Disable sun light for this map
 *
 * Sun Light:
 *   The sun acts as a global directional spotlight covering the entire map.
 *   Direction is in degrees: 0=right, 90=down, 180=left, 270=up
 *   Example: direction 135 means light coming from top-left corner
 *
 * ============================================================================
 * 
 * @command SetAmbientLight
 * @text Set Ambient Light
 * @desc Sets the ambient light color and intensity
 *
 * @arg color
 * @text Color
 * @type text
 * @default #1a1a2e
 *
 * @arg intensity
 * @text Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.2
 *
 * @command SetEventLight
 * @text Set Event Light
 * @desc Toggles light for a specific event
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg enabled
 * @text Enabled
 * @type boolean
 * @default true
 *
 * @command SetPlayerLight
 * @text Set Player Light
 * @desc Toggles light attached to the player
 *
 * @arg enabled
 * @text Enabled
 * @type boolean
 * @default true
 *
 * @command SetPlayerLightParams
 * @text Set Player Light Parameters
 * @desc Sets light parameters for the player
 *
 * @arg radius
 * @text Radius
 * @type number
 * @min 1
 * @default 150
 *
 * @arg intensity
 * @text Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 1.0
 *
 * @arg color
 * @text Color
 * @type text
 * @default #ffffff
 *
 * @command SetEventSpotlight
 * @text Set Event Spotlight
 * @desc Converts event light to a spotlight with direction and cone
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg direction
 * @text Direction (degrees)
 * @type number
 * @min 0
 * @max 360
 * @default 90
 * @desc Light direction in degrees (0=right, 90=down, 180=left, 270=up)
 *
 * @arg coneAngle
 * @text Cone Angle (degrees)
 * @type number
 * @min 1
 * @max 360
 * @default 45
 * @desc Total cone spread angle in degrees
 *
 * @arg innerRadius
 * @text Inner Radius
 * @type number
 * @min 0
 * @default 0
 * @desc Distance from center where light starts (0 = point source)
 *
 * @command SetEventLightInnerRadius
 * @text Set Event Light Inner Radius
 * @desc Sets the inner radius for an event light (creates plane start)
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg innerRadius
 * @text Inner Radius
 * @type number
 * @min 0
 * @default 30
 * @desc Distance from center where light starts (0 = point source)
 *
 * @command SetPlayerSpotlight
 * @text Set Player Spotlight
 * @desc Converts player light to a spotlight
 *
 * @arg direction
 * @text Direction (degrees)
 * @type number
 * @min 0
 * @max 360
 * @default 90
 * @desc Light direction in degrees (0=right, 90=down, 180=left, 270=up)
 *
 * @arg coneAngle
 * @text Cone Angle (degrees)
 * @type number
 * @min 1
 * @max 360
 * @default 45
 * @desc Total cone spread angle in degrees
 *
 * @arg innerRadius
 * @text Inner Radius
 * @type number
 * @min 0
 * @default 0
 * @desc Distance from center where light starts (0 = point source)
 *
 * @arg followDirection
 * @text Follow Player Direction
 * @type boolean
 * @default true
 * @desc If true, spotlight follows player's facing direction
 *
 * @command SetPlayerLightToPoint
 * @text Set Player Light to Point
 * @desc Converts player spotlight back to a point light
 *
 * @command SetSunLight
 * @text Set Sun Light
 * @desc Enables or disables the global sun light
 *
 * @arg enabled
 * @text Enabled
 * @type boolean
 * @default true
 * @desc Enable or disable sun light
 *
 * @command SetSunLightParams
 * @text Set Sun Light Parameters
 * @desc Sets sun light direction, intensity and color
 *
 * @arg direction
 * @text Direction (degrees)
 * @type number
 * @min 0
 * @max 360
 * @default 135
 * @desc Sun direction in degrees (0=right, 90=down, 180=left, 270=up)
 *
 * @arg intensity
 * @text Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.8
 * @desc Sun light intensity (0.0 - 2.0)
 *
 * @arg color
 * @text Color
 * @type text
 * @default #fffae0
 * @desc Sun light color in hex format
 */

(() => {
    'use strict';

    // CRITICAL DEBUG: Log when this file is loaded to verify no caching
    console.log('[DynamicLighting] ========================================');
    console.log('[DynamicLighting] PLUGIN FILE LOADED AT:', new Date().toISOString());
    console.log('[DynamicLighting] ========================================');

    const pluginName = 'DynamicLighting';
    const parameters = PluginManager.parameters(pluginName);
    
    const CONFIG = {
        ambientColor: String(parameters['AmbientColor'] || '#1a1a2e'),
        ambientIntensity: Number(parameters['AmbientIntensity'] || 0.2),
        defaultRadius: Number(parameters['DefaultLightRadius'] || 150),
        defaultIntensity: Number(parameters['DefaultLightIntensity'] || 1.0),
        defaultColor: String(parameters['DefaultLightColor'] || '#ffffff'),
        maxLights: Number(parameters['MaxLights'] || 50),
        // Sun light defaults
        sunDirection: Number(parameters['DefaultSunDirection'] || 135),
        sunIntensity: Number(parameters['DefaultSunIntensity'] || 0.8),
        sunColor: String(parameters['DefaultSunColor'] || '#fffae0')
    };

    const DEBUG = true;
    let frameCount = 0;

    function debugLog(...args) {
        if (DEBUG) console.log('[DynamicLighting]', ...args);
    }

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
     * Convert degrees to radians
     */
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Get direction angle from RPG Maker direction (2,4,6,8)
     * Returns angle in degrees (0=right, 90=down, 180=left, 270=up)
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

    //==========================================================================
    // Dynamic Lighting Filter - Shader with Spotlight and Inner Radius support
    //==========================================================================

    // Cache for compiled shaders by light count
    const shaderCache = new Map();

    /**
     * Generates fragment shader code with spotlight, inner radius, and GPU-based sun shadows
     * @param {number} maxLights - Maximum number of lights to support
     * @returns {string} GLSL fragment shader code
     */
    function generateFragmentShader(maxLights) {
        return `
            precision highp float;
            
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform sampler2D uShadowMap;
            uniform sampler2D uRegionMap;
            uniform sampler2D uTileTypeMap;      // Tile type map from TileTypeDetector
            
            uniform vec3 uAmbientColor;
            uniform float uAmbientIntensity;
            uniform vec2 uResolution;
            
            // 1D Shadow map parameters
            uniform float uShadowMapResolution;
            uniform float uShadowSoftness;
            uniform bool uShadowsEnabled;
            uniform bool uWallShadowEnabled;     // Enable wall geometry-aware shadows
            
            // Region map parameters (for obstacle detection)
            uniform vec2 uTileSize;
            uniform vec2 uDisplayOffset;
            uniform vec2 uDisplayOffsetInt;  // Integer-aligned offset for region map sampling
            uniform vec2 uRegionMapSize;
            uniform vec2 uTileTypeMapSize;       // Tile type map dimensions
            uniform float uTileTypePadding;      // Padding for tile type map
            
            // Sun light parameters (global directional light)
            uniform bool uSunEnabled;
            uniform float uSunDirection;    // Direction in radians
            uniform float uSunIntensity;    // Light intensity
            uniform vec3 uSunColor;         // Light color RGB
            uniform sampler2D uSunShadowMap; // GPU-generated sun shadow map
            uniform bool uSunShadowsEnabled;
            
            // Sprite shadow parameters (from DynamicLighting_SpriteShadows)
            uniform sampler2D uSpriteShadowMap;
            uniform bool uSpriteShadowsEnabled;
            
            #define MAX_LIGHTS ${maxLights}
            #define PI 3.14159265359
            #define TWO_PI 6.28318530718
            #define SUN_SHADOW_STEPS 32
            #define MAX_WALL_HEIGHT 8
            
            // Tile type constants
            #define TILE_NONE 0
            #define TILE_WALL_SIDE 1
            #define TILE_WALL_TOP 2
            
            // Light data: x, y, radius, intensity
            uniform vec4 uLightData[MAX_LIGHTS];
            // Light colors: r, g, b
            uniform vec3 uLightColors[MAX_LIGHTS];
            // Spotlight data: direction (radians), cone angle (radians), inner radius, isSpotlight (0 or 1)
            uniform vec4 uSpotlightData[MAX_LIGHTS];
            uniform int uActiveLightCount;
            
            // Region map padding - must match the value in DynamicLighting_Shadows.js
            #define REGION_PADDING 10.0
            
            // Check if a tile position is an obstacle using region map
            // Uses uDisplayOffsetInt for region map sampling (region map starts at floor(displayX) - padding)
            // worldTilePos should already be integer tile coordinates
            bool isObstacleAt(vec2 worldTilePos) {
                vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
                // Add padding offset - region map starts 'padding' tiles before displayTile
                vec2 localTile = worldTilePos - displayTile + REGION_PADDING;
                vec2 regionUV = (localTile + 0.5) / uRegionMapSize;
                
                if (regionUV.x < 0.0 || regionUV.x > 1.0 || regionUV.y < 0.0 || regionUV.y > 1.0) {
                    return false;
                }
                
                float region = texture2D(uRegionMap, regionUV).r;
                return region > 0.5;
            }
            
            // Check if pixel is on an obstacle (region > 0)
            // Uses epsilon to avoid floating point precision issues at tile boundaries
            bool isOnObstacle(vec2 pixelPos) {
                vec2 worldPos = pixelPos + uDisplayOffset;
                // Add small epsilon to avoid jittering at tile boundaries
                vec2 adjustedPos = worldPos + 0.001;
                vec2 tileCoord = floor(adjustedPos / uTileSize);
                return isObstacleAt(tileCoord);
            }
            
            // Sample tile type map - returns tile type (0=none, 1=wall_side, 2=wall_top)
            // Uses epsilon to avoid floating point precision issues at tile boundaries
            int getTileType(vec2 pixelPos) {
                if (!uWallShadowEnabled) return TILE_NONE;
                
                vec2 worldPos = pixelPos + uDisplayOffset;
                vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
                // Add small epsilon to avoid jittering at tile boundaries
                vec2 adjustedPos = worldPos + 0.001;
                vec2 tilePos = floor(adjustedPos / uTileSize);
                vec2 localTile = tilePos - displayTile + uTileTypePadding;
                vec2 tileTypeUV = (localTile + 0.5) / uTileTypeMapSize;
                
                if (tileTypeUV.x < 0.0 || tileTypeUV.x > 1.0 || tileTypeUV.y < 0.0 || tileTypeUV.y > 1.0) {
                    return TILE_NONE;
                }
                
                vec4 tileType = texture2D(uTileTypeMap, tileTypeUV);
                
                // Detect invalid/default WHITE texture
                if (tileType.r > 0.5 && tileType.g > 0.5) {
                    return TILE_NONE;
                }
                
                if (tileType.r > 0.5) return TILE_WALL_SIDE;
                if (tileType.g > 0.5) return TILE_WALL_TOP;
                
                return TILE_NONE;
            }
            
            // Get tile type at specific tile coordinates (not pixel coordinates)
            int getTileTypeAtTile(vec2 tilePos) {
                if (!uWallShadowEnabled) return TILE_NONE;
                
                vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
                vec2 localTile = tilePos - displayTile + uTileTypePadding;
                vec2 tileTypeUV = (localTile + 0.5) / uTileTypeMapSize;
                
                if (tileTypeUV.x < 0.0 || tileTypeUV.x > 1.0 || tileTypeUV.y < 0.0 || tileTypeUV.y > 1.0) {
                    return TILE_NONE;
                }
                
                vec4 tileType = texture2D(uTileTypeMap, tileTypeUV);
                
                // Detect invalid/default WHITE texture
                if (tileType.r > 0.5 && tileType.g > 0.5) {
                    return TILE_NONE;
                }
                
                if (tileType.r > 0.5) return TILE_WALL_SIDE;
                if (tileType.g > 0.5) return TILE_WALL_TOP;
                
                return TILE_NONE;
            }
            
            // Find the bottom Y coordinate of a wall (in world pixels)
            // Searches downward from the current tile to find where the wall ends
            float findWallBottomY(vec2 currentTilePos) {
                float bottomTileY = currentTilePos.y;
                
                // Search downward for up to MAX_WALL_HEIGHT tiles
                for (int i = 1; i <= MAX_WALL_HEIGHT; i++) {
                    vec2 checkTile = vec2(currentTilePos.x, currentTilePos.y + float(i));
                    int tileType = getTileTypeAtTile(checkTile);
                    
                    // If we find another WALL_SIDE, update the bottom
                    if (tileType == TILE_WALL_SIDE) {
                        bottomTileY = checkTile.y;
                    } else {
                        // Wall ended, stop searching
                        break;
                    }
                }
                
                // Return the bottom edge of the bottom-most wall tile (in world pixels)
                return (bottomTileY + 1.0) * uTileSize.y;
            }
            
            // Sample shadow map with Gaussian blur for soft shadows
            float sampleShadowMap(float angle, float lightIndex, float distance, float blur) {
                float angleCoord = (angle + PI) / TWO_PI;
                float yCoord = (lightIndex + 0.5) / float(MAX_LIGHTS);
                float blurAmount = blur / uShadowMapResolution;
                
                float litSum = 0.0;
                
                // 11-tap Gaussian blur with weights
                float w0 = 0.022657;
                float w1 = 0.046108;
                float w2 = 0.080127;
                float w3 = 0.118904;
                float w4 = 0.150677;
                float w5 = 0.163053;
                
                float d;
                d = texture2D(uShadowMap, vec2(fract(angleCoord - 5.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w0;
                d = texture2D(uShadowMap, vec2(fract(angleCoord - 4.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w1;
                d = texture2D(uShadowMap, vec2(fract(angleCoord - 3.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w2;
                d = texture2D(uShadowMap, vec2(fract(angleCoord - 2.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w3;
                d = texture2D(uShadowMap, vec2(fract(angleCoord - 1.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w4;
                d = texture2D(uShadowMap, vec2(fract(angleCoord), yCoord)).r;
                litSum += step(distance, d) * w5;
                d = texture2D(uShadowMap, vec2(fract(angleCoord + 1.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w4;
                d = texture2D(uShadowMap, vec2(fract(angleCoord + 2.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w3;
                d = texture2D(uShadowMap, vec2(fract(angleCoord + 3.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w2;
                d = texture2D(uShadowMap, vec2(fract(angleCoord + 4.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w1;
                d = texture2D(uShadowMap, vec2(fract(angleCoord + 5.0*blurAmount), yCoord)).r;
                litSum += step(distance, d) * w0;
                
                return litSum;
            }
            
            // Calculate angle difference handling wrap-around
            float angleDiff(float a, float b) {
                float diff = a - b;
                // Normalize to -PI to PI
                diff = mod(diff + PI, TWO_PI) - PI;
                return abs(diff);
            }
            
            vec3 calculateLight(vec2 pixelPos, vec4 lightData, vec3 lightColor, vec4 spotData, float lightIndex, bool onObstacle, int tileType) {
                vec2 lightPos = lightData.xy;
                float radius = lightData.z;
                float intensity = lightData.w;
                
                if (intensity <= 0.0) return vec3(0.0);
                
                vec2 toPixel = pixelPos - lightPos;
                float dist = length(toPixel);
                
                if (dist >= radius) return vec3(0.0);
                
                // Spotlight parameters
                float spotDirection = spotData.x;  // Direction in radians
                float coneAngle = spotData.y;      // Half cone angle in radians
                float innerRadius = spotData.z;    // Inner radius (start distance)
                float isSpotlight = spotData.w;    // 1.0 if spotlight, 0.0 if point light
                
                // Check inner radius - if pixel is closer than inner radius, no light
                if (dist < innerRadius) return vec3(0.0);
                
                // Calculate effective distance (from inner radius to outer radius)
                float effectiveRadius = radius - innerRadius;
                float effectiveDist = dist - innerRadius;
                float normalizedDist = effectiveDist / effectiveRadius;
                
                // Calculate pixel angle for spotlight check and shadow sampling
                float pixelAngle = atan(toPixel.y, toPixel.x);
                
                // Spotlight cone check
                // For WALL SIDES (vertical surfaces), we use VERTICAL boundary instead of cone angle
                // For WALL TOPS and regular surfaces, we use normal cone angle
                float spotlightFactor = 1.0;
                if (isSpotlight > 0.5) {
                    // Get spotlight direction components
                    float spotDirY = sin(spotDirection);
                    float spotDirX = cos(spotDirection);
                    
                    // First, do the normal angular cone check for ALL pixels
                    float angleFromCenter = angleDiff(pixelAngle, spotDirection);
                    
                    // Outside cone - no light at all
                    if (angleFromCenter > coneAngle) return vec3(0.0);
                    
                    // Check if this pixel is on a WALL SIDE - these use VERTICAL boundary
                    // This creates a sharp vertical edge on wall sides instead of diagonal
                    // Use WALL_SIDE if available, otherwise fall back to onObstacle check
                    // for any obstacle that's not a WALL_TOP
                    bool useVerticalBoundary = (tileType == TILE_WALL_SIDE) ||
                                               (onObstacle && tileType != TILE_WALL_TOP);
                    
                    if (useVerticalBoundary) {
                        // VERTICAL BOUNDARY for wall sides
                        // Calculate where the cone edges would be at THIS pixel's Y level
                        // Then use those X positions as VERTICAL boundaries
                        vec2 worldPos = pixelPos + uDisplayOffset;
                        vec2 lightWorldPos = lightPos + uDisplayOffset;
                        
                        // Distance from light to this pixel's Y level
                        float verticalDist = worldPos.y - lightWorldPos.y;
                        
                        // Only apply vertical boundary if pixel is in the direction the light points
                        // For light pointing down (spotDirY > 0), pixel must be below light (verticalDist > 0)
                        // For light pointing up (spotDirY < 0), pixel must be above light (verticalDist < 0)
                        bool pixelInLightDirection = (spotDirY > 0.0 && verticalDist > 0.0) ||
                                                     (spotDirY < 0.0 && verticalDist < 0.0);
                        
                        if (pixelInLightDirection && abs(spotDirY) > 0.1) {
                            // Calculate the cone center X at this Y level
                            // The cone center follows the spotlight direction
                            float absVerticalDist = abs(verticalDist);
                            float absSpotDirY = abs(spotDirY);
                            
                            // Distance along the spotlight direction to reach this Y level
                            float distAlongDir = absVerticalDist / absSpotDirY;
                            
                            // X position of cone center at this Y level
                            float coneCenterX = lightWorldPos.x + spotDirX * distAlongDir;
                            
                            // Half-width of cone at this distance (using tangent of cone angle)
                            float coneHalfWidth = distAlongDir * tan(coneAngle);
                            
                            // VERTICAL boundaries: left and right edges of the cone at this Y
                            float leftBoundary = coneCenterX - coneHalfWidth;
                            float rightBoundary = coneCenterX + coneHalfWidth;
                            
                            // Check if pixel X is within the vertical boundaries
                            if (worldPos.x < leftBoundary || worldPos.x > rightBoundary) {
                                return vec3(0.0);
                            }
                            
                            // Soft edge falloff at vertical boundaries
                            float edgeSoftness = coneHalfWidth * 0.15;
                            float distFromLeft = worldPos.x - leftBoundary;
                            float distFromRight = rightBoundary - worldPos.x;
                            float minDistFromEdge = min(distFromLeft, distFromRight);
                            
                            if (minDistFromEdge < edgeSoftness && edgeSoftness > 0.0) {
                                spotlightFactor = smoothstep(0.0, edgeSoftness, minDistFromEdge);
                            }
                        } else {
                            // Pixel is not in the direction the light points, or light is mostly horizontal
                            // Fall back to normal angular cone check
                            float edgeSoftness = coneAngle * 0.2;
                            float edgeStart = coneAngle - edgeSoftness;
                            if (angleFromCenter > edgeStart) {
                                spotlightFactor = 1.0 - (angleFromCenter - edgeStart) / edgeSoftness;
                                spotlightFactor = smoothstep(0.0, 1.0, spotlightFactor);
                            }
                        }
                    } else {
                        // NORMAL CONE CHECK for wall tops, regular obstacles, and non-obstacles
                        // Soft edge falloff at cone boundary
                        float edgeSoftness = coneAngle * 0.2;
                        float edgeStart = coneAngle - edgeSoftness;
                        if (angleFromCenter > edgeStart) {
                            spotlightFactor = 1.0 - (angleFromCenter - edgeStart) / edgeSoftness;
                            spotlightFactor = smoothstep(0.0, 1.0, spotlightFactor);
                        }
                    }
                }
                
                // Calculate shadow using 1D shadow map
                // For spotlights, shadow map contains 0 for angles outside the cone
                // For point lights, shadow map contains distance to first obstacle
                float shadow = 1.0;
                if (uShadowsEnabled && dist > 1.0) {
                    float blur = smoothstep(0.0, 1.0, normalizedDist) * uShadowSoftness;
                    
                    // For shadow calculation, use normalized distance from light center
                    float shadowDist = dist / radius;
                    
                    if (onObstacle) {
                        // For obstacles: check if we're outside spotlight cone
                        // Shadow map stores 0 for angles outside cone (for spotlights)
                        // We need to sample without blur to get accurate cone boundary
                        float angleCoord = (pixelAngle + PI) / TWO_PI;
                        float yCoord = (lightIndex + 0.5) / float(MAX_LIGHTS);
                        float rawShadowDist = texture2D(uShadowMap, vec2(angleCoord, yCoord)).r;
                        
                        // If raw shadow distance is 0, we're outside spotlight cone - no light
                        if (rawShadowDist < 0.01) {
                            shadow = 0.0;
                        } else {
                            // Wall geometry-aware lighting for obstacles
                                if (tileType == TILE_WALL_TOP) {
                                    // Wall tops (horizontal surface facing up) - always fully lit
                                    shadow = 1.0;
                                } else if (tileType == TILE_WALL_SIDE) {
                                    // Wall sides are vertical surfaces that "face" downward (toward the player)
                                    // They are lit when light comes from BELOW (light.y > wall bottom)
                                    // For multi-tile walls, we need to find the ACTUAL bottom of the entire wall
                                    vec2 worldPos = pixelPos + uDisplayOffset;
                                    vec2 tilePos = floor(worldPos / uTileSize);
                                    
                                    // Find the bottom of the entire wall structure (not just this tile)
                                    float wallBottomY = findWallBottomY(tilePos);
                                    
                                    // Light position in world coordinates
                                    vec2 lightWorldPos = lightPos + uDisplayOffset;
                                    
                                    // Light must be BELOW the bottom edge of the ENTIRE wall to illuminate it
                                    // (wall side faces downward, so light from below illuminates it)
                                    if (lightWorldPos.y > wallBottomY) {
                                        // Light is below the wall - wall side is lit
                                        // BUT we need to check if there's a shadow from OTHER obstacles
                                        // Project shadow from the floor position directly below this wall pixel
                                        
                                        // Calculate the floor position (bottom of entire wall, same X as pixel)
                                        vec2 floorWorldPos = vec2(worldPos.x, wallBottomY + 1.0);
                                        vec2 floorScreenPos = floorWorldPos - uDisplayOffset;
                                        
                                        // Calculate angle and distance from light to floor position
                                        vec2 toFloor = floorScreenPos - lightPos;
                                        float floorDist = length(toFloor);
                                        float floorAngle = atan(toFloor.y, toFloor.x);
                                        float floorShadowDist = floorDist / radius;
                                        
                                        // Sample shadow map at floor position
                                        if (floorDist < radius && floorDist > 1.0) {
                                            float floorBlur = smoothstep(0.0, 1.0, floorShadowDist) * uShadowSoftness;
                                            shadow = sampleShadowMap(floorAngle, lightIndex, floorShadowDist, floorBlur);
                                        } else {
                                            shadow = 1.0;
                                        }
                                    } else {
                                        // Light is at the same level or above - wall side is in shadow
                                        shadow = 0.0;
                                    }
                                } else {
                                    // Regular obstacle (no tile type info) - fully lit
                                    shadow = 1.0;
                                }
                        }
                    } else {
                        // For non-obstacles: check if this is a wall side (vertical surface)
                        // Wall sides need vertical shadow projection even if not marked as obstacle
                        if (tileType == TILE_WALL_SIDE) {
                            // Wall side - project shadow vertically from wall bottom
                            // For multi-tile walls, we need to find the ACTUAL bottom of the entire wall
                            vec2 worldPos = pixelPos + uDisplayOffset;
                            vec2 tilePos = floor(worldPos / uTileSize);
                            
                            // Find the bottom of the entire wall structure (not just this tile)
                            float wallBottomY = findWallBottomY(tilePos);
                            vec2 lightWorldPos = lightPos + uDisplayOffset;
                            
                            // Light must be BELOW the entire wall to illuminate it
                            if (lightWorldPos.y > wallBottomY) {
                                // Light is below the wall - wall side is lit
                                shadow = 1.0;
                            } else {
                                // Light is above or at same level - wall side is in shadow
                                shadow = 0.0;
                            }
                        } else {
                            // Normal shadow calculation for non-wall surfaces
                            shadow = sampleShadowMap(pixelAngle, lightIndex, shadowDist, blur);
                        }
                    }
                }
                
                // Quadratic falloff from inner radius
                float att = 1.0 - normalizedDist;
                att = att * att * intensity * shadow * spotlightFactor;
                
                return lightColor * att;
            }
            
            // Sun shadow using GPU-generated shadow map (render-to-texture)
            float calculateSunShadow(vec2 pixelPos) {
                if (!uSunShadowsEnabled) return 1.0;
                
                // Sample GPU-generated sun shadow map
                vec2 shadowUV = pixelPos / uResolution;
                float shadow = texture2D(uSunShadowMap, shadowUV).r;
                
                return shadow;
            }
            
            // Sample sprite shadow map (from DynamicLighting_SpriteShadows)
            // Returns shadow factor (1.0 = fully lit, 0.0 = fully shadowed)
            float sampleSpriteShadow(vec2 pixelPos) {
                if (!uSpriteShadowsEnabled) return 1.0;
                
                vec2 shadowUV = pixelPos / uResolution;
                float shadow = texture2D(uSpriteShadowMap, shadowUV).r;
                
                return shadow;
            }
            
            // Calculate sun light contribution with GPU-based shadows
            // The sun shadow map is 2D and contains shadows for FLOOR pixels.
            //
            // For wall sides, we use a HEIGHT-AWARE approach:
            // - Wall is a vertical surface with normal pointing toward player (down on screen)
            // - For each wall pixel at height h, we check if the shadow on the floor
            //   extends far enough to cast onto this height
            vec3 calculateSunLight(vec2 pixelPos, bool onObstacle, int tileType) {
                if (!uSunEnabled || uSunIntensity <= 0.0) return vec3(0.0);
                
                float shadow = 1.0;
                
                // Sun direction vector
                vec2 sunDir = vec2(cos(uSunDirection), sin(uSunDirection));
                
                if (tileType == TILE_WALL_TOP) {
                    // Wall tops are always fully lit (horizontal surface facing up)
                    shadow = 1.0;
                } else if (tileType == TILE_WALL_SIDE) {
                    // Wall sides: HEIGHT-AWARE shadow projection
                    //
                    // For a pixel at height h above floor:
                    // 1. First check if floor directly below is in shadow
                    // 2. If yes, calculate if shadow reaches this height based on sun angle
                    
                    vec2 worldPos = pixelPos + uDisplayOffset;
                    vec2 tilePos = floor(worldPos / uTileSize);
                    
                    // Find the bottom of the entire wall structure
                    float wallBottomY = findWallBottomY(tilePos);
                    
                    // Height of this pixel above the floor (in pixels)
                    // Clamp to positive values to avoid issues with pixels at or below floor level
                    float heightAboveFloor = max(0.0, wallBottomY - worldPos.y);
                    
                    // First, check shadow at the floor directly below this wall pixel
                    vec2 floorWorldPos = vec2(worldPos.x, wallBottomY + 1.0);
                    vec2 floorScreenPos = floorWorldPos - uDisplayOffset;
                    float floorShadowBelow = calculateSunShadow(floorScreenPos);
                    
                    // If floor directly below is fully lit, wall is fully lit
                    if (floorShadowBelow > 0.99) {
                        shadow = 1.0;
                    } else {
                        // Floor below has shadow - now check if shadow reaches this height
                        //
                        // For shadow to reach height h on wall, the shadow on floor must
                        // extend a certain distance from the wall base in the direction
                        // where the sun is coming from.
                        //
                        // Distance needed: h * |sunDirX / sunDirY|
                        // Direction: opposite to sunDir.x (shadow extends away from sun)
                        
                        if (abs(sunDir.y) > 0.01 && abs(sunDir.x) > 0.01) {
                            // Sun has both horizontal and vertical components
                            // Calculate required floor distance for shadow to reach this height
                            float requiredFloorDist = heightAboveFloor * abs(sunDir.x / sunDir.y);
                            
                            // Sample shadow at the required distance from wall base
                            // Direction: opposite to sun's horizontal component
                            // (shadow extends in the direction opposite to where sun is)
                            float sampleOffsetX = -sign(sunDir.x) * requiredFloorDist;
                            vec2 sampleWorldPos = vec2(worldPos.x + sampleOffsetX, wallBottomY + 1.0);
                            vec2 sampleScreenPos = sampleWorldPos - uDisplayOffset;
                            
                            // Sample shadow at the calculated distance
                            // This is the key: we only use the shadow at the distance
                            // that corresponds to this pixel's height
                            shadow = calculateSunShadow(sampleScreenPos);
                        } else if (abs(sunDir.y) > 0.01) {
                            // Sun is mostly vertical - shadow goes straight up the wall
                            // Use the floor shadow directly
                            shadow = floorShadowBelow;
                        } else {
                            // Sun is mostly horizontal - shadow doesn't climb wall much
                            // Only bottom of wall gets shadow
                            if (heightAboveFloor < uTileSize.y * 0.5) {
                                shadow = floorShadowBelow;
                            } else {
                                shadow = 1.0;
                            }
                        }
                    }
                } else if (onObstacle) {
                    // Regular obstacles are fully lit (they cast shadows, not receive them)
                    shadow = 1.0;
                } else {
                    // Floor/ground - sample shadow map directly
                    shadow = calculateSunShadow(pixelPos);
                }
                
                // Calculate a subtle gradient based on position to simulate 3D lighting
                vec2 normalizedPos = pixelPos / uResolution;
                float directionalFactor = 0.9 + 0.1 * dot(normalizedPos - 0.5, sunDir);
                directionalFactor = clamp(directionalFactor, 0.7, 1.0);
                
                // Apply intensity, color and shadow
                float att = uSunIntensity * directionalFactor * shadow;
                
                return uSunColor * att;
            }
            
            // Debug mode: 0 = off, 1 = show obstacles in red, 2 = show tile types, 3 = show vertical boundary debug
            uniform int uDebugMode;
            
            void main(void) {
                vec4 texColor = texture2D(uSampler, vTextureCoord);
                vec2 pixelPos = vTextureCoord * uResolution;
                
                bool onObstacle = isOnObstacle(pixelPos);
                int tileType = getTileType(pixelPos);
                
                // Debug mode: show obstacles/tile types
                if (uDebugMode == 1 && onObstacle) {
                    // Show obstacles in red
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                    return;
                }
                if (uDebugMode == 2) {
                    // Show tile types: red = wall side, green = wall top, blue = obstacle
                    if (tileType == TILE_WALL_SIDE) {
                        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                        return;
                    } else if (tileType == TILE_WALL_TOP) {
                        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
                        return;
                    } else if (onObstacle) {
                        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
                        return;
                    }
                }
                // Debug mode 3: Show vertical boundary calculation for ALL spotlights
                if (uDebugMode == 3) {
                    for (int i = 0; i < MAX_LIGHTS; i++) {
                        if (i >= uActiveLightCount) break;
                        
                        vec4 lightData = uLightData[i];
                        vec4 spotData = uSpotlightData[i];
                        
                        if (spotData.w > 0.5) { // Is spotlight
                            vec2 lightPos = lightData.xy;
                            float spotDirection = spotData.x;
                            float coneAngle = spotData.y;
                            
                            vec2 worldPos = pixelPos + uDisplayOffset;
                            vec2 lightWorldPos = lightPos + uDisplayOffset;
                            
                            // Get spotlight direction components
                            float spotDirY = sin(spotDirection);
                            float spotDirX = cos(spotDirection);
                            
                            // Check if light points mostly vertically
                            if (abs(spotDirY) > 0.5) {
                                float verticalDist = worldPos.y - lightWorldPos.y;
                                
                                // Check if pixel is in the direction the light is pointing
                                bool pixelInLightDirection = (spotDirY > 0.0 && verticalDist > 0.0) ||
                                                             (spotDirY < 0.0 && verticalDist < 0.0);
                                
                                if (pixelInLightDirection) {
                                    float absVerticalDist = abs(verticalDist);
                                    float absSpotDirY = abs(spotDirY);
                                    float distAlongDir = absVerticalDist / absSpotDirY;
                                    float coneCenterX = lightWorldPos.x + spotDirX * distAlongDir;
                                    float coneHalfWidth = distAlongDir * tan(coneAngle);
                                    
                                    float horizontalDist = abs(worldPos.x - coneCenterX);
                                    
                                    // Show vertical boundary: green = inside, red = outside
                                    if (horizontalDist <= coneHalfWidth) {
                                        // Inside vertical boundary - show green tint
                                        float edgeFactor = horizontalDist / coneHalfWidth;
                                        gl_FragColor = vec4(texColor.rgb * vec3(0.5, 1.0, 0.5) * (1.0 - edgeFactor * 0.5), texColor.a);
                                        return;
                                    } else {
                                        // Outside vertical boundary - show red tint
                                        gl_FragColor = vec4(texColor.rgb * vec3(1.0, 0.3, 0.3), texColor.a);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
                
                vec3 totalLight = uAmbientColor * uAmbientIntensity;
                
                // Add sun light (global directional light with GPU shadows)
                // Pass tileType so sun shadows can be projected onto wall sides
                totalLight += calculateSunLight(pixelPos, onObstacle, tileType);
                
                for (int i = 0; i < MAX_LIGHTS; i++) {
                    if (i >= uActiveLightCount) break;
                    totalLight += calculateLight(pixelPos, uLightData[i], uLightColors[i], uSpotlightData[i], float(i), onObstacle, tileType);
                }
                
                // Apply sprite shadows (from DynamicLighting_SpriteShadows)
                // Sprite shadows affect all light sources except ambient
                float spriteShadow = sampleSpriteShadow(pixelPos);
                vec3 ambientPart = uAmbientColor * uAmbientIntensity;
                vec3 lightPart = totalLight - ambientPart;
                totalLight = ambientPart + lightPart * spriteShadow;
                
                totalLight = clamp(totalLight, 0.0, 2.0);
                
                gl_FragColor = vec4(texColor.rgb * sqrt(totalLight), texColor.a);
            }
        `;
    }

    class DynamicLightingFilter extends PIXI.Filter {
        constructor(maxLights = CONFIG.maxLights) {
            const fragmentShader = generateFragmentShader(maxLights);
            
            super(null, fragmentShader);
            
            this._maxLights = maxLights;
            
            // Initialize uniforms
            this.uniforms.uAmbientColor = [0.1, 0.1, 0.18];
            this.uniforms.uAmbientIntensity = CONFIG.ambientIntensity;
            this.uniforms.uResolution = [Graphics.width, Graphics.height];
            this.uniforms.uActiveLightCount = 0;
            
            // Initialize light arrays with zeros
            this.uniforms.uLightData = new Float32Array(maxLights * 4);
            this.uniforms.uLightColors = new Float32Array(maxLights * 3);
            this.uniforms.uSpotlightData = new Float32Array(maxLights * 4);
            
            // 1D Shadow map uniforms
            this.uniforms.uShadowMap = PIXI.Texture.WHITE;
            this.uniforms.uShadowMapResolution = 360;
            this.uniforms.uShadowSoftness = 5.0;
            this.uniforms.uShadowsEnabled = false;
            
            // Region map uniforms
            this.uniforms.uRegionMap = PIXI.Texture.WHITE;
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];
            this.uniforms.uDisplayOffsetInt = [0, 0];  // Integer-aligned offset for region map sampling
            this.uniforms.uRegionMapSize = [20, 15];
            
            // Tile type map uniforms (for wall geometry-aware shadows)
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this.uniforms.uTileTypeMapSize = [20, 15];
            this.uniforms.uTileTypePadding = 2.0;
            this.uniforms.uWallShadowEnabled = false;
            
            // Debug mode: 0 = off, 1 = show obstacles in red, 2 = show tile types
            this.uniforms.uDebugMode = 0;
            
            // Sun light uniforms (GPU render-to-texture shadows)
            this.uniforms.uSunEnabled = false;
            this.uniforms.uSunDirection = degToRad(CONFIG.sunDirection);
            this.uniforms.uSunIntensity = CONFIG.sunIntensity;
            const sunRgb = hexToRgb(CONFIG.sunColor);
            this.uniforms.uSunColor = [sunRgb.r, sunRgb.g, sunRgb.b];
            this.uniforms.uSunShadowMap = PIXI.Texture.WHITE;
            this.uniforms.uSunShadowsEnabled = false;
            
            // Sprite shadow uniforms (from DynamicLighting_SpriteShadows)
            this.uniforms.uSpriteShadowMap = PIXI.Texture.WHITE;
            this.uniforms.uSpriteShadowsEnabled = false;
            
            debugLog(`DynamicLightingFilter created with max ${maxLights} lights (spotlight + sun + sprite shadows support)`);
        }

        setAmbientColor(hexColor) {
            const rgb = hexToRgb(hexColor);
            this.uniforms.uAmbientColor = [rgb.r, rgb.g, rgb.b];
        }

        setAmbientIntensity(intensity) {
            this.uniforms.uAmbientIntensity = intensity;
        }

        setShadowMap(texture) {
            if (texture) {
                this.uniforms.uShadowMap = texture;
            }
        }

        setShadowParams(resolution, softness, enabled) {
            this.uniforms.uShadowMapResolution = resolution;
            this.uniforms.uShadowSoftness = softness;
            this.uniforms.uShadowsEnabled = enabled;
        }

        /**
         * Enable or disable sun light
         * @param {boolean} enabled - Whether sun light is enabled
         */
        setSunEnabled(enabled) {
            this.uniforms.uSunEnabled = enabled;
        }

        /**
         * Set sun light direction
         * @param {number} direction - Direction in radians
         */
        setSunDirection(direction) {
            this.uniforms.uSunDirection = direction;
        }

        /**
         * Set sun light intensity
         * @param {number} intensity - Light intensity (0.0 - 2.0)
         */
        setSunIntensity(intensity) {
            this.uniforms.uSunIntensity = intensity;
        }

        /**
         * Set sun light color
         * @param {string} hexColor - Color in hex format
         */
        setSunColor(hexColor) {
            const rgb = hexToRgb(hexColor);
            this.uniforms.uSunColor = [rgb.r, rgb.g, rgb.b];
        }

        /**
         * Set all sun light parameters at once
         * @param {boolean} enabled - Whether sun is enabled
         * @param {number} direction - Direction in radians
         * @param {number} intensity - Light intensity
         * @param {string|object} color - Color in hex format or pre-converted RGB object
         */
        setSunParams(enabled, direction, intensity, color) {
            // DEBUG: Log what we receive
            if (DEBUG && frameCount % 60 === 1) {
                console.log('[DynamicLighting.setSunParams] Input:', {
                    enabled: enabled,
                    direction: direction,
                    intensity: intensity,
                    color: color,
                    colorType: typeof color
                });
            }
            
            this.uniforms.uSunEnabled = enabled;
            this.uniforms.uSunDirection = direction;
            this.uniforms.uSunIntensity = intensity;
            if (color) {
                // Accept both hex string and pre-converted RGB object
                if (typeof color === 'object' && color.r !== undefined) {
                    // Color is already an RGB object (0-1 range expected)
                    this.uniforms.uSunColor = [color.r, color.g, color.b];
                    if (DEBUG && frameCount % 60 === 1) {
                        console.log('[DynamicLighting.setSunParams] Using RGB object:', this.uniforms.uSunColor);
                    }
                } else {
                    // Color is a hex string, convert it
                    const rgb = hexToRgb(color);
                    this.uniforms.uSunColor = [rgb.r, rgb.g, rgb.b];
                    if (DEBUG && frameCount % 60 === 1) {
                        console.log('[DynamicLighting.setSunParams] Converted hex to RGB:', this.uniforms.uSunColor);
                    }
                }
            } else {
                if (DEBUG && frameCount % 60 === 1) {
                    console.log('[DynamicLighting.setSunParams] WARNING: No color provided!');
                }
            }
        }

        /**
         * Set sun shadow map texture (GPU render-to-texture)
         * @param {PIXI.Texture} texture - GPU-generated sun shadow map
         * @param {boolean} enabled - Whether sun shadows are enabled
         */
        setSunShadowMap(texture, enabled) {
            if (texture) {
                this.uniforms.uSunShadowMap = texture;
            }
            this.uniforms.uSunShadowsEnabled = enabled;
        }

        /**
         * Updates all light data in a single batch operation
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
                const rgb = light.colorRgb || hexToRgb(light.color);
                
                // Pack light data: x, y, radius, intensity
                const dataOffset = i * 4;
                lightData[dataOffset] = light.x;
                lightData[dataOffset + 1] = light.y;
                lightData[dataOffset + 2] = light.radius;
                lightData[dataOffset + 3] = light.intensity;
                
                // Pack light color: r, g, b
                const colorOffset = i * 3;
                lightColors[colorOffset] = rgb.r;
                lightColors[colorOffset + 1] = rgb.g;
                lightColors[colorOffset + 2] = rgb.b;
                
                // Pack spotlight data: direction, coneAngle, innerRadius, isSpotlight
                const spotOffset = i * 4;
                spotlightData[spotOffset] = light.direction || 0;           // Direction in radians
                spotlightData[spotOffset + 1] = light.coneAngle || Math.PI; // Cone half-angle in radians (PI = full circle)
                spotlightData[spotOffset + 2] = light.innerRadius || 0;     // Inner radius
                spotlightData[spotOffset + 3] = light.isSpotlight ? 1.0 : 0.0;
            }
            
            // Zero out unused lights
            for (let i = count; i < this._maxLights; i++) {
                const dataOffset = i * 4;
                lightData[dataOffset + 3] = 0;
            }
        }
        
        get maxLights() {
            return this._maxLights;
        }
    }

    // Alias for backwards compatibility
    const SimpleLightingFilter = DynamicLightingFilter;

    //==========================================================================
    // Game_Map Extensions
    //==========================================================================

    const _Game_Map_initialize = Game_Map.prototype.initialize;
    Game_Map.prototype.initialize = function() {
        _Game_Map_initialize.call(this);
        this._ambientColor = CONFIG.ambientColor;
        this._ambientIntensity = CONFIG.ambientIntensity;
        this._playerLight = null;
        // Sun light initialization
        this._sunLight = {
            enabled: false,
            direction: degToRad(CONFIG.sunDirection),
            intensity: CONFIG.sunIntensity,
            color: CONFIG.sunColor,
            colorRgb: hexToRgb(CONFIG.sunColor)
        };
    };

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this._playerLight = null;
        this.setupMapLighting();
    };

    Game_Map.prototype.setupMapLighting = function() {
        this._ambientColor = CONFIG.ambientColor;
        this._ambientIntensity = CONFIG.ambientIntensity;
        
        // Reset sun to defaults
        this._sunLight = {
            enabled: false,
            direction: degToRad(CONFIG.sunDirection),
            intensity: CONFIG.sunIntensity,
            color: CONFIG.sunColor,
            colorRgb: hexToRgb(CONFIG.sunColor)
        };
        
        if ($dataMap && $dataMap.note) {
            debugLog('Map note:', $dataMap.note);
            
            // Parse ambient light
            const ambientMatch = $dataMap.note.match(/<ambient[:\s]*([^,>]+)[,\s]*([^>]*)>/i);
            if (ambientMatch) {
                this._ambientColor = ambientMatch[1].trim();
                if (ambientMatch[2]) this._ambientIntensity = parseFloat(ambientMatch[2].trim());
                debugLog('Map ambient set to:', this._ambientColor, this._ambientIntensity);
            }
            
            // Parse sun light: <sun:direction,intensity,color> or <sun:off>
            const sunMatch = $dataMap.note.match(/<sun[:\s]*([^>]*)>/i);
            if (sunMatch) {
                const sunParams = sunMatch[1].trim();
                if (sunParams.toLowerCase() === 'off') {
                    this._sunLight.enabled = false;
                    debugLog('Sun light disabled for this map');
                } else {
                    const params = sunParams.split(',').map(p => p.trim()).filter(p => p);
                    this._sunLight.enabled = true;
                    if (params[0]) this._sunLight.direction = degToRad(parseFloat(params[0]));
                    if (params[1]) this._sunLight.intensity = parseFloat(params[1]);
                    if (params[2]) {
                        this._sunLight.color = params[2];
                        this._sunLight.colorRgb = hexToRgb(params[2]);
                    }
                    debugLog('Sun light enabled:', this._sunLight);
                }
            }
        }
    };

    Game_Map.prototype.setAmbientLight = function(color, intensity) {
        this._ambientColor = color;
        this._ambientIntensity = intensity;
    };

    Game_Map.prototype.setPlayerLight = function(enabled) {
        if (enabled) {
            const color = CONFIG.defaultColor;
            this._playerLight = {
                enabled: true,
                radius: CONFIG.defaultRadius,
                intensity: CONFIG.defaultIntensity,
                color: color,
                colorRgb: hexToRgb(color),
                isSpotlight: false,
                direction: 0,
                coneAngle: Math.PI,
                innerRadius: 0,
                followDirection: false
            };
        } else {
            this._playerLight = null;
        }
    };

    Game_Map.prototype.setPlayerLightParams = function(radius, intensity, color) {
        if (!this._playerLight) this.setPlayerLight(true);
        if (radius !== undefined) this._playerLight.radius = radius;
        if (intensity !== undefined) this._playerLight.intensity = intensity;
        if (color !== undefined) {
            this._playerLight.color = color;
            this._playerLight.colorRgb = hexToRgb(color);
        }
    };

    /**
     * Set player light as a spotlight
     */
    Game_Map.prototype.setPlayerSpotlight = function(direction, coneAngle, innerRadius, followDirection) {
        if (!this._playerLight) this.setPlayerLight(true);
        this._playerLight.isSpotlight = true;
        this._playerLight.direction = degToRad(direction);
        this._playerLight.coneAngle = degToRad(coneAngle / 2); // Store half-angle
        this._playerLight.innerRadius = innerRadius || 0;
        this._playerLight.followDirection = followDirection !== false;
    };

    /**
     * Convert player spotlight back to point light
     */
    Game_Map.prototype.setPlayerLightToPoint = function() {
        if (this._playerLight) {
            this._playerLight.isSpotlight = false;
            this._playerLight.coneAngle = Math.PI;
            this._playerLight.innerRadius = 0;
            this._playerLight.followDirection = false;
        }
    };

    /**
     * Enable or disable sun light
     * @param {boolean} enabled - Whether sun light is enabled
     */
    Game_Map.prototype.setSunLight = function(enabled) {
        if (!this._sunLight) {
            this._sunLight = {
                enabled: false,
                direction: degToRad(CONFIG.sunDirection),
                intensity: CONFIG.sunIntensity,
                color: CONFIG.sunColor,
                colorRgb: hexToRgb(CONFIG.sunColor)
            };
        }
        this._sunLight.enabled = enabled;
    };

    /**
     * Set sun light parameters
     * @param {number} direction - Direction in degrees
     * @param {number} intensity - Light intensity
     * @param {string} color - Color in hex format
     */
    Game_Map.prototype.setSunLightParams = function(direction, intensity, color) {
        if (!this._sunLight) this.setSunLight(true);
        if (direction !== undefined) this._sunLight.direction = degToRad(direction);
        if (intensity !== undefined) this._sunLight.intensity = intensity;
        if (color !== undefined) {
            this._sunLight.color = color;
            this._sunLight.colorRgb = hexToRgb(color);
        }
    };

    //==========================================================================
    // Game_Event Extensions
    //==========================================================================

    const _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function(mapId, eventId) {
        _Game_Event_initialize.call(this, mapId, eventId);
        this._lightData = null;
        this.setupEventLight();
    };

    Game_Event.prototype.setupEventLight = function() {
        const event = this.event();
        if (!event) return;

        const note = event.note || '';
        debugLog('Event', this.eventId(), 'note:', note);
        
        // Check for spotlight first
        const spotMatch = note.match(/<spotlight[:\s]*([^>]*)>/i);
        if (spotMatch) {
            this._setupSpotlight(spotMatch[1]);
            return;
        }
        
        // Check for regular light
        const lightMatch = note.match(/<light(?:[:\s]([^>]*))?>/i);
        if (lightMatch) {
            this._setupPointLight(lightMatch[1] || '');
        }
    };

    Game_Event.prototype._setupPointLight = function(paramsStr) {
        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        
        // Check for inner radius parameter
        let innerRadius = 0;
        let colorParam = params[2];
        
        // Look for inner:XX parameter
        for (let i = 0; i < params.length; i++) {
            const innerMatch = params[i].match(/inner[:\s]*(\d+)/i);
            if (innerMatch) {
                innerRadius = parseFloat(innerMatch[1]);
                params.splice(i, 1);
                break;
            }
        }
        
        const color = params[2] || CONFIG.defaultColor;
        this._lightData = {
            enabled: true,
            radius: params[0] ? parseFloat(params[0]) : CONFIG.defaultRadius,
            intensity: params[1] ? parseFloat(params[1]) : CONFIG.defaultIntensity,
            color: color,
            colorRgb: hexToRgb(color),
            isSpotlight: false,
            direction: 0,
            coneAngle: Math.PI,
            innerRadius: innerRadius
        };
        
        debugLog('Event', this.eventId(), 'point light:', this._lightData);
    };

    /**
     * Setup spotlight from note tag
     * Format: <spotlight:radius,intensity,color,direction,coneAngle>
     */
    Game_Event.prototype._setupSpotlight = function(paramsStr) {
        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        
        const color = params[2] || CONFIG.defaultColor;
        const direction = params[3] ? parseFloat(params[3]) : 90;
        const coneAngle = params[4] ? parseFloat(params[4]) : 45;
        
        this._lightData = {
            enabled: true,
            radius: params[0] ? parseFloat(params[0]) : CONFIG.defaultRadius,
            intensity: params[1] ? parseFloat(params[1]) : CONFIG.defaultIntensity,
            color: color,
            colorRgb: hexToRgb(color),
            isSpotlight: true,
            direction: degToRad(direction),
            coneAngle: degToRad(coneAngle / 2), // Store half-angle
            innerRadius: 0
        };
        
        debugLog('Event', this.eventId(), 'spotlight:', this._lightData);
    };

    Game_Event.prototype.hasLight = function() {
        return this._lightData && this._lightData.enabled;
    };

    Game_Event.prototype.getLightData = function() {
        return this._lightData;
    };

    Game_Event.prototype.setLightEnabled = function(enabled) {
        if (this._lightData) {
            this._lightData.enabled = enabled;
        } else if (enabled) {
            const color = CONFIG.defaultColor;
            this._lightData = {
                enabled: true,
                radius: CONFIG.defaultRadius,
                intensity: CONFIG.defaultIntensity,
                color: color,
                colorRgb: hexToRgb(color),
                isSpotlight: false,
                direction: 0,
                coneAngle: Math.PI,
                innerRadius: 0
            };
        }
    };

    /**
     * Set light color with RGB caching
     */
    Game_Event.prototype.setLightColor = function(color) {
        if (this._lightData) {
            this._lightData.color = color;
            this._lightData.colorRgb = hexToRgb(color);
        }
    };

    /**
     * Convert event light to spotlight
     */
    Game_Event.prototype.setSpotlight = function(direction, coneAngle, innerRadius) {
        if (!this._lightData) {
            this.setLightEnabled(true);
        }
        this._lightData.isSpotlight = true;
        this._lightData.direction = degToRad(direction);
        this._lightData.coneAngle = degToRad(coneAngle / 2);
        if (innerRadius !== undefined) {
            this._lightData.innerRadius = innerRadius;
        }
    };

    /**
     * Set inner radius for light
     */
    Game_Event.prototype.setLightInnerRadius = function(innerRadius) {
        if (this._lightData) {
            this._lightData.innerRadius = innerRadius;
        }
    };

    /**
     * Convert spotlight back to point light
     */
    Game_Event.prototype.setLightToPoint = function() {
        if (this._lightData) {
            this._lightData.isSpotlight = false;
            this._lightData.coneAngle = Math.PI;
        }
    };

    //==========================================================================
    // Spriteset_Map Extensions
    //==========================================================================

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this.createLightingSystem();
    };

    Spriteset_Map.prototype.createLightingSystem = function() {
        try {
            this._lightingFilter = new SimpleLightingFilter();
            this._lightingFilter.setAmbientColor($gameMap._ambientColor);
            this._lightingFilter.setAmbientIntensity($gameMap._ambientIntensity);
            
            // Initialize sun light from map settings
            if ($gameMap._sunLight) {
                this._lightingFilter.setSunParams(
                    $gameMap._sunLight.enabled,
                    $gameMap._sunLight.direction,
                    $gameMap._sunLight.intensity,
                    $gameMap._sunLight.color
                );
                debugLog('Initial sun state:', $gameMap._sunLight.enabled,
                         'int:', $gameMap._sunLight.intensity);
            }
            
            if (!this._baseSprite.filters) {
                this._baseSprite.filters = [];
            }
            this._baseSprite.filters.push(this._lightingFilter);
            
            debugLog('Lighting filter applied to baseSprite');
        } catch (e) {
            console.error('[DynamicLighting] Filter creation failed:', e);
        }
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        
        // DEBUG: Log that we're about to call updateLightingSystem
        if (frameCount % 60 === 0) {
            console.log('[DynamicLighting] Spriteset_Map.update calling updateLightingSystem...');
        }
        
        this.updateLightingSystem();
    };

    // Global counter for logging
    let _updateLightingSystemCallCount = 0;
    
    Spriteset_Map.prototype.updateLightingSystem = function() {
        _updateLightingSystemCallCount++;
        
        // Log every 60 calls (about once per second at 60fps)
        const shouldLog = _updateLightingSystemCallCount % 60 === 1;
        
        if (shouldLog) {
            console.log('[DynamicLighting] *** updateLightingSystem CALLED *** count:', _updateLightingSystemCallCount);
        }
        
        if (!this._lightingFilter) {
            if (shouldLog) console.log('[DynamicLighting] ERROR: No lighting filter!');
            return;
        }

        // Update ambient light
        this._lightingFilter.setAmbientColor($gameMap._ambientColor);
        this._lightingFilter.setAmbientIntensity($gameMap._ambientIntensity);
        
        // Update sun light - use pre-converted colorRgb for performance
        if ($gameMap._sunLight) {
            const sunColorRgb = $gameMap._sunLight.colorRgb;
            const sunColor = $gameMap._sunLight.color;
            const sunEnabled = $gameMap._sunLight.enabled;
            const sunIntensity = $gameMap._sunLight.intensity;
            const sunDirection = $gameMap._sunLight.direction;
            
            if (shouldLog) {
                console.log('[DynamicLighting] ========== SUN UPDATE ==========');
                console.log('[DynamicLighting] Sun enabled:', sunEnabled);
                console.log('[DynamicLighting] Sun color (hex):', sunColor);
                console.log('[DynamicLighting] Sun colorRgb:', sunColorRgb ? `r=${sunColorRgb.r.toFixed(3)}, g=${sunColorRgb.g.toFixed(3)}, b=${sunColorRgb.b.toFixed(3)}` : 'NULL');
                console.log('[DynamicLighting] Sun intensity:', sunIntensity);
                console.log('[DynamicLighting] Sun direction:', sunDirection);
                console.log('[DynamicLighting] Filter uSunColor BEFORE:', this._lightingFilter.uniforms.uSunColor);
                console.log('[DynamicLighting] Filter uSunEnabled BEFORE:', this._lightingFilter.uniforms.uSunEnabled);
            }
            
            // Pass colorRgb if available, otherwise pass hex color
            const colorToPass = sunColorRgb || sunColor;
            
            this._lightingFilter.setSunParams(
                sunEnabled,
                sunDirection,
                sunIntensity,
                colorToPass
            );
            
            // Debug output after setSunParams
            if (shouldLog) {
                console.log('[DynamicLighting] Filter uSunColor AFTER:', this._lightingFilter.uniforms.uSunColor);
                console.log('[DynamicLighting] Filter uSunEnabled AFTER:', this._lightingFilter.uniforms.uSunEnabled);
                console.log('[DynamicLighting] Filter uSunIntensity AFTER:', this._lightingFilter.uniforms.uSunIntensity);
                console.log('[DynamicLighting] ================================');
            }
        } else {
            if (shouldLog) console.log('[DynamicLighting] WARNING: No $gameMap._sunLight object!');
        }

        const lights = [];
        const screenWidth = Graphics.width;
        const screenHeight = Graphics.height;
        
        // Collect event lights with off-screen culling
        const events = $gameMap.events();
        let culledCount = 0;
        
        for (const event of events) {
            if (event && event.hasLight && event.hasLight()) {
                const data = event.getLightData();
                const x = event.screenX();
                const y = event.screenY() - 24;
                const radius = data.radius;
                
                // Off-screen culling
                if (x + radius < 0 || x - radius > screenWidth ||
                    y + radius < 0 || y - radius > screenHeight) {
                    culledCount++;
                    continue;
                }
                
                lights.push({
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
        
        // Player light
        if ($gameMap._playerLight && $gameMap._playerLight.enabled) {
            const pl = $gameMap._playerLight;
            let direction = pl.direction;
            
            // Update direction based on player facing if followDirection is enabled
            if (pl.isSpotlight && pl.followDirection) {
                direction = degToRad(directionToAngle($gamePlayer.direction()));
            }
            
            lights.push({
                x: $gamePlayer.screenX(),
                y: $gamePlayer.screenY() - 24,
                radius: pl.radius,
                intensity: pl.intensity,
                color: pl.color,
                colorRgb: pl.colorRgb,
                isSpotlight: pl.isSpotlight,
                direction: direction,
                coneAngle: pl.coneAngle,
                innerRadius: pl.innerRadius
            });
        }
        
        // Store the filtered lights list for shadow plugin to use
        this._activeLights = lights;
        
        this._lightingFilter.updateLights(lights, screenWidth, screenHeight);
        
        frameCount++;
        if (frameCount % 300 === 1 && culledCount > 0) {
            debugLog('Off-screen lights culled:', culledCount, 'Active lights:', lights.length);
        }
    };

    //==========================================================================
    // Plugin Commands
    //==========================================================================

    PluginManager.registerCommand(pluginName, 'SetAmbientLight', args => {
        $gameMap.setAmbientLight(String(args.color), Number(args.intensity));
    });

    PluginManager.registerCommand(pluginName, 'SetEventLight', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (event) event.setLightEnabled(args.enabled === 'true');
    });

    PluginManager.registerCommand(pluginName, 'SetPlayerLight', args => {
        $gameMap.setPlayerLight(args.enabled === 'true');
    });

    PluginManager.registerCommand(pluginName, 'SetPlayerLightParams', args => {
        $gameMap.setPlayerLightParams(
            Number(args.radius),
            Number(args.intensity),
            String(args.color)
        );
    });

    PluginManager.registerCommand(pluginName, 'SetEventSpotlight', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (event) {
            event.setSpotlight(
                Number(args.direction),
                Number(args.coneAngle),
                Number(args.innerRadius)
            );
        }
    });

    PluginManager.registerCommand(pluginName, 'SetEventLightInnerRadius', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (event) {
            event.setLightInnerRadius(Number(args.innerRadius));
        }
    });

    PluginManager.registerCommand(pluginName, 'SetPlayerSpotlight', args => {
        $gameMap.setPlayerSpotlight(
            Number(args.direction),
            Number(args.coneAngle),
            Number(args.innerRadius),
            args.followDirection === 'true'
        );
    });

    PluginManager.registerCommand(pluginName, 'SetPlayerLightToPoint', args => {
        $gameMap.setPlayerLightToPoint();
    });

    PluginManager.registerCommand(pluginName, 'SetSunLight', args => {
        $gameMap.setSunLight(args.enabled === 'true');
    });

    PluginManager.registerCommand(pluginName, 'SetSunLightParams', args => {
        $gameMap.setSunLightParams(
            Number(args.direction),
            Number(args.intensity),
            String(args.color)
        );
    });

    //==========================================================================
    // Export
    //==========================================================================

    window.DynamicLighting = {
        CONFIG: CONFIG,
        hexToRgb: hexToRgb,
        degToRad: degToRad,
        directionToAngle: directionToAngle,
        /**
         * Set debug mode for lighting visualization
         * @param {number} mode - 0 = off, 1 = show obstacles in red, 2 = show tile types (red=wall side, green=wall top, blue=obstacle), 3 = show vertical boundary
         */
        setDebugMode: function(mode) {
            const scene = SceneManager._scene;
            if (scene && scene._spriteset && scene._spriteset._lightingFilter) {
                scene._spriteset._lightingFilter.uniforms.uDebugMode = mode;
                console.log('[DynamicLighting] Debug mode set to:', mode);
            } else {
                console.warn('[DynamicLighting] Cannot set debug mode - lighting filter not found');
            }
        },
        /**
         * Log info about all active lights (for debugging)
         */
        logLights: function() {
            const scene = SceneManager._scene;
            console.log('[DynamicLighting] Scene:', !!scene);
            console.log('[DynamicLighting] Spriteset:', scene ? !!scene._spriteset : 'N/A');
            if (scene && scene._spriteset) {
                console.log('[DynamicLighting] _activeLights:', !!scene._spriteset._activeLights);
                console.log('[DynamicLighting] _lightingFilter:', !!scene._spriteset._lightingFilter);
                
                if (scene._spriteset._activeLights) {
                    const lights = scene._spriteset._activeLights;
                    console.log('[DynamicLighting] Active lights:', lights.length);
                    for (let i = 0; i < lights.length; i++) {
                        const l = lights[i];
                        console.log(`  Light ${i}: x=${Math.round(l.x)}, y=${Math.round(l.y)}, r=${l.radius}, spotlight=${l.isSpotlight}, dir=${l.direction ? (l.direction * 180 / Math.PI).toFixed(1) + '°' : 'N/A'}, cone=${l.coneAngle ? (l.coneAngle * 180 / Math.PI).toFixed(1) + '°' : 'N/A'}`);
                    }
                }
                
                // Also check filter uniforms
                if (scene._spriteset._lightingFilter) {
                    const filter = scene._spriteset._lightingFilter;
                    console.log('[DynamicLighting] Filter uniforms:');
                    console.log('  uActiveLightCount:', filter.uniforms.uActiveLightCount);
                    console.log('  uDebugMode:', filter.uniforms.uDebugMode);
                    
                    // Check spotlight data for first few lights
                    const spotData = filter.uniforms.uSpotlightData;
                    for (let i = 0; i < Math.min(5, filter.uniforms.uActiveLightCount); i++) {
                        const offset = i * 4;
                        console.log(`  Spotlight ${i}: dir=${spotData[offset].toFixed(2)}, cone=${spotData[offset+1].toFixed(2)}, inner=${spotData[offset+2]}, isSpot=${spotData[offset+3]}`);
                    }
                }
            } else {
                console.warn('[DynamicLighting] Cannot log lights - spriteset not found');
            }
            
            // Check event light data directly
            console.log('[DynamicLighting] === EVENT LIGHT DATA ===');
            if ($gameMap && $gameMap.events) {
                const events = $gameMap.events();
                for (const event of events) {
                    if (event && event._lightData) {
                        console.log(`  Event ${event.eventId()}: isSpotlight=${event._lightData.isSpotlight}, dir=${event._lightData.direction ? (event._lightData.direction * 180 / Math.PI).toFixed(1) + '°' : 'N/A'}, cone=${event._lightData.coneAngle ? (event._lightData.coneAngle * 180 / Math.PI).toFixed(1) + '°' : 'N/A'}`);
                        console.log('    Full data:', JSON.stringify(event._lightData));
                    }
                }
            }
        },
        /**
         * Check a specific event's note tag
         */
        checkEvent: function(eventId) {
            const event = $gameMap.event(eventId);
            if (!event) {
                console.log('[DynamicLighting] Event not found:', eventId);
                return;
            }
            const eventData = event.event();
            console.log('[DynamicLighting] Event', eventId, 'data:');
            console.log('  Note:', eventData ? eventData.note : 'N/A');
            console.log('  _lightData:', event._lightData);
            
            // Try to parse the note tag manually
            if (eventData && eventData.note) {
                const note = eventData.note;
                const spotMatch = note.match(/<spotlight[:\s]*([^>]*)>/i);
                console.log('  Spotlight regex match:', spotMatch);
                if (spotMatch) {
                    const params = spotMatch[1].split(',').map(p => p.trim()).filter(p => p);
                    console.log('  Parsed params:', params);
                }
            }
        }
    };

})();
