/*:
 * @target MZ
 * @plugindesc Dynamic Sprite Shadows v7.5 - Fixed Destroy Order Bug
 * @author MesaFer
 * @base DynamicLighting
 * @base DynamicLighting_Shadows
 * @orderAfter DynamicLighting
 * @orderAfter DynamicLighting_Shadows
 * @orderAfter TileTypeDetector
 *
 * @param SpriteShadowsEnabled
 * @text Sprite Shadows Enabled
 * @type boolean
 * @default true
 * @desc Enable dynamic shadows from character sprites
 *
 * @param PlayerShadow
 * @text Player Shadow
 * @type boolean
 * @default true
 * @desc Enable shadow casting for the player character
 *
 * @param EventShadows
 * @text Event Shadows
 * @type boolean
 * @default true
 * @desc Enable shadow casting for events (can be overridden per event)
 *
 * @param FollowerShadows
 * @text Follower Shadows
 * @type boolean
 * @default true
 * @desc Enable shadow casting for party followers
 *
 * @param ShadowOpacity
 * @text Shadow Opacity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.6
 * @desc Opacity of character shadows (0 = invisible, 1 = solid black)
 *
 * @param ShadowLength
 * @text Shadow Length
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 10
 * @default 3.0
 * @desc Maximum shadow length multiplier based on light distance
 *
 * @param ShadowSoftness
 * @text Shadow Softness
 * @type number
 * @min 0
 * @max 20
 * @default 2
 * @desc Blur amount for shadow edges (0 = sharp)
 *
 * @param DebugMode
 * @text Debug Mode
 * @type boolean
 * @default false
 * @desc Enable debug logging and visualization
 *
 * @help
 * ============================================================================
 * Dynamic Sprite Shadows v7.2 - Fixed Map Transition Crash
 * ============================================================================
 *
 * This plugin creates pixel-accurate shadows from character sprites that are
 * projected onto the ground FROM THE BOTTOM of the character (feet).
 *
 * NEW IN v7.2: Fixed crash when transitioning between maps!
 *   - Fixed "Cannot read properties of null (reading 'parentTextureArray')" error
 *   - GPU textures are now properly cleaned up in Scene_Map.terminate()
 *   - Filter uniforms are reset to safe values before texture destruction
 *
 * v7.1: Spotlight cone-aware shadows!
 *   - Spotlights only cast shadows within their cone angle
 *   - Characters outside the spotlight cone don't cast shadows from that light
 *
 * v7.0: Wall geometry-aware shadows!
 *   - Wall Tops: No sprite shadows (horizontal surfaces facing up)
 *   - Wall Sides: Vertical shadow projection (shadows go straight down)
 *   - Requires TileTypeDetector plugin for wall detection
 *
 * Key Features:
 *   - Shadows originate from the character's feet (bottom of sprite)
 *   - Shadow shape exactly matches the sprite's opaque pixels
 *   - Shadow direction and stretch depend on nearby light sources
 *   - Multiple light sources create multiple shadows
 *   - GPU-accelerated for performance
 *   - Wall geometry-aware shadow rendering
 *
 * How it works:
 *   - For each pixel on the ground, we check if it's in shadow
 *   - We trace from the pixel toward each light source
 *   - If the ray passes through a sprite's silhouette, the pixel is shadowed
 *   - The shadow is stretched based on light height and distance
 *
 * Event Note Tags:
 *   <castShadow>       - Enable shadow casting for this event
 *   <castShadow:off>   - Disable shadow casting for this event
 *   <noShadow>         - Alias for <castShadow:off>
 *
 * Map Note Tags:
 *   <spriteShadows:off>  - Disable sprite shadows for this map
 *   <spriteShadows:on>   - Enable sprite shadows for this map
 *
 * Script Calls:
 *   $gameMap.setSpriteShadowsEnabled(true/false)
 *   $gamePlayer.setCastsShadow(true/false)
 *   $gameMap.event(id).setCastsShadow(true/false)
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const pluginName = 'DynamicLighting_SpriteShadows';
    const parameters = PluginManager.parameters(pluginName);
    
    if (!window.DynamicLighting) {
        console.error('[DL_SpriteShadows] Base plugin DynamicLighting not found!');
        return;
    }

    const CONFIG = {
        enabled: parameters['SpriteShadowsEnabled'] !== 'false',
        playerShadow: parameters['PlayerShadow'] !== 'false',
        eventShadows: parameters['EventShadows'] !== 'false',
        followerShadows: parameters['FollowerShadows'] !== 'false',
        shadowOpacity: Number(parameters['ShadowOpacity'] || 0.6),
        shadowLength: Number(parameters['ShadowLength'] || 3.0),
        shadowSoftness: Number(parameters['ShadowSoftness'] || 2),
        debugMode: parameters['DebugMode'] === 'true'
    };

    const MAX_SPRITES = 20;
    const LIGHT_HEIGHT = 100.0;

    function log(...args) {
        if (CONFIG.debugMode) console.log('[DL_SpriteShadows]', ...args);
    }

    function generateSpriteShadowShader(maxLights, maxSprites) {
        return `
            precision highp float;
            
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform sampler2D uSilhouetteMap;
            uniform sampler2D uRegionMap;
            uniform sampler2D uTileTypeMap;
            
            uniform vec2 uResolution;
            uniform vec2 uTileSize;
            uniform vec2 uDisplayOffset;
            uniform vec2 uDisplayOffsetInt;
            uniform vec2 uRegionMapSize;
            uniform vec2 uTileTypeMapSize;
            uniform float uRegionPadding;
            uniform float uTileTypePadding;
            uniform bool uWallShadowEnabled;
            
            uniform float uShadowOpacity;
            uniform float uShadowLength;
            uniform float uLightHeight;
            
            uniform bool uSunEnabled;
            uniform float uSunDirection;
            uniform float uSunElevation;
            uniform float uSunIntensity;
            
            #define MAX_LIGHTS ${maxLights}
            uniform vec4 uLightData[MAX_LIGHTS];
            uniform vec4 uLightExtra[MAX_LIGHTS];
            uniform vec4 uSpotlightData[MAX_LIGHTS];  // direction, coneAngle, innerRadius, isSpotlight
            uniform int uActiveLightCount;
            
            #define TWO_PI 6.28318530718
            
            #define MAX_SPRITES ${maxSprites}
            uniform vec4 uSpriteData[MAX_SPRITES];
            uniform vec4 uSpriteUV[MAX_SPRITES];
            uniform int uActiveSpriteCount;
            
            #define PI 3.14159265359
            
            // Tile type constants
            #define TILE_NONE 0
            #define TILE_WALL_SIDE 1
            #define TILE_WALL_TOP 2
            
            // Check if a position is blocked by an obstacle (wall)
            float sampleRegion(vec2 screenPos) {
                // Convert screen position to world position
                vec2 worldPos = screenPos + uDisplayOffset;
                
                // Get tile position using integer offset for region map
                vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
                vec2 tilePos = floor((worldPos + 0.001) / uTileSize);
                
                // Calculate local tile position in region map
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
            int sampleTileType(vec2 screenPos) {
                if (!uWallShadowEnabled) return TILE_NONE;
                
                vec2 worldPos = screenPos + uDisplayOffset;
                vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
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
            
            // Check if there's a clear line of sight between two screen positions
            // Returns true if light can reach from lightPos to targetPos (no obstacles)
            bool hasLineOfSight(vec2 lightPos, vec2 targetPos) {
                vec2 dir = targetPos - lightPos;
                float dist = length(dir);
                
                if (dist < 1.0) return true;
                
                dir = dir / dist;
                float stepSize = uTileSize.x * 0.5;
                int numSteps = int(dist / stepSize);
                
                for (int i = 1; i <= 64; i++) {
                    if (i > numSteps) break;
                    
                    float t = float(i) * stepSize;
                    vec2 samplePos = lightPos + dir * t;
                    
                    if (sampleRegion(samplePos) > 0.5) {
                        return false; // Obstacle blocks line of sight
                    }
                }
                
                return true;
            }
            
            float sampleSpriteAlpha(int spriteIdx, vec2 localPos) {
                if (localPos.x < 0.0 || localPos.x > 1.0 || localPos.y < 0.0 || localPos.y > 1.0) {
                    return 0.0;
                }
                
                vec4 uv;
                for (int i = 0; i < MAX_SPRITES; i++) {
                    if (i == spriteIdx) {
                        uv = uSpriteUV[i];
                        break;
                    }
                }
                
                vec2 texCoord = mix(uv.xy, uv.zw, localPos);
                return texture2D(uSilhouetteMap, texCoord).a;
            }
            
            vec4 getSpriteData(int idx) {
                for (int i = 0; i < MAX_SPRITES; i++) {
                    if (i == idx) return uSpriteData[i];
                }
                return vec4(0.0);
            }
            
            vec4 getLightData(int idx) {
                for (int i = 0; i < MAX_LIGHTS; i++) {
                    if (i == idx) return uLightData[i];
                }
                return vec4(0.0);
            }
            
            vec4 getLightExtra(int idx) {
                for (int i = 0; i < MAX_LIGHTS; i++) {
                    if (i == idx) return uLightExtra[i];
                }
                return vec4(0.0);
            }
            
            vec4 getSpotlightData(int idx) {
                for (int i = 0; i < MAX_LIGHTS; i++) {
                    if (i == idx) return uSpotlightData[i];
                }
                return vec4(0.0);
            }
            
            // Calculate angle difference handling wrap-around (-PI to PI)
            float angleDiff(float a, float b) {
                float diff = a - b;
                diff = mod(diff + PI, TWO_PI) - PI;
                return abs(diff);
            }
            
            // Check if a direction is within the spotlight cone
            // Returns true if the angle from spotlight direction to target direction is within coneAngle
            bool isInSpotlightCone(vec2 lightPos, vec2 targetPos, float spotDirection, float coneAngle) {
                vec2 toTarget = targetPos - lightPos;
                float angleToTarget = atan(toTarget.y, toTarget.x);
                float diff = angleDiff(angleToTarget, spotDirection);
                return diff <= coneAngle;
            }
            
            float checkPointLightShadow(vec2 groundPixel, int lightIdx, int spriteIdx) {
                vec4 lightData = getLightData(lightIdx);
                vec2 lightPos = lightData.xy;
                float lightRadius = lightData.z;
                float lightIntensity = lightData.w;
                float lightHeight = getLightExtra(lightIdx).x;
                
                if (lightIntensity <= 0.0) return 0.0;
                
                vec2 toLight = lightPos - groundPixel;
                float distToLight = length(toLight);
                
                if (distToLight > lightRadius) return 0.0;
                
                vec4 spriteData = getSpriteData(spriteIdx);
                vec2 footPos = spriteData.xy;
                float spriteWidth = spriteData.z;
                float spriteHeight = spriteData.w;
                
                vec2 lightToFoot = footPos - lightPos;
                float distLightToFoot = length(lightToFoot);
                
                if (distLightToFoot > lightRadius * 1.5) return 0.0;
                if (distLightToFoot < 1.0) return 0.0;
                
                // Check if this is a spotlight and if the sprite is within the cone
                vec4 spotData = getSpotlightData(lightIdx);
                float isSpotlight = spotData.w;
                if (isSpotlight > 0.5) {
                    float spotDirection = spotData.x;
                    float coneAngle = spotData.y;
                    // If sprite is not in spotlight cone, no shadow from this light
                    if (!isInSpotlightCone(lightPos, footPos, spotDirection, coneAngle)) {
                        return 0.0;
                    }
                }
                
                // IMPORTANT: Check if light can reach the sprite (no obstacles between light and sprite)
                // If there's a wall between the light and the sprite, don't cast shadow
                if (!hasLineOfSight(lightPos, footPos)) {
                    return 0.0; // Light doesn't reach sprite, no shadow
                }
                
                vec2 shadowDir = normalize(lightToFoot);
                vec2 footToPixel = groundPixel - footPos;
                float projDist = dot(footToPixel, shadowDir);
                
                if (projDist < 0.0) return 0.0;
                
                float shadowStretch = (distLightToFoot / lightHeight) * uShadowLength;
                shadowStretch = clamp(shadowStretch, 0.5, uShadowLength * 2.0);
                
                float maxShadowDist = spriteHeight * shadowStretch;
                if (projDist > maxShadowDist) return 0.0;
                
                vec2 perpDir = vec2(-shadowDir.y, shadowDir.x);
                float perpDist = dot(footToPixel, perpDir);
                
                float widthAtDist = spriteWidth * 0.5 * (1.0 + projDist / maxShadowDist * 0.3);
                if (abs(perpDist) > widthAtDist) return 0.0;
                
                float spriteY = 1.0 - (projDist / maxShadowDist);
                spriteY = clamp(spriteY, 0.0, 1.0);
                
                float spriteX = (perpDist / widthAtDist) * 0.5 + 0.5;
                spriteX = clamp(spriteX, 0.0, 1.0);
                
                float alpha = sampleSpriteAlpha(spriteIdx, vec2(spriteX, spriteY));
                
                if (alpha < 0.3) return 0.0;
                
                float distFalloff = 1.0 - (projDist / maxShadowDist);
                float lightFalloff = 1.0 - (distToLight / lightRadius);
                
                return alpha * distFalloff * lightFalloff * uShadowOpacity;
            }
            
            float checkSunShadow(vec2 groundPixel, int spriteIdx) {
                if (!uSunEnabled || uSunIntensity <= 0.0) return 0.0;
                
                vec2 sunDir = vec2(cos(uSunDirection), sin(uSunDirection));
                vec2 shadowDir = -sunDir;
                
                vec4 spriteData = getSpriteData(spriteIdx);
                vec2 footPos = spriteData.xy;
                float spriteWidth = spriteData.z;
                float spriteHeight = spriteData.w;
                
                vec2 footToPixel = groundPixel - footPos;
                float projDist = dot(footToPixel, shadowDir);
                
                if (projDist < 0.0) return 0.0;
                
                float shadowStretch = uShadowLength / max(uSunElevation, 0.1);
                shadowStretch = clamp(shadowStretch, 1.0, uShadowLength * 3.0);
                
                float maxShadowDist = spriteHeight * shadowStretch;
                if (projDist > maxShadowDist) return 0.0;
                
                vec2 perpDir = vec2(-shadowDir.y, shadowDir.x);
                float perpDist = dot(footToPixel, perpDir);
                
                float widthAtDist = spriteWidth * 0.5 * (1.0 + projDist / maxShadowDist * 0.2);
                if (abs(perpDist) > widthAtDist) return 0.0;
                
                float spriteY = 1.0 - (projDist / maxShadowDist);
                float spriteX = (perpDist / widthAtDist) * 0.5 + 0.5;
                
                float alpha = sampleSpriteAlpha(spriteIdx, vec2(spriteX, spriteY));
                
                if (alpha < 0.3) return 0.0;
                
                float distFalloff = 1.0 - (projDist / maxShadowDist) * 0.5;
                
                return alpha * distFalloff * uShadowOpacity * uSunIntensity;
            }
            
            // Check vertical shadow for wall side tiles
            // On wall sides, shadows should project VERTICALLY downward from sprites
            float checkVerticalPointLightShadow(vec2 wallPixel, int lightIdx, int spriteIdx) {
                vec4 lightData = getLightData(lightIdx);
                vec2 lightPos = lightData.xy;
                float lightRadius = lightData.z;
                float lightIntensity = lightData.w;
                float lightHeight = getLightExtra(lightIdx).x;
                
                if (lightIntensity <= 0.0) return 0.0;
                
                vec2 toLight = lightPos - wallPixel;
                float distToLight = length(toLight);
                
                if (distToLight > lightRadius) return 0.0;
                
                vec4 spriteData = getSpriteData(spriteIdx);
                vec2 footPos = spriteData.xy;
                float spriteWidth = spriteData.z;
                float spriteHeight = spriteData.w;
                
                // For wall sides, check if the sprite is ABOVE this pixel
                // and within horizontal bounds
                float horizontalDist = abs(wallPixel.x - footPos.x);
                if (horizontalDist > spriteWidth * 0.6) return 0.0;
                
                // Sprite must be above the wall pixel
                if (footPos.y > wallPixel.y) return 0.0;
                
                // Check if this is a spotlight and if the sprite is within the cone
                vec4 spotData = getSpotlightData(lightIdx);
                float isSpotlight = spotData.w;
                if (isSpotlight > 0.5) {
                    float spotDirection = spotData.x;
                    float coneAngle = spotData.y;
                    // If sprite is not in spotlight cone, no shadow from this light
                    if (!isInSpotlightCone(lightPos, footPos, spotDirection, coneAngle)) {
                        return 0.0;
                    }
                }
                
                // Check if light can reach the sprite
                if (!hasLineOfSight(lightPos, footPos)) {
                    return 0.0;
                }
                
                // Calculate vertical shadow distance
                float verticalDist = wallPixel.y - footPos.y;
                float maxShadowDist = spriteHeight * uShadowLength;
                
                if (verticalDist > maxShadowDist) return 0.0;
                
                // Sample sprite silhouette vertically
                float spriteY = 1.0 - (verticalDist / maxShadowDist);
                spriteY = clamp(spriteY, 0.0, 1.0);
                
                float spriteX = (wallPixel.x - footPos.x + spriteWidth * 0.5) / spriteWidth;
                spriteX = clamp(spriteX, 0.0, 1.0);
                
                float alpha = sampleSpriteAlpha(spriteIdx, vec2(spriteX, spriteY));
                
                if (alpha < 0.3) return 0.0;
                
                float distFalloff = 1.0 - (verticalDist / maxShadowDist);
                float lightFalloff = 1.0 - (distToLight / lightRadius);
                
                return alpha * distFalloff * lightFalloff * uShadowOpacity;
            }
            
            // Check vertical shadow from sun for wall side tiles
            float checkVerticalSunShadow(vec2 wallPixel, int spriteIdx) {
                if (!uSunEnabled || uSunIntensity <= 0.0) return 0.0;
                
                vec4 spriteData = getSpriteData(spriteIdx);
                vec2 footPos = spriteData.xy;
                float spriteWidth = spriteData.z;
                float spriteHeight = spriteData.w;
                
                // For wall sides, check if the sprite is ABOVE this pixel
                float horizontalDist = abs(wallPixel.x - footPos.x);
                if (horizontalDist > spriteWidth * 0.6) return 0.0;
                
                // Sprite must be above the wall pixel
                if (footPos.y > wallPixel.y) return 0.0;
                
                // Calculate vertical shadow distance
                float verticalDist = wallPixel.y - footPos.y;
                float shadowStretch = uShadowLength / max(uSunElevation, 0.1);
                shadowStretch = clamp(shadowStretch, 1.0, uShadowLength * 3.0);
                float maxShadowDist = spriteHeight * shadowStretch;
                
                if (verticalDist > maxShadowDist) return 0.0;
                
                // Sample sprite silhouette vertically
                float spriteY = 1.0 - (verticalDist / maxShadowDist);
                spriteY = clamp(spriteY, 0.0, 1.0);
                
                float spriteX = (wallPixel.x - footPos.x + spriteWidth * 0.5) / spriteWidth;
                spriteX = clamp(spriteX, 0.0, 1.0);
                
                float alpha = sampleSpriteAlpha(spriteIdx, vec2(spriteX, spriteY));
                
                if (alpha < 0.3) return 0.0;
                
                float distFalloff = 1.0 - (verticalDist / maxShadowDist) * 0.5;
                
                return alpha * distFalloff * uShadowOpacity * uSunIntensity;
            }
            
            void main(void) {
                vec2 pixelPos = vTextureCoord * uResolution;
                
                if (uActiveSpriteCount <= 0) {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }
                
                // Check tile type for wall-aware shadow rendering
                int tileType = sampleTileType(pixelPos);
                
                // Wall tops should NOT receive sprite shadows (they face upward)
                if (tileType == TILE_WALL_TOP) {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }
                
                float totalShadow = 0.0;
                
                // Wall sides get VERTICAL shadow projection
                if (tileType == TILE_WALL_SIDE) {
                    // Vertical sun shadows on wall sides
                    for (int i = 0; i < MAX_SPRITES; i++) {
                        if (i >= uActiveSpriteCount) break;
                        float shadow = checkVerticalSunShadow(pixelPos, i);
                        totalShadow = max(totalShadow, shadow);
                    }
                    
                    // Vertical point light shadows on wall sides
                    for (int lightIdx = 0; lightIdx < MAX_LIGHTS; lightIdx++) {
                        if (lightIdx >= uActiveLightCount) break;
                        
                        for (int spriteIdx = 0; spriteIdx < MAX_SPRITES; spriteIdx++) {
                            if (spriteIdx >= uActiveSpriteCount) break;
                            float shadow = checkVerticalPointLightShadow(pixelPos, lightIdx, spriteIdx);
                            totalShadow = max(totalShadow, shadow);
                        }
                    }
                } else {
                    // Regular ground tiles get diagonal shadow projection
                    for (int i = 0; i < MAX_SPRITES; i++) {
                        if (i >= uActiveSpriteCount) break;
                        float shadow = checkSunShadow(pixelPos, i);
                        totalShadow = max(totalShadow, shadow);
                    }
                    
                    for (int lightIdx = 0; lightIdx < MAX_LIGHTS; lightIdx++) {
                        if (lightIdx >= uActiveLightCount) break;
                        
                        for (int spriteIdx = 0; spriteIdx < MAX_SPRITES; spriteIdx++) {
                            if (spriteIdx >= uActiveSpriteCount) break;
                            float shadow = checkPointLightShadow(pixelPos, lightIdx, spriteIdx);
                            totalShadow = max(totalShadow, shadow);
                        }
                    }
                }
                
                totalShadow = clamp(totalShadow, 0.0, uShadowOpacity);
                float brightness = 1.0 - totalShadow;
                gl_FragColor = vec4(brightness, brightness, brightness, 1.0);
            }
        `;
    }

    class SpriteShadowFilter extends PIXI.Filter {
        constructor(maxLights, maxSprites) {
            const fragmentShader = generateSpriteShadowShader(maxLights, maxSprites);
            super(null, fragmentShader);
            
            this._maxLights = maxLights;
            this._maxSprites = maxSprites;
            
            this.uniforms.uResolution = [Graphics.width, Graphics.height];
            this.uniforms.uTileSize = [48, 48];
            this.uniforms.uDisplayOffset = [0, 0];
            this.uniforms.uDisplayOffsetInt = [0, 0];
            this.uniforms.uRegionMapSize = [20, 15];
            this.uniforms.uRegionPadding = 10.0;
            this.uniforms.uRegionMap = PIXI.Texture.WHITE;
            
            // Tile type map uniforms for wall geometry-aware shadows
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this.uniforms.uTileTypeMapSize = [20, 15];
            this.uniforms.uTileTypePadding = 2.0;
            this.uniforms.uWallShadowEnabled = false;
            this._hasTileTypeMap = false;
            
            this.uniforms.uShadowOpacity = CONFIG.shadowOpacity;
            this.uniforms.uShadowLength = CONFIG.shadowLength;
            this.uniforms.uLightHeight = LIGHT_HEIGHT;
            
            this.uniforms.uSunEnabled = false;
            this.uniforms.uSunDirection = 0;
            this.uniforms.uSunElevation = 0.5;
            this.uniforms.uSunIntensity = 0;
            
            this.uniforms.uLightData = new Float32Array(maxLights * 4);
            this.uniforms.uLightExtra = new Float32Array(maxLights * 4);
            this.uniforms.uSpotlightData = new Float32Array(maxLights * 4);
            this.uniforms.uActiveLightCount = 0;
            
            this.uniforms.uSpriteData = new Float32Array(maxSprites * 4);
            this.uniforms.uSpriteUV = new Float32Array(maxSprites * 4);
            this.uniforms.uActiveSpriteCount = 0;
            
            this.uniforms.uSilhouetteMap = PIXI.Texture.WHITE;
            this._silhouetteMapValid = false;
        }
        
        setSilhouetteMap(texture) {
            if (texture && texture.valid && texture.baseTexture && texture.baseTexture.valid) {
                this.uniforms.uSilhouetteMap = texture;
                this._silhouetteMapValid = true;
            } else {
                this.uniforms.uSilhouetteMap = PIXI.Texture.WHITE;
                this._silhouetteMapValid = false;
            }
        }
        
        get silhouetteMapValid() {
            return this._silhouetteMapValid;
        }
        
        updateSunLight(enabled, direction, elevation, intensity) {
            this.uniforms.uSunEnabled = enabled;
            this.uniforms.uSunDirection = direction;
            this.uniforms.uSunElevation = elevation;
            this.uniforms.uSunIntensity = intensity;
        }
        
        updateLights(lights) {
            const count = Math.min(lights.length, this._maxLights);
            this.uniforms.uActiveLightCount = count;
            
            const lightData = this.uniforms.uLightData;
            const lightExtra = this.uniforms.uLightExtra;
            const spotlightData = this.uniforms.uSpotlightData;
            
            for (let i = 0; i < count; i++) {
                const light = lights[i];
                const offset = i * 4;
                
                lightData[offset] = light.x;
                lightData[offset + 1] = light.y;
                lightData[offset + 2] = light.radius;
                lightData[offset + 3] = light.intensity || 1.0;
                
                lightExtra[offset] = light.height || LIGHT_HEIGHT;
                lightExtra[offset + 1] = 0;
                lightExtra[offset + 2] = 0;
                lightExtra[offset + 3] = 0;
                
                // Spotlight data: direction, coneAngle, innerRadius, isSpotlight
                spotlightData[offset] = light.direction || 0;
                spotlightData[offset + 1] = light.coneAngle || Math.PI;
                spotlightData[offset + 2] = light.innerRadius || 0;
                spotlightData[offset + 3] = light.isSpotlight ? 1.0 : 0.0;
            }
        }
        
        updateSprites(sprites) {
            const count = Math.min(sprites.length, this._maxSprites);
            this.uniforms.uActiveSpriteCount = count;
            
            const spriteData = this.uniforms.uSpriteData;
            const spriteUV = this.uniforms.uSpriteUV;
            
            for (let i = 0; i < count; i++) {
                const sprite = sprites[i];
                const offset = i * 4;
                
                spriteData[offset] = sprite.footX;
                spriteData[offset + 1] = sprite.footY;
                spriteData[offset + 2] = sprite.width;
                spriteData[offset + 3] = sprite.height;
                
                spriteUV[offset] = sprite.u1;
                spriteUV[offset + 1] = sprite.v1;
                spriteUV[offset + 2] = sprite.u2;
                spriteUV[offset + 3] = sprite.v2;
            }
        }
        
        setDisplayOffset(x, y) {
            this.uniforms.uDisplayOffset = [x, y];
        }
        
        setDisplayOffsetInt(x, y) {
            this.uniforms.uDisplayOffsetInt = [x, y];
        }
        
        setTileSize(width, height) {
            this.uniforms.uTileSize = [width, height];
        }
        
        setRegionMap(texture, width, height, padding) {
            if (texture && texture.valid) {
                this.uniforms.uRegionMap = texture;
            }
            if (width !== undefined && height !== undefined) {
                this.uniforms.uRegionMapSize = [width, height];
            }
            if (padding !== undefined) {
                this.uniforms.uRegionPadding = padding;
            }
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
    }

    class SilhouetteMapGenerator {
        constructor() {
            this._canvas = null;
            this._ctx = null;
            this._texture = null;
            this._baseTexture = null;
            this._spriteInfo = [];
            this._initialized = false;
        }
        
        initialize() {
            if (this._initialized) return;
            
            const size = 512;
            this._canvas = document.createElement('canvas');
            this._canvas.width = size;
            this._canvas.height = size;
            this._ctx = this._canvas.getContext('2d');
            
            this._baseTexture = PIXI.BaseTexture.from(this._canvas, {
                scaleMode: PIXI.SCALE_MODES.NEAREST
            });
            this._texture = new PIXI.Texture(this._baseTexture);
            
            this._initialized = true;
            log('Silhouette map initialized:', size, 'x', size);
        }
        
        update(characterSprites) {
            if (!this._initialized) this.initialize();
            
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            this._spriteInfo = [];
            
            let x = 0;
            let y = 0;
            let rowHeight = 0;
            const padding = 2;
            
            for (const charSprite of characterSprites) {
                if (!charSprite || !charSprite._character) continue;
                if (!charSprite.bitmap || !charSprite.bitmap.isReady()) continue;
                
                const character = charSprite._character;
                if (!this._shouldCastShadow(character)) continue;
                
                const bitmap = charSprite.bitmap;
                const pw = charSprite.patternWidth();
                const ph = charSprite.patternHeight();
                
                if (pw <= 0 || ph <= 0) continue;
                
                if (x + pw > this._canvas.width) {
                    x = 0;
                    y += rowHeight + padding;
                    rowHeight = 0;
                }
                
                if (y + ph > this._canvas.height) {
                    log('Silhouette map full, skipping remaining sprites');
                    break;
                }
                
                const sx = charSprite._frame.x;
                const sy = charSprite._frame.y;
                const sw = charSprite._frame.width;
                const sh = charSprite._frame.height;
                
                const sourceCanvas = bitmap._canvas || bitmap._image;
                if (sourceCanvas) {
                    this._ctx.drawImage(sourceCanvas, sx, sy, sw, sh, x, y, pw, ph);
                }
                
                const u1 = x / this._canvas.width;
                const v1 = y / this._canvas.height;
                const u2 = (x + pw) / this._canvas.width;
                const v2 = (y + ph) / this._canvas.height;
                
                let footX, footY;
                
                if (charSprite.worldTransform) {
                    footX = charSprite.worldTransform.tx;
                    footY = charSprite.worldTransform.ty;
                } else {
                    footX = charSprite.x;
                    footY = charSprite.y;
                }
                
                this._spriteInfo.push({
                    footX: footX,
                    footY: footY,
                    width: pw,
                    height: ph,
                    u1: u1,
                    v1: v1,
                    u2: u2,
                    v2: v2
                });
                
                x += pw + padding;
                rowHeight = Math.max(rowHeight, ph);
            }
            
            this._baseTexture.update();
            
            if (CONFIG.debugMode && this._spriteInfo.length > 0) {
                log('Silhouette map updated with', this._spriteInfo.length, 'sprites');
            }
            
            return this._spriteInfo;
        }
        
        _shouldCastShadow(character) {
            if (!CONFIG.enabled) return false;
            if (!$gameMap || !$gameMap.areSpriteShadowsEnabled()) return false;
            
            if (character._castsShadow === false) return false;
            if (character._castsShadow === true) return true;
            
            if (character instanceof Game_Player) {
                return CONFIG.playerShadow;
            } else if (character instanceof Game_Follower) {
                return CONFIG.followerShadows && character.isVisible();
            } else if (character instanceof Game_Event) {
                if (character._shadowDisabled) return false;
                if (!character.characterName() || character.characterName() === '') {
                    return false;
                }
                return CONFIG.eventShadows;
            }
            
            return false;
        }
        
        get texture() { return this._texture; }
        get spriteInfo() { return this._spriteInfo; }
        
        destroy() {
            if (this._texture) {
                this._texture.destroy(true);
                this._texture = null;
            }
            this._canvas = null;
            this._ctx = null;
            this._initialized = false;
        }
    }

    let silhouetteGenerator = null;
    let shadowFilter = null;
    let shadowRenderTexture = null;
    let shadowSprite = null;
    
    // Flag to track if cleanup has been performed (must be declared before use)
    let spriteShadowsCleanedUp = false;

    const _Spriteset_Map_createLightingSystem = Spriteset_Map.prototype.createLightingSystem;
    Spriteset_Map.prototype.createLightingSystem = function() {
        _Spriteset_Map_createLightingSystem.call(this);
        
        if (!CONFIG.enabled) return;
        
        console.log('[DL_SpriteShadows] createLightingSystem called, spriteShadowsCleanedUp was:', spriteShadowsCleanedUp);
        
        // ALWAYS reset cleanup flag when creating new system - this is critical!
        spriteShadowsCleanedUp = false;
        
        // Safety check: if old resources still exist, clean them up first
        // This shouldn't happen normally since Scene_Map.stop() cleans up
        if (silhouetteGenerator || shadowRenderTexture || shadowFilter || shadowSprite) {
            console.log('[DL_SpriteShadows] Warning: Old resources still exist, cleaning up');
            // Temporarily allow cleanup
            spriteShadowsCleanedUp = false;
            cleanupSpriteShadowResources(this);
        }
        
        // Reset flag again after any cleanup - this is the key fix!
        spriteShadowsCleanedUp = false;
        
        silhouetteGenerator = new SilhouetteMapGenerator();
        silhouetteGenerator.initialize();
        
        const maxLights = window.DynamicLighting.CONFIG.maxLights;
        shadowFilter = new SpriteShadowFilter(maxLights, MAX_SPRITES);
        
        shadowRenderTexture = PIXI.RenderTexture.create({
            width: Graphics.width,
            height: Graphics.height,
            scaleMode: PIXI.SCALE_MODES.LINEAR
        });
        
        shadowSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        shadowSprite.width = Graphics.width;
        shadowSprite.height = Graphics.height;
        shadowSprite.filters = [shadowFilter];
        
        console.log('[DL_SpriteShadows] Sprite shadow system initialized, spriteShadowsCleanedUp is now:', spriteShadowsCleanedUp);
    };
    
    Spriteset_Map.prototype._collectActiveLights = function() {
        const lights = [];
        const screenWidth = Graphics.width;
        const screenHeight = Graphics.height;
        
        const events = $gameMap.events();
        for (const event of events) {
            if (event && event.hasLight && event.hasLight()) {
                const data = event.getLightData();
                const x = event.screenX();
                const y = event.screenY() - 24;
                const radius = data.radius;
                
                if (x + radius < 0 || x - radius > screenWidth ||
                    y + radius < 0 || y - radius > screenHeight) {
                    continue;
                }
                
                lights.push({
                    x: x,
                    y: y,
                    radius: radius,
                    intensity: data.intensity,
                    height: data.height || LIGHT_HEIGHT,
                    color: data.color,
                    colorRgb: data.colorRgb,
                    isSpotlight: data.isSpotlight,
                    direction: data.direction,
                    coneAngle: data.coneAngle,
                    innerRadius: data.innerRadius
                });
            }
        }
        
        if ($gameMap._playerLight && $gameMap._playerLight.enabled) {
            const pl = $gameMap._playerLight;
            let direction = pl.direction;
            
            if (pl.isSpotlight && pl.followDirection) {
                direction = window.DynamicLighting.degToRad(
                    window.DynamicLighting.directionToAngle($gamePlayer.direction())
                );
            }
            
            lights.push({
                x: $gamePlayer.screenX(),
                y: $gamePlayer.screenY() - 24,
                radius: pl.radius,
                intensity: pl.intensity,
                height: pl.height || LIGHT_HEIGHT,
                color: pl.color,
                colorRgb: pl.colorRgb,
                isSpotlight: pl.isSpotlight,
                direction: direction,
                coneAngle: pl.coneAngle,
                innerRadius: pl.innerRadius
            });
        }
        
        return lights;
    };

    let frameCounter = 0;
    
    const _Spriteset_Map_updateLightingSystem = Spriteset_Map.prototype.updateLightingSystem;
    
    // DEBUG: Log what we captured
    console.log('[DL_SpriteShadows] Captured _Spriteset_Map_updateLightingSystem:', typeof _Spriteset_Map_updateLightingSystem);
    
    Spriteset_Map.prototype.updateLightingSystem = function() {
        // DEBUG: Log before calling original
        if (frameCounter % 60 === 0) {
            console.log('[DL_SpriteShadows] About to call original updateLightingSystem, type:', typeof _Spriteset_Map_updateLightingSystem);
        }
        
        if (_Spriteset_Map_updateLightingSystem) {
            _Spriteset_Map_updateLightingSystem.call(this);
        } else {
            console.error('[DL_SpriteShadows] ERROR: _Spriteset_Map_updateLightingSystem is undefined!');
        }
        
        frameCounter++;
        const shouldLog = CONFIG.debugMode && frameCounter % 60 === 1;
        
        // CRITICAL: Check if resources have been cleaned up (during map transition)
        if (spriteShadowsCleanedUp) {
            if (frameCounter % 60 === 1) {
                console.log('[DL_SpriteShadows] updateLightingSystem: skipping because spriteShadowsCleanedUp is true');
            }
            return;
        }
        
        if (!CONFIG.enabled || !shadowFilter || !silhouetteGenerator) {
            if (frameCounter % 60 === 1) {
                console.log('[DL_SpriteShadows] updateLightingSystem: skipping - enabled:', CONFIG.enabled, 'shadowFilter:', !!shadowFilter, 'silhouetteGenerator:', !!silhouetteGenerator);
            }
            return;
        }
        if (!$gameMap || !$gameMap.areSpriteShadowsEnabled()) {
            return;
        }
        
        const characterSprites = this._characterSprites || [];
        const spriteInfo = silhouetteGenerator.update(characterSprites);
        
        shadowFilter.setSilhouetteMap(silhouetteGenerator.texture);
        shadowFilter.updateSprites(spriteInfo);
        
        if ($gameMap._sunLight) {
            const elevation = $gameMap._sunLight.elevation || 0.5;
            shadowFilter.updateSunLight(
                $gameMap._sunLight.enabled,
                $gameMap._sunLight.direction,
                elevation,
                $gameMap._sunLight.intensity
            );
        }
        
        const lights = this._collectActiveLights();
        if (lights && lights.length > 0) {
            shadowFilter.updateLights(lights);
        }
        
        const tileWidth = $gameMap.tileWidth();
        const tileHeight = $gameMap.tileHeight();
        const displayX = $gameMap.displayX();
        const displayY = $gameMap.displayY();
        
        shadowFilter.setTileSize(tileWidth, tileHeight);
        shadowFilter.setDisplayOffset(displayX * tileWidth, displayY * tileHeight);
        shadowFilter.setDisplayOffsetInt(Math.floor(displayX) * tileWidth, Math.floor(displayY) * tileHeight);
        
        // Pass region map from main lighting filter to sprite shadow filter
        if (this._lightingFilter && this._lightingFilter.uniforms) {
            const regionMap = this._lightingFilter.uniforms.uRegionMap;
            const regionMapSize = this._lightingFilter.uniforms.uRegionMapSize;
            if (regionMap && regionMap !== PIXI.Texture.WHITE) {
                // Get region padding from DynamicLighting_Shadows if available
                const regionPadding = window.DynamicLighting.Shadows &&
                    window.DynamicLighting.Shadows.generator &&
                    window.DynamicLighting.Shadows.generator() ?
                    window.DynamicLighting.Shadows.generator()._regionPadding : 10;
                shadowFilter.setRegionMap(regionMap, regionMapSize[0], regionMapSize[1], regionPadding);
            }
        }
        
        // Pass tile type map from TileTypeDetector to sprite shadow filter
        // This enables wall geometry-aware shadows (no shadows on wall tops, vertical on wall sides)
        if (window.TileTypeDetector) {
            const tileTypeGen = window.TileTypeDetector.tileTypeMapGenerator;
            if (tileTypeGen && tileTypeGen.texture) {
                const tileTypePadding = tileTypeGen._padding || 2;
                const tileTypeWidth = tileTypeGen._canvas ? tileTypeGen._canvas.width : 20;
                const tileTypeHeight = tileTypeGen._canvas ? tileTypeGen._canvas.height : 15;
                
                shadowFilter.setTileTypeMap(
                    tileTypeGen.texture,
                    tileTypeWidth,
                    tileTypeHeight,
                    tileTypePadding
                );
                shadowFilter.setWallShadowEnabled(true);
                
                if (shouldLog) {
                    log('Tile type map passed to sprite shadow filter');
                }
            }
        } else {
            shadowFilter.setWallShadowEnabled(false);
        }
        
        if (!shadowFilter.silhouetteMapValid || spriteInfo.length === 0) {
            if (this._lightingFilter && this._lightingFilter.uniforms) {
                this._lightingFilter.uniforms.uSpriteShadowsEnabled = false;
            }
            return;
        }
        
        const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
        
        if (renderer && shadowRenderTexture && shadowRenderTexture.valid) {
            try {
                renderer.render(shadowSprite, {
                    renderTexture: shadowRenderTexture,
                    clear: true
                });
            } catch (e) {
                try {
                    renderer.render(shadowSprite, shadowRenderTexture, true);
                } catch (e2) {
                    log('Failed to render sprite shadows:', e2);
                    return;
                }
            }
            
            if (this._lightingFilter && this._lightingFilter.uniforms) {
                if (shadowRenderTexture.baseTexture && shadowRenderTexture.baseTexture.valid) {
                    this._lightingFilter.uniforms.uSpriteShadowMap = shadowRenderTexture;
                    this._lightingFilter.uniforms.uSpriteShadowsEnabled = true;
                } else {
                    this._lightingFilter.uniforms.uSpriteShadowsEnabled = false;
                }
            }
        }
    };

    /**
     * Clean up sprite shadow resources and reset filter uniforms
     * This prevents PIXI texture errors during map transitions
     *
     * CRITICAL: The error occurs because DynamicLightingFilter still holds a reference
     * to shadowRenderTexture via uSpriteShadowMap uniform. When we destroy the texture,
     * PIXI tries to bind it and fails because parentTextureArray is null.
     *
     * Solution: We must NOT destroy the render texture while the filter might still use it.
     * Instead, we just reset the uniform to WHITE and null our references.
     * The old texture will be garbage collected when nothing references it.
     */
    function cleanupSpriteShadowResources(spriteset) {
        // Prevent double cleanup
        if (spriteShadowsCleanedUp) {
            log('Sprite shadow resources already cleaned up, skipping');
            return;
        }
        spriteShadowsCleanedUp = true;
        
        console.log('[DL_SpriteShadows] Cleaning up sprite shadow resources...');
        
        // STEP 1: Reset ALL texture uniforms FIRST, before touching any textures
        // This ensures PIXI won't try to bind destroyed textures
        
        // Reset main lighting filter uniforms
        if (spriteset && spriteset._lightingFilter && spriteset._lightingFilter.uniforms) {
            spriteset._lightingFilter.uniforms.uSpriteShadowMap = PIXI.Texture.WHITE;
            spriteset._lightingFilter.uniforms.uSpriteShadowsEnabled = false;
            console.log('[DL_SpriteShadows] Reset lighting filter uniforms');
        }
        
        // Reset shadow filter uniforms
        if (shadowFilter && shadowFilter.uniforms) {
            shadowFilter.uniforms.uSilhouetteMap = PIXI.Texture.WHITE;
            shadowFilter.uniforms.uRegionMap = PIXI.Texture.WHITE;
            shadowFilter.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            shadowFilter.uniforms.uActiveSpriteCount = 0;
            shadowFilter.uniforms.uActiveLightCount = 0;
            console.log('[DL_SpriteShadows] Reset shadow filter uniforms');
        }
        
        // STEP 2: Remove filter from shadowSprite
        if (shadowSprite) {
            shadowSprite.filters = [];
            console.log('[DL_SpriteShadows] Removed filters from shadowSprite');
        }
        
        // STEP 3: Destroy silhouette generator (this is safe - it's not used by main filter)
        if (silhouetteGenerator) {
            silhouetteGenerator.destroy();
            silhouetteGenerator = null;
            console.log('[DL_SpriteShadows] Destroyed silhouette generator');
        }
        
        // STEP 4: DO NOT destroy shadowRenderTexture!
        // The main lighting filter might still reference it via uSpriteShadowMap.
        // Even though we set it to WHITE above, PIXI might have cached the old texture.
        // Just null our reference - the texture will be garbage collected later.
        shadowRenderTexture = null;
        console.log('[DL_SpriteShadows] Nulled shadow render texture reference');
        
        // STEP 5: Null other references (don't destroy - PIXI may still reference them)
        shadowFilter = null;
        shadowSprite = null;
        
        console.log('[DL_SpriteShadows] Sprite shadow resources cleaned up');
    }

    // Hook into Scene_Map.stop() - this is called BEFORE terminate and BEFORE the new scene starts
    const _Scene_Map_stop_SpriteShadows = Scene_Map.prototype.stop;
    Scene_Map.prototype.stop = function() {
        console.log('[DL_SpriteShadows] Scene_Map.stop called');
        
        // Clean up sprite shadow resources before the scene stops
        if (this._spriteset) {
            cleanupSpriteShadowResources(this._spriteset);
        }
        
        _Scene_Map_stop_SpriteShadows.call(this);
    };

    // Also hook into Scene_Map termination as a backup
    const _Scene_Map_terminate_SpriteShadows = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        console.log('[DL_SpriteShadows] Scene_Map.terminate called');
        
        // Clean up sprite shadow resources before the scene terminates
        if (this._spriteset) {
            cleanupSpriteShadowResources(this._spriteset);
        }
        
        _Scene_Map_terminate_SpriteShadows.call(this);
    };

    const _Spriteset_Map_destroy = Spriteset_Map.prototype.destroy;
    Spriteset_Map.prototype.destroy = function(options) {
        // IMPORTANT: Do NOT call cleanupSpriteShadowResources here!
        // The destroy() of the OLD spriteset is called AFTER the NEW spriteset is created.
        // If we clean up here, we would destroy the NEW resources, not the old ones.
        // Resources are already cleaned up in Scene_Map.stop() and Scene_Map.terminate().
        
        // Just log for debugging
        console.log('[DL_SpriteShadows] Spriteset_Map.destroy called, NOT cleaning up (resources belong to new spriteset)');
        
        _Spriteset_Map_destroy.call(this, options);
    };

    //==========================================================================
    // Game_CharacterBase Extensions
    //==========================================================================

    const _Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
    Game_CharacterBase.prototype.initMembers = function() {
        _Game_CharacterBase_initMembers.call(this);
        this._castsShadow = undefined;
    };

    Game_CharacterBase.prototype.setCastsShadow = function(casts) {
        this._castsShadow = casts;
    };

    Game_CharacterBase.prototype.castsShadow = function() {
        return this._castsShadow !== false;
    };

    //==========================================================================
    // Game_Event Extensions
    //==========================================================================

    const _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function(mapId, eventId) {
        _Game_Event_initialize.call(this, mapId, eventId);
        this._parseCastShadowNoteTag();
    };

    Game_Event.prototype._parseCastShadowNoteTag = function() {
        const event = this.event();
        if (!event) return;

        const note = event.note || '';
        
        if (note.match(/<castShadow\s*:\s*off>/i) || note.match(/<noShadow>/i)) {
            this._castsShadow = false;
            this._shadowDisabled = true;
            return;
        }

        if (note.match(/<castShadow>/i)) {
            this._castsShadow = true;
        }
    };

    //==========================================================================
    // Game_Map Extensions
    //==========================================================================

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        
        if (this._spriteShadowsEnabled === undefined) {
            this._spriteShadowsEnabled = CONFIG.enabled;
        }
        
        this._parseSpriteShadowMapNote();
    };

    Game_Map.prototype._parseSpriteShadowMapNote = function() {
        if (!$dataMap || !$dataMap.note) return;

        const note = $dataMap.note;
        
        if (note.match(/<spriteShadows\s*:\s*off>/i)) {
            this._spriteShadowsEnabled = false;
            log('Sprite shadows disabled for this map');
        } else if (note.match(/<spriteShadows\s*:\s*on>/i)) {
            this._spriteShadowsEnabled = true;
            log('Sprite shadows enabled for this map');
        }
    };

    Game_Map.prototype.areSpriteShadowsEnabled = function() {
        return this._spriteShadowsEnabled !== false && CONFIG.enabled;
    };

    Game_Map.prototype.setSpriteShadowsEnabled = function(enabled) {
        this._spriteShadowsEnabled = enabled;
    };

    //==========================================================================
    // Plugin Commands
    //==========================================================================

    PluginManager.registerCommand(pluginName, 'SetSpriteShadowsEnabled', args => {
        $gameMap.setSpriteShadowsEnabled(args.enabled === 'true');
    });

    PluginManager.registerCommand(pluginName, 'SetPlayerShadow', args => {
        $gamePlayer.setCastsShadow(args.enabled === 'true');
    });

    PluginManager.registerCommand(pluginName, 'SetEventShadow', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (event) {
            event.setCastsShadow(args.enabled === 'true');
        }
    });

    //==========================================================================
    // Export
    //==========================================================================

    window.DynamicLighting.SpriteShadows = {
        CONFIG,
        SpriteShadowFilter,
        SilhouetteMapGenerator,
        getSilhouetteGenerator: () => silhouetteGenerator,
        getShadowFilter: () => shadowFilter,
        setEnabled: (enabled) => { CONFIG.enabled = enabled; },
        setPlayerShadow: (enabled) => { CONFIG.playerShadow = enabled; },
        setEventShadows: (enabled) => { CONFIG.eventShadows = enabled; },
        setFollowerShadows: (enabled) => { CONFIG.followerShadows = enabled; },
        setShadowOpacity: (opacity) => { CONFIG.shadowOpacity = opacity; },
        setShadowLength: (length) => { CONFIG.shadowLength = length; },
        setDebugMode: (enabled) => { CONFIG.debugMode = enabled; }
    };

    console.log('[DL_SpriteShadows] Plugin loaded v7.2 - Fixed Map Transition Crash');

})();
