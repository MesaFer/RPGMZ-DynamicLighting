/**
 * DynamicLighting - Silhouette Map Generator
 * Generates texture atlas of character silhouettes for sprite shadows
 * @module DynamicLighting/sprites/SilhouetteMapGenerator
 */

(function() {
    'use strict';

    const Debug = window.DynamicLighting.Debug;

    /**
     * Silhouette Map Generator
     * Creates a texture atlas containing character silhouettes
     */
    class SilhouetteMapGenerator {
        constructor(config) {
            this._config = config;
            this._canvas = null;
            this._ctx = null;
            this._texture = null;
            this._baseTexture = null;
            this._spriteInfo = [];
            this._initialized = false;
        }
        
        initialize() {
            if (this._initialized) return;
            
            const size = 512;
            this._canvas = document.createElement('canvas');
            this._canvas.width = size;
            this._canvas.height = size;
            this._ctx = this._canvas.getContext('2d');
            
            this._baseTexture = PIXI.BaseTexture.from(this._canvas, {
                scaleMode: PIXI.SCALE_MODES.NEAREST
            });
            this._texture = new PIXI.Texture(this._baseTexture);
            
            this._initialized = true;
            Debug.log('Silhouette map initialized:', size, 'x', size);
        }
        
        /**
         * Update silhouette map with current character sprites
         * @param {Array} characterSprites - Array of character sprites
         * @returns {Array} Sprite info array for shader
         */
        update(characterSprites) {
            if (!this._initialized) this.initialize();
            
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            this._spriteInfo = [];
            
            let x = 0;
            let y = 0;
            let rowHeight = 0;
            const padding = 2;
            
            for (const charSprite of characterSprites) {
                if (!charSprite || !charSprite._character) continue;
                if (!charSprite.bitmap || !charSprite.bitmap.isReady()) continue;
                
                const character = charSprite._character;
                if (!this._shouldCastShadow(character)) continue;
                
                const bitmap = charSprite.bitmap;
                const pw = charSprite.patternWidth();
                const ph = charSprite.patternHeight();
                
                if (pw <= 0 || ph <= 0) continue;
                
                if (x + pw > this._canvas.width) {
                    x = 0;
                    y += rowHeight + padding;
                    rowHeight = 0;
                }
                
                if (y + ph > this._canvas.height) {
                    Debug.log('Silhouette map full, skipping remaining sprites');
                    break;
                }
                
                const sx = charSprite._frame.x;
                const sy = charSprite._frame.y;
                const sw = charSprite._frame.width;
                const sh = charSprite._frame.height;
                
                const sourceCanvas = bitmap._canvas || bitmap._image;
                if (sourceCanvas) {
                    this._ctx.drawImage(sourceCanvas, sx, sy, sw, sh, x, y, pw, ph);
                }
                
                const u1 = x / this._canvas.width;
                const v1 = y / this._canvas.height;
                const u2 = (x + pw) / this._canvas.width;
                const v2 = (y + ph) / this._canvas.height;
                
                let footX, footY;
                
                if (charSprite.worldTransform) {
                    footX = charSprite.worldTransform.tx;
                    footY = charSprite.worldTransform.ty;
                } else {
                    footX = charSprite.x;
                    footY = charSprite.y;
                }
                
                this._spriteInfo.push({
                    footX: footX,
                    footY: footY,
                    width: pw,
                    height: ph,
                    u1: u1,
                    v1: v1,
                    u2: u2,
                    v2: v2
                });
                
                x += pw + padding;
                rowHeight = Math.max(rowHeight, ph);
            }
            
            this._baseTexture.update();
            
            return this._spriteInfo;
        }
        
        /**
         * Check if a character should cast a shadow
         * @param {Game_CharacterBase} character - Character to check
         * @returns {boolean} Whether character should cast shadow
         */
        _shouldCastShadow(character) {
            if (!this._config.enabled) return false;
            if (!$gameMap || !$gameMap.areSpriteShadowsEnabled()) return false;
            
            if (character._castsShadow === false) return false;
            if (character._castsShadow === true) return true;
            
            if (character instanceof Game_Player) {
                return this._config.playerShadow;
            } else if (character instanceof Game_Follower) {
                return this._config.followerShadows && character.isVisible();
            } else if (character instanceof Game_Event) {
                if (character._shadowDisabled) return false;
                if (!character.characterName() || character.characterName() === '') {
                    return false;
                }
                return this._config.eventShadows;
            }
            
            return false;
        }
        
        get texture() { return this._texture; }
        get spriteInfo() { return this._spriteInfo; }
        
        destroy() {
            if (this._texture) {
                this._texture.destroy(true);
                this._texture = null;
            }
            this._canvas = null;
            this._ctx = null;
            this._initialized = false;
        }
    }

    // Export
    window.DynamicLighting = window.DynamicLighting || {};
    window.DynamicLighting.SilhouetteMapGenerator = SilhouetteMapGenerator;

})();
