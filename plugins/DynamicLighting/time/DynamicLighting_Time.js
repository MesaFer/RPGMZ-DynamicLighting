/*:
 * @target MZ
 * @plugindesc Dynamic Time & Day/Night Cycle System v2.0 - Modular
 * @author MesaFer
 * @base DynamicLighting/DynamicLighting
 * @orderAfter DynamicLighting/DynamicLighting
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
 *
 * @param StartMinute
 * @text Starting Minute
 * @type number
 * @min 0
 * @max 59
 * @default 0
 *
 * @param DawnStart
 * @text Dawn Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 5
 *
 * @param DayStart
 * @text Day Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 7
 *
 * @param DuskStart
 * @text Dusk Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 18
 *
 * @param NightStart
 * @text Night Start Hour
 * @type number
 * @min 0
 * @max 23
 * @default 20
 *
 * @param DawnAmbientColor
 * @text Dawn Ambient Color
 * @type text
 * @default #4a3a5c
 *
 * @param DayAmbientColor
 * @text Day Ambient Color
 * @type text
 * @default #8090a0
 *
 * @param DuskAmbientColor
 * @text Dusk Ambient Color
 * @type text
 * @default #5c3a3a
 *
 * @param NightAmbientColor
 * @text Night Ambient Color
 * @type text
 * @default #1a1a2e
 *
 * @param DawnAmbientIntensity
 * @text Dawn Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.35
 *
 * @param DayAmbientIntensity
 * @text Day Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.6
 *
 * @param DuskAmbientIntensity
 * @text Dusk Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.35
 *
 * @param NightAmbientIntensity
 * @text Night Ambient Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.03
 *
 * @param DawnSunColor
 * @text Dawn Sun Color
 * @type text
 * @default #ff9966
 *
 * @param DaySunColor
 * @text Day Sun Color
 * @type text
 * @default #fffae0
 *
 * @param DuskSunColor
 * @text Dusk Sun Color
 * @type text
 * @default #ff6633
 *
 * @param NightSunColor
 * @text Night Sun Color
 * @type text
 * @default #6688cc
 *
 * @param DawnSunIntensity
 * @text Dawn Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.4
 *
 * @param DaySunIntensity
 * @text Day Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.9
 *
 * @param DuskSunIntensity
 * @text Dusk Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.5
 *
 * @param NightSunIntensity
 * @text Night Sun Intensity
 * @type number
 * @decimals 2
 * @min 0
 * @max 2
 * @default 0.0
 *
 * @param SunRotation
 * @text Sun Rotation
 * @type boolean
 * @default true
 *
 * @param SunriseDirection
 * @text Sunrise Direction
 * @type number
 * @min 0
 * @max 360
 * @default 315
 *
 * @param SunsetDirection
 * @text Sunset Direction
 * @type number
 * @min 0
 * @max 360
 * @default 225
 *
 * @param ShowTimeWindow
 * @text Show Time Window
 * @type boolean
 * @default true
 *
 * @param TimeWindowX
 * @text Time Window X
 * @type number
 * @default 10
 *
 * @param TimeWindowY
 * @text Time Window Y
 * @type number
 * @default 10
 *
 * @help
 * ============================================================================
 * Dynamic Time & Day/Night Cycle System v2.0 - Modular Architecture
 * ============================================================================
 *
 * This plugin adds a time system with dynamic day/night cycle that integrates
 * with the DynamicLighting plugin's sun light system.
 *
 * IMPORTANT: This plugin ONLY works when the sun is enabled on the map!
 * Use <sun:direction,intensity,color> in map notes to enable sun.
 *
 * @command SetTime
 * @text Set Time
 * @arg hour
 * @type number
 * @min 0
 * @max 23
 * @default 12
 * @arg minute
 * @type number
 * @min 0
 * @max 59
 * @default 0
 *
 * @command AddTime
 * @text Add Time
 * @arg hours
 * @type number
 * @min 0
 * @default 0
 * @arg minutes
 * @type number
 * @min 0
 * @default 0
 *
 * @command SetTimeSpeed
 * @text Set Time Speed
 * @arg speed
 * @type number
 * @min 0
 * @max 3600
 * @default 60
 *
 * @command PauseTime
 * @text Pause Time
 *
 * @command ResumeTime
 * @text Resume Time
 *
 * @command ShowTimeWindow
 * @text Show Time Window
 *
 * @command HideTimeWindow
 * @text Hide Time Window
 *
 * @command SetPhase
 * @text Set Phase
 * @arg phase
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
 */

(function() {
    'use strict';

    // Plugin name must match exactly what's in plugins.js
    const pluginName = 'DynamicLighting/time/DynamicLighting_Time';
    const BASE_PATH = 'js/plugins/DynamicLighting/time/';

    // =========================================================================
    // Get Plugin Parameters FIRST (before loading modules!)
    // =========================================================================
    
    const DL = window.DynamicLighting;
    if (!DL) {
        console.error('[DynamicLighting_Time] Base DynamicLighting plugin not loaded!');
        return;
    }

    const Debug = DL.Debug;
    
    // Get parameters from PluginManager BEFORE loading modules
    console.log('[DynamicLighting_Time] Looking for plugin:', pluginName);
    console.log('[DynamicLighting_Time] $plugins array:', $plugins.map(p => p.name));
    
    // Find our plugin directly
    const ourPlugin = $plugins.find(p => p.name === pluginName);
    console.log('[DynamicLighting_Time] Our plugin entry:', ourPlugin);
    
    const parameters = ourPlugin ? ourPlugin.parameters : {};
    console.log('[DynamicLighting_Time] Parameters:', parameters);
    
    // Pre-parse time configuration and store it for modules to use
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
    
    console.log('[DynamicLighting_Time] Parsed TIME_CONFIG:', TIME_CONFIG);
    
    // Store config in DL namespace for modules to use
    DL.TimeConfig = TIME_CONFIG;

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
            console.error('[DynamicLighting_Time] Failed to load module:', path);
            return false;
        }
    }

    // =========================================================================
    // Module Loading
    // =========================================================================

    // Load time modules
    const modules = [
        'TimeSystem.js',
        'TimeWindow.js'
    ];

    console.log('[DynamicLighting_Time] Loading modules...');
    
    for (const module of modules) {
        const fullPath = BASE_PATH + module;
        if (!loadScriptSync(fullPath)) {
            console.error('[DynamicLighting_Time] Failed to load required module:', module);
            return;
        }
    }
    
    console.log('[DynamicLighting_Time] All modules loaded successfully');

    // Get references
    const Game_Time = DL.Time.Game_Time;
    const Window_GameTime = DL.Time.Window_GameTime;
    const TimeConfig = DL.Time.CONFIG;
    
    console.log('[DynamicLighting_Time] TimeConfig after modules:', TimeConfig);

    // Global time object
    let $gameTime = null;

    //==========================================================================
    // DataManager Extensions - Save/Load
    //==========================================================================

    const _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _DataManager_createGameObjects.call(this);
        $gameTime = new Game_Time();
        window.$gameTime = $gameTime;
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
        window.$gameTime = $gameTime;
    };

    //==========================================================================
    // Game_Map Extensions
    //==========================================================================

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this.setupTimeSystem();
    };

    Game_Map.prototype.setupTimeSystem = function() {
        if (!$gameTime) return;
        
        $gameTime.clearMapTimeLock();
        $gameTime.clearMapSpeedOverride();
        
        if ($dataMap && $dataMap.note) {
            const timeLockMatch = $dataMap.note.match(/<timelock[:\s]*(\d+)(?::(\d+))?>/i);
            if (timeLockMatch) {
                const hour = parseInt(timeLockMatch[1]);
                const minute = timeLockMatch[2] ? parseInt(timeLockMatch[2]) : 0;
                $gameTime.setMapTimeLock(hour * 60 + minute);
                Debug.log('Map time locked to', hour + ':' + minute.toString().padStart(2, '0'));
            }
            
            const speedMatch = $dataMap.note.match(/<timespeed[:\s]*(\d+)>/i);
            if (speedMatch) {
                const speed = parseInt(speedMatch[1]);
                $gameTime.setMapSpeedOverride(speed);
                Debug.log('Map time speed set to', speed);
            }
        }
    };

    Game_Map.prototype.isSunEnabled = function() {
        return this._sunLight && this._sunLight.enabled;
    };

    //==========================================================================
    // Scene_Map Extensions
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
        this.updateTimeSystem();
        _Scene_Map_update.call(this);
        this.updateTimeWindow();
    };

    Scene_Map.prototype.updateTimeSystem = function() {
        if (!$gameTime || !$gameMap) return;
        
        $gameTime.incrementFrame();
        $gameTime.update();
        $gameTime._invalidateCache();
        
        if (!$gameMap.isSunEnabled()) {
            return;
        }
        
        $gameTime.forceUpdateCache();
        
        const sunColor = $gameTime.getSunColor();
        const sunColorRgb = $gameTime.getSunColorRgb();
        const sunIntensity = $gameTime.getSunIntensity();
        const sunDirection = $gameTime.getSunDirection();
        const ambientColor = $gameTime.getAmbientColor();
        const ambientIntensity = $gameTime.getAmbientIntensity();
        
        if ($gameMap._sunLight) {
            $gameMap._sunLight.color = sunColor;
            $gameMap._sunLight.colorRgb = sunColorRgb;
            $gameMap._sunLight.intensity = sunIntensity;
            
            if (sunDirection !== null) {
                $gameMap._sunLight.direction = sunDirection * Math.PI / 180;
            }
        }
        
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
                case 'dawn': hour = TimeConfig.dawnStart; break;
                case 'day': hour = TimeConfig.dayStart + 2; break;
                case 'dusk': hour = TimeConfig.duskStart; break;
                case 'night': hour = TimeConfig.nightStart + 2; break;
                default: hour = 12;
            }
            $gameTime.setTime(hour, 0);
        }
    });

    //==========================================================================
    // Export
    //==========================================================================

    window.Game_Time = Game_Time;
    window.$gameTime = null;

    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        window.$gameTime = $gameTime;
    };

    Debug.log('DynamicLighting_Time v2.0 loaded - Modular Architecture');

})();
