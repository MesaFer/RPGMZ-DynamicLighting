precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
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

uniform vec2 uSunDirection;
uniform float uShadowLength;
uniform float uShadowStrength;
uniform float uStepSize;
uniform int uFalloffType;
uniform bool uWallShadowEnabled;

#define TILE_NONE 0
#define TILE_WALL_SIDE 1
#define TILE_WALL_TOP 2

float sampleRegion(vec2 worldPixelPos) {
    vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
    vec2 adjustedPos = worldPixelPos + 0.001;
    vec2 tilePos = floor(adjustedPos / uTileSize);
    vec2 localTile = tilePos - displayTile + uRegionPadding;
    vec2 regionUV = (localTile + 0.5) / uRegionMapSize;
    
    if (regionUV.x < 0.0 || regionUV.x > 1.0 || regionUV.y < 0.0 || regionUV.y > 1.0) {
        return 0.0;
    }
    
    return texture2D(uRegionMap, regionUV).r > 0.5 ? 1.0 : 0.0;
}

int sampleTileType(vec2 worldPixelPos) {
    vec2 displayTile = floor(uDisplayOffsetInt / uTileSize);
    vec2 adjustedPos = worldPixelPos + 0.001;
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

// Find the BOTTOM Y position of WALL_SIDE column (where wall meets floor)
float findWallBottomY(vec2 worldPixelPos) {
    float tileHeight = uTileSize.y;
    vec2 currentTile = floor(worldPixelPos / uTileSize);
    float lastWallSideY = (currentTile.y + 1.0) * tileHeight;
    
    for (int i = 0; i < 20; i++) {
        float checkTileY = currentTile.y + float(i);
        vec2 checkPos = vec2(worldPixelPos.x, checkTileY * tileHeight + tileHeight * 0.5);
        
        int checkType = sampleTileType(checkPos);
        
        if (checkType == TILE_WALL_SIDE) {
            lastWallSideY = (checkTileY + 1.0) * tileHeight;
        } else {
            break;
        }
    }
    
    return lastWallSideY;
}

float traceRay(vec2 startPos, vec2 rayDir, float maxDist, int startType, float startY, out int outTileType) {
    outTileType = TILE_NONE;
    
    float stepSize = 0.5;
    int maxSteps = int(maxDist / stepSize) + 1;
    
    if (maxSteps > 1024) maxSteps = 1024;
    
    bool leftStartingWall = false;
    
    for (int i = 1; i <= 1024; i++) {
        if (i > maxSteps) break;
        
        float dist = float(i) * stepSize;
        vec2 samplePos = startPos + rayDir * dist;
        
        bool isInRegionMap = sampleRegion(samplePos) > 0.5;
        
        if (isInRegionMap) {
            int hitType = TILE_NONE;
            if (uWallShadowEnabled) {
                hitType = sampleTileType(samplePos);
            }
            
            if (startType == TILE_WALL_SIDE && hitType == TILE_WALL_SIDE && !leftStartingWall) {
                continue;
            }
            
            if (startType == TILE_WALL_SIDE && hitType == TILE_WALL_SIDE && samplePos.y < startY) {
                continue;
            }
            
            outTileType = hitType;
            return dist;
        } else {
            if (startType == TILE_WALL_SIDE) {
                leftStartingWall = true;
            }
        }
    }
    
    return -1.0;
}

void main(void) {
    vec2 pixelPos = vTextureCoord * uResolution;
    vec2 worldPos = pixelPos + uDisplayOffset;
    
    bool isOnRegionObstacle = sampleRegion(worldPos) > 0.5;
    
    int tileType = TILE_NONE;
    if (uWallShadowEnabled) {
        tileType = sampleTileType(worldPos);
    }
    
    if (tileType == TILE_WALL_TOP) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    if (isOnRegionObstacle && tileType == TILE_NONE) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // SKEW for WALL_SIDE: shift X based on distance from wall bottom
    vec2 sampleWorldPos = worldPos;
    
    if (tileType == TILE_WALL_SIDE && abs(uSunDirection.y) > 0.001) {
        float wallBottomY = findWallBottomY(worldPos);
        float distFromBottom = wallBottomY - worldPos.y;
        float skewRatio = uSunDirection.x / uSunDirection.y;
        float skewedX = worldPos.x - distFromBottom * skewRatio;
        
        // Check if the skewed position lands on another WALL_SIDE tile
        // If so, allow the skew; otherwise, clamp to current tile boundaries
        vec2 testPos = vec2(skewedX, worldPos.y);
        int skewedTileType = sampleTileType(testPos);
        bool skewedIsObstacle = sampleRegion(testPos) > 0.5;
        
        if (skewedTileType == TILE_WALL_SIDE || (skewedIsObstacle && skewedTileType == TILE_NONE)) {
            // Skewed position is also on a wall or obstacle - use skewed X directly
            sampleWorldPos.x = skewedX;
        } else {
            // Skewed position is outside wall - clamp to tile boundary
            float tileLeft = floor(worldPos.x / uTileSize.x) * uTileSize.x;
            float tileRight = tileLeft + uTileSize.x;
            sampleWorldPos.x = clamp(skewedX, tileLeft, tileRight - 0.01);
        }
    }
    
    float maxDistPixels = uShadowLength * uTileSize.x;
    int hitTileType = TILE_NONE;
    float hitDist = traceRay(sampleWorldPos, uSunDirection, maxDistPixels, tileType, worldPos.y, hitTileType);
    
    float shadow = 1.0;
    
    if (hitDist > 0.0) {
        float normalizedDist = hitDist / maxDistPixels;
        
        if (uFalloffType == 0) {
            shadow = 1.0 - uShadowStrength;
        } else if (uFalloffType == 1) {
            shadow = 1.0 - uShadowStrength * (1.0 - normalizedDist);
        } else {
            float falloff = normalizedDist * normalizedDist;
            shadow = 1.0 - uShadowStrength * (1.0 - falloff);
        }
    }
    
    gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
}
