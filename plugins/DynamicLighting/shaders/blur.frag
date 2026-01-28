precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec2 uResolution;
uniform vec2 uBlurDirection;
uniform float uBlurAmount;

void main(void) {
    vec2 texelSize = 1.0 / uResolution;
    
    // 9-tap Gaussian blur weights
    float weights[5];
    weights[0] = 0.227027;
    weights[1] = 0.1945946;
    weights[2] = 0.1216216;
    weights[3] = 0.054054;
    weights[4] = 0.016216;
    
    vec3 result = texture2D(uSampler, vTextureCoord).rgb * weights[0];
    
    for (int i = 1; i < 5; i++) {
        vec2 offset = uBlurDirection * texelSize * float(i) * uBlurAmount;
        result += texture2D(uSampler, vTextureCoord + offset).rgb * weights[i];
        result += texture2D(uSampler, vTextureCoord - offset).rgb * weights[i];
    }
    
    gl_FragColor = vec4(result, 1.0);
}
