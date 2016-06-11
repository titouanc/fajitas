import {shaderPipeline, variable} from './transformations.js'
import parse from './mathparser.js'

const HELPERS = `
  vec2 CMul(vec2 a, vec2 b)
  {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
  }`;


export function vertexShader(){
    return `
        precision mediump float;

        attribute vec2 position;
        varying vec2 absPos;

        void main() {
          gl_Position = vec4(position, 0, 1);
          absPos = position;
        }`
}


export function genericShader(expr, n_iter=128){
    let statement = expr.render()
    return `
        precision mediump float;

        const int N_ITER = ${n_iter};
        ${HELPERS}

        precision mediump float;
        varying vec2 absPos;
        uniform float zoom;
        uniform vec2 center;
        uniform vec2 scale;

        void main()
        {
          vec2 C = center.xy + zoom * scale.xy * absPos.xy;
          vec2 Zn = vec2(0, 0);
          float c = 1.0;

          for (int i=0; i<N_ITER; i++){
            Zn = ${statement};
            if (length(Zn) > 4.0){
              c = float(i)/float(N_ITER);
              break;
            }
          }

          gl_FragColor = vec4(c, c, c, 1);
        }`
}

export function shaderify(text){
    return new Promise((ok, err) => {
        let expr;

        try {
          expr = parse(text)
        }
        catch (exc){
          err(exc)
        }

        let unbound = node => (node.op != 'Zn') && (node.op != 'C')
        let freeVariables = expr.find(node => variable(node) && unbound(node))
                                .reduce((acc, x) => acc.add(x), new Set())
        if (freeVariables.size > 0){
            err(`Unbound variables: ${freeVariables}`)
        }

        ok(shaderPipeline(expr))
    })
}
