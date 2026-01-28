/**
 * DynamicLighting - Transition Manager Module
 * Handles smooth transitions for light properties (color, intensity, radius)
 */

(function() {
    'use strict';

    const DL = window.DynamicLighting;
    if (!DL) {
        console.error('[TransitionManager] DynamicLighting not found!');
        return;
    }

    // Initialize effects namespace
    DL.Effects = DL.Effects || {};

    //==========================================================================
    // Transition Manager Class
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
            if (DL.Debug) DL.Debug.log('Transitions cleared');
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

    //==========================================================================
    // Export
    //==========================================================================

    DL.Effects.TransitionManager = TransitionManager;
    
    // Create global instance
    DL.Effects.transitionManager = new TransitionManager();

    console.log('[DynamicLighting] TransitionManager module loaded');

})();
