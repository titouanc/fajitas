import T from './transformer.js'

export function expandPolynom(expr){
    if (expr.type == "polynom"){
        let v = T.identifier(expr.varname)
        let terms = expr.args.map((arg, i) => T.infix('*', arg, T.infix('^', v, expr.degree-i)))
        return terms.slice(1).reduce((res, term) => T.infix('+', res, term), terms[0])
    }
}
