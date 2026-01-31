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
uniform float uStepSize;         // Step size for ray marching (precision)
uniform int uFalloffType;
uniform bool uWallShadowEnabled;

// Tile type constants
#define TILE_NONE 0
#define TILE_WALL_SIDE 1
#define TILE_WALL_TOP 2

// Sample region map
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

// Sample tile type
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
    
    // Detect invalid WHITE texture
    if (tileType.r > 0.5 && tileType.g > 0.5) {
        return TILE_NONE;
    }
    
    if (tileType.r > 0.5) return TILE_WALL_SIDE;
    if (tileType.g > 0.5) return TILE_WALL_TOP;
    
    return TILE_NONE;
}

// Trace ray to find obstacle
// Returns: distance in pixels to first obstacle hit, or -1 if no hit
// startType: the tile type we're starting from (to skip connected walls)
// startY: the Y position we're starting from (to ignore walls above when starting from wall)
float traceRay(vec2 startPos, vec2 rayDir, float maxDist, int startType, float startY, out int outTileType) {
    outTileType = TILE_NONE;
    
    // Use sub-pixel stepping for accurate results
    float stepSize = 0.5;
    int maxSteps = int(maxDist / stepSize) + 1;
    
    // Limit max steps to prevent infinite loops
    if (maxSteps > 1024) maxSteps = 1024;
    
    // Track if we've left the starting wall group
    bool leftStartingWall = false;
    
    for (int i = 1; i <= 1024; i++) {
        if (i > maxSteps) break;
        
        float dist = float(i) * stepSize;
        vec2 samplePos = startPos + rayDir * dist;
        
        // Check if this position is marked as obstacle in regionMap
        bool isInRegionMap = sampleRegion(samplePos) > 0.5;
        
        if (isInRegionMap) {
            // Check what type of tile this is
            int hitType = TILE_NONE;
            if (uWallShadowEnabled) {
                hitType = sampleTileType(samplePos);
            }
            
            // If we started on WALL_SIDE, skip all connected WALL_SIDE tiles
            if (startType == TILE_WALL_SIDE && hitType == TILE_WALL_SIDE && !leftStartingWall) {
                // Still in connected wall, keep going
                continue;
            }
            
            // If we started on WALL_SIDE and hit another WALL_SIDE that is ABOVE us
            // (smaller Y = higher on screen), ignore it - walls don't shadow other walls below
            if (startType == TILE_WALL_SIDE && hitType == TILE_WALL_SIDE && samplePos.y < startY) {
                // Wall above us - skip it, don't count as shadow
                continue;
            }
            
            // We found an obstacle that's not part of our starting wall
            outTileType = hitType;
            return dist;
        } else {
            // We left the obstacle - mark that we're no longer in starting wall
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
    
    // Wall tops always fully lit
    if (tileType == TILE_WALL_TOP) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // WALL_SIDE: trace ray to find shadows (same as floor)
    // Do NOT return early - let it trace
    
    // Region obstacles (not walls) are fully lit - they cast shadows but don't receive
    if (isOnRegionObstacle && tileType == TILE_NONE) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // Trace toward sun
    float maxDistPixels = uShadowLength * uTileSize.x;
    int hitTileType = TILE_NONE;
    float hitDist = traceRay(worldPos, uSunDirection, maxDistPixels, tileType, worldPos.y, hitTileType);
    
    float shadow = 1.0;
    
    if (hitDist > 0.0) {
        float normalizedDist = hitDist / maxDistPixels;
        
        if (uFalloffType == 0) {
            // Sharp (none)
            shadow = 1.0 - uShadowStrength;
        } else if (uFalloffType == 1) {
            // Linear
            shadow = 1.0 - uShadowStrength * (1.0 - normalizedDist);
        } else {
            // Smooth
            float falloff = normalizedDist * normalizedDist;
            shadow = 1.0 - uShadowStrength * (1.0 - falloff);
        }
    }
    
    gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
}
