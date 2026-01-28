/*:
 * @target MZ
 * @plugindesc Dynamic Lighting Effects Addon v2.0 - Modular
 * @author MesaFer
 * @base DynamicLighting/DynamicLighting
 * @orderAfter DynamicLighting/DynamicLighting
 *
 * @help
 * ============================================================================
 * Dynamic Lighting Effects Addon v2.0 - Modular Architecture
 * ============================================================================
 * 
 * This addon requires DynamicLighting plugin to be installed and enabled.
 * Place this plugin AFTER DynamicLighting in the plugin list.
 * 
 * ============================================================================
 * Event Note Tags (Extended):
 * ============================================================================
 *
 * FLICKERING (like a candle or torch):
 *   <light:200,1.0,#ff6600,flicker>
 *   <light:200,1.0,#ff6600,flicker:0.3>      - flicker intensity (0.0-1.0)
 *   <light:200,1.0,#ff6600,flicker:0.3,10>   - flicker intensity, speed
 *
 * PULSING (smooth sine wave):
 *   <light:200,1.0,#ffffff,pulse>
 *   <light:200,1.0,#ffffff,pulse:0.5>        - pulse amplitude (0.0-1.0)
 *   <light:200,1.0,#ffffff,pulse:0.5,2>      - pulse amplitude, speed
 *
 * STROBE (on/off blinking):
 *   <light:200,1.0,#ff0000,strobe>
 *   <light:200,1.0,#ff0000,strobe:5>         - strobe frequency (Hz)
 *
 * FIRE (realistic fire simulation):
 *   <light:200,1.0,#ff6600,fire>
 *   <light:200,1.0,#ff6600,fire:0.4>         - fire intensity variation
 *
 * FLUORESCENT (old fluorescent lamp with random flickers):
 *   <light:200,1.0,#ffffff,fluorescent>
 *   <light:200,1.0,#ffffff,fluorescent:0.15> - flicker chance (0.0-1.0)
 *   <light:200,1.0,#ffffff,fluorescent:0.15,0.3> - chance, max off duration
 *
 * BROKEN (mostly off with occasional sparks):
 *   <light:200,1.0,#ffff00,broken>
 *   <light:200,1.0,#ffff00,broken:0.1>       - on chance (0.0-1.0)
 *
 * NEON (neon sign with segment failures):
 *   <light:200,1.0,#ff00ff,neon>
 *   <light:200,1.0,#ff00ff,neon:30>          - flicker speed
 *   <light:200,1.0,#ff00ff,neon:30,0.05>     - flicker speed, fail chance
 *
 * SPARK (electrical sparks/lightning):
 *   <light:200,1.0,#00ffff,spark>
 *   <light:200,1.0,#00ffff,spark:0.02>       - flash chance
 * 
 * ============================================================================
 * Plugin Commands:
 * ============================================================================
 *
 * FadeAmbientLight    - Smoothly transition ambient light
 * FadeEventLight      - Smoothly fade event light intensity
 * FadeEventLightColor - Smoothly change event light color
 * FadeEventLightRadius- Smoothly change event light radius
 * TransitionEventLight- Smoothly transition all light parameters at once
 * SetLightEffect      - Change light effect at runtime
 *
 * ============================================================================
 * 
 * @command FadeAmbientLight
 * @text Fade Ambient Light
 * @desc Smoothly transitions ambient light to new values
 *
 * @arg targetColor
 * @text Target Color
 * @type text
 * @default #1a1a2e
 * @desc Target ambient color in hex format
 *
 * @arg targetIntensity
 * @text Target Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.2
 * @desc Target ambient intensity
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 1
 * @default 60
 * @desc Transition duration in frames (60 = 1 second)
 *
 * @command FadeEventLight
 * @text Fade Event Light
 * @desc Smoothly fades event light intensity
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg targetIntensity
 * @text Target Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 1.0
 * @desc Target light intensity (0 = off)
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 1
 * @default 30
 *
 * @command FadeEventLightColor
 * @text Fade Event Light Color
 * @desc Smoothly transitions event light color
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg targetColor
 * @text Target Color
 * @type text
 * @default #ffffff
 * @desc Target light color in hex format
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 1
 * @default 30
 *
 * @command FadeEventLightRadius
 * @text Fade Event Light Radius
 * @desc Smoothly transitions event light radius
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg targetRadius
 * @text Target Radius
 * @type number
 * @min 1
 * @default 150
 * @desc Target light radius in pixels
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 1
 * @default 30
 *
 * @command TransitionEventLight
 * @text Transition Event Light
 * @desc Smoothly transitions all event light parameters at once
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg targetRadius
 * @text Target Radius
 * @type number
 * @min 0
 * @default 150
 * @desc Target light radius (0 = no change)
 *
 * @arg targetIntensity
 * @text Target Intensity
 * @type number
 * @decimals 2
 * @min -1
 * @max 2
 * @default -1
 * @desc Target intensity (-1 = no change)
 *
 * @arg targetColor
 * @text Target Color
 * @type text
 * @default
 * @desc Target color in hex (empty = no change)
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 1
 * @default 60
 *
 * @command SetLightEffect
 * @text Set Light Effect
 * @desc Changes the effect type for an event's light
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 *
 * @arg effectType
 * @text Effect Type
 * @type select
 * @option none
 * @option flicker
 * @option pulse
 * @option strobe
 * @option fire
 * @option fluorescent
 * @option broken
 * @option neon
 * @option spark
 * @default none
 *
 * @arg param1
 * @text Parameter 1
 * @type number
 * @decimals 2
 * @default 0.3
 * @desc Effect-specific parameter (intensity/amplitude/frequency)
 *
 * @arg param2
 * @text Parameter 2
 * @type number
 * @decimals 2
 * @default 5
 * @desc Effect-specific parameter (speed)
 */

(function() {
    'use strict';

    const pluginName = 'DynamicLighting_Effects';
    const BASE_PATH = 'js/plugins/DynamicLighting/effects/';

    //==========================================================================
    // Synchronous Script Loader
    //==========================================================================

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
            console.error('[DynamicLighting_Effects] Failed to load module:', path);
            return false;
        }
    }

    //==========================================================================
    // Module Loading
    //==========================================================================

    const DL = window.DynamicLighting;
    if (!DL) {
        console.error('[DynamicLighting_Effects] Base DynamicLighting plugin not loaded!');
        return;
    }

    const Debug = DL.Debug;

    // Load effects modules
    const modules = [
        'LightEffects.js',
        'TransitionManager.js'
    ];

    console.log('[DynamicLighting_Effects] Loading modules...');
    
    for (const module of modules) {
        const fullPath = BASE_PATH + module;
        if (!loadScriptSync(fullPath)) {
            console.error('[DynamicLighting_Effects] Failed to load required module:', module);
            return;
        }
    }
    
    console.log('[DynamicLighting_Effects] All modules loaded successfully');

    // Get references
    const LightEffects = DL.Effects.LightEffects;
    const transitionManager = DL.Effects.transitionManager;
    const parseEffectParams = DL.Effects.parseEffectParams;

    //==========================================================================
    // Extended Game_Event - Effect Support
    //==========================================================================

    const _Game_Event_setupEventLight = Game_Event.prototype.setupEventLight;
    Game_Event.prototype.setupEventLight = function() {
        _Game_Event_setupEventLight.call(this);
        
        if (!this._lightData) return;
        
        const event = this.event();
        if (!event) return;
        
        const note = event.note || '';
        
        // Parse effect from note tag
        // Format: <light:radius,intensity,color,effect:param1,param2>
        const effectMatch = note.match(/<light[^>]*,(flicker|pulse|strobe|fire|fluorescent|broken|neon|spark)(?::([^,>]+))?(?:,([^>]+))?/i);
        
        if (effectMatch) {
            const effectType = effectMatch[1].toLowerCase();
            const param1 = effectMatch[2] ? parseFloat(effectMatch[2]) : undefined;
            const param2 = effectMatch[3] ? parseFloat(effectMatch[3]) : undefined;
            
            this._lightData.effect = {
                type: effectType,
                params: parseEffectParams(effectType, param1, param2)
            };
            
            // Store base intensity for effect calculations
            this._lightData.baseIntensity = this._lightData.intensity;
            
            Debug.log('Event', this.eventId(), 'effect:', this._lightData.effect);
        }
    };

    Game_Event.prototype.setLightEffect = function(effectType, params) {
        if (!this._lightData) return;
        
        if (effectType === 'none' || !effectType) {
            this._lightData.effect = null;
            this._lightData.intensity = this._lightData.baseIntensity || this._lightData.intensity;
        } else {
            this._lightData.effect = {
                type: effectType,
                params: params || parseEffectParams(effectType)
            };
            this._lightData.baseIntensity = this._lightData.baseIntensity || this._lightData.intensity;
        }
    };

    Game_Event.prototype.getEffectiveIntensity = function(time) {
        if (!this._lightData) return 0;
        
        const baseIntensity = this._lightData.baseIntensity || this._lightData.intensity;
        
        if (!this._lightData.effect) {
            return this._lightData.intensity;
        }
        
        const effectFunc = LightEffects[this._lightData.effect.type];
        if (effectFunc) {
            return effectFunc(baseIntensity, time, this._lightData.effect.params);
        }
        
        return this._lightData.intensity;
    };

    //==========================================================================
    // Extended Game_Map - Ambient Transitions
    //==========================================================================

    Game_Map.prototype.fadeAmbientLight = function(targetColor, targetIntensity, duration) {
        const startColor = DL.hexToRgb(this._ambientColor);
        const endColor = DL.hexToRgb(targetColor);
        const startIntensity = this._ambientIntensity;
        
        // Color transition
        transitionManager.add({
            target: this,
            property: 'ambientColor',
            startValue: startColor,
            endValue: endColor,
            duration: duration,
            easing: 'easeInOut',
            onUpdate: (value) => {
                const r = Math.round(value.r * 255).toString(16).padStart(2, '0');
                const g = Math.round(value.g * 255).toString(16).padStart(2, '0');
                const b = Math.round(value.b * 255).toString(16).padStart(2, '0');
                this._ambientColor = `#${r}${g}${b}`;
            }
        });
        
        // Intensity transition
        transitionManager.add({
            target: this,
            property: 'ambientIntensity',
            startValue: startIntensity,
            endValue: targetIntensity,
            duration: duration,
            easing: 'easeInOut',
            onUpdate: (value) => {
                this._ambientIntensity = value;
            }
        });
    };

    //==========================================================================
    // Extended Game_Map - Player Light Effects
    //==========================================================================

    Game_Map.prototype.setPlayerLightEffect = function(effectType, params) {
        if (!this._playerLight) return;
        
        if (effectType === 'none' || !effectType) {
            this._playerLight.effect = null;
            this._playerLight.intensity = this._playerLight.baseIntensity || this._playerLight.intensity;
        } else {
            this._playerLight.effect = {
                type: effectType,
                params: params || {}
            };
            this._playerLight.baseIntensity = this._playerLight.baseIntensity || this._playerLight.intensity;
        }
    };

    //==========================================================================
    // Extended Spriteset_Map - Effect Processing (via update hook)
    //==========================================================================

    // Hook into Spriteset_Map.update to apply effects BEFORE lighting system updates
    const _Spriteset_Map_update_effects = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        // Update transitions before base update
        transitionManager.update();
        
        // Apply light effects to event lights before base lighting system runs
        const time = performance.now() / 1000;
        
        // Apply effects to event lights
        const events = $gameMap.events();
        for (const event of events) {
            if (event && event._lightData && event._lightData.effect) {
                const baseIntensity = event._lightData.baseIntensity || event._lightData.intensity;
                const effectFunc = LightEffects[event._lightData.effect.type];
                if (effectFunc) {
                    // Temporarily store effective intensity for LightManager to pick up
                    event._lightData._effectiveIntensity = effectFunc(baseIntensity, time, event._lightData.effect.params);
                }
            }
        }
        
        // Apply effects to player light
        if ($gameMap._playerLight && $gameMap._playerLight.effect) {
            const pl = $gameMap._playerLight;
            const baseIntensity = pl.baseIntensity || pl.intensity;
            const effectFunc = LightEffects[pl.effect.type];
            if (effectFunc) {
                pl._effectiveIntensity = effectFunc(baseIntensity, time, pl.effect.params);
            }
        }
        
        // Call original update which will call updateLightingSystem
        _Spriteset_Map_update_effects.call(this);
    };
    
    //==========================================================================
    // LightManager Extension - Use effective intensity
    //==========================================================================
    
    // Extend LightManager.collectLights to use effective intensity
    if (DL.LightManager && DL.LightManager.collectLights) {
        const _LightManager_collectLights = DL.LightManager.collectLights;
        DL.LightManager.collectLights = function(screenWidth, screenHeight) {
            const lights = _LightManager_collectLights.call(this, screenWidth, screenHeight);
            
            // Apply effective intensities from effects
            const events = $gameMap.events();
            for (let i = 0; i < lights.length; i++) {
                const light = lights[i];
                
                // Find matching event and apply effect
                for (const event of events) {
                    if (event && event._lightData && 
                        event._lightData._effectiveIntensity !== undefined &&
                        Math.abs(event.screenX() - light.x) < 1 &&
                        Math.abs((event.screenY() - 24) - light.y) < 1) {
                        light.intensity = event._lightData._effectiveIntensity;
                        break;
                    }
                }
            }
            
            // Apply player light effect
            if ($gameMap._playerLight && $gameMap._playerLight._effectiveIntensity !== undefined) {
                for (const light of lights) {
                    if (Math.abs($gamePlayer.screenX() - light.x) < 1 &&
                        Math.abs(($gamePlayer.screenY() - 24) - light.y) < 1) {
                        light.intensity = $gameMap._playerLight._effectiveIntensity;
                        break;
                    }
                }
            }
            
            return lights;
        };
    }

    //==========================================================================
    // Helper Functions
    //==========================================================================

    function rgbToHex(rgb) {
        const r = Math.round(rgb.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(rgb.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(rgb.b * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    //==========================================================================
    // Plugin Commands
    //==========================================================================

    PluginManager.registerCommand(pluginName, 'FadeAmbientLight', args => {
        $gameMap.fadeAmbientLight(
            String(args.targetColor),
            Number(args.targetIntensity),
            Number(args.duration)
        );
    });

    PluginManager.registerCommand(pluginName, 'FadeEventLight', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (!event || !event._lightData) return;
        
        const startIntensity = event._lightData.intensity;
        const targetIntensity = Number(args.targetIntensity);
        const duration = Number(args.duration);
        
        transitionManager.add({
            target: event._lightData,
            property: 'intensity',
            startValue: startIntensity,
            endValue: targetIntensity,
            duration: duration,
            easing: 'easeInOut',
            onUpdate: (value) => {
                event._lightData.intensity = value;
                event._lightData.baseIntensity = value;
            },
            onComplete: () => {
                if (targetIntensity <= 0) {
                    event._lightData.enabled = false;
                }
            }
        });
    });

    PluginManager.registerCommand(pluginName, 'FadeEventLightColor', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (!event || !event._lightData) return;
        
        const startColor = DL.hexToRgb(event._lightData.color);
        const endColor = DL.hexToRgb(String(args.targetColor));
        const duration = Number(args.duration);
        
        transitionManager.add({
            target: event._lightData,
            property: 'color',
            startValue: startColor,
            endValue: endColor,
            duration: duration,
            easing: 'easeInOut',
            onUpdate: (value) => {
                event._lightData.color = rgbToHex(value);
                event._lightData.colorRgb = value;
            }
        });
    });

    PluginManager.registerCommand(pluginName, 'FadeEventLightRadius', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (!event || !event._lightData) return;
        
        const startRadius = event._lightData.radius;
        const targetRadius = Number(args.targetRadius);
        const duration = Number(args.duration);
        
        transitionManager.add({
            target: event._lightData,
            property: 'radius',
            startValue: startRadius,
            endValue: targetRadius,
            duration: duration,
            easing: 'easeInOut',
            onUpdate: (value) => {
                event._lightData.radius = value;
            }
        });
    });

    PluginManager.registerCommand(pluginName, 'TransitionEventLight', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (!event || !event._lightData) return;
        
        const duration = Number(args.duration);
        const targetRadius = Number(args.targetRadius);
        const targetIntensity = Number(args.targetIntensity);
        const targetColor = String(args.targetColor);
        
        // Transition radius if specified (> 0)
        if (targetRadius > 0) {
            transitionManager.add({
                target: event._lightData,
                property: 'radius',
                startValue: event._lightData.radius,
                endValue: targetRadius,
                duration: duration,
                easing: 'easeInOut',
                onUpdate: (value) => {
                    event._lightData.radius = value;
                }
            });
        }
        
        // Transition intensity if specified (>= 0)
        if (targetIntensity >= 0) {
            transitionManager.add({
                target: event._lightData,
                property: 'intensity',
                startValue: event._lightData.intensity,
                endValue: targetIntensity,
                duration: duration,
                easing: 'easeInOut',
                onUpdate: (value) => {
                    event._lightData.intensity = value;
                    event._lightData.baseIntensity = value;
                },
                onComplete: () => {
                    if (targetIntensity <= 0) {
                        event._lightData.enabled = false;
                    }
                }
            });
        }
        
        // Transition color if specified (not empty)
        if (targetColor && targetColor.length > 0) {
            const startColor = DL.hexToRgb(event._lightData.color);
            const endColor = DL.hexToRgb(targetColor);
            
            transitionManager.add({
                target: event._lightData,
                property: 'color',
                startValue: startColor,
                endValue: endColor,
                duration: duration,
                easing: 'easeInOut',
                onUpdate: (value) => {
                    event._lightData.color = rgbToHex(value);
                    event._lightData.colorRgb = value;
                }
            });
        }
    });

    PluginManager.registerCommand(pluginName, 'SetLightEffect', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (!event) return;
        
        const effectType = String(args.effectType);
        const params = {};
        
        switch (effectType) {
            case 'flicker':
                params.intensity = Number(args.param1);
                params.speed = Number(args.param2);
                break;
            case 'pulse':
                params.amplitude = Number(args.param1);
                params.speed = Number(args.param2);
                break;
            case 'strobe':
                params.frequency = Number(args.param1);
                break;
            case 'fire':
                params.variation = Number(args.param1);
                break;
            case 'fluorescent':
                params.chance = Number(args.param1);
                params.maxOff = Number(args.param2);
                break;
            case 'broken':
                params.onChance = Number(args.param1);
                params.sparkDuration = Number(args.param2);
                break;
            case 'neon':
                params.flickerSpeed = Number(args.param1);
                params.failChance = Number(args.param2);
                break;
            case 'spark':
                params.flashChance = Number(args.param1);
                params.baseLevel = Number(args.param2);
                break;
        }
        
        event.setLightEffect(effectType, params);
    });

    //==========================================================================
    // Scene_Map Hooks - Clear transitions on map change
    //==========================================================================

    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        transitionManager.clear();
        _Scene_Map_terminate.call(this);
    };

    //==========================================================================
    // Export
    //==========================================================================

    Debug.log('DynamicLighting_Effects v2.0 loaded - Modular Architecture');

})();