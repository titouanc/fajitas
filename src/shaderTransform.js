import T from './transformer.js'

export function expandPolynom(expr){
    if (expr.type == "polynom"){
        let v = T.identifier(expr.varname)
        let terms = expr.args.map((arg, i) =>
            T.infix('*', arg, T.infix('^', v, T.int(expr.args.length+expr.degree-i-1))))
        return terms.slice(1).reduce((res, term) => T.infix('+', res, term), terms[0])
    }
}
