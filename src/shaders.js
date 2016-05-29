export function vertexShader(){
    return `
        precision mediump float;

        attribute vec2 position;
        varying vec2 absPos;

        void main() {
          gl_Position = vec4(position, 0, 1);
          absPos = position;
        }
    `
}

export function mandelbrotShader(n_iter=128){
    return `
        precision mediump float;

        const int N_ITER = ${n_iter};

        precision mediump float;
        varying vec2 absPos;
        uniform float zoom;
        uniform vec2 center;
        uniform vec2 scale;

        vec2 CMul(vec2 a, vec2 b)
        {
          return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
        }

        void main()
        {
          vec2 z0 = center.xy + zoom * scale.xy * absPos.xy;
          vec2 zn = z0.xy;
          float c = 1.0;

          for (int i=0; i<N_ITER; i++){
            zn = CMul(zn, CMul(zn, CMul(zn, zn))) + z0.xy;
            if (length(zn) > 4.0){
              c = float(i)/float(N_ITER);
              break;
            }
          }

          gl_FragColor = vec4(c, c, c, 1);
        }
    `
}

export function burningShipShader(n_iter=128){
    return `
        precision mediump float;

        const int N_ITER = ${n_iter};

        precision mediump float;
        varying vec2 absPos;
        uniform float zoom;
        uniform vec2 center;
        uniform vec2 scale;

        vec2 CMul(vec2 a, vec2 b)
        {
          return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
        }

        void main()
        {
          vec2 z0 = center.xy + zoom * scale.xy * absPos.xy;
          vec2 zn = vec2(0, 0);
          float c = 1.0;

          for (int i=0; i<N_ITER; i++){
            zn = CMul(abs(zn), abs(zn)) + z0.xy;
            if (length(zn) > 4.0){
              c = float(i)/float(N_ITER);
              break;
            }
          }

          gl_FragColor = vec4(c, c, c, 1);
        }
    `
}
