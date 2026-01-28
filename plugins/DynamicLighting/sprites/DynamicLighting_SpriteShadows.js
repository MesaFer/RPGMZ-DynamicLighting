/*:
 * @target MZ
 * @plugindesc Dynamic Sprite Shadows v8.0 - Modular Architecture
 * @author MesaFer
 * @base DynamicLighting
 * @orderAfter DynamicLighting
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
 * Dynamic Sprite Shadows v8.0 - Modular Architecture
 * ============================================================================
 *
 * This plugin creates pixel-accurate shadows from character sprites that are
 * projected onto the ground FROM THE BOTTOM of the character (feet).
 *
 * NEW IN v8.0: Modular architecture compatible with DynamicLighting v4.0+
 *   - Separated into modular components (SpriteShadowFilter, SilhouetteMapGenerator)
 *   - Uses shared modules from DynamicLighting core (Config, Debug, LightManager)
 *   - Improved resource cleanup and map transition handling
 *
 * Key Features:
 *   - Shadows originate from the character's feet (bottom of sprite)
 *   - Shadow shape exactly matches the sprite's opaque pixels
 *   - Shadow direction and stretch depend on nearby light sources
 *   - Multiple light sources create multiple shadows
 *   - GPU-accelerated for performance
 *   - Wall geometry-aware shadow rendering
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

(function() {
    'use strict';

    const pluginName = 'DynamicLighting_SpriteShadows';
    const BASE_PATH = 'js/plugins/DynamicLighting/';
    
    // Check for base plugin
    if (!window.DynamicLighting) {
        console.error('[DL_SpriteShadows] Base plugin DynamicLighting not found!');
        return;
    }

    // Load sprite shadow modules synchronously
    function loadScriptSync(path) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path, false);
        xhr.send();
        
        if (xhr.status === 200) {
            const script = document.createElement('script');
            script.text = xhr.responseText;
            script.setAttribute('data-module', path);
            document.head.appendChild(script);
            return true;
        } else {
            console.error('[DL_SpriteShadows] Failed to load module:', path);
            return false;
        }
    }

    // Load sprite shadow modules
    const modules = [
        'sprites/SpriteShadowFilter.js',
        'sprites/SilhouetteMapGenerator.js'
    ];

    console.log('[DL_SpriteShadows] Loading modules...');
    
    for (const module of modules) {
        const fullPath = BASE_PATH + module;
        if (!loadScriptSync(fullPath)) {
            console.error('[DL_SpriteShadows] Failed to load required module:', module);
            return;
        }
    }
    
    console.log('[DL_SpriteShadows] Modules loaded successfully');

    // Get module references
    const DL = window.DynamicLighting;
    const Debug = DL.Debug;
    const Config = DL.Config;
    const LightManager = DL.LightManager;
    const SpriteShadowFilter = DL.SpriteShadowFilter;
    const SilhouetteMapGenerator = DL.SilhouetteMapGenerator;
    const CONSTANTS = DL.SPRITE_SHADOW_CONSTANTS;

    // Parse plugin parameters
    const parameters = PluginManager.parameters(pluginName);
    
    const SPRITE_SHADOW_CONFIG = {
        enabled: parameters['SpriteShadowsEnabled'] !== 'false',
        playerShadow: parameters['PlayerShadow'] !== 'false',
        eventShadows: parameters['EventShadows'] !== 'false',
        followerShadows: parameters['FollowerShadows'] !== 'false',
        shadowOpacity: Number(parameters['ShadowOpacity'] || 0.6),
        shadowLength: Number(parameters['ShadowLength'] || 3.0),
        shadowSoftness: Number(parameters['ShadowSoftness'] || 2),
        debugMode: parameters['DebugMode'] === 'true'
    };

    // Set debug mode
    if (SPRITE_SHADOW_CONFIG.debugMode) {
        Debug.setDebugEnabled(true);
    }

    Debug.log('SpriteShadows config:', SPRITE_SHADOW_CONFIG);

    // =========================================================================
    // Sprite Shadow System Manager
    // =========================================================================

    class SpriteShadowSystem {
        constructor() {
            this._silhouetteGenerator = null;
            this._shadowFilter = null;
            this._shadowRenderTexture = null;
            this._shadowSprite = null;
            this._cleanedUp = false;
            this._frameCounter = 0;
        }

        initialize(maxLights) {
            this._cleanedUp = false;
            
            // Create silhouette generator
            this._silhouetteGenerator = new SilhouetteMapGenerator(SPRITE_SHADOW_CONFIG);
            this._silhouetteGenerator.initialize();
            
            // Create shadow filter
            this._shadowFilter = new SpriteShadowFilter(
                maxLights, 
                CONSTANTS.MAX_SPRITES,
                SPRITE_SHADOW_CONFIG
            );
            
            // Create render texture
            this._shadowRenderTexture = PIXI.RenderTexture.create({
                width: Graphics.width,
                height: Graphics.height,
                scaleMode: PIXI.SCALE_MODES.LINEAR
            });
            
            // Create shadow sprite
            this._shadowSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
            this._shadowSprite.width = Graphics.width;
            this._shadowSprite.height = Graphics.height;
            this._shadowSprite.filters = [this._shadowFilter];
            
            Debug.log('Sprite shadow system initialized');
        }

        update(spriteset) {
            if (this._cleanedUp) return;
            if (!SPRITE_SHADOW_CONFIG.enabled) return;
            if (!this._shadowFilter || !this._silhouetteGenerator) return;
            if (!$gameMap || !$gameMap.areSpriteShadowsEnabled()) return;

            this._frameCounter++;
            const shouldLog = SPRITE_SHADOW_CONFIG.debugMode && this._frameCounter % 60 === 1;
            
            // Update silhouette map
            const characterSprites = spriteset._characterSprites || [];
            const spriteInfo = this._silhouetteGenerator.update(characterSprites);
            
            this._shadowFilter.setSilhouetteMap(this._silhouetteGenerator.texture);
            this._shadowFilter.updateSprites(spriteInfo);
            
            // Update sun light
            if ($gameMap._sunLight) {
                const elevation = $gameMap._sunLight.elevation || 0.5;
                this._shadowFilter.updateSunLight(
                    $gameMap._sunLight.enabled,
                    $gameMap._sunLight.direction,
                    elevation,
                    $gameMap._sunLight.intensity
                );
            }
            
            // Collect and update lights
            const lights = this._collectActiveLights();
            if (lights && lights.length > 0) {
                this._shadowFilter.updateLights(lights);
            }
            
            // Update tile and display info
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            const displayX = $gameMap.displayX();
            const displayY = $gameMap.displayY();
            
            this._shadowFilter.setTileSize(tileWidth, tileHeight);
            this._shadowFilter.setDisplayOffset(displayX * tileWidth, displayY * tileHeight);
            this._shadowFilter.setDisplayOffsetInt(
                Math.floor(displayX) * tileWidth, 
                Math.floor(displayY) * tileHeight
            );
            
            // Pass region map from main lighting filter
            if (spriteset._lightingFilter && spriteset._lightingFilter.uniforms) {
                const regionMap = spriteset._lightingFilter.uniforms.uRegionMap;
                const regionMapSize = spriteset._lightingFilter.uniforms.uRegionMapSize;
                if (regionMap && regionMap !== PIXI.Texture.WHITE) {
                    const shadowGen = DL.getShadowMapGenerator();
                    const regionPadding = shadowGen ? shadowGen.regionPadding : 10;
                    this._shadowFilter.setRegionMap(regionMap, regionMapSize[0], regionMapSize[1], regionPadding);
                }
            }
            
            // Pass tile type map from DynamicLighting's TileTypeMapGenerator
            const tileTypeGen = DL.getTileTypeMapGenerator ? DL.getTileTypeMapGenerator() : null;
            if (tileTypeGen && tileTypeGen.texture) {
                this._shadowFilter.setTileTypeMap(
                    tileTypeGen.texture,
                    tileTypeGen.width,
                    tileTypeGen.height,
                    tileTypeGen.padding
                );
                this._shadowFilter.setWallShadowEnabled(true);
                
                if (shouldLog) {
                    Debug.log('Tile type map passed to sprite shadow filter');
                }
            } else {
                this._shadowFilter.setWallShadowEnabled(false);
            }
            
            // Check if we should render
            if (!this._shadowFilter.silhouetteMapValid || spriteInfo.length === 0) {
                if (spriteset._lightingFilter && spriteset._lightingFilter.uniforms) {
                    spriteset._lightingFilter.uniforms.uSpriteShadowsEnabled = false;
                }
                return;
            }
            
            // Render sprite shadows
            const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
            
            if (renderer && this._shadowRenderTexture && this._shadowRenderTexture.valid) {
                try {
                    renderer.render(this._shadowSprite, {
                        renderTexture: this._shadowRenderTexture,
                        clear: true
                    });
                } catch (e) {
                    try {
                        renderer.render(this._shadowSprite, this._shadowRenderTexture, true);
                    } catch (e2) {
                        Debug.log('Failed to render sprite shadows:', e2);
                        return;
                    }
                }
                
                // Pass to main lighting filter
                if (spriteset._lightingFilter && spriteset._lightingFilter.uniforms) {
                    if (this._shadowRenderTexture.baseTexture && this._shadowRenderTexture.baseTexture.valid) {
                        spriteset._lightingFilter.uniforms.uSpriteShadowMap = this._shadowRenderTexture;
                        spriteset._lightingFilter.uniforms.uSpriteShadowsEnabled = true;
                    } else {
                        spriteset._lightingFilter.uniforms.uSpriteShadowsEnabled = false;
                    }
                }
            }
        }

        _collectActiveLights() {
            const lights = [];
            const screenWidth = Graphics.width;
            const screenHeight = Graphics.height;
            
            // Collect event lights
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
                        height: data.height || CONSTANTS.LIGHT_HEIGHT,
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
                
                if (pl.isSpotlight && pl.followDirection) {
                    direction = DL.degToRad(DL.directionToAngle($gamePlayer.direction()));
                }
                
                lights.push({
                    x: $gamePlayer.screenX(),
                    y: $gamePlayer.screenY() - 24,
                    radius: pl.radius,
                    intensity: pl.intensity,
                    height: pl.height || CONSTANTS.LIGHT_HEIGHT,
                    color: pl.color,
                    colorRgb: pl.colorRgb,
                    isSpotlight: pl.isSpotlight,
                    direction: direction,
                    coneAngle: pl.coneAngle,
                    innerRadius: pl.innerRadius
                });
            }
            
            return lights;
        }

        cleanup(spriteset) {
            if (this._cleanedUp) {
                Debug.log('Sprite shadow resources already cleaned up');
                return;
            }
            this._cleanedUp = true;
            
            Debug.log('Cleaning up sprite shadow resources...');
            
            // Reset lighting filter uniforms
            if (spriteset && spriteset._lightingFilter && spriteset._lightingFilter.uniforms) {
                spriteset._lightingFilter.uniforms.uSpriteShadowMap = PIXI.Texture.WHITE;
                spriteset._lightingFilter.uniforms.uSpriteShadowsEnabled = false;
            }
            
            // Reset shadow filter uniforms
            if (this._shadowFilter && this._shadowFilter.uniforms) {
                this._shadowFilter.uniforms.uSilhouetteMap = PIXI.Texture.WHITE;
                this._shadowFilter.uniforms.uRegionMap = PIXI.Texture.WHITE;
                this._shadowFilter.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
                this._shadowFilter.uniforms.uActiveSpriteCount = 0;
                this._shadowFilter.uniforms.uActiveLightCount = 0;
            }
            
            // Remove filter from shadow sprite
            if (this._shadowSprite) {
                this._shadowSprite.filters = [];
            }
            
            // Destroy silhouette generator
            if (this._silhouetteGenerator) {
                this._silhouetteGenerator.destroy();
                this._silhouetteGenerator = null;
            }
            
            // Null references (don't destroy - PIXI may still reference them)
            this._shadowRenderTexture = null;
            this._shadowFilter = null;
            this._shadowSprite = null;
            
            Debug.log('Sprite shadow resources cleaned up');
        }

        isValid() {
            return !this._cleanedUp && this._shadowFilter !== null;
        }
    }

    // Singleton instance
    let spriteShadowSystem = null;

    // =========================================================================
    // Spriteset_Map Extensions
    // =========================================================================

    const _Spriteset_Map_createLightingSystem = Spriteset_Map.prototype.createLightingSystem;
    Spriteset_Map.prototype.createLightingSystem = function() {
        _Spriteset_Map_createLightingSystem.call(this);
        
        if (!SPRITE_SHADOW_CONFIG.enabled) return;
        
        Debug.log('Creating sprite shadow system...');
        
        // Clean up old system if exists
        if (spriteShadowSystem && spriteShadowSystem.isValid()) {
            spriteShadowSystem.cleanup(this);
        }
        
        // Create new system
        spriteShadowSystem = new SpriteShadowSystem();
        spriteShadowSystem.initialize(Config.get('maxLights'));
    };

    const _Spriteset_Map_updateLightingSystem = Spriteset_Map.prototype.updateLightingSystem;
    Spriteset_Map.prototype.updateLightingSystem = function() {
        if (_Spriteset_Map_updateLightingSystem) {
            _Spriteset_Map_updateLightingSystem.call(this);
        }
        
        // Update sprite shadow system
        if (spriteShadowSystem && spriteShadowSystem.isValid()) {
            spriteShadowSystem.update(this);
        }
    };

    // =========================================================================
    // Scene_Map Extensions
    // =========================================================================

    const _Scene_Map_stop_SpriteShadows = Scene_Map.prototype.stop;
    Scene_Map.prototype.stop = function() {
        Debug.log('Scene_Map.stop called');
        
        if (this._spriteset && spriteShadowSystem) {
            spriteShadowSystem.cleanup(this._spriteset);
        }
        
        _Scene_Map_stop_SpriteShadows.call(this);
    };

    const _Scene_Map_terminate_SpriteShadows = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        Debug.log('Scene_Map.terminate called');
        
        if (this._spriteset && spriteShadowSystem) {
            spriteShadowSystem.cleanup(this._spriteset);
        }
        
        _Scene_Map_terminate_SpriteShadows.call(this);
    };

    // =========================================================================
    // Game_CharacterBase Extensions
    // =========================================================================

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

    // =========================================================================
    // Game_Event Extensions
    // =========================================================================

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

    // =========================================================================
    // Game_Map Extensions
    // =========================================================================

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        
        if (this._spriteShadowsEnabled === undefined) {
            this._spriteShadowsEnabled = SPRITE_SHADOW_CONFIG.enabled;
        }
        
        this._parseSpriteShadowMapNote();
    };

    Game_Map.prototype._parseSpriteShadowMapNote = function() {
        if (!$dataMap || !$dataMap.note) return;

        const note = $dataMap.note;
        
        if (note.match(/<spriteShadows\s*:\s*off>/i)) {
            this._spriteShadowsEnabled = false;
            Debug.log('Sprite shadows disabled for this map');
        } else if (note.match(/<spriteShadows\s*:\s*on>/i)) {
            this._spriteShadowsEnabled = true;
            Debug.log('Sprite shadows enabled for this map');
        }
    };

    Game_Map.prototype.areSpriteShadowsEnabled = function() {
        return this._spriteShadowsEnabled !== false && SPRITE_SHADOW_CONFIG.enabled;
    };

    Game_Map.prototype.setSpriteShadowsEnabled = function(enabled) {
        this._spriteShadowsEnabled = enabled;
    };

    // =========================================================================
    // Plugin Commands
    // =========================================================================

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

    // =========================================================================
    // Export
    // =========================================================================

    DL.SpriteShadows = {
        CONFIG: SPRITE_SHADOW_CONFIG,
        getSystem: () => spriteShadowSystem,
        setEnabled: (enabled) => { SPRITE_SHADOW_CONFIG.enabled = enabled; },
        setPlayerShadow: (enabled) => { SPRITE_SHADOW_CONFIG.playerShadow = enabled; },
        setEventShadows: (enabled) => { SPRITE_SHADOW_CONFIG.eventShadows = enabled; },
        setFollowerShadows: (enabled) => { SPRITE_SHADOW_CONFIG.followerShadows = enabled; },
        setShadowOpacity: (opacity) => { SPRITE_SHADOW_CONFIG.shadowOpacity = opacity; },
        setShadowLength: (length) => { SPRITE_SHADOW_CONFIG.shadowLength = length; },
        setDebugMode: (enabled) => { SPRITE_SHADOW_CONFIG.debugMode = enabled; }
    };

    console.log('[DL_SpriteShadows] Plugin loaded v8.0 - Modular Architecture');

})();
