/**
 * DynamicLighting - Time Window
 * Window for displaying game time
 * @module DynamicLighting/time/TimeWindow
 */

(function() {
    'use strict';

    const DL = window.DynamicLighting;
    if (!DL || !DL.Time) {
        console.error('[DynamicLighting] Time module not loaded!');
        return;
    }

    const Debug = DL.Debug;
    const TimeConfig = DL.Time.CONFIG;

    /**
     * Window_GameTime - Time display window
     */
    class Window_GameTime extends Window_Base {
        constructor(rect) {
            super(rect);
            this._lastTimeString = '';
            this._lastRefreshFrame = 0;
            this._refreshInterval = 15;
            this._frameCounter = 0;
            this.refresh();
        }

        static create() {
            const width = 120;
            const height = 60;
            const x = TimeConfig.timeWindowX;
            const y = TimeConfig.timeWindowY;
            const rect = new Rectangle(x, y, width, height);
            return new Window_GameTime(rect);
        }

        update() {
            super.update();
            this._frameCounter++;
            
            if (window.$gameTime) {
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
            if (window.$gameTime) {
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

    // Export
    DL.Time.Window_GameTime = Window_GameTime;
    window.Window_GameTime = Window_GameTime;

    Debug.log('TimeWindow module loaded');

})();
