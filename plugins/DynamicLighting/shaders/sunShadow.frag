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
        
        // Check if this position is an obstacle (region or wall)
        bool isObstacle = sampleRegion(samplePos) > 0.5;
        
        // Also check for wall tiles if wall shadows enabled
        if (uWallShadowEnabled && !isObstacle) {
            int wallType = sampleTileType(samplePos);
            if (wallType == TILE_WALL_SIDE || wallType == TILE_WALL_TOP) {
                isObstacle = true;
                outTileType = wallType;
            }
        }
        
        if (isObstacle) {
            if (uWallShadowEnabled && outTileType == TILE_NONE) {
                outTileType = sampleTileType(samplePos);
            }
            return dist;
        }
    }
    
    return -1.0;
}

void main(void) {
    vec2 pixelPos = vTextureCoord * uResolution;
    vec2 worldPos = pixelPos + uDisplayOffset;
    
    bool isOnObstacle = sampleRegion(worldPos) > 0.5;
    
    int tileType = TILE_NONE;
    if (uWallShadowEnabled) {
        tileType = sampleTileType(worldPos);
        // Wall tiles also count as obstacles
        if (tileType == TILE_WALL_SIDE || tileType == TILE_WALL_TOP) {
            isOnObstacle = true;
        }
    }
    
    // Wall tops always fully lit
    if (tileType == TILE_WALL_TOP) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // Wall sides: output 1.0, main shader handles projection
    if (tileType == TILE_WALL_SIDE) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // Regular obstacles fully lit
    if (isOnObstacle) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // Trace toward sun
    float maxDistPixels = uShadowLength * uTileSize.x;
    int hitTileType = TILE_NONE;
    float hitDist = traceRay(worldPos, uSunDirection, maxDistPixels, hitTileType);
    
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
