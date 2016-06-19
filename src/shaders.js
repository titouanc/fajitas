import {toShader} from './shaderTransform.js'
import Parser from './parser.js'
import T from './transformer.js'
import 'babel-polyfill'

const HELPERS = `
  vec2 CMul(vec2 a, vec2 b){
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
  }

  vec2 CInv(vec2 z){
    float d = z.x*z.x + z.y*z.y;
    return vec2(z.x/d, -z.y/d);
  }
`;


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
    let statement = T.str(expr)
    return `
        precision mediump float;

        const int N_ITER = ${n_iter};
        ${HELPERS}

        precision mediump float;
        varying vec2 absPos;
        uniform float zoom;
        uniform vec2 center;
        uniform vec2 scale;
        uniform vec4 c0, c1;

        void main(){
          vec2 C = center.xy + zoom * scale.xy * absPos.xy;
          vec2 Zn = C.xy;
          vec2 Znn;
          float c = 1.0;

          for (int i=0; i<N_ITER; i++){
            Znn = ${statement};
            if (distance(Zn, Znn) > 4.0){
              c = float(i)/float(N_ITER);
              break;
            }
            Zn = Znn;
          }

          gl_FragColor = c0 + c*(c1-c0);
        }`
}

export function shaderify(text){
    return new Promise((ok, err) => {
        let expr;

        try {
          expr = Parser.parse(text)
        }
        catch (exc){
          err(exc)
        }


        let freeVariables = new Set()
        T.find({type: "identifier"}, expr, x => {
            if (x.value != 'Zn' && x.value != 'C') freeVariables.add(x.value)
        })

        if (freeVariables.size > 0){
            err(`Unbound variables: ${[...freeVariables].join(',')}`)
        }

        ok(toShader(expr))
    })
}
