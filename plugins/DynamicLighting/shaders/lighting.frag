precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uShadowMap;
uniform sampler2D uRegionMap;
uniform sampler2D uTileTypeMap;
uniform sampler2D uSunShadowMap;
uniform sampler2D uSpriteShadowMap;

uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec2 uResolution;

// 1D Shadow map parameters
uniform float uShadowMapResolution;
uniform float uShadowSoftness;
uniform bool uShadowsEnabled;
uniform bool uWallShadowEnabled;

// Region map parameters
uniform vec2 uTileSize;
uniform vec2 uDisplayOffset;
uniform vec2 uDisplayOffsetInt;
uniform vec2 uRegionMapSize;
uniform vec2 uTileTypeMapSize;
uniform float uTileTypePadding;

// Sun light parameters
uniform bool uSunEnabled;
uniform float uSunDirection;
uniform float uSunIntensity;
uniform vec3 uSunColor;
uniform bool uSunShadowsEnabled;

// Sprite shadow parameters
uniform bool uSpriteShadowsEnabled;

// Debug mode
uniform int uDebugMode;

#define MAX_LIGHTS ${MAX_LIGHTS}
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define REGION_PADDING 10.0
#define MAX_WALL_HEIGHT 8

// Tile type constants
#define TILE_NONE 0
#define TILE_WALL_SIDE 1
#define TILE_WALL_TOP 2

// Light uniforms
uniform vec4 uLightData[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform vec4 uSpotlightData[MAX_LIGHTS];
uniform int uActiveLightCount;

// === OBSTACLE DETECTION ===

bool isObstacleAt(vec2 worldTilePos) {
    vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
    vec2 localTile = worldTilePos - displayTile + REGION_PADDING;
    vec2 regionUV = (localTile + 0.5) / uRegionMapSize;
    
    if (regionUV.x < 0.0 || regionUV.x > 1.0 || regionUV.y < 0.0 || regionUV.y > 1.0) {
        return false;
    }
    
    float region = texture2D(uRegionMap, regionUV).r;
    return region > 0.5;
}

bool isOnObstacle(vec2 pixelPos) {
    vec2 worldPos = pixelPos + uDisplayOffset;
    vec2 adjustedPos = worldPos + 0.001;
    vec2 tileCoord = floor(adjustedPos / uTileSize);
    return isObstacleAt(tileCoord);
}

// === TILE TYPE DETECTION ===

int getTileType(vec2 pixelPos) {
    if (!uWallShadowEnabled) return TILE_NONE;
    
    vec2 worldPos = pixelPos + uDisplayOffset;
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

int getTileTypeAtTile(vec2 tilePos) {
    if (!uWallShadowEnabled) return TILE_NONE;
    
    vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
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

// === WALL GEOMETRY ===

float findWallBottomY(vec2 currentTilePos) {
    float bottomTileY = currentTilePos.y;
    
    for (int i = 1; i <= MAX_WALL_HEIGHT; i++) {
        vec2 checkTile = vec2(currentTilePos.x, currentTilePos.y + float(i));
        int tileType = getTileTypeAtTile(checkTile);
        
        if (tileType == TILE_WALL_SIDE) {
            bottomTileY = checkTile.y;
        } else {
            break;
        }
    }
    
    return (bottomTileY + 1.0) * uTileSize.y;
}

// === SHADOW SAMPLING ===

float angleDiff(float a, float b) {
    float diff = a - b;
    diff = mod(diff + PI, TWO_PI) - PI;
    return abs(diff);
}

float sampleShadowMap(float angle, float lightIndex, float distance, float blur) {
    float angleCoord = (angle + PI) / TWO_PI;
    float yCoord = (lightIndex + 0.5) / float(MAX_LIGHTS);
    float blurAmount = blur / uShadowMapResolution;
    
    float litSum = 0.0;
    
    // 11-tap Gaussian blur
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

// === POINT LIGHT CALCULATION ===

vec3 calculateLight(vec2 pixelPos, vec4 lightData, vec3 lightColor, vec4 spotData, 
                   float lightIndex, bool onObstacle, int tileType) {
    vec2 lightPos = lightData.xy;
    float radius = lightData.z;
    float intensity = lightData.w;
    
    if (intensity <= 0.0) return vec3(0.0);
    
    vec2 toPixel = pixelPos - lightPos;
    float dist = length(toPixel);
    
    if (dist >= radius) return vec3(0.0);
    
    float spotDirection = spotData.x;
    float coneAngle = spotData.y;
    float innerRadius = spotData.z;
    float isSpotlight = spotData.w;
    
    if (dist < innerRadius) return vec3(0.0);
    
    float effectiveRadius = radius - innerRadius;
    float effectiveDist = dist - innerRadius;
    float normalizedDist = effectiveDist / effectiveRadius;
    
    float pixelAngle = atan(toPixel.y, toPixel.x);
    
    // Spotlight cone check with wall handling
    float spotlightFactor = 1.0;
    if (isSpotlight > 0.5) {
        float spotDirY = sin(spotDirection);
        float spotDirX = cos(spotDirection);
        float angleFromCenter = angleDiff(pixelAngle, spotDirection);
        
        if (angleFromCenter > coneAngle) return vec3(0.0);
        
        bool useVerticalBoundary = (tileType == TILE_WALL_SIDE) ||
                                   (onObstacle && tileType != TILE_WALL_TOP);
        
        if (useVerticalBoundary) {
            vec2 worldPos = pixelPos + uDisplayOffset;
            vec2 lightWorldPos = lightPos + uDisplayOffset;
            float verticalDist = worldPos.y - lightWorldPos.y;
            
            bool pixelInLightDirection = (spotDirY > 0.0 && verticalDist > 0.0) ||
                                         (spotDirY < 0.0 && verticalDist < 0.0);
            
            if (pixelInLightDirection && abs(spotDirY) > 0.1) {
                float absVerticalDist = abs(verticalDist);
                float absSpotDirY = abs(spotDirY);
                float distAlongDir = absVerticalDist / absSpotDirY;
                float coneCenterX = lightWorldPos.x + spotDirX * distAlongDir;
                float coneHalfWidth = distAlongDir * tan(coneAngle);
                float leftBoundary = coneCenterX - coneHalfWidth;
                float rightBoundary = coneCenterX + coneHalfWidth;
                
                if (worldPos.x < leftBoundary || worldPos.x > rightBoundary) {
                    return vec3(0.0);
                }
                
                float edgeSoftness = coneHalfWidth * 0.15;
                float distFromLeft = worldPos.x - leftBoundary;
                float distFromRight = rightBoundary - worldPos.x;
                float minDistFromEdge = min(distFromLeft, distFromRight);
                
                if (minDistFromEdge < edgeSoftness && edgeSoftness > 0.0) {
                    spotlightFactor = smoothstep(0.0, edgeSoftness, minDistFromEdge);
                }
            } else {
                float edgeSoftness = coneAngle * 0.2;
                float edgeStart = coneAngle - edgeSoftness;
                if (angleFromCenter > edgeStart) {
                    spotlightFactor = 1.0 - (angleFromCenter - edgeStart) / edgeSoftness;
                    spotlightFactor = smoothstep(0.0, 1.0, spotlightFactor);
                }
            }
        } else {
            float edgeSoftness = coneAngle * 0.2;
            float edgeStart = coneAngle - edgeSoftness;
            if (angleFromCenter > edgeStart) {
                spotlightFactor = 1.0 - (angleFromCenter - edgeStart) / edgeSoftness;
                spotlightFactor = smoothstep(0.0, 1.0, spotlightFactor);
            }
        }
    }
    
    // Shadow calculation
    float shadow = 1.0;
    
    // WALL_TOP tiles always ignore shadows - full light
    if (tileType == TILE_WALL_TOP) {
        shadow = 1.0;
    } else if (uShadowsEnabled && dist > 1.0) {
        float blur = smoothstep(0.0, 1.0, normalizedDist) * uShadowSoftness;
        float shadowDist = dist / radius;
        
        if (onObstacle) {
            float angleCoord = (pixelAngle + PI) / TWO_PI;
            float yCoord = (lightIndex + 0.5) / float(MAX_LIGHTS);
            float rawShadowDist = texture2D(uShadowMap, vec2(angleCoord, yCoord)).r;
            
            if (rawShadowDist < 0.01) {
                shadow = 0.0;
            } else {
                if (tileType == TILE_WALL_SIDE) {
                    vec2 worldPos = pixelPos + uDisplayOffset;
                    vec2 tilePos = floor(worldPos / uTileSize);
                    float wallBottomY = findWallBottomY(tilePos);
                    vec2 lightWorldPos = lightPos + uDisplayOffset;
                    
                    if (lightWorldPos.y > wallBottomY) {
                        vec2 floorWorldPos = vec2(worldPos.x, wallBottomY + 1.0);
                        vec2 floorScreenPos = floorWorldPos - uDisplayOffset;
                        vec2 toFloor = floorScreenPos - lightPos;
                        float floorDist = length(toFloor);
                        float floorAngle = atan(toFloor.y, toFloor.x);
                        float floorShadowDist = floorDist / radius;
                        
                        if (floorDist < radius && floorDist > 1.0) {
                            float floorBlur = smoothstep(0.0, 1.0, floorShadowDist) * uShadowSoftness;
                            shadow = sampleShadowMap(floorAngle, lightIndex, floorShadowDist, floorBlur);
                        } else {
                            shadow = 1.0;
                        }
                    } else {
                        shadow = 0.0;
                    }
                } else {
                    shadow = 1.0;
                }
            }
        } else {
            if (tileType == TILE_WALL_SIDE) {
                vec2 worldPos = pixelPos + uDisplayOffset;
                vec2 tilePos = floor(worldPos / uTileSize);
                float wallBottomY = findWallBottomY(tilePos);
                vec2 lightWorldPos = lightPos + uDisplayOffset;
                
                if (lightWorldPos.y > wallBottomY) {
                    shadow = 1.0;
                } else {
                    shadow = 0.0;
                }
            } else {
                shadow = sampleShadowMap(pixelAngle, lightIndex, shadowDist, blur);
            }
        }
    }
    
    float att = 1.0 - normalizedDist;
    att = att * att * intensity * shadow * spotlightFactor;
    
    return lightColor * att;
}

// === SUN SHADOW ===

float calculateSunShadow(vec2 pixelPos) {
    if (!uSunShadowsEnabled) return 1.0;
    vec2 shadowUV = pixelPos / uResolution;
    return texture2D(uSunShadowMap, shadowUV).r;
}

// === SPRITE SHADOW ===

float sampleSpriteShadow(vec2 pixelPos) {
    if (!uSpriteShadowsEnabled) return 1.0;
    vec2 shadowUV = pixelPos / uResolution;
    return texture2D(uSpriteShadowMap, shadowUV).r;
}

// === SUN LIGHT ===

vec3 calculateSunLight(vec2 pixelPos, bool onObstacle, int tileType) {
    if (!uSunEnabled || uSunIntensity <= 0.0) return vec3(0.0);
    
    float shadow = 1.0;
    vec2 sunDir = vec2(cos(uSunDirection), sin(uSunDirection));
    
    // Wall facing factor for WALL_SIDE
    // WALL_SIDE faces "south" (positive Y in screen coordinates)
    // Wall normal is (0, 1) pointing down
    float wallFacingFactor = 1.0;
    
    if (tileType == TILE_WALL_TOP) {
        shadow = 1.0;
    } else if (tileType == TILE_WALL_SIDE) {
        // Wall sides: sample 2D shadow map directly, same as floor
        shadow = calculateSunShadow(pixelPos);
        
        // Calculate wall facing factor based on sun direction
        // Wall normal points in +Y direction (down/south)
        // Sun direction points TO sun
        // If sunDir.y > 0, sun is below horizon (shining up) - wall is lit
        // If sunDir.y < 0, sun is above horizon (shining down) - wall is in shadow
        // The closer sunDir.y to 1, the more direct light on wall
        // sunDir.y ranges from -1 (sun directly above) to 1 (sun directly below)
        // We want: sunDir.y = 1 -> wallFacingFactor = 1.0 (fully lit)
        //          sunDir.y = 0 -> wallFacingFactor = 0.5 (half lit)
        //          sunDir.y = -1 -> wallFacingFactor = 0.0 (no light)
        wallFacingFactor = clamp(sunDir.y * 0.5 + 0.5, 0.0, 1.0);
    } else if (onObstacle) {
        shadow = 1.0;
    } else {
        shadow = calculateSunShadow(pixelPos);
    }
    
    vec2 normalizedPos = pixelPos / uResolution;
    float directionalFactor = 0.9 + 0.1 * dot(normalizedPos - 0.5, sunDir);
    directionalFactor = clamp(directionalFactor, 0.7, 1.0);
    
    float att = uSunIntensity * directionalFactor * shadow * wallFacingFactor;
    return uSunColor * att;
}

// === MAIN ===

void main(void) {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    vec2 pixelPos = vTextureCoord * uResolution;
    
    bool onObstacle = isOnObstacle(pixelPos);
    int tileType = getTileType(pixelPos);
    
    // Debug modes
    if (uDebugMode == 1 && onObstacle) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        return;
    }
    if (uDebugMode == 2) {
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
    
    // Debug mode 3: Show projected sun shadow on WALL_SIDE (same logic as calculateSunLight)
    if (uDebugMode == 3 && tileType == TILE_WALL_SIDE) {
        vec2 sunDir = vec2(cos(uSunDirection), sin(uSunDirection));
        vec2 worldPos = pixelPos + uDisplayOffset;
        vec2 tilePos = floor(worldPos / uTileSize);
        float wallBottomY = findWallBottomY(tilePos);
        float heightAboveFloor = max(0.0, wallBottomY - worldPos.y);
        
        float projectedShadow = 1.0;
        vec2 floorWorldPos = vec2(worldPos.x, wallBottomY + 1.0);
        vec2 floorScreenPos = floorWorldPos - uDisplayOffset;
        float floorShadowBelow = calculateSunShadow(floorScreenPos);
        
        if (floorShadowBelow > 0.99) {
            projectedShadow = 1.0;
        } else {
            if (abs(sunDir.y) > 0.01 && abs(sunDir.x) > 0.01) {
                float requiredFloorDist = heightAboveFloor * abs(sunDir.x / sunDir.y);
                float sampleOffsetX = -sign(sunDir.x) * requiredFloorDist;
                vec2 sampleWorldPos = vec2(worldPos.x + sampleOffsetX, wallBottomY + 1.0);
                vec2 sampleScreenPos = sampleWorldPos - uDisplayOffset;
                projectedShadow = calculateSunShadow(sampleScreenPos);
            } else if (abs(sunDir.y) > 0.01) {
                projectedShadow = floorShadowBelow;
            } else {
                if (heightAboveFloor < uTileSize.y * 0.5) {
                    projectedShadow = floorShadowBelow;
                } else {
                    projectedShadow = 1.0;
                }
            }
        }
        
        // Show RED where shadow is projected onto wall (shadow < 1)
        if (projectedShadow < 0.99) {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            return;
        }
    }
    
    vec3 totalLight = uAmbientColor * uAmbientIntensity;
    
    // Sun light
    totalLight += calculateSunLight(pixelPos, onObstacle, tileType);
    
    // Point lights
    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uActiveLightCount) break;
        totalLight += calculateLight(pixelPos, uLightData[i], uLightColors[i], 
                                    uSpotlightData[i], float(i), onObstacle, tileType);
    }
    
    // Sprite shadows
    float spriteShadow = sampleSpriteShadow(pixelPos);
    vec3 ambientPart = uAmbientColor * uAmbientIntensity;
    vec3 lightPart = totalLight - ambientPart;
    totalLight = ambientPart + lightPart * spriteShadow;
    
    totalLight = clamp(totalLight, 0.0, 2.0);
    
    gl_FragColor = vec4(texColor.rgb * sqrt(totalLight), texColor.a);
}
