/**
 * DynamicLighting - Sprite Shadow Filter
 * GPU shader filter for character sprite shadows
 * @module DynamicLighting/sprites/SpriteShadowFilter
 */

(function() {
    'use strict';

    const Debug = window.DynamicLighting.Debug;

    const MAX_SPRITES = 20;
    const LIGHT_HEIGHT = 100.0;

    /**
     * Generate the sprite shadow fragment shader
     * @param {number} maxLights - Maximum number of lights
     * @param {number} maxSprites - Maximum number of sprites
     * @returns {string} GLSL fragment shader code
     */
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
            uniform vec4 uSpotlightData[MAX_LIGHTS];
            uniform int uActiveLightCount;
            
            #define TWO_PI 6.28318530718
            
            #define MAX_SPRITES ${maxSprites}
            uniform vec4 uSpriteData[MAX_SPRITES];
            uniform vec4 uSpriteUV[MAX_SPRITES];
            uniform int uActiveSpriteCount;
            
            #define PI 3.14159265359
            
            #define TILE_NONE 0
            #define TILE_WALL_SIDE 1
            #define TILE_WALL_TOP 2
            
            float sampleRegion(vec2 screenPos) {
                vec2 worldPos = screenPos + uDisplayOffset;
                vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
                vec2 tilePos = floor((worldPos + 0.001) / uTileSize);
                vec2 localTile = tilePos - displayTile + uRegionPadding;
                vec2 regionUV = (localTile + 0.5) / uRegionMapSize;
                
                if (regionUV.x < 0.0 || regionUV.x > 1.0 || regionUV.y < 0.0 || regionUV.y > 1.0) {
                    return 0.0;
                }
                
                return texture2D(uRegionMap, regionUV).r > 0.5 ? 1.0 : 0.0;
            }
            
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
                
                if (tileType.r > 0.5 && tileType.g > 0.5) {
                    return TILE_NONE;
                }
                
                if (tileType.r > 0.5) return TILE_WALL_SIDE;
                if (tileType.g > 0.5) return TILE_WALL_TOP;
                
                return TILE_NONE;
            }
            
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
                    
                    // Check region-based obstacles
                    if (sampleRegion(samplePos) > 0.5) {
                        return false;
                    }
                    
                    // Check wall tiles as obstacles
                    int tileType = sampleTileType(samplePos);
                    if (tileType == TILE_WALL_SIDE) {
                        return false;
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
            
            float angleDiff(float a, float b) {
                float diff = a - b;
                diff = mod(diff + PI, TWO_PI) - PI;
                return abs(diff);
            }
            
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
                
                vec4 spotData = getSpotlightData(lightIdx);
                float isSpotlight = spotData.w;
                if (isSpotlight > 0.5) {
                    float spotDirection = spotData.x;
                    float coneAngle = spotData.y;
                    if (!isInSpotlightCone(lightPos, footPos, spotDirection, coneAngle)) {
                        return 0.0;
                    }
                }
                
                if (!hasLineOfSight(lightPos, footPos)) {
                    return 0.0;
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
                
                float horizontalDist = abs(wallPixel.x - footPos.x);
                if (horizontalDist > spriteWidth * 0.6) return 0.0;
                
                if (footPos.y > wallPixel.y) return 0.0;
                
                vec4 spotData = getSpotlightData(lightIdx);
                float isSpotlight = spotData.w;
                if (isSpotlight > 0.5) {
                    float spotDirection = spotData.x;
                    float coneAngle = spotData.y;
                    if (!isInSpotlightCone(lightPos, footPos, spotDirection, coneAngle)) {
                        return 0.0;
                    }
                }
                
                if (!hasLineOfSight(lightPos, footPos)) {
                    return 0.0;
                }
                
                float verticalDist = wallPixel.y - footPos.y;
                float maxShadowDist = spriteHeight * uShadowLength;
                
                if (verticalDist > maxShadowDist) return 0.0;
                
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
            
            float checkVerticalSunShadow(vec2 wallPixel, int spriteIdx) {
                if (!uSunEnabled || uSunIntensity <= 0.0) return 0.0;
                
                vec4 spriteData = getSpriteData(spriteIdx);
                vec2 footPos = spriteData.xy;
                float spriteWidth = spriteData.z;
                float spriteHeight = spriteData.w;
                
                float horizontalDist = abs(wallPixel.x - footPos.x);
                if (horizontalDist > spriteWidth * 0.6) return 0.0;
                
                if (footPos.y > wallPixel.y) return 0.0;
                
                float verticalDist = wallPixel.y - footPos.y;
                float shadowStretch = uShadowLength / max(uSunElevation, 0.1);
                shadowStretch = clamp(shadowStretch, 1.0, uShadowLength * 3.0);
                float maxShadowDist = spriteHeight * shadowStretch;
                
                if (verticalDist > maxShadowDist) return 0.0;
                
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
                
                int tileType = sampleTileType(pixelPos);
                
                if (tileType == TILE_WALL_TOP) {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }
                
                float totalShadow = 0.0;
                
                if (tileType == TILE_WALL_SIDE) {
                    for (int i = 0; i < MAX_SPRITES; i++) {
                        if (i >= uActiveSpriteCount) break;
                        float shadow = checkVerticalSunShadow(pixelPos, i);
                        totalShadow = max(totalShadow, shadow);
                    }
                    
                    for (int lightIdx = 0; lightIdx < MAX_LIGHTS; lightIdx++) {
                        if (lightIdx >= uActiveLightCount) break;
                        
                        for (int spriteIdx = 0; spriteIdx < MAX_SPRITES; spriteIdx++) {
                            if (spriteIdx >= uActiveSpriteCount) break;
                            float shadow = checkVerticalPointLightShadow(pixelPos, lightIdx, spriteIdx);
                            totalShadow = max(totalShadow, shadow);
                        }
                    }
                } else {
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

    /**
     * Sprite Shadow Filter
     * PIXI filter for rendering character sprite shadows
     */
    class SpriteShadowFilter extends PIXI.Filter {
        constructor(maxLights, maxSprites, config) {
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
            
            this.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            this.uniforms.uTileTypeMapSize = [20, 15];
            this.uniforms.uTileTypePadding = 2.0;
            this.uniforms.uWallShadowEnabled = false;
            this._hasTileTypeMap = false;
            
            this.uniforms.uShadowOpacity = config.shadowOpacity || 0.6;
            this.uniforms.uShadowLength = config.shadowLength || 3.0;
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
        
        setWallShadowEnabled(enabled) {
            this.uniforms.uWallShadowEnabled = enabled && this._hasTileTypeMap;
        }
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.SpriteShadowFilter = SpriteShadowFilter;
    window.DynamicLighting.SPRITE_SHADOW_CONSTANTS = {
        MAX_SPRITES,
        LIGHT_HEIGHT
    };

})();
