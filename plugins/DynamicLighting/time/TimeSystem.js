/**
 * DynamicLighting - Time System Module
 * Handles game time, day/night cycle, and time-based lighting updates
 * @module DynamicLighting/time/TimeSystem
 */

(function() {
    'use strict';

    // Get reference to core modules
    const DL = window.DynamicLighting;
    if (!DL) {
        console.error('[DynamicLighting_Time] Base plugin not loaded!');
        return;
    }
    
    const Utils = DL.Utils;
    const Debug = DL.Debug;

    // Get pre-parsed TIME_CONFIG from main plugin (set before this module loads)
    const TIME_CONFIG = DL.TimeConfig;
    if (!TIME_CONFIG) {
        console.error('[DynamicLighting_Time] TimeConfig not found! Ensure DynamicLighting_Time.js loads this module.');
        return;
    }
    
    console.log('[DynamicLighting_Time] TimeSystem using config - speed:', TIME_CONFIG.speed);

    /**
     * Interpolate between two colors
     */
    function lerpColor(color1, color2, t) {
        const rgb1 = Utils.hexToRgb(color1);
        const rgb2 = Utils.hexToRgb(color2);
        const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
        const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
        const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, x)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
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
            
            // Cached lighting values
            this._cachedMinute = -1;
            this._cachedAmbientColor = null;
            this._cachedAmbientIntensity = null;
            this._cachedSunColor = null;
            this._cachedSunColorRgb = null;
            this._cachedSunIntensity = null;
            this._cachedSunDirection = null;
            this._cacheValid = false;
            
            // Frame counter
            this._frameCounter = 0;
            this._lastLightingUpdateFrame = 0;
            this._lightingUpdateInterval = 1;
        }

        incrementFrame() {
            this._frameCounter++;
        }

        shouldUpdateLighting() {
            if (this._frameCounter - this._lastLightingUpdateFrame >= this._lightingUpdateInterval) {
                this._lastLightingUpdateFrame = this._frameCounter;
                return true;
            }
            return false;
        }

        _updateCache() {
            if (!this._cacheValid) {
                this._cachedMinute = this.totalMinutes();
                this._cachedAmbientColor = this._calculateAmbientColor();
                this._cachedAmbientIntensity = this._calculateAmbientIntensity();
                this._cachedSunColor = this._calculateSunColor();
                this._cachedSunColorRgb = Utils.hexToRgb(this._cachedSunColor);
                this._cachedSunIntensity = this._calculateSunIntensity();
                this._cachedSunDirection = this._calculateSunDirection();
                this._cacheValid = true;
            }
        }

        forceUpdateCache() {
            this._cachedMinute = this.totalMinutes();
            this._cachedAmbientColor = this._calculateAmbientColor();
            this._cachedAmbientIntensity = this._calculateAmbientIntensity();
            this._cachedSunColor = this._calculateSunColor();
            this._cachedSunColorRgb = Utils.hexToRgb(this._cachedSunColor);
            this._cachedSunIntensity = this._calculateSunIntensity();
            this._cachedSunDirection = this._calculateSunDirection();
            this._cacheValid = true;
        }

        getSunColorRgb() {
            this._updateCache();
            return this._cachedSunColorRgb;
        }

        _invalidateCache() {
            this._cacheValid = false;
        }

        update() {
            if (this._paused || this._mapTimeLock !== null) return;
            
            const currentTime = performance.now();
            if (this._lastUpdate === 0) {
                this._lastUpdate = currentTime;
                return;
            }
            
            const deltaMs = currentTime - this._lastUpdate;
            this._lastUpdate = currentTime;
            
            const speed = this._mapSpeedOverride !== null ? this._mapSpeedOverride : this._speed;
            const secondsToAdd = (deltaMs / 1000) * speed;
            
            this._totalSeconds += secondsToAdd;
            
            while (this._totalSeconds >= 86400) {
                this._totalSeconds -= 86400;
                this._day++;
            }
        }

        hour() {
            if (this._mapTimeLock !== null) {
                return Math.floor(this._mapTimeLock / 60);
            }
            return Math.floor(this._totalSeconds / 3600) % 24;
        }

        minute() {
            if (this._mapTimeLock !== null) {
                return this._mapTimeLock % 60;
            }
            return Math.floor(this._totalSeconds / 60) % 60;
        }

        totalMinutes() {
            if (this._mapTimeLock !== null) {
                return this._mapTimeLock;
            }
            return Math.floor(this._totalSeconds / 60);
        }

        day() {
            return this._day;
        }

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

        isDay() {
            return this.phase() === 'day';
        }

        isNight() {
            return this.phase() === 'night';
        }

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
            } else {
                let nightDuration;
                let progress;
                if (hour >= TIME_CONFIG.nightStart) {
                    nightDuration = (24 * 60 - nightStartMin) + dawnStartMin;
                    progress = currentMinutes - nightStartMin;
                } else {
                    nightDuration = (24 * 60 - nightStartMin) + dawnStartMin;
                    progress = (24 * 60 - nightStartMin) + currentMinutes;
                }
                return progress / nightDuration;
            }
        }

        getAmbientColor() {
            this._updateCache();
            return this._cachedAmbientColor;
        }

        getAmbientIntensity() {
            this._updateCache();
            return this._cachedAmbientIntensity;
        }

        getSunColor() {
            this._updateCache();
            return this._cachedSunColor;
        }

        getSunIntensity() {
            this._updateCache();
            return this._cachedSunIntensity;
        }

        getSunDirection() {
            this._updateCache();
            return this._cachedSunDirection;
        }

        _calculateAmbientColor() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                return lerpColor(TIME_CONFIG.nightAmbientColor, TIME_CONFIG.dawnAmbientColor, progress);
            } else if (phase === 'day') {
                if (progress < 0.2) {
                    return lerpColor(TIME_CONFIG.dawnAmbientColor, TIME_CONFIG.dayAmbientColor, progress / 0.2);
                }
                return TIME_CONFIG.dayAmbientColor;
            } else if (phase === 'dusk') {
                if (progress < 0.5) {
                    return lerpColor(TIME_CONFIG.dayAmbientColor, TIME_CONFIG.duskAmbientColor, progress * 2);
                } else {
                    return lerpColor(TIME_CONFIG.duskAmbientColor, TIME_CONFIG.nightAmbientColor, (progress - 0.5) * 2);
                }
            } else {
                return TIME_CONFIG.nightAmbientColor;
            }
        }

        _calculateAmbientIntensity() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                return lerp(TIME_CONFIG.nightAmbientIntensity, TIME_CONFIG.dawnAmbientIntensity, progress);
            } else if (phase === 'day') {
                if (progress < 0.2) {
                    return lerp(TIME_CONFIG.dawnAmbientIntensity, TIME_CONFIG.dayAmbientIntensity, progress / 0.2);
                }
                return TIME_CONFIG.dayAmbientIntensity;
            } else if (phase === 'dusk') {
                return lerp(TIME_CONFIG.dayAmbientIntensity, TIME_CONFIG.nightAmbientIntensity, progress);
            } else {
                return TIME_CONFIG.nightAmbientIntensity;
            }
        }

        _calculateSunColor() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                return lerpColor(TIME_CONFIG.nightSunColor, TIME_CONFIG.dawnSunColor, progress);
            } else if (phase === 'day') {
                if (progress < 0.2) {
                    return lerpColor(TIME_CONFIG.dawnSunColor, TIME_CONFIG.daySunColor, progress / 0.2);
                }
                return TIME_CONFIG.daySunColor;
            } else if (phase === 'dusk') {
                if (progress < 0.5) {
                    return lerpColor(TIME_CONFIG.daySunColor, TIME_CONFIG.duskSunColor, progress * 2);
                } else {
                    return lerpColor(TIME_CONFIG.duskSunColor, TIME_CONFIG.nightSunColor, (progress - 0.5) * 2);
                }
            } else {
                return TIME_CONFIG.nightSunColor;
            }
        }

        _calculateSunIntensity() {
            const phase = this.phase();
            const progress = smoothstep(this.phaseProgress());
            
            if (phase === 'dawn') {
                return lerp(TIME_CONFIG.nightSunIntensity, TIME_CONFIG.dawnSunIntensity, progress);
            } else if (phase === 'day') {
                if (progress < 0.2) {
                    return lerp(TIME_CONFIG.dawnSunIntensity, TIME_CONFIG.daySunIntensity, progress / 0.2);
                }
                return TIME_CONFIG.daySunIntensity;
            } else if (phase === 'dusk') {
                return lerp(TIME_CONFIG.daySunIntensity, TIME_CONFIG.nightSunIntensity, progress);
            } else {
                return TIME_CONFIG.nightSunIntensity;
            }
        }

        _calculateSunDirection() {
            if (!TIME_CONFIG.sunRotation) {
                return null;
            }
            
            const hour = this.hour();
            const minute = this.minute();
            const currentMinutes = hour * 60 + minute;
            
            const dawnMin = TIME_CONFIG.dawnStart * 60;
            const sunriseDir = TIME_CONFIG.sunriseDirection;
            const sunsetDir = TIME_CONFIG.sunsetDirection;
            
            const dayRotation = sunsetDir - sunriseDir;
            const rotationDirection = dayRotation < 0 ? -1 : 1;
            
            let minutesSinceDawn;
            if (currentMinutes >= dawnMin) {
                minutesSinceDawn = currentMinutes - dawnMin;
            } else {
                minutesSinceDawn = (24 * 60 - dawnMin) + currentMinutes;
            }
            
            const dayProgress = minutesSinceDawn / (24 * 60);
            const currentDir = sunriseDir + (rotationDirection * 360 * dayProgress);
            
            return ((currentDir % 360) + 360) % 360;
        }

        setTime(hour, minute = 0) {
            this._totalSeconds = (hour * 3600) + (minute * 60);
            this._invalidateCache();
            Debug.log('Time set to', hour + ':' + minute.toString().padStart(2, '0'));
        }

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

        addHours(hours) {
            this.addMinutes(hours * 60);
        }

        setSpeed(speed) {
            this._speed = speed;
        }

        pause() {
            this._paused = true;
        }

        resume() {
            this._paused = false;
            this._lastUpdate = performance.now();
        }

        isPaused() {
            return this._paused;
        }

        setMapTimeLock(totalMinutes) {
            this._mapTimeLock = totalMinutes;
        }

        clearMapTimeLock() {
            this._mapTimeLock = null;
        }

        setMapSpeedOverride(speed) {
            this._mapSpeedOverride = speed;
        }

        clearMapSpeedOverride() {
            this._mapSpeedOverride = null;
        }

        getTimeString() {
            const h = this.hour().toString().padStart(2, '0');
            const m = this.minute().toString().padStart(2, '0');
            return h + ':' + m;
        }

        makeSaveContents() {
            return {
                totalSeconds: this._totalSeconds,
                day: this._day,
                speed: this._speed,
                paused: this._paused,
                showWindow: this._showWindow
            };
        }

        extractSaveContents(contents) {
            this._totalSeconds = contents.totalSeconds || 0;
            this._day = contents.day || 1;
            this._speed = contents.speed || TIME_CONFIG.speed;
            this._paused = contents.paused || false;
            this._showWindow = contents.showWindow !== undefined ? contents.showWindow : TIME_CONFIG.showTimeWindow;
            this._lastUpdate = performance.now();
        }
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.Time = {
        Game_Time: Game_Time,
        CONFIG: TIME_CONFIG,
        lerpColor: lerpColor,
        lerp: lerp,
        smoothstep: smoothstep
    };

    Debug.log('Time module loaded');

})();
