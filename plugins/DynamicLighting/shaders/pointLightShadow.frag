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
uniform bool uWallShadowEnabled;

#define MAX_LIGHTS ${MAX_LIGHTS}
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define MAX_STEPS 128

// Tile type constants
#define TILE_NONE 0
#define TILE_WALL_SIDE 1
#define TILE_WALL_TOP 2

uniform vec4 uLightData[MAX_LIGHTS];
uniform vec4 uSpotlightData[MAX_LIGHTS];
uniform int uActiveLightCount;

// Sample region map - returns 1.0 if obstacle, 0.0 if empty
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

// Sample tile type - returns tile type constant
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

// Check if position is obstacle for shadow casting
// IMPORTANT: Only use regions as shadow casters, NOT walls
// Walls receive shadows and have special lighting logic in the main shader
// Including walls here would cause them to block their own light
bool isObstacle(vec2 worldPixelPos) {
    // Only sample region map - walls are NOT shadow casters
    return sampleRegion(worldPixelPos) > 0.5;
}

// Angle difference with wrap-around
float angleDiff(float a, float b) {
    float diff = a - b;
    diff = mod(diff + PI, TWO_PI) - PI;
    return abs(diff);
}

void main(void) {
    // Calculate angle from X coordinate
    float angle = (gl_FragCoord.x / uResolution.x) * TWO_PI - PI;
    
    // Light index from Y coordinate
    int targetLightIndex = int(floor(gl_FragCoord.y));
    
    if (targetLightIndex < 0) targetLightIndex = 0;
    if (targetLightIndex >= MAX_LIGHTS) targetLightIndex = MAX_LIGHTS - 1;
    
    if (targetLightIndex >= uActiveLightCount) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // Get light data
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
    
    float spotDirection = spotData.x;
    float coneAngle = spotData.y;
    float innerRadius = spotData.z;
    float isSpotlight = spotData.w;
    
    if (intensity <= 0.0 || radius <= 0.0) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // For spotlights, check cone
    if (isSpotlight > 0.5) {
        float angleFromCenter = angleDiff(angle, spotDirection);
        if (angleFromCenter > coneAngle) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
    }
    
    vec2 rayDir = vec2(cos(angle), sin(angle));
    vec2 lightWorldPos = lightPos + uDisplayOffset;
    
    float hitDistance = 1.0;
    float stepSize = max(2.0, radius / float(MAX_STEPS));
    float startDist = innerRadius;
    vec2 lastCheckedTile = floor(lightWorldPos / uTileSize);
    
    for (int i = 0; i < MAX_STEPS; i++) {
        float dist = startDist + float(i) * stepSize;
        
        if (dist >= radius) break;
        
        vec2 sampleWorldPos = lightWorldPos + rayDir * dist;
        vec2 currentTile = floor(sampleWorldPos / uTileSize);
        
        if (currentTile != lastCheckedTile) {
            lastCheckedTile = currentTile;
            
            // Check for obstacle (region or wall)
            if (isObstacle(sampleWorldPos)) {
                vec2 tileMin = currentTile * uTileSize;
                vec2 tileMax = tileMin + uTileSize;
                
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
                
                hitDistance = max(tEntry, dist) / radius;
                break;
            }
        }
    }
    
    gl_FragColor = vec4(hitDistance, hitDistance, hitDistance, 1.0);
}
