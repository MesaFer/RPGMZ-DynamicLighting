/*:
 * @target MZ
 * @plugindesc Dynamic Time & Day/Night Cycle System v1.0 - Works with DynamicLighting sun system
 * @author MesaFer
 * @orderAfter DynamicLighting
 *
 * @param TimeSpeed
 * @text Time Speed
 * @type number
 * @min 0
 * @max 3600
 * @default 60
 * @desc Game seconds per real second (60 = 1 game minute per real second)
 *
 * @param StartHour
 * @text Starting Hour
 * @type number
 * @min 0
 * @max 23
 * @default 12
 * @desc Starting hour when new game begins (0-23)
 *
 * @param StartMinute
 * @text Starting Minute
 * @type number
 * @min 0
 * @max 59
 * @default 0
 * @desc Starting minute when new game begins (0-59)
 *
 * @param DawnStart
 * @text Dawn Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 5
 * @desc Hour when dawn begins (0-23)
 *
 * @param DayStart
 * @text Day Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 7
 * @desc Hour when full day begins (0-23)
 *
 * @param DuskStart
 * @text Dusk Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 18
 * @desc Hour when dusk begins (0-23)
 *
 * @param NightStart
 * @text Night Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 20
 * @desc Hour when full night begins (0-23)
 *
 * @param DawnAmbientColor
 * @text Dawn Ambient Color
 * @type text
 * @default #4a3a5c
 * @desc Ambient light color during dawn
 *
 * @param DayAmbientColor
 * @text Day Ambient Color
 * @type text
 * @default #8090a0
 * @desc Ambient light color during day
 *
 * @param DuskAmbientColor
 * @text Dusk Ambient Color
 * @type text
 * @default #5c3a3a
 * @desc Ambient light color during dusk
 *
 * @param NightAmbientColor
 * @text Night Ambient Color
 * @type text
 * @default #1a1a2e
 * @desc Ambient light color during night
 *
 * @param DawnAmbientIntensity
 * @text Dawn Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.35
 * @desc Ambient light intensity during dawn
 *
 * @param DayAmbientIntensity
 * @text Day Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.6
 * @desc Ambient light intensity during day
 *
 * @param DuskAmbientIntensity
 * @text Dusk Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.35
 * @desc Ambient light intensity during dusk
 *
 * @param NightAmbientIntensity
 * @text Night Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.03
 * @desc Ambient light intensity during night (lower = darker). 0.03 = very dark, 0.08 = dim, 0.15 = moonlit
 *
 * @param DawnSunColor
 * @text Dawn Sun Color
 * @type text
 * @default #ff9966
 * @desc Sun light color during dawn (orange-pink)
 *
 * @param DaySunColor
 * @text Day Sun Color
 * @type text
 * @default #fffae0
 * @desc Sun light color during day (warm white)
 *
 * @param DuskSunColor
 * @text Dusk Sun Color
 * @type text
 * @default #ff6633
 * @desc Sun light color during dusk (deep orange)
 *
 * @param NightSunColor
 * @text Night Sun Color (Moon)
 * @type text
 * @default #6688cc
 * @desc Moon light color during night (cool blue)
 *
 * @param DawnSunIntensity
 * @text Dawn Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.4
 * @desc Sun light intensity during dawn
 *
 * @param DaySunIntensity
 * @text Day Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.9
 * @desc Sun light intensity during day
 *
 * @param DuskSunIntensity
 * @text Dusk Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.5
 * @desc Sun light intensity during dusk
 *
 * @param NightSunIntensity
 * @text Night Sun Intensity (Moon)
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.0
 * @desc Moon light intensity during night (0 = no sun shadows at night)
 *
 * @param SunRotation
 * @text Sun Rotation
 * @type boolean
 * @default true
 * @desc If true, sun direction rotates throughout the day (east to west)
 *
 * @param SunriseDirection
 * @text Sunrise Direction
 * @type number
 * @min 0
 * @max 360
 * @default 315
 * @desc Sun direction at sunrise in degrees (315 = from top-right/east)
 *
 * @param SunsetDirection
 * @text Sunset Direction
 * @type number
 * @min 0
 * @max 360
 * @default 225
 * @desc Sun direction at sunset in degrees (225 = from top-left/west)
 *
 * @param ShowTimeWindow
 * @text Show Time Window
 * @type boolean
 * @default true
 * @desc Show a small window displaying current time
 *
 * @param TimeWindowX
 * @text Time Window X
 * @type number
 * @default 10
 * @desc X position of time window
 *
 * @param TimeWindowY
 * @text Time Window Y
 * @type number
 * @default 10
 * @desc Y position of time window
 *
 * @help
 * ============================================================================
 * Dynamic Time & Day/Night Cycle System v1.0
 * ============================================================================
 *
 * This plugin adds a time system with dynamic day/night cycle that integrates
 * with the DynamicLighting plugin's sun light system.
 *
 * IMPORTANT: This plugin ONLY works when the sun is enabled on the map!
 * Use <sun:direction,intensity,color> in map notes to enable sun.
 *
 * Features:
 *   - Real-time game clock (configurable speed)
 *   - Four time phases: Dawn, Day, Dusk, Night
 *   - Smooth transitions between phases
 *   - Dynamic sun/moon color and intensity
 *   - Dynamic ambient light color and intensity
 *   - Sun position rotation (east to west)
 *   - Optional time display window
 *   - Save/load time state
 *   - Plugin commands for time control
 *
 * Time Phases:
 *   - Night: Dark, moonlit atmosphere
 *   - Dawn: Sunrise, warming colors
 *   - Day: Full daylight
 *   - Dusk: Sunset, cooling colors
 *
 * Map Note Tags:
 *   <sun:135>           - Enable sun (required for day/night cycle!)
 *   <sun:135,0.8>       - Sun with custom intensity
 *   <sun:off>           - Disable sun (no day/night cycle)
 *   <timelock:12>       - Lock time to specific hour on this map
 *   <timelock:12:30>    - Lock time to specific hour:minute
 *   <timespeed:120>     - Override time speed for this map
 *
 * Script Calls:
 *   $gameTime.hour()           - Get current hour (0-23)
 *   $gameTime.minute()         - Get current minute (0-59)
 *   $gameTime.totalMinutes()   - Get total minutes since midnight
 *   $gameTime.day()            - Get current day number
 *   $gameTime.phase()          - Get current phase ('night','dawn','day','dusk')
 *   $gameTime.isDay()          - Returns true if day phase
 *   $gameTime.isNight()        - Returns true if night phase
 *   $gameTime.setTime(h, m)    - Set time to specific hour:minute
 *   $gameTime.addMinutes(n)    - Add n minutes to current time
 *   $gameTime.setSpeed(n)      - Set time speed
 *   $gameTime.pause()          - Pause time
 *   $gameTime.resume()         - Resume time
 *
 * ============================================================================
 *
 * @command SetTime
 * @text Set Time
 * @desc Sets the current game time
 *
 * @arg hour
 * @text Hour
 * @type number
 * @min 0
 * @max 23
 * @default 12
 * @desc Hour to set (0-23)
 *
 * @arg minute
 * @text Minute
 * @type number
 * @min 0
 * @max 59
 * @default 0
 * @desc Minute to set (0-59)
 *
 * @command AddTime
 * @text Add Time
 * @desc Adds time to the current game time
 *
 * @arg hours
 * @text Hours
 * @type number
 * @min 0
 * @default 0
 * @desc Hours to add
 *
 * @arg minutes
 * @text Minutes
 * @type number
 * @min 0
 * @default 0
 * @desc Minutes to add
 *
 * @command SetTimeSpeed
 * @text Set Time Speed
 * @desc Sets the time progression speed
 *
 * @arg speed
 * @text Speed
 * @type number
 * @min 0
 * @max 3600
 * @default 60
 * @desc Game seconds per real second (0 = paused)
 *
 * @command PauseTime
 * @text Pause Time
 * @desc Pauses time progression
 *
 * @command ResumeTime
 * @text Resume Time
 * @desc Resumes time progression
 *
 * @command ShowTimeWindow
 * @text Show Time Window
 * @desc Shows the time display window
 *
 * @command HideTimeWindow
 * @text Hide Time Window
 * @desc Hides the time display window
 *
 * @command SetPhase
 * @text Set Phase
 * @desc Instantly sets the time to a specific phase
 *
 * @arg phase
 * @text Phase
 * @type select
 * @option Dawn
 * @value dawn
 * @option Day
 * @value day
 * @option Dusk
 * @value dusk
 * @option Night
 * @value night
 * @default day
 * @desc Phase to set
 */

(() => {
    'use strict';

    const pluginName = 'DynamicLighting_Time';
    const parameters = PluginManager.parameters(pluginName);

    // Time configuration
    const TIME_CONFIG = {
        speed: Number(parameters['TimeSpeed'] || 60),
        startHour: Number(parameters['StartHour'] || 12),
        startMinute: Number(parameters['StartMinute'] || 0),
        
        // Phase hours
        dawnStart: Number(parameters['DawnStart'] || 5),
        dayStart: Number(parameters['DayStart'] || 7),
        duskStart: Number(parameters['DuskStart'] || 18),
        nightStart: Number(parameters['NightStart'] || 20),
        
        // Ambient colors per phase
        dawnAmbientColor: String(parameters['DawnAmbientColor'] || '#4a3a5c'),
        dayAmbientColor: String(parameters['DayAmbientColor'] || '#8090a0'),
        duskAmbientColor: String(parameters['DuskAmbientColor'] || '#5c3a3a'),
        nightAmbientColor: String(parameters['NightAmbientColor'] || '#1a1a2e'),
        
        // Ambient intensities per phase
        dawnAmbientIntensity: Number(parameters['DawnAmbientIntensity'] || 0.35),
        dayAmbientIntensity: Number(parameters['DayAmbientIntensity'] || 0.6),
        duskAmbientIntensity: Number(parameters['DuskAmbientIntensity'] || 0.35),
        nightAmbientIntensity: Number(parameters['NightAmbientIntensity'] || 0.08),
        
        // Sun colors per phase
        dawnSunColor: String(parameters['DawnSunColor'] || '#ff9966'),
        daySunColor: String(parameters['DaySunColor'] || '#fffae0'),
        duskSunColor: String(parameters['DuskSunColor'] || '#ff6633'),
        nightSunColor: String(parameters['NightSunColor'] || '#6688cc'),
        
        // Sun intensities per phase
        dawnSunIntensity: Number(parameters['DawnSunIntensity'] || 0.4),
        daySunIntensity: Number(parameters['DaySunIntensity'] || 0.9),
        duskSunIntensity: Number(parameters['DuskSunIntensity'] || 0.5),
        nightSunIntensity: Number(parameters['NightSunIntensity'] || 0.0),
        
        // Sun rotation
        sunRotation: parameters['SunRotation'] === 'true',
        sunriseDirection: Number(parameters['SunriseDirection'] || 315),
        sunsetDirection: Number(parameters['SunsetDirection'] || 225),
        
        // Time window
        showTimeWindow: parameters['ShowTimeWindow'] === 'true',
        timeWindowX: Number(parameters['TimeWindowX'] || 10),
        timeWindowY: Number(parameters['TimeWindowY'] || 10)
    };

    const DEBUG = true;
    
    function debugLog(...args) {
        if (DEBUG) console.log('[DynamicLighting_Time]', ...args);
    }

    /**
     * Convert hex color to RGB object (0-255 range)
     */
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    /**
     * Convert hex color to normalized RGB object (0-1 range for shaders)
     */
    function hexToRgbNormalized(hex) {
        const rgb = hexToRgb(hex);
        return {
            r: rgb.r / 255,
            g: rgb.g / 255,
            b: rgb.b / 255
        };
    }

    /**
     * Convert RGB object to hex string
     */
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    /**
     * Interpolate between two colors
     */
    function lerpColor(color1, color2, t) {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        return rgbToHex(
            rgb1.r + (rgb2.r - rgb1.r) * t,
            rgb1.g + (rgb2.g - rgb1.g) * t,
            rgb1.b + (rgb2.b - rgb1.b) * t
        );
    }

    /**
     * Linear interpolation
     */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Smooth step interpolation (ease in-out)
     */
    function smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    //==========================================================================
    // Game_Time - Core time system
    //==========================================================================

    class Game_Time {
        constructor() {
            this.initialize();
        }

        initialize() {
            this._totalSeconds = (TIME_CONFIG.startHour * 3600) + (TIME_CONFIG.startMinute * 60);
            this._day = 1;
            this._speed = TIME_CONFIG.speed;
            this._paused = false;
            this._lastUpdate = 0;
            this._showWindow = TIME_CONFIG.showTimeWindow;
            this._mapTimeLock = null;
            this._mapSpeedOverride = null;
            
            // Cached lighting values (updated based on frame throttling)
            this._cachedMinute = -1;
            this._cachedAmbientColor = null;
            this._cachedAmbientIntensity = null;
            this._cachedSunColor = null;
            this._cachedSunColorRgb = null;
            this._cachedSunIntensity = null;
            this._cachedSunDirection = null;
            this._cacheValid = false;
            
            // Frame counter for tracking
            this._frameCounter = 0;
            this._lastLightingUpdateFrame = 0;
            this._lightingUpdateInterval = 1; // Update lighting every frame for smooth transitions
        }

        /**
         * Increment frame counter (call once per frame from Scene_Map)
         */
        incrementFrame() {
            this._frameCounter++;
        }

        /**
         * Check if lighting should be updated this frame (throttled)
         */
        shouldUpdateLighting() {
            if (this._frameCounter - this._lastLightingUpdateFrame >= this._lightingUpdateInterval) {
                this._lastLightingUpdateFrame = this._frameCounter;
                return true;
            }
            return false;
        }

        /**
         * Update cached lighting values (throttled by frame counter)
         */
        _updateCache() {
            // Only recalculate if cache is invalid
            if (!this._cacheValid) {
                this._cachedMinute = this.totalMinutes();
                this._cachedAmbientColor = this._calculateAmbientColor();
                this._cachedAmbientIntensity = this._calculateAmbientIntensity();
                this._cachedSunColor = this._calculateSunColor();
                this._cachedSunColorRgb = hexToRgbNormalized(this._cachedSunColor);
                this._cachedSunIntensity = this._calculateSunIntensity();
                this._cachedSunDirection = this._calculateSunDirection();
                this._cacheValid = true;
            }
        }

        /**
         * Force cache update (called from Scene_Map on throttled frames)
         */
        forceUpdateCache() {
            this._cachedMinute = this.totalMinutes();
            this._cachedAmbientColor = this._calculateAmbientColor();
            this._cachedAmbientIntensity = this._calculateAmbientIntensity();
            this._cachedSunColor = this._calculateSunColor();
            this._cachedSunColorRgb = hexToRgbNormalized(this._cachedSunColor);
            this._cachedSunIntensity = this._calculateSunIntensity();
            this._cachedSunDirection = this._calculateSunDirection();
            this._cacheValid = true;
        }

        /**
         * Get cached sun color RGB (pre-converted)
         */
        getSunColorRgb() {
            this._updateCache();
            return this._cachedSunColorRgb;
        }

        /**
         * Invalidate cache (call when time is manually changed)
         */
        _invalidateCache() {
            this._cacheValid = false;
        }

        /**
         * Update time progression
         */
        update() {
            if (this._paused || this._mapTimeLock !== null) return;
            
            const currentTime = performance.now();
            if (this._lastUpdate === 0) {
                this._lastUpdate = currentTime;
                return;
            }
            
            const deltaMs = currentTime - this._lastUpdate;
            this._lastUpdate = currentTime;
            
            // Calculate time to add based on speed
            const speed = this._mapSpeedOverride !== null ? this._mapSpeedOverride : this._speed;
            const secondsToAdd = (deltaMs / 1000) * speed;
            
            this._totalSeconds += secondsToAdd;
            
            // Handle day rollover
            while (this._totalSeconds >= 86400) {
                this._totalSeconds -= 86400;
                this._day++;
            }
        }

        /**
         * Get current hour (0-23)
         */
        hour() {
            if (this._mapTimeLock !== null) {
                return Math.floor(this._mapTimeLock / 60);
            }
            return Math.floor(this._totalSeconds / 3600) % 24;
        }

        /**
         * Get current minute (0-59)
         */
        minute() {
            if (this._mapTimeLock !== null) {
                return this._mapTimeLock % 60;
            }
            return Math.floor(this._totalSeconds / 60) % 60;
        }

        /**
         * Get total minutes since midnight
         */
        totalMinutes() {
            if (this._mapTimeLock !== null) {
                return this._mapTimeLock;
            }
            return Math.floor(this._totalSeconds / 60);
        }

        /**
         * Get current day number
         */
        day() {
            return this._day;
        }

        /**
         * Get current time phase
         */
        phase() {
            const hour = this.hour();
            if (hour >= TIME_CONFIG.nightStart || hour < TIME_CONFIG.dawnStart) {
                return 'night';
            } else if (hour >= TIME_CONFIG.duskStart) {
                return 'dusk';
            } else if (hour >= TIME_CONFIG.dayStart) {
                return 'day';
            } else {
                return 'dawn';
            }
        }

        /**
         * Check if it's daytime
         */
        isDay() {
            return this.phase() === 'day';
        }

        /**
         * Check if it's nighttime
         */
        isNight() {
            return this.phase() === 'night';
        }

        /**
         * Get progress within current phase (0-1)
         */
        phaseProgress() {
            const hour = this.hour();
            const minute = this.minute();
            const currentMinutes = hour * 60 + minute;
            
            const dawnStartMin = TIME_CONFIG.dawnStart * 60;
            const dayStartMin = TIME_CONFIG.dayStart * 60;
            const duskStartMin = TIME_CONFIG.duskStart * 60;
            const nightStartMin = TIME_CONFIG.nightStart * 60;
            
            const phase = this.phase();
            
            if (phase === 'dawn') {
                const duration = dayStartMin - dawnStartMin;
                return (currentMinutes - dawnStartMin) / duration;
            } else if (phase === 'day') {
                const duration = duskStartMin - dayStartMin;
                return (currentMinutes - dayStartMin) / duration;
            } else if (phase === 'dusk') {
                const duration = nightStartMin - duskStartMin;
                return (currentMinutes - duskStartMin) / duration;
            } else { // night
                // Night wraps around midnight
                let nightDuration;
                let progress;
                if (hour >= TIME_CONFIG.nightStart) {
                    // Before midnight
                    nightDuration = (24 * 60 - nightStartMin) + dawnStartMin;
                    progress = currentMinutes - nightStartMin;
                } else {
                    // After midnight
                    nightDuration = (24 * 60 - nightStartMin) + dawnStartMin;
                    progress = (24 * 60 - nightStartMin) + currentMinutes;
                }
                return progress / nightDuration;
            }
        }

        /**
         * Get cached ambient color (updates once per minute)
         */
        getAmbientColor() {
            this._updateCache();
            return this._cachedAmbientColor;
        }

        /**
         * Get cached ambient intensity (updates once per minute)
         */
        getAmbientIntensity() {
            this._updateCache();
            return this._cachedAmbientIntensity;
        }

        /**
         * Get cached sun color (updates once per minute)
         */
        getSunColor() {
            this._updateCache();
            return this._cachedSunColor;
        }

        /**
         * Get cached sun intensity (updates once per minute)
         */
        getSunIntensity() {
            this._updateCache();
            return this._cachedSunIntensity;
        }

        /**
         * Get cached sun direction (updates once per minute)
         */
        getSunDirection() {
            this._updateCache();
            return this._cachedSunDirection;
        }

        /**
         * Calculate interpolated ambient color for current time (internal)
         *
         * Ambient color sets the overall scene tint:
         * - Dawn: Warm sunrise colors
         * - Day: Neutral daylight
         * - Dusk: Warm sunset colors transitioning to night by END of dusk
         * - Night: Cool dark blue
         */
        _calculateAmbientColor() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                // Transition from night to dawn colors
                return lerpColor(TIME_CONFIG.nightAmbientColor, TIME_CONFIG.dawnAmbientColor, progress);
            } else if (phase === 'day') {
                // Quick transition from dawn to day colors
                if (progress < 0.2) {
                    return lerpColor(TIME_CONFIG.dawnAmbientColor, TIME_CONFIG.dayAmbientColor, progress / 0.2);
                }
                return TIME_CONFIG.dayAmbientColor;
            } else if (phase === 'dusk') {
                // Transition from day to night colors by END of dusk
                // First half: day -> dusk colors
                // Second half: dusk -> night colors
                if (progress < 0.5) {
                    return lerpColor(TIME_CONFIG.dayAmbientColor, TIME_CONFIG.duskAmbientColor, progress * 2);
                } else {
                    return lerpColor(TIME_CONFIG.duskAmbientColor, TIME_CONFIG.nightAmbientColor, (progress - 0.5) * 2);
                }
            } else {
                // Night: constant night color
                return TIME_CONFIG.nightAmbientColor;
            }
        }

        /**
         * Calculate interpolated ambient intensity for current time (internal)
         *
         * Ambient intensity controls overall scene brightness:
         * - Dawn: Sky brightens, intensity increases
         * - Day: Full daylight
         * - Dusk: Sky darkens, intensity decreases to night level by END of dusk
         * - Night: Dark, intensity stays at nightAmbientIntensity
         */
        _calculateAmbientIntensity() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                // Sky brightens during dawn
                return lerp(TIME_CONFIG.nightAmbientIntensity, TIME_CONFIG.dawnAmbientIntensity, progress);
            } else if (phase === 'day') {
                // Quick transition to full daylight
                if (progress < 0.2) {
                    return lerp(TIME_CONFIG.dawnAmbientIntensity, TIME_CONFIG.dayAmbientIntensity, progress / 0.2);
                }
                return TIME_CONFIG.dayAmbientIntensity;
            } else if (phase === 'dusk') {
                // Sky darkens during dusk, reaching night darkness by END of dusk
                return lerp(TIME_CONFIG.dayAmbientIntensity, TIME_CONFIG.nightAmbientIntensity, progress);
            } else {
                // Night: dark, intensity stays constant
                return TIME_CONFIG.nightAmbientIntensity;
            }
        }

        /**
         * Calculate interpolated sun color for current time (internal)
         *
         * Sun color affects the tint of sunlight and shadows:
         * - Dawn: Orange/pink sunrise
         * - Day: Warm white
         * - Dusk: Deep orange sunset, transitioning to moon color by END of dusk
         * - Night: Cool blue moonlight (though intensity is 0, so not visible)
         */
        _calculateSunColor() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                // Sunrise colors
                return lerpColor(TIME_CONFIG.nightSunColor, TIME_CONFIG.dawnSunColor, progress);
            } else if (phase === 'day') {
                // Quick transition to full daylight color
                if (progress < 0.2) {
                    return lerpColor(TIME_CONFIG.dawnSunColor, TIME_CONFIG.daySunColor, progress / 0.2);
                }
                return TIME_CONFIG.daySunColor;
            } else if (phase === 'dusk') {
                // Sunset colors, transitioning to night by END of dusk
                if (progress < 0.5) {
                    return lerpColor(TIME_CONFIG.daySunColor, TIME_CONFIG.duskSunColor, progress * 2);
                } else {
                    return lerpColor(TIME_CONFIG.duskSunColor, TIME_CONFIG.nightSunColor, (progress - 0.5) * 2);
                }
            } else {
                // Night: moon color (though not visible since intensity is 0)
                return TIME_CONFIG.nightSunColor;
            }
        }

        /**
         * Calculate interpolated sun intensity for current time (internal)
         *
         * Sun intensity controls shadow visibility:
         * - Dawn: Sun rises, intensity increases from 0 to dawnSunIntensity
         * - Day: Full sun, intensity at daySunIntensity
         * - Dusk: Sun sets, intensity decreases from daySunIntensity to 0 (NOT duskSunIntensity!)
         * - Night: No sun, intensity stays at 0 (nightSunIntensity)
         *
         * The sun should be completely below the horizon by the END of dusk (nightStart),
         * so shadows disappear by that time.
         */
        _calculateSunIntensity() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                // Sun rises during dawn: 0 -> dawnSunIntensity
                return lerp(TIME_CONFIG.nightSunIntensity, TIME_CONFIG.dawnSunIntensity, progress);
            } else if (phase === 'day') {
                // Sun at full strength during day
                if (progress < 0.2) {
                    // Quick transition from dawn to full day
                    return lerp(TIME_CONFIG.dawnSunIntensity, TIME_CONFIG.daySunIntensity, progress / 0.2);
                }
                return TIME_CONFIG.daySunIntensity;
            } else if (phase === 'dusk') {
                // Sun sets during dusk: daySunIntensity -> 0
                // By the END of dusk (nightStart), sun should be completely gone
                return lerp(TIME_CONFIG.daySunIntensity, TIME_CONFIG.nightSunIntensity, progress);
            } else {
                // Night: no sun, intensity stays at 0
                return TIME_CONFIG.nightSunIntensity;
            }
        }

        /**
         * Calculate sun direction based on time of day (internal)
         *
         * UNIFORM ROTATION SPEED:
         * The sun/moon rotates at a constant speed throughout the entire 24-hour cycle.
         * This means 360° / 24 hours = 15° per hour = 0.25° per minute.
         *
         * The rotation is continuous and smooth, with no speed changes between day and night.
         * At dawn (e.g., 5:00), the sun is at sunriseDirection (e.g., 315°).
         * The sun rotates counterclockwise throughout the day and night.
         */
        _calculateSunDirection() {
            if (!TIME_CONFIG.sunRotation) {
                return null;
            }
            
            const hour = this.hour();
            const minute = this.minute();
            const currentMinutes = hour * 60 + minute;
            
            // Dawn time in minutes (when sun is at sunrise direction)
            const dawnMin = TIME_CONFIG.dawnStart * 60;
            
            // Sunrise direction (where sun is at dawn, e.g., 315° = top-right/east)
            const sunriseDir = TIME_CONFIG.sunriseDirection;
            // Sunset direction (where sun is at dusk, e.g., 225° = top-left/west)
            const sunsetDir = TIME_CONFIG.sunsetDirection;
            
            // Calculate the rotation direction (counterclockwise or clockwise)
            // From sunrise to sunset: 315° -> 225° = -90° (counterclockwise)
            // We want to continue in the same direction for the full 360°
            const dayRotation = sunsetDir - sunriseDir; // e.g., 225 - 315 = -90°
            
            // Determine rotation direction: if dayRotation is negative, we're going counterclockwise
            // The full rotation should be 360° in the same direction
            const rotationDirection = dayRotation < 0 ? -1 : 1;
            
            // Calculate minutes since dawn (wrapping around midnight)
            let minutesSinceDawn;
            if (currentMinutes >= dawnMin) {
                minutesSinceDawn = currentMinutes - dawnMin;
            } else {
                // After midnight but before dawn
                minutesSinceDawn = (24 * 60 - dawnMin) + currentMinutes;
            }
            
            // Calculate progress through the full 24-hour cycle (0 to 1)
            const dayProgress = minutesSinceDawn / (24 * 60);
            
            // Calculate the current direction
            // Start at sunriseDir and rotate 360° over 24 hours
            const currentDir = sunriseDir + (rotationDirection * 360 * dayProgress);
            
            // Normalize to 0-360 range
            return ((currentDir % 360) + 360) % 360;
        }

        /**
         * Set time to specific hour and minute
         */
        setTime(hour, minute = 0) {
            this._totalSeconds = (hour * 3600) + (minute * 60);
            this._invalidateCache();
            debugLog('Time set to', hour + ':' + minute.toString().padStart(2, '0'));
        }

        /**
         * Add minutes to current time
         */
        addMinutes(minutes) {
            this._totalSeconds += minutes * 60;
            while (this._totalSeconds >= 86400) {
                this._totalSeconds -= 86400;
                this._day++;
            }
            while (this._totalSeconds < 0) {
                this._totalSeconds += 86400;
                this._day = Math.max(1, this._day - 1);
            }
            this._invalidateCache();
        }

        /**
         * Add hours to current time
         */
        addHours(hours) {
            this.addMinutes(hours * 60);
        }

        /**
         * Set time speed
         */
        setSpeed(speed) {
            this._speed = speed;
        }

        /**
         * Pause time
         */
        pause() {
            this._paused = true;
        }

        /**
         * Resume time
         */
        resume() {
            this._paused = false;
            this._lastUpdate = performance.now();
        }

        /**
         * Check if time is paused
         */
        isPaused() {
            return this._paused;
        }

        /**
         * Set time lock for current map
         */
        setMapTimeLock(totalMinutes) {
            this._mapTimeLock = totalMinutes;
        }

        /**
         * Clear time lock
         */
        clearMapTimeLock() {
            this._mapTimeLock = null;
        }

        /**
         * Set speed override for current map
         */
        setMapSpeedOverride(speed) {
            this._mapSpeedOverride = speed;
        }

        /**
         * Clear speed override
         */
        clearMapSpeedOverride() {
            this._mapSpeedOverride = null;
        }

        /**
         * Get formatted time string
         */
        getTimeString() {
            const h = this.hour().toString().padStart(2, '0');
            const m = this.minute().toString().padStart(2, '0');
            return h + ':' + m;
        }

        /**
         * Save time data
         */
        makeSaveContents() {
            return {
                totalSeconds: this._totalSeconds,
                day: this._day,
                speed: this._speed,
                paused: this._paused,
                showWindow: this._showWindow
            };
        }

        /**
         * Load time data
         */
        extractSaveContents(contents) {
            this._totalSeconds = contents.totalSeconds || 0;
            this._day = contents.day || 1;
            this._speed = contents.speed || TIME_CONFIG.speed;
            this._paused = contents.paused || false;
            this._showWindow = contents.showWindow !== undefined ? contents.showWindow : TIME_CONFIG.showTimeWindow;
            this._lastUpdate = performance.now();
        }
    }

    // Global time object
    let $gameTime = null;

    //==========================================================================
    // Window_GameTime - Time display window
    //==========================================================================

    class Window_GameTime extends Window_Base {
        constructor(rect) {
            super(rect);
            this._lastTimeString = '';
            this._lastRefreshFrame = 0;
            this._refreshInterval = 15; // Refresh every 15 frames (4 times/sec at 60fps)
            this._frameCounter = 0;
            this.refresh();
        }

        static create() {
            const width = 120;
            const height = 60;
            const x = TIME_CONFIG.timeWindowX;
            const y = TIME_CONFIG.timeWindowY;
            const rect = new Rectangle(x, y, width, height);
            return new Window_GameTime(rect);
        }

        update() {
            super.update();
            this._frameCounter++;
            
            if ($gameTime) {
                // Throttle refresh rate to prevent lag at high time speeds
                if (this._frameCounter - this._lastRefreshFrame >= this._refreshInterval) {
                    const timeString = $gameTime.getTimeString();
                    if (timeString !== this._lastTimeString) {
                        this._lastTimeString = timeString;
                        this._lastRefreshFrame = this._frameCounter;
                        this.refresh();
                    }
                }
            }
        }

        refresh() {
            this.contents.clear();
            if ($gameTime) {
                const timeString = $gameTime.getTimeString();
                const phase = $gameTime.phase();
                const phaseIcon = this.getPhaseIcon(phase);
                this.drawText(phaseIcon + ' ' + timeString, 0, 0, this.contentsWidth(), 'center');
            }
        }

        getPhaseIcon(phase) {
            switch (phase) {
                case 'dawn': return '🌅';
                case 'day': return '☀️';
                case 'dusk': return '🌇';
                case 'night': return '🌙';
                default: return '';
            }
        }
    }

    //==========================================================================
    // DataManager Extensions - Save/Load
    //==========================================================================

    const _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _DataManager_createGameObjects.call(this);
        $gameTime = new Game_Time();
    };

    const _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        const contents = _DataManager_makeSaveContents.call(this);
        contents.gameTime = $gameTime ? $gameTime.makeSaveContents() : null;
        return contents;
    };

    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        if (!$gameTime) {
            $gameTime = new Game_Time();
        }
        if (contents.gameTime) {
            $gameTime.extractSaveContents(contents.gameTime);
        }
    };

    //==========================================================================
    // Game_Map Extensions - Map note parsing
    //==========================================================================

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this.setupTimeSystem();
    };

    Game_Map.prototype.setupTimeSystem = function() {
        if (!$gameTime) return;
        
        // Clear previous map overrides
        $gameTime.clearMapTimeLock();
        $gameTime.clearMapSpeedOverride();
        
        if ($dataMap && $dataMap.note) {
            // Parse time lock: <timelock:12> or <timelock:12:30>
            const timeLockMatch = $dataMap.note.match(/<timelock[:\s]*(\d+)(?::(\d+))?>/i);
            if (timeLockMatch) {
                const hour = parseInt(timeLockMatch[1]);
                const minute = timeLockMatch[2] ? parseInt(timeLockMatch[2]) : 0;
                $gameTime.setMapTimeLock(hour * 60 + minute);
                debugLog('Map time locked to', hour + ':' + minute.toString().padStart(2, '0'));
            }
            
            // Parse time speed override: <timespeed:120>
            const speedMatch = $dataMap.note.match(/<timespeed[:\s]*(\d+)>/i);
            if (speedMatch) {
                const speed = parseInt(speedMatch[1]);
                $gameTime.setMapSpeedOverride(speed);
                debugLog('Map time speed set to', speed);
            }
        }
    };

    /**
     * Check if sun is enabled on current map
     */
    Game_Map.prototype.isSunEnabled = function() {
        return this._sunLight && this._sunLight.enabled;
    };

    //==========================================================================
    // Scene_Map Extensions - Time system update
    //==========================================================================

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createTimeWindow();
    };

    Scene_Map.prototype.createTimeWindow = function() {
        this._timeWindow = Window_GameTime.create();
        this._timeWindow.visible = $gameTime && $gameTime._showWindow;
        this.addWindow(this._timeWindow);
    };

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        // IMPORTANT: Update time system BEFORE the main update
        // This ensures lighting values are updated before the lighting filter reads them
        this.updateTimeSystem();
        
        _Scene_Map_update.call(this);
        this.updateTimeWindow();
    };

    Scene_Map.prototype.updateTimeSystem = function() {
        if (!$gameTime || !$gameMap) return;
        
        // Increment frame counter
        $gameTime.incrementFrame();
        
        // Update time progression
        $gameTime.update();
        
        // Invalidate cache every frame to ensure smooth transitions
        // (cache is only used within a single frame for multiple reads)
        $gameTime._invalidateCache();
        
        // Only update lighting if sun is enabled on this map
        if (!$gameMap.isSunEnabled()) {
            debugLog('Sun is NOT enabled on this map, skipping time-based lighting update');
            return;
        }
        
        // Force recalculate cached values
        $gameTime.forceUpdateCache();
        
        // Get cached values
        const sunColor = $gameTime.getSunColor();
        const sunColorRgb = $gameTime.getSunColorRgb();
        const sunIntensity = $gameTime.getSunIntensity();
        const sunDirection = $gameTime.getSunDirection();
        const ambientColor = $gameTime.getAmbientColor();
        const ambientIntensity = $gameTime.getAmbientIntensity();
        
        // Debug output every 60 frames (about once per second)
        if ($gameTime._frameCounter % 60 === 0) {
            debugLog('=== Time System Update ===');
            debugLog('Time:', $gameTime.getTimeString(), 'Phase:', $gameTime.phase());
            debugLog('Sun Color (hex):', sunColor);
            debugLog('Sun Color (RGB):', sunColorRgb);
            debugLog('Sun Intensity:', sunIntensity);
            debugLog('Ambient Color:', ambientColor, 'Intensity:', ambientIntensity);
            debugLog('$gameMap._sunLight before update:', JSON.stringify($gameMap._sunLight));
        }
        
        // Update sun in $gameMap
        if ($gameMap._sunLight) {
            $gameMap._sunLight.color = sunColor;
            $gameMap._sunLight.colorRgb = sunColorRgb;
            $gameMap._sunLight.intensity = sunIntensity;
            
            if (sunDirection !== null) {
                $gameMap._sunLight.direction = sunDirection * Math.PI / 180;
            }
            
            // Debug output after update
            if ($gameTime._frameCounter % 60 === 0) {
                debugLog('$gameMap._sunLight after update:', JSON.stringify($gameMap._sunLight));
            }
        }
        
        // Update ambient light based on time
        // IMPORTANT: These values are read by DynamicLighting.updateLightingSystem()
        // which is called after this method in the update cycle
        $gameMap._ambientColor = ambientColor;
        $gameMap._ambientIntensity = ambientIntensity;
        
    };

    Scene_Map.prototype.updateTimeWindow = function() {
        if (this._timeWindow && $gameTime) {
            this._timeWindow.visible = $gameTime._showWindow;
        }
    };

    //==========================================================================
    // Plugin Commands
    //==========================================================================

    PluginManager.registerCommand(pluginName, 'SetTime', args => {
        if ($gameTime) {
            $gameTime.setTime(Number(args.hour), Number(args.minute));
        }
    });

    PluginManager.registerCommand(pluginName, 'AddTime', args => {
        if ($gameTime) {
            const totalMinutes = Number(args.hours) * 60 + Number(args.minutes);
            $gameTime.addMinutes(totalMinutes);
        }
    });

    PluginManager.registerCommand(pluginName, 'SetTimeSpeed', args => {
        if ($gameTime) {
            $gameTime.setSpeed(Number(args.speed));
        }
    });

    PluginManager.registerCommand(pluginName, 'PauseTime', args => {
        if ($gameTime) {
            $gameTime.pause();
        }
    });

    PluginManager.registerCommand(pluginName, 'ResumeTime', args => {
        if ($gameTime) {
            $gameTime.resume();
        }
    });

    PluginManager.registerCommand(pluginName, 'ShowTimeWindow', args => {
        if ($gameTime) {
            $gameTime._showWindow = true;
        }
    });

    PluginManager.registerCommand(pluginName, 'HideTimeWindow', args => {
        if ($gameTime) {
            $gameTime._showWindow = false;
        }
    });

    PluginManager.registerCommand(pluginName, 'SetPhase', args => {
        if ($gameTime) {
            const phase = args.phase;
            let hour;
            switch (phase) {
                case 'dawn':
                    hour = TIME_CONFIG.dawnStart;
                    break;
                case 'day':
                    hour = TIME_CONFIG.dayStart + 2; // Mid-day
                    break;
                case 'dusk':
                    hour = TIME_CONFIG.duskStart;
                    break;
                case 'night':
                    hour = TIME_CONFIG.nightStart + 2; // Mid-night
                    break;
                default:
                    hour = 12;
            }
            $gameTime.setTime(hour, 0);
        }
    });

    //==========================================================================
    // Export
    //==========================================================================

    window.Game_Time = Game_Time;
    window.$gameTime = null;

    // Make $gameTime accessible globally after creation
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        window.$gameTime = $gameTime;
    };

    debugLog('DynamicLighting_Time plugin loaded');
    debugLog('Time phases:',
             'Dawn:', TIME_CONFIG.dawnStart + ':00',
             'Day:', TIME_CONFIG.dayStart + ':00',
             'Dusk:', TIME_CONFIG.duskStart + ':00',
             'Night:', TIME_CONFIG.nightStart + ':00');

})();