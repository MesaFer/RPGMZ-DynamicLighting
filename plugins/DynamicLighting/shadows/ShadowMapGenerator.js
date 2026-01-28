/**
 * DynamicLighting - Shadow Map Generator
 * Manages GPU shadow map generation for point lights and sun
 * @module DynamicLighting/shadows/ShadowMapGenerator
 */

(function() {
    'use strict';

    const Debug = window.DynamicLighting.Debug;
    const Config = window.DynamicLighting.Config;
    const RegionMapGenerator = window.DynamicLighting.RegionMapGenerator;
    const PointLightShadowFilter = window.DynamicLighting.PointLightShadowFilter;
    const SunShadowFilter = window.DynamicLighting.SunShadowFilter;

    /**
     * Shadow Map Generator
     * Handles GPU-based shadow map generation for all light sources
     */
    class ShadowMapGenerator {
        constructor(resolution, maxLights, regionPadding = 10) {
            this._resolution = resolution;
            this._maxLights = maxLights;
            this._destroyed = false;
            
            // Region map generator
            this._regionMap = new RegionMapGenerator(regionPadding);
            
            // Point light shadow system
            this._pointLightFilter = null;
            this._pointLightRenderTexture = null;
            this._pointLightSprite = null;
            this._pointLightContainer = null;
            this._pointLightInitialized = false;
            
            // Sun shadow system
            this._sunShadowFilter = null;
            this._sunShadowRenderTexture = null;
            this._sunShadowSprite = null;
            this._sunShadowContainer = null;
            this._sunShadowInitialized = false;
            
            // Sun shadow caching
            this._lastSunDisplayX = -999;
            this._lastSunDisplayY = -999;
            this._lastSunDirection = -999;
            this._lastSunSettings = null;
            this._sunShadowDirty = true;
            
            // Frame throttling
            this._frameCounter = 0;
            this._lastSunShadowFrame = 0;
            this._sunShadowMinInterval = 1;
            this._positionChangeThreshold = 0.01;
            
            Debug.log('ShadowMapGenerator created:', resolution, 'x', maxLights);
        }

        /**
         * Initialize point light shadow system (lazy)
         */
        _initPointLightSystem() {
            if (this._pointLightInitialized) return;
            
            const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
            if (!renderer) {
                Debug.log('Cannot init point light shadows - renderer not ready');
                return;
            }
            
            try {
                this._pointLightRenderTexture = PIXI.RenderTexture.create({
                    width: this._resolution,
                    height: this._maxLights,
                    scaleMode: PIXI.SCALE_MODES.LINEAR,
                    resolution: 1
                });
                
                this._pointLightSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
                this._pointLightSprite.width = this._resolution;
                this._pointLightSprite.height = this._maxLights;
                
                this._pointLightFilter = new PointLightShadowFilter(this._maxLights, this._resolution);
                this._pointLightFilter.setRegionMapSize(this._regionMap.width, this._regionMap.height);
                this._pointLightFilter.setRegionPadding(this._regionMap.padding);
                
                this._pointLightSprite.filters = [this._pointLightFilter];
                
                this._pointLightContainer = new PIXI.Container();
                this._pointLightContainer.addChild(this._pointLightSprite);
                
                this._pointLightInitialized = true;
                Debug.log('Point light shadow system initialized');
            } catch (e) {
                console.error('[DynamicLighting] Failed to init point light shadows:', e);
            }
        }

        /**
         * Initialize sun shadow system (lazy)
         */
        _initSunShadowSystem() {
            if (this._sunShadowInitialized) return;
            
            const width = Graphics.width || 816;
            const height = Graphics.height || 624;
            
            if (width <= 0 || height <= 0) return;
            
            const renderer = Graphics.app ? Graphics.app.renderer : Graphics._renderer;
            if (!renderer) return;
            
            try {
                this._sunShadowRenderTexture = PIXI.RenderTexture.create({
                    width: width,
                    height: height,
                    scaleMode: PIXI.SCALE_MODES.LINEAR,
                    resolution: renderer.resolution || 1
                });
                
                this._sunShadowSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
                this._sunShadowSprite.width = width;
                this._sunShadowSprite.height = height;
                
                this._sunShadowFilter = new SunShadowFilter();
                this._sunShadowFilter.setRegionMapSize(this._regionMap.width, this._regionMap.height);
                this._sunShadowFilter.setRegionPadding(this._regionMap.padding);
                
                this._sunShadowSprite.filters = [this._sunShadowFilter];
                
                this._sunShadowContainer = new PIXI.Container();
                this._sunShadowContainer.addChild(this._sunShadowSprite);
                
                this._sunShadowInitialized = true;
                Debug.log('Sun shadow system initialized');
            } catch (e) {
                console.error('[DynamicLighting] Failed to init sun shadows:', e);
            }
        }

        /**
         * Update region map
         */
        updateRegionMap() {
            this._regionMap.update();
        }

        /**
         * Increment frame counter
         */
        incrementFrame() {
            this._frameCounter++;
        }

        /**
         * Mark sun shadows as needing update
         */
        invalidateSunShadows() {
            this._sunShadowDirty = true;
        }

        /**
         * Check if sun shadows need update
         */
        _needsSunShadowUpdate(sunDirection, settings) {
            const framesSinceLastUpdate = this._frameCounter - this._lastSunShadowFrame;
            if (framesSinceLastUpdate < this._sunShadowMinInterval) {
                return false;
            }
            
            const displayX = $gameMap.displayX();
            const displayY = $gameMap.displayY();
            
            const deltaX = Math.abs(displayX - this._lastSunDisplayX);
            const deltaY = Math.abs(displayY - this._lastSunDisplayY);
            if (deltaX > this._positionChangeThreshold || deltaY > this._positionChangeThreshold) {
                return true;
            }
            
            if (Math.abs(sunDirection - this._lastSunDirection) > 0.001) {
                return true;
            }
            
            if (!this._lastSunSettings ||
                settings.softness !== this._lastSunSettings.softness ||
                settings.strength !== this._lastSunSettings.strength ||
                settings.length !== this._lastSunSettings.length ||
                settings.falloff !== this._lastSunSettings.falloff) {
                return true;
            }
            
            return this._sunShadowDirty;
        }

        /**
         * Generate point light shadow map
         * @param {Array} lights - Array of light objects
         * @param {PIXI.Renderer} renderer - PIXI renderer
         */
        generatePointLightShadows(lights, renderer) {
            if (!$dataMap || !renderer || lights.length === 0) return;
            
            if (!this._pointLightInitialized) {
                this._initPointLightSystem();
            }
            
            if (!this._pointLightFilter || !this._pointLightRenderTexture) return;
            
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            const displayX = $gameMap.displayX();
            const displayY = $gameMap.displayY();
            
            this._pointLightFilter.setRegionMap(this._regionMap.texture);
            this._pointLightFilter.setDisplayOffset(displayX, displayY, tileWidth, tileHeight);
            this._pointLightFilter.setRegionMapSize(this._regionMap.width, this._regionMap.height);
            this._pointLightFilter.updateLights(lights);
            
            try {
                renderer.render(this._pointLightContainer, {
                    renderTexture: this._pointLightRenderTexture,
                    clear: true
                });
            } catch (e) {
                try {
                    renderer.render(this._pointLightContainer, this._pointLightRenderTexture, true);
                } catch (e2) {
                    Debug.warn('Failed to render point light shadows:', e2);
                }
            }
        }

        /**
         * Generate sun shadow map
         * @param {number} sunDirection - Sun direction in radians
         * @param {Object} settings - Shadow settings
         * @param {PIXI.Renderer} renderer - PIXI renderer
         */
        generateSunShadows(sunDirection, settings, renderer) {
            if (!$dataMap || !renderer) return;
            
            if (!this._sunShadowInitialized) {
                this._initSunShadowSystem();
            }
            
            if (!this._sunShadowFilter || !this._sunShadowRenderTexture) return;
            
            const effectiveSettings = {
                softness: settings.softness !== undefined ? settings.softness : 0,
                precision: settings.precision !== undefined ? settings.precision : 1,
                strength: settings.strength !== undefined ? settings.strength : 0.85,
                length: settings.length !== undefined ? settings.length : 3.0,
                falloff: settings.falloff !== undefined ? settings.falloff : 'smooth'
            };
            
            if (!this._needsSunShadowUpdate(sunDirection, effectiveSettings)) {
                return;
            }
            
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            const displayX = $gameMap.displayX();
            const displayY = $gameMap.displayY();
            
            this._lastSunDisplayX = displayX;
            this._lastSunDisplayY = displayY;
            this._lastSunDirection = sunDirection;
            this._lastSunSettings = Object.assign({}, effectiveSettings);
            this._sunShadowDirty = false;
            this._lastSunShadowFrame = this._frameCounter;
            
            this._sunShadowFilter.setRegionMap(this._regionMap.texture);
            this._sunShadowFilter.setSunDirection(sunDirection);
            this._sunShadowFilter.setShadowParams(
                effectiveSettings.length,
                effectiveSettings.strength,
                effectiveSettings.precision,
                effectiveSettings.falloff
            );
            this._sunShadowFilter.updateDisplayOffset(displayX, displayY, tileWidth, tileHeight);
            this._sunShadowFilter.setResolution(Graphics.width, Graphics.height);
            this._sunShadowFilter.setRegionMapSize(this._regionMap.width, this._regionMap.height);
            
            try {
                renderer.render(this._sunShadowContainer, {
                    renderTexture: this._sunShadowRenderTexture,
                    clear: true
                });
            } catch (e) {
                try {
                    renderer.render(this._sunShadowContainer, this._sunShadowRenderTexture, true);
                } catch (e2) {
                    Debug.warn('Failed to render sun shadows:', e2);
                }
            }
        }

        /**
         * Destroy all GPU resources
         */
        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            
            Debug.log('Destroying ShadowMapGenerator...');
            
            // Destroy point light resources
            if (this._pointLightRenderTexture) {
                this._pointLightRenderTexture.destroy(true);
                this._pointLightRenderTexture = null;
            }
            if (this._pointLightSprite) {
                this._pointLightSprite.destroy({ children: true, texture: false });
                this._pointLightSprite = null;
            }
            if (this._pointLightContainer) {
                this._pointLightContainer.destroy({ children: true });
                this._pointLightContainer = null;
            }
            if (this._pointLightFilter) {
                this._pointLightFilter.destroy();
                this._pointLightFilter = null;
            }
            this._pointLightInitialized = false;
            
            // Destroy sun shadow resources
            if (this._sunShadowRenderTexture) {
                this._sunShadowRenderTexture.destroy(true);
                this._sunShadowRenderTexture = null;
            }
            if (this._sunShadowSprite) {
                this._sunShadowSprite.destroy({ children: true, texture: false });
                this._sunShadowSprite = null;
            }
            if (this._sunShadowContainer) {
                this._sunShadowContainer.destroy({ children: true });
                this._sunShadowContainer = null;
            }
            if (this._sunShadowFilter) {
                this._sunShadowFilter.destroy();
                this._sunShadowFilter = null;
            }
            this._sunShadowInitialized = false;
            
            // Destroy region map
            if (this._regionMap) {
                this._regionMap.destroy();
                this._regionMap = null;
            }
            
            Debug.log('ShadowMapGenerator destroyed');
        }

        /**
         * Check if generator is valid
         * @returns {boolean} True if not destroyed
         */
        isValid() {
            return !this._destroyed;
        }

        // Getters
        get pointLightTexture() {
            return this._pointLightRenderTexture;
        }

        get sunShadowTexture() {
            return this._sunShadowRenderTexture;
        }

        get regionTexture() {
            return this._regionMap ? this._regionMap.texture : null;
        }

        get regionMapWidth() {
            return this._regionMap ? this._regionMap.width : 0;
        }

        get regionMapHeight() {
            return this._regionMap ? this._regionMap.height : 0;
        }

        get regionPadding() {
            return this._regionMap ? this._regionMap.padding : 0;
        }

        get sunShadowFilter() {
            return this._sunShadowFilter;
        }

        get pointLightFilter() {
            return this._pointLightFilter;
        }

        get resolution() {
            return this._resolution;
        }

        get maxLights() {
            return this._maxLights;
        }
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.ShadowMapGenerator = ShadowMapGenerator;

})();
