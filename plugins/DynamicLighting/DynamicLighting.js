/*:
 * @target MZ
 * @plugindesc Dynamic Lighting System v4.0 - Modular Architecture
 * @author MesaFer
 *
 * @param AmbientColor
 * @text Ambient Light Color
 * @type text
 * @default #1a1a2e
 * @desc Default ambient light color in hex format
 *
 * @param AmbientIntensity
 * @text Ambient Light Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.2
 *
 * @param DefaultLightRadius
 * @text Default Light Radius
 * @type number
 * @min 1
 * @default 150
 *
 * @param DefaultLightIntensity
 * @text Default Light Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 1.0
 *
 * @param DefaultLightColor
 * @text Default Light Color
 * @type text
 * @default #ffffff
 *
 * @param MaxLights
 * @text Maximum Lights
 * @type number
 * @min 1
 * @max 100
 * @default 50
 *
 * @param DefaultSunDirection
 * @text Default Sun Direction
 * @type number
 * @min 0
 * @max 360
 * @default 135
 *
 * @param DefaultSunIntensity
 * @text Default Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.8
 *
 * @param DefaultSunColor
 * @text Default Sun Color
 * @type text
 * @default #fffae0
 *
 * @param ShadowsEnabled
 * @text Shadows Enabled
 * @type boolean
 * @default true
 *
 * @param ShadowMapResolution
 * @text Shadow Map Resolution
 * @type number
 * @min 256
 * @max 4096
 * @default 1536
 *
 * @param ShadowSoftness
 * @text Shadow Softness
 * @type number
 * @decimals 1
 * @min 0
 * @max 30
 * @default 8
 *
 * @param SunShadowSoftness
 * @text Sun Shadow Softness
 * @type number
 * @decimals 1
 * @min 0
 * @max 50
 * @default 0
 *
 * @param SunShadowStrength
 * @text Sun Shadow Strength
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.85
 *
 * @param SunShadowLength
 * @text Sun Shadow Length
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 10
 * @default 3.0
 *
 * @param SunShadowFalloff
 * @text Sun Shadow Falloff
 * @type select
 * @option None (Sharp)
 * @value none
 * @option Linear
 * @value linear
 * @option Smooth
 * @value smooth
 * @default smooth
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
 *
 * @param WallShadowEnabled
 * @text Wall Geometry Shadows
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Dynamic Lighting System v4.0 - Modular Architecture
 * ============================================================================
 *
 * Fully modular lighting system with separate files for:
 *   - Core utilities and configuration
 *   - Shader files (.frag) loaded at runtime
 *   - Lighting filters and light management
 *   - Shadow map generation (point lights & sun)
 *
 * This is the main loader plugin that initializes all modules.
 *
 * @command SetAmbientLight
 * @text Set Ambient Light
 * @arg color
 * @type text
 * @default #1a1a2e
 * @arg intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.2
 *
 * @command SetEventLight
 * @text Set Event Light
 * @arg eventId
 * @type number
 * @min 1
 * @arg enabled
 * @type boolean
 * @default true
 *
 * @command SetPlayerLight
 * @text Set Player Light
 * @arg enabled
 * @type boolean
 * @default true
 *
 * @command SetPlayerLightParams
 * @text Set Player Light Parameters
 * @arg radius
 * @type number
 * @min 1
 * @default 150
 * @arg intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 1.0
 * @arg color
 * @type text
 * @default #ffffff
 *
 * @command SetSunLight
 * @text Set Sun Light
 * @arg enabled
 * @type boolean
 * @default true
 *
 * @command SetSunLightParams
 * @text Set Sun Light Parameters
 * @arg direction
 * @type number
 * @min 0
 * @max 360
 * @default 135
 * @arg intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.8
 * @arg color
 * @type text
 * @default #fffae0
 *
 * @command SetShadowsEnabled
 * @text Set Shadows Enabled
 * @arg enabled
 * @type boolean
 * @default true
 */

(function() {
    'use strict';

    const pluginName = 'DynamicLighting';
    const BASE_PATH = 'js/plugins/DynamicLighting/';

    // =========================================================================
    // Synchronous Script Loader
    // =========================================================================

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
            console.error('[DynamicLighting] Failed to load module:', path);
            return false;
        }
    }

    // =========================================================================
    // Module Loading
    // =========================================================================

    // Load all modules in correct order
    const modules = [
        'core/Utils.js',
        'core/Config.js',
        'core/Debug.js',
        'shaders/ShaderLoader.js',
        'lighting/LightingFilter.js',
        'lighting/LightManager.js',
        'shadows/RegionMap.js',
        'shadows/TileTypeDetector.js',
        'shadows/PointLightShadowFilter.js',
        'shadows/SunShadowFilter.js',
        'shadows/ShadowMapGenerator.js'
    ];

    console.log('[DynamicLighting] Loading modules...');
    
    for (const module of modules) {
        const fullPath = BASE_PATH + module;
        if (!loadScriptSync(fullPath)) {
            console.error('[DynamicLighting] Failed to load required module:', module);
            return;
        }
    }
    
    console.log('[DynamicLighting] All modules loaded successfully');

    // Get module references
    const DL = window.DynamicLighting;
    
    if (!DL || !DL.Utils) {
        console.error('[DynamicLighting] Core modules not loaded properly!');
        return;
    }

    const Utils = DL.Utils;
    const Config = DL.Config;
    const Debug = DL.Debug;
    const LightManager = DL.LightManager;

    // Initialize configuration from plugin parameters
    Config.initialize(pluginName);
    
    // Parse additional shadow parameters
    const parameters = PluginManager.parameters(pluginName);
    Config.set('shadowsEnabled', parameters['ShadowsEnabled'] !== 'false');
    Config.set('shadowMapResolution', Number(parameters['ShadowMapResolution'] || 1536));
    Config.set('shadowSoftness', Number(parameters['ShadowSoftness'] || 8));
    Config.set('sunShadowSoftness', Number(parameters['SunShadowSoftness'] || 0));
    Config.set('sunShadowStrength', Number(parameters['SunShadowStrength'] || 0.85));
    Config.set('sunShadowLength', Number(parameters['SunShadowLength'] || 3.0));
    Config.set('sunShadowFalloff', String(parameters['SunShadowFalloff'] || 'smooth'));
    Config.set('obstacleDetectionMode', String(parameters['ObstacleDetectionMode'] || 'tiledetector'));
    Config.set('wallShadowEnabled', parameters['WallShadowEnabled'] !== 'false');

    Debug.log('Plugin initialized, config:', Config.getAll());

    // =========================================================================
    // Shadow Map Generator & Tile Type Generator Instances
    // =========================================================================

    let shadowMapGenerator = null;
    let tileTypeMapGenerator = null;

    function cleanupShadowResources(spriteset) {
        Debug.log('Cleaning up shadow resources...');
        
        if (spriteset && spriteset._lightingFilter) {
            const filter = spriteset._lightingFilter;
            filter.uniforms.uShadowMap = PIXI.Texture.WHITE;
            filter.uniforms.uRegionMap = PIXI.Texture.WHITE;
            filter.uniforms.uSunShadowMap = PIXI.Texture.WHITE;
            filter.uniforms.uTileTypeMap = PIXI.Texture.WHITE;
            filter.uniforms.uSpriteShadowMap = PIXI.Texture.WHITE;
            filter.uniforms.uShadowsEnabled = false;
            filter.uniforms.uSunShadowsEnabled = false;
            filter.uniforms.uSpriteShadowsEnabled = false;
            filter.uniforms.uWallShadowEnabled = false;
        }
        
        if (shadowMapGenerator) {
            shadowMapGenerator.destroy();
            shadowMapGenerator = null;
        }
        
        if (tileTypeMapGenerator) {
            tileTypeMapGenerator.destroy();
            tileTypeMapGenerator = null;
        }
    }

    // =========================================================================
    // Game_Map Extensions
    // =========================================================================

    const _Game_Map_initialize = Game_Map.prototype.initialize;
    Game_Map.prototype.initialize = function() {
        _Game_Map_initialize.call(this);
        const config = Config.getAll();
        this._ambientColor = config.ambientColor;
        this._ambientIntensity = config.ambientIntensity;
        this._playerLight = null;
        this._sunLight = {
            enabled: false,
            direction: Utils.degToRad(config.sunDirection),
            intensity: config.sunIntensity,
            color: config.sunColor,
            colorRgb: Utils.hexToRgb(config.sunColor)
        };
        this._shadowsEnabled = config.shadowsEnabled;
        this._sunShadowSettings = {
            softness: config.sunShadowSoftness,
            precision: 1, // Default step size for ray marching
            strength: config.sunShadowStrength,
            length: config.sunShadowLength,
            falloff: config.sunShadowFalloff
        };
    };

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this._playerLight = null;
        this.setupMapLighting();
    };

    Game_Map.prototype.setupMapLighting = function() {
        const config = Config.getAll();
        this._ambientColor = config.ambientColor;
        this._ambientIntensity = config.ambientIntensity;
        
        this._sunLight = {
            enabled: false,
            direction: Utils.degToRad(config.sunDirection),
            intensity: config.sunIntensity,
            color: config.sunColor,
            colorRgb: Utils.hexToRgb(config.sunColor)
        };
        
        if ($dataMap && $dataMap.note) {
            // Parse ambient light
            const ambientMatch = $dataMap.note.match(/<ambient[:\s]*([^,>]+)[,\s]*([^>]*)>/i);
            if (ambientMatch) {
                this._ambientColor = ambientMatch[1].trim();
                if (ambientMatch[2]) this._ambientIntensity = parseFloat(ambientMatch[2].trim());
            }
            
            // Parse sun light
            const sunMatch = $dataMap.note.match(/<sun[:\s]*([^>]*)>/i);
            if (sunMatch) {
                const sunParams = sunMatch[1].trim();
                if (sunParams.toLowerCase() === 'off') {
                    this._sunLight.enabled = false;
                } else {
                    const params = sunParams.split(',').map(p => p.trim()).filter(p => p);
                    this._sunLight.enabled = true;
                    if (params[0]) this._sunLight.direction = Utils.degToRad(parseFloat(params[0]));
                    if (params[1]) this._sunLight.intensity = parseFloat(params[1]);
                    if (params[2]) {
                        this._sunLight.color = params[2];
                        this._sunLight.colorRgb = Utils.hexToRgb(params[2]);
                    }
                }
            }
            
            // Parse sun shadow settings: <sunShadow:softness,precision,strength,length,falloff>
            // Format matches original DynamicLighting_Shadows plugin
            const sunShadowMatch = $dataMap.note.match(/<sunShadow[:\s]*([^>]*)>/i);
            if (sunShadowMatch) {
                const params = sunShadowMatch[1].split(',').map(p => p.trim()).filter(p => p);
                this._sunShadowSettings = this._sunShadowSettings || {};
                if (params[0] !== undefined && params[0] !== '') this._sunShadowSettings.softness = parseFloat(params[0]);
                if (params[1] !== undefined && params[1] !== '') this._sunShadowSettings.precision = parseFloat(params[1]);
                if (params[2] !== undefined && params[2] !== '') this._sunShadowSettings.strength = parseFloat(params[2]);
                if (params[3] !== undefined && params[3] !== '') this._sunShadowSettings.length = parseFloat(params[3]);
                if (params[4] !== undefined && params[4] !== '') this._sunShadowSettings.falloff = params[4].toLowerCase();
                Debug.log('Sun shadow settings from map:', this._sunShadowSettings);
            }
            
            // Parse shadows on/off
            if ($dataMap.note.match(/<shadows\s*:\s*off>/i)) {
                this._shadowsEnabled = false;
            } else if ($dataMap.note.match(/<shadows\s*:\s*on>/i)) {
                this._shadowsEnabled = true;
            }
        }
    };

    Game_Map.prototype.setAmbientLight = function(color, intensity) {
        this._ambientColor = color;
        this._ambientIntensity = intensity;
    };

    Game_Map.prototype.setPlayerLight = function(enabled) {
        LightManager.setPlayerLight(enabled);
        this._playerLight = LightManager.getPlayerLight();
    };

    Game_Map.prototype.setPlayerLightParams = function(radius, intensity, color) {
        LightManager.setPlayerLightParams(radius, intensity, color);
        this._playerLight = LightManager.getPlayerLight();
    };

    Game_Map.prototype.setPlayerSpotlight = function(direction, coneAngle, innerRadius, followDirection) {
        LightManager.setPlayerSpotlight(direction, coneAngle, innerRadius, followDirection);
        this._playerLight = LightManager.getPlayerLight();
    };

    Game_Map.prototype.setPlayerLightToPoint = function() {
        LightManager.setPlayerLightToPoint();
        this._playerLight = LightManager.getPlayerLight();
    };

    Game_Map.prototype.setSunLight = function(enabled) {
        this._sunLight.enabled = enabled;
    };

    Game_Map.prototype.setSunLightParams = function(direction, intensity, color) {
        if (direction !== undefined) this._sunLight.direction = Utils.degToRad(direction);
        if (intensity !== undefined) this._sunLight.intensity = intensity;
        if (color !== undefined) {
            this._sunLight.color = color;
            this._sunLight.colorRgb = Utils.hexToRgb(color);
        }
    };

    Game_Map.prototype.areShadowsEnabled = function() {
        return this._shadowsEnabled !== false;
    };

    Game_Map.prototype.setShadowsEnabled = function(enabled) {
        this._shadowsEnabled = enabled;
    };

    // =========================================================================
    // Game_Event Extensions
    // =========================================================================

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
        
        const spotMatch = note.match(/<spotlight[:\s]*([^>]*)>/i);
        if (spotMatch) {
            this._setupSpotlight(spotMatch[1]);
            return;
        }
        
        const lightMatch = note.match(/<light(?:[:\s]([^>]*))?>/i);
        if (lightMatch) {
            this._setupPointLight(lightMatch[1] || '');
        }
    };

    Game_Event.prototype._setupPointLight = function(paramsStr) {
        const config = Config.getAll();
        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        
        let innerRadius = 0;
        for (let i = 0; i < params.length; i++) {
            const innerMatch = params[i].match(/inner[:\s]*(\d+)/i);
            if (innerMatch) {
                innerRadius = parseFloat(innerMatch[1]);
                params.splice(i, 1);
                break;
            }
        }
        
        const color = params[2] || config.defaultColor;
        this._lightData = {
            enabled: true,
            radius: params[0] ? parseFloat(params[0]) : config.defaultRadius,
            intensity: params[1] ? parseFloat(params[1]) : config.defaultIntensity,
            color: color,
            colorRgb: Utils.hexToRgb(color),
            isSpotlight: false,
            direction: 0,
            coneAngle: Math.PI,
            innerRadius: innerRadius
        };
    };

    Game_Event.prototype._setupSpotlight = function(paramsStr) {
        const config = Config.getAll();
        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        
        const color = params[2] || config.defaultColor;
        const direction = params[3] ? parseFloat(params[3]) : 90;
        const coneAngle = params[4] ? parseFloat(params[4]) : 45;
        
        this._lightData = {
            enabled: true,
            radius: params[0] ? parseFloat(params[0]) : config.defaultRadius,
            intensity: params[1] ? parseFloat(params[1]) : config.defaultIntensity,
            color: color,
            colorRgb: Utils.hexToRgb(color),
            isSpotlight: true,
            direction: Utils.degToRad(direction),
            coneAngle: Utils.degToRad(coneAngle / 2),
            innerRadius: 0
        };
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
            const config = Config.getAll();
            const color = config.defaultColor;
            this._lightData = {
                enabled: true,
                radius: config.defaultRadius,
                intensity: config.defaultIntensity,
                color: color,
                colorRgb: Utils.hexToRgb(color),
                isSpotlight: false,
                direction: 0,
                coneAngle: Math.PI,
                innerRadius: 0
            };
        }
    };

    // =========================================================================
    // Scene_Map Extensions
    // =========================================================================

    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (this._spriteset) {
            cleanupShadowResources(this._spriteset);
        }
        _Scene_Map_terminate.call(this);
    };

    // =========================================================================
    // Spriteset_Map Extensions
    // =========================================================================

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this.createLightingSystem();
    };

    Spriteset_Map.prototype.createLightingSystem = function() {
        if (shadowMapGenerator && shadowMapGenerator.isValid()) {
            cleanupShadowResources(this);
        }
        
        try {
            const config = Config.getAll();
            this._lightingFilter = new DL.LightingFilter(config.maxLights);
            this._lightingFilter.setAmbientColor($gameMap._ambientColor);
            this._lightingFilter.setAmbientIntensity($gameMap._ambientIntensity);
            
            if ($gameMap._sunLight) {
                this._lightingFilter.setSunParams(
                    $gameMap._sunLight.enabled,
                    $gameMap._sunLight.direction,
                    $gameMap._sunLight.intensity,
                    $gameMap._sunLight.color
                );
            }
            
            if (!this._baseSprite.filters) {
                this._baseSprite.filters = [];
            }
            this._baseSprite.filters.push(this._lightingFilter);
            
            // Create shadow map generator
            shadowMapGenerator = new DL.ShadowMapGenerator(
                config.shadowMapResolution,
                config.maxLights,
                10 // Region padding
            );
            
            // Create tile type map generator for wall detection
            // Always create it if available, regardless of wallShadowEnabled
            if (DL.TileTypeMapGenerator) {
                tileTypeMapGenerator = new DL.TileTypeMapGenerator();
                console.log('[DynamicLighting] TileTypeMapGenerator created, wallShadowEnabled:', config.wallShadowEnabled);
            } else {
                console.warn('[DynamicLighting] TileTypeMapGenerator not found! Wall shadows will not work.');
            }
            
            // Set up shadow uniforms
            const regionPadding = shadowMapGenerator.regionPadding;
            this._lightingFilter.uniforms.uShadowMapResolution = config.shadowMapResolution;
            this._lightingFilter.uniforms.uShadowSoftness = config.shadowSoftness;
            this._lightingFilter.uniforms.uShadowsEnabled = config.shadowsEnabled;
            this._lightingFilter.uniforms.uRegionMapSize = [
                shadowMapGenerator.regionMapWidth,
                shadowMapGenerator.regionMapHeight
            ];
            
            Debug.log('Lighting system created');
        } catch (e) {
            console.error('[DynamicLighting] Failed to create lighting system:', e);
        }
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateLightingSystem();
    };

    Spriteset_Map.prototype.updateLightingSystem = function() {
        if (!this._lightingFilter) return;
        if (!shadowMapGenerator || !shadowMapGenerator.isValid()) return;
        
        const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
        const config = Config.getAll();
        
        // Increment frame counter
        shadowMapGenerator.incrementFrame();
        Debug.incrementFrame();
        
        // Update region map
        shadowMapGenerator.updateRegionMap();
        
        // Update display offset
        const tileWidth = $gameMap.tileWidth();
        const tileHeight = $gameMap.tileHeight();
        const displayX = $gameMap.displayX();
        const displayY = $gameMap.displayY();
        
        this._lightingFilter.uniforms.uDisplayOffset = [displayX * tileWidth, displayY * tileHeight];
        this._lightingFilter.uniforms.uDisplayOffsetInt = [
            Math.floor(displayX) * tileWidth,
            Math.floor(displayY) * tileHeight
        ];
        this._lightingFilter.uniforms.uTileSize = [tileWidth, tileHeight];
        this._lightingFilter.uniforms.uRegionMap = shadowMapGenerator.regionTexture;
        
        // Update tile type map for wall shadows
        if (config.wallShadowEnabled && tileTypeMapGenerator) {
            tileTypeMapGenerator.update();
            if (tileTypeMapGenerator.texture) {
                this._lightingFilter.uniforms.uTileTypeMap = tileTypeMapGenerator.texture;
                this._lightingFilter.uniforms.uTileTypeMapSize = [
                    tileTypeMapGenerator.width,
                    tileTypeMapGenerator.height
                ];
                this._lightingFilter.uniforms.uTileTypePadding = tileTypeMapGenerator.padding;
                this._lightingFilter.uniforms.uWallShadowEnabled = true;
            }
        }
        
        // Update ambient light
        this._lightingFilter.setAmbientColor($gameMap._ambientColor);
        this._lightingFilter.setAmbientIntensity($gameMap._ambientIntensity);
        
        // Update sun light
        if ($gameMap._sunLight) {
            this._lightingFilter.setSunParams(
                $gameMap._sunLight.enabled,
                $gameMap._sunLight.direction,
                $gameMap._sunLight.intensity,
                $gameMap._sunLight.colorRgb
            );
        }
        
        // Generate sun shadows
        const sunShadowThreshold = 0.1;
        const sunIntensity = $gameMap._sunLight ? $gameMap._sunLight.intensity : 0;
        const shouldRenderSunShadows = $gameMap._sunLight &&
                                       $gameMap._sunLight.enabled &&
                                       sunIntensity >= sunShadowThreshold;
        
        if (shouldRenderSunShadows && renderer) {
            // Set tile type map for sun shadow filter
            if (config.wallShadowEnabled && tileTypeMapGenerator && tileTypeMapGenerator.texture) {
                if (shadowMapGenerator.sunShadowFilter) {
                    shadowMapGenerator.sunShadowFilter.setTileTypeMap(
                        tileTypeMapGenerator.texture,
                        tileTypeMapGenerator.width,
                        tileTypeMapGenerator.height,
                        tileTypeMapGenerator.padding
                    );
                    shadowMapGenerator.sunShadowFilter.setWallShadowEnabled(true);
                }
            }
            
            const settings = $gameMap._sunShadowSettings || {};
            const intensityFactor = Math.min(1.0, (sunIntensity - sunShadowThreshold) / (1.0 - sunShadowThreshold));
            const adjustedSettings = Object.assign({}, settings);
            adjustedSettings.strength = (settings.strength || config.sunShadowStrength) * intensityFactor;
            
            shadowMapGenerator.generateSunShadows($gameMap._sunLight.direction, adjustedSettings, renderer);
            
            this._lightingFilter.setSunShadowMap(shadowMapGenerator.sunShadowTexture, true);
        } else {
            this._lightingFilter.setSunShadowMap(null, false);
        }
        
        // Collect lights
        const screenWidth = Graphics.width;
        const screenHeight = Graphics.height;
        const lights = LightManager.collectLights(screenWidth, screenHeight);
        this._activeLights = lights;
        
        // Generate point light shadows
        if (lights.length > 0 && renderer) {
            // Set tile type map for point light shadow filter
            if (config.wallShadowEnabled && tileTypeMapGenerator && tileTypeMapGenerator.texture) {
                if (shadowMapGenerator.pointLightFilter) {
                    shadowMapGenerator.pointLightFilter.setTileTypeMap(
                        tileTypeMapGenerator.texture,
                        tileTypeMapGenerator.width,
                        tileTypeMapGenerator.height,
                        tileTypeMapGenerator.padding
                    );
                    shadowMapGenerator.pointLightFilter.setWallShadowEnabled(true);
                }
            }
            shadowMapGenerator.generatePointLightShadows(lights, renderer);
        }
        
        // Update light uniforms
        const shadowsEnabled = $gameMap.areShadowsEnabled();
        this._lightingFilter.uniforms.uShadowMap = shadowMapGenerator.pointLightTexture || PIXI.Texture.WHITE;
        this._lightingFilter.uniforms.uShadowsEnabled = shadowsEnabled && lights.length > 0;
        
        this._lightingFilter.updateLights(lights, screenWidth, screenHeight);
    };

    // =========================================================================
    // Plugin Commands
    // =========================================================================

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

    PluginManager.registerCommand(pluginName, 'SetShadowsEnabled', args => {
        $gameMap.setShadowsEnabled(args.enabled === 'true');
    });

    // =========================================================================
    // Public API
    // =========================================================================

    // Export convenience methods
    DL.hexToRgb = Utils.hexToRgb;
    DL.degToRad = Utils.degToRad;
    DL.directionToAngle = Utils.directionToAngle;
    DL.CONFIG = Config.getAll();
    
    DL.setDebugMode = function(mode) {
        const scene = SceneManager._scene;
        if (scene && scene._spriteset && scene._spriteset._lightingFilter) {
            scene._spriteset._lightingFilter.uniforms.uDebugMode = mode;
            Debug.log('Debug mode set to:', mode);
        }
    };
    
    DL.getShadowMapGenerator = function() {
        return shadowMapGenerator;
    };
    
    DL.getTileTypeMapGenerator = function() {
        return tileTypeMapGenerator;
    };
    
    // Expose tile type constants and methods for external use
    DL.getTileType = function(x, y) {
        return $gameMap ? $gameMap.getTileType(x, y) : DL.TILE_TYPE.NONE;
    };
    
    DL.isWallSide = function(x, y) {
        return $gameMap ? $gameMap.isWallSideTile(x, y) : false;
    };
    
    DL.isWallTop = function(x, y) {
        return $gameMap ? $gameMap.isWallTopTile(x, y) : false;
    };
    
    DL.isAnyWall = function(x, y) {
        return $gameMap ? $gameMap.isAnyWallTile(x, y) : false;
    };

    Debug.log('DynamicLighting v4.0 loaded - Modular Architecture with integrated TileTypeDetector');

})();
