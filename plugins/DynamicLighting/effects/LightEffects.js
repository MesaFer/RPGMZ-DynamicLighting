/**
 * DynamicLighting - Light Effects Module
 * Effect types: flicker, pulse, strobe, fire, fluorescent, broken, neon, spark
 */

(function() {
    'use strict';

    const DL = window.DynamicLighting;
    if (!DL) {
        console.error('[LightEffects] DynamicLighting not found!');
        return;
    }

    // Initialize effects namespace
    DL.Effects = DL.Effects || {};

    //==========================================================================
    // Utility Functions
    //==========================================================================

    // Pseudo-random number generator with seed for consistent randomness per light
    function seededRandom(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    //==========================================================================
    // Light Effect Types
    //==========================================================================

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
            const chance = params.chance || 0.15;
            const minOff = params.minOff || 0.05;
            const maxOff = params.maxOff || 0.3;
            
            const segment = Math.floor(time * 20);
            const segmentPhase = (time * 20) % 1;
            const flickerRandom = seededRandom(segment);
            
            if (flickerRandom < chance) {
                const flickerDuration = minOff + seededRandom(segment + 0.5) * (maxOff - minOff);
                
                if (segmentPhase < flickerDuration) {
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
                    result = baseIntensity * (1.5 + seededRandom(segment + 0.2) * 0.5);
                } else if (segmentPhase < 0.15) {
                    result = baseIntensity * 0.8;
                } else if (segmentPhase < 0.2) {
                    result = baseIntensity * (0.3 + seededRandom(segment + 0.4) * 0.4);
                }
            }
            
            return result;
        }
    };

    //==========================================================================
    // Effect Parameter Parser
    //==========================================================================

    function parseEffectParams(effectType, param1, param2) {
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
    }

    //==========================================================================
    // Export
    //==========================================================================

    DL.Effects.LightEffects = LightEffects;
    DL.Effects.parseEffectParams = parseEffectParams;
    DL.Effects.seededRandom = seededRandom;

    console.log('[DynamicLighting] LightEffects module loaded');

})();
