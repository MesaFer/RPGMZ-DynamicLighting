/*:
 * @target MZ
 * @plugindesc Dynamic Lighting Effects Addon v1.0 - Flickering, pulsing, smooth transitions
 * @author MesaFer
 * @base DynamicLighting
 * @orderAfter DynamicLighting
 *
 * @help
 * ============================================================================
 * Dynamic Lighting Effects Addon v1.0
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

(() => {
    'use strict';

    const pluginName = 'DynamicLighting_Effects';
    
    // Check if base plugin exists
    if (!window.DynamicLighting) {
        console.error('[DynamicLighting_Effects] Base plugin DynamicLighting not found!');
        return;
    }

    const DEBUG = false;
    
    function debugLog(...args) {
        if (DEBUG) console.log('[DL_Effects]', ...args);
    }

    //==========================================================================
    // Light Effect Types
    //==========================================================================

    // Pseudo-random number generator with seed for consistent randomness per light
    function seededRandom(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    const LightEffects = {
        /**
         * No effect - static light
         */
        none: function(baseIntensity, time, params) {
            return baseIntensity;
        },

        /**
         * Flickering effect - random variations like a candle
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {intensity: 0.3, speed: 10}
         */
        flicker: function(baseIntensity, time, params) {
            const intensity = params.intensity || 0.3;
            const speed = params.speed || 10;
            
            // Multiple noise frequencies for realistic flicker
            const noise1 = Math.sin(time * speed * 7.3) * 0.5;
            const noise2 = Math.sin(time * speed * 13.7) * 0.3;
            const noise3 = Math.sin(time * speed * 23.1) * 0.2;
            
            // Random component that changes occasionally
            const randomPhase = Math.sin(time * speed * 0.5) > 0.8 ? Math.random() * 0.3 : 0;
            
            const flicker = (noise1 + noise2 + noise3 + randomPhase) * intensity;
            
            return Math.max(0, baseIntensity + flicker * baseIntensity);
        },

        /**
         * Pulsing effect - smooth sine wave
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {amplitude: 0.5, speed: 2}
         */
        pulse: function(baseIntensity, time, params) {
            const amplitude = params.amplitude || 0.5;
            const speed = params.speed || 2;
            
            // Smooth sine wave oscillation
            const pulse = Math.sin(time * speed * Math.PI) * amplitude;
            
            return Math.max(0, baseIntensity + pulse * baseIntensity);
        },

        /**
         * Strobe effect - on/off blinking
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {frequency: 5}
         */
        strobe: function(baseIntensity, time, params) {
            const frequency = params.frequency || 5;
            
            // Square wave
            const phase = (time * frequency) % 1;
            return phase < 0.5 ? baseIntensity : 0;
        },

        /**
         * Fire effect - realistic fire simulation
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {variation: 0.4}
         */
        fire: function(baseIntensity, time, params) {
            const variation = params.variation || 0.4;
            
            // Multiple overlapping waves for organic fire look
            const wave1 = Math.sin(time * 8.7) * 0.3;
            const wave2 = Math.sin(time * 12.3 + 1.5) * 0.25;
            const wave3 = Math.sin(time * 17.1 + 3.2) * 0.2;
            const wave4 = Math.sin(time * 5.3) * 0.15;
            
            // Occasional bright flare
            const flare = Math.sin(time * 2.1) > 0.9 ? 0.2 : 0;
            
            // Occasional dim
            const dim = Math.sin(time * 3.7) < -0.85 ? -0.15 : 0;
            
            const fireEffect = (wave1 + wave2 + wave3 + wave4 + flare + dim) * variation;
            
            return Math.max(0.1, baseIntensity + fireEffect * baseIntensity);
        },

        /**
         * Fluorescent lamp effect - characteristic random flickering
         * Simulates old/faulty fluorescent tube with random sharp flickers
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {chance: 0.15, minOff: 0.05, maxOff: 0.3}
         */
        fluorescent: function(baseIntensity, time, params) {
            const chance = params.chance || 0.15;      // Chance of flicker per "cycle"
            const minOff = params.minOff || 0.05;      // Minimum off duration
            const maxOff = params.maxOff || 0.3;       // Maximum off duration
            
            // Create pseudo-random flicker pattern based on time
            // Divide time into small segments and decide if each segment is a flicker
            const segment = Math.floor(time * 20); // 20 segments per second
            const segmentPhase = (time * 20) % 1;
            
            // Use seeded random for consistent flicker pattern
            const flickerRandom = seededRandom(segment);
            
            // Determine if this segment should flicker
            if (flickerRandom < chance) {
                // Calculate flicker duration within this segment
                const flickerDuration = minOff + seededRandom(segment + 0.5) * (maxOff - minOff);
                
                // Sharp on/off transition
                if (segmentPhase < flickerDuration) {
                    // Random dim or complete off
                    const dimLevel = seededRandom(segment + 0.3);
                    return dimLevel < 0.3 ? 0 : baseIntensity * 0.2;
                }
            }
            
            // Occasional rapid double-flicker
            const doubleFlicker = seededRandom(segment * 0.1);
            if (doubleFlicker > 0.95) {
                const rapidPhase = (time * 60) % 1;
                if (rapidPhase < 0.1 || (rapidPhase > 0.15 && rapidPhase < 0.25)) {
                    return 0;
                }
            }
            
            // Slight constant hum/variation
            const hum = Math.sin(time * 120) * 0.02;
            
            return Math.max(0, baseIntensity + hum * baseIntensity);
        },

        /**
         * Broken/damaged light effect - mostly off with occasional sparks
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {onChance: 0.1, sparkDuration: 0.1}
         */
        broken: function(baseIntensity, time, params) {
            const onChance = params.onChance || 0.1;
            const sparkDuration = params.sparkDuration || 0.1;
            
            const segment = Math.floor(time * 10);
            const segmentPhase = (time * 10) % 1;
            const random = seededRandom(segment);
            
            // Mostly off
            if (random > onChance) {
                return 0;
            }
            
            // Brief spark/flash
            if (segmentPhase < sparkDuration) {
                // Bright flash with some variation
                const flashIntensity = 0.5 + seededRandom(segment + 0.7) * 1.0;
                return baseIntensity * flashIntensity;
            }
            
            // Quick fade out after spark
            if (segmentPhase < sparkDuration * 3) {
                const fadeProgress = (segmentPhase - sparkDuration) / (sparkDuration * 2);
                return baseIntensity * (1 - fadeProgress) * 0.5;
            }
            
            return 0;
        },

        /**
         * Neon sign effect - slight flicker with occasional segment failures
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {flickerSpeed: 30, failChance: 0.05}
         */
        neon: function(baseIntensity, time, params) {
            const flickerSpeed = params.flickerSpeed || 30;
            const failChance = params.failChance || 0.05;
            
            // Base neon hum
            const hum = Math.sin(time * flickerSpeed * 2) * 0.03;
            
            // Occasional segment failure
            const segment = Math.floor(time * 2);
            const failRandom = seededRandom(segment);
            
            if (failRandom < failChance) {
                const failPhase = (time * 2) % 1;
                if (failPhase < 0.3) {
                    // Segment off or dim
                    return baseIntensity * 0.3;
                }
            }
            
            // Rapid micro-flicker characteristic of neon
            const microFlicker = seededRandom(Math.floor(time * 100)) < 0.1 ? -0.1 : 0;
            
            return Math.max(0.2, baseIntensity + (hum + microFlicker) * baseIntensity);
        },

        /**
         * Lightning/electrical spark effect - random bright flashes
         * @param {number} baseIntensity - Base light intensity
         * @param {number} time - Current time in seconds
         * @param {object} params - {flashChance: 0.02, baseLevel: 0.1}
         */
        spark: function(baseIntensity, time, params) {
            const flashChance = params.flashChance || 0.02;
            const baseLevel = params.baseLevel || 0.1;
            
            const segment = Math.floor(time * 30);
            const segmentPhase = (time * 30) % 1;
            const random = seededRandom(segment);
            
            // Base dim glow
            let result = baseIntensity * baseLevel;
            
            // Random bright flash
            if (random < flashChance) {
                if (segmentPhase < 0.1) {
                    // Main flash
                    result = baseIntensity * (1.5 + seededRandom(segment + 0.2) * 0.5);
                } else if (segmentPhase < 0.15) {
                    // Secondary flash
                    result = baseIntensity * 0.8;
                } else if (segmentPhase < 0.2) {
                    // Tertiary flash
                    result = baseIntensity * (0.3 + seededRandom(segment + 0.4) * 0.4);
                }
            }
            
            return result;
        }
    };

    //==========================================================================
    // Transition Manager
    //==========================================================================

    class TransitionManager {
        constructor() {
            this._transitions = [];
        }

        /**
         * Add a new transition
         * @param {object} config - Transition configuration
         */
        add(config) {
            this._transitions.push({
                target: config.target,
                property: config.property,
                startValue: config.startValue,
                endValue: config.endValue,
                duration: config.duration,
                elapsed: 0,
                easing: config.easing || 'linear',
                onUpdate: config.onUpdate,
                onComplete: config.onComplete
            });
        }

        /**
         * Clear all active transitions (called on map change)
         */
        clear() {
            this._transitions = [];
            debugLog('Transitions cleared');
        }

        /**
         * Update all active transitions
         */
        update() {
            for (let i = this._transitions.length - 1; i >= 0; i--) {
                const t = this._transitions[i];
                t.elapsed++;
                
                const progress = Math.min(t.elapsed / t.duration, 1);
                const easedProgress = this._applyEasing(progress, t.easing);
                
                // Calculate current value
                let currentValue;
                if (typeof t.startValue === 'object') {
                    // Color transition
                    currentValue = this._lerpColor(t.startValue, t.endValue, easedProgress);
                } else {
                    // Number transition
                    currentValue = t.startValue + (t.endValue - t.startValue) * easedProgress;
                }
                
                // Call update callback
                if (t.onUpdate) {
                    t.onUpdate(currentValue, progress);
                }
                
                // Check if complete
                if (progress >= 1) {
                    if (t.onComplete) {
                        t.onComplete();
                    }
                    this._transitions.splice(i, 1);
                }
            }
        }

        /**
         * Apply easing function
         */
        _applyEasing(t, type) {
            switch (type) {
                case 'easeIn':
                    return t * t;
                case 'easeOut':
                    return t * (2 - t);
                case 'easeInOut':
                    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                case 'linear':
                default:
                    return t;
            }
        }

        /**
         * Interpolate between two colors
         */
        _lerpColor(start, end, t) {
            return {
                r: start.r + (end.r - start.r) * t,
                g: start.g + (end.g - start.g) * t,
                b: start.b + (end.b - start.b) * t
            };
        }

        /**
         * Check if any transitions are active
         */
        get isActive() {
            return this._transitions.length > 0;
        }
    }

    // Global transition manager
    const transitionManager = new TransitionManager();

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
        // Supports: flicker, pulse, strobe, fire, fluorescent, broken, neon, spark
        const effectMatch = note.match(/<light[^>]*,(flicker|pulse|strobe|fire|fluorescent|broken|neon|spark)(?::([^,>]+))?(?:,([^>]+))?/i);
        
        if (effectMatch) {
            const effectType = effectMatch[1].toLowerCase();
            const param1 = effectMatch[2] ? parseFloat(effectMatch[2]) : undefined;
            const param2 = effectMatch[3] ? parseFloat(effectMatch[3]) : undefined;
            
            this._lightData.effect = {
                type: effectType,
                params: this._parseEffectParams(effectType, param1, param2)
            };
            
            // Store base intensity for effect calculations
            this._lightData.baseIntensity = this._lightData.intensity;
            
            debugLog('Event', this.eventId(), 'effect:', this._lightData.effect);
        }
    };

    Game_Event.prototype._parseEffectParams = function(effectType, param1, param2) {
        switch (effectType) {
            case 'flicker':
                return {
                    intensity: param1 !== undefined ? param1 : 0.3,
                    speed: param2 !== undefined ? param2 : 10
                };
            case 'pulse':
                return {
                    amplitude: param1 !== undefined ? param1 : 0.5,
                    speed: param2 !== undefined ? param2 : 2
                };
            case 'strobe':
                return {
                    frequency: param1 !== undefined ? param1 : 5
                };
            case 'fire':
                return {
                    variation: param1 !== undefined ? param1 : 0.4
                };
            case 'fluorescent':
                return {
                    chance: param1 !== undefined ? param1 : 0.15,
                    maxOff: param2 !== undefined ? param2 : 0.3
                };
            case 'broken':
                return {
                    onChance: param1 !== undefined ? param1 : 0.1,
                    sparkDuration: param2 !== undefined ? param2 : 0.1
                };
            case 'neon':
                return {
                    flickerSpeed: param1 !== undefined ? param1 : 30,
                    failChance: param2 !== undefined ? param2 : 0.05
                };
            case 'spark':
                return {
                    flashChance: param1 !== undefined ? param1 : 0.02,
                    baseLevel: param2 !== undefined ? param2 : 0.1
                };
            default:
                return {};
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
                params: params || this._parseEffectParams(effectType)
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
        const startColor = window.DynamicLighting.hexToRgb(this._ambientColor);
        const endColor = window.DynamicLighting.hexToRgb(targetColor);
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
    // Extended Spriteset_Map - Effect Processing
    //==========================================================================

    const _Spriteset_Map_updateLightingSystem = Spriteset_Map.prototype.updateLightingSystem;
    Spriteset_Map.prototype.updateLightingSystem = function() {
        if (!this._lightingFilter) return;

        // Update transitions
        transitionManager.update();

        // Update ambient light
        this._lightingFilter.setAmbientColor($gameMap._ambientColor);
        this._lightingFilter.setAmbientIntensity($gameMap._ambientIntensity);
        
        // CRITICAL FIX: Update sun light from $gameMap._sunLight
        // This was missing and caused sun color to not update!
        if ($gameMap._sunLight) {
            this._lightingFilter.setSunParams(
                $gameMap._sunLight.enabled,
                $gameMap._sunLight.direction,
                $gameMap._sunLight.intensity,
                $gameMap._sunLight.colorRgb || $gameMap._sunLight.color
            );
        }

        const lights = [];
        const screenWidth = Graphics.width;
        const screenHeight = Graphics.height;
        
        // Current time in seconds for effect calculations
        const time = performance.now() / 1000;
        
        // Collect event lights with effects
        const events = $gameMap.events();
        
        for (const event of events) {
            if (event && event.hasLight && event.hasLight()) {
                const data = event.getLightData();
                const x = event.screenX();
                const y = event.screenY() - 24;
                const radius = data.radius;
                
                // Off-screen culling
                if (x + radius < 0 || x - radius > screenWidth ||
                    y + radius < 0 || y - radius > screenHeight) {
                    continue;
                }
                
                // Get effective intensity with effects applied
                const effectiveIntensity = event.getEffectiveIntensity ? 
                    event.getEffectiveIntensity(time) : data.intensity;
                
                lights.push({
                    x: x,
                    y: y,
                    radius: radius,
                    intensity: effectiveIntensity,
                    color: data.color,
                    colorRgb: data.colorRgb,  // Use cached RGB
                    // IMPORTANT: Include spotlight data!
                    isSpotlight: data.isSpotlight,
                    direction: data.direction,
                    coneAngle: data.coneAngle,
                    innerRadius: data.innerRadius
                });
            }
        }
        
        // Player light
        if ($gameMap._playerLight && $gameMap._playerLight.enabled) {
            let playerIntensity = $gameMap._playerLight.intensity;
            
            // Apply player light effect if set
            if ($gameMap._playerLight.effect) {
                const effectFunc = LightEffects[$gameMap._playerLight.effect.type];
                if (effectFunc) {
                    const baseIntensity = $gameMap._playerLight.baseIntensity || playerIntensity;
                    playerIntensity = effectFunc(baseIntensity, time, $gameMap._playerLight.effect.params);
                }
            }
            
            const pl = $gameMap._playerLight;
            let direction = pl.direction || 0;
            
            // Update direction based on player facing if followDirection is enabled
            if (pl.isSpotlight && pl.followDirection && window.DynamicLighting.directionToAngle) {
                direction = window.DynamicLighting.degToRad(
                    window.DynamicLighting.directionToAngle($gamePlayer.direction())
                );
            }
            
            lights.push({
                x: $gamePlayer.screenX(),
                y: $gamePlayer.screenY() - 24,
                radius: pl.radius,
                intensity: playerIntensity,
                color: pl.color,
                colorRgb: pl.colorRgb,
                // IMPORTANT: Include spotlight data!
                isSpotlight: pl.isSpotlight,
                direction: direction,
                coneAngle: pl.coneAngle,
                innerRadius: pl.innerRadius
            });
        }
        
        this._lightingFilter.updateLights(lights, screenWidth, screenHeight);
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

    // Helper function to convert RGB object to hex string
    function rgbToHex(rgb) {
        const r = Math.round(rgb.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(rgb.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(rgb.b * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    PluginManager.registerCommand(pluginName, 'FadeEventLightColor', args => {
        const event = $gameMap.event(Number(args.eventId));
        if (!event || !event._lightData) return;
        
        const startColor = window.DynamicLighting.hexToRgb(event._lightData.color);
        const endColor = window.DynamicLighting.hexToRgb(String(args.targetColor));
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
                event._lightData.colorRgb = value;  // Update cached RGB
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
            const startColor = window.DynamicLighting.hexToRgb(event._lightData.color);
            const endColor = window.DynamicLighting.hexToRgb(targetColor);
            
            transitionManager.add({
                target: event._lightData,
                property: 'color',
                startValue: startColor,
                endValue: endColor,
                duration: duration,
                easing: 'easeInOut',
                onUpdate: (value) => {
                    event._lightData.color = rgbToHex(value);
                    event._lightData.colorRgb = value;  // Update cached RGB
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
        // Clear all active transitions when leaving the map
        transitionManager.clear();
        _Scene_Map_terminate.call(this);
    };

    //==========================================================================
    // Export
    //==========================================================================

    window.DynamicLighting.Effects = {
        LightEffects: LightEffects,
        TransitionManager: transitionManager
    };

})();
