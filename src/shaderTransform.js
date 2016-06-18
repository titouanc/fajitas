import T from './transformer.js'

const Zero = T.int(0)
const One = T.int(1)

export function expandPolynom(expr){
    if (expr.type == "polynom"){
        let v = T.identifier(expr.varname)
        let terms = expr.args.map((arg, i) =>
            T.infix('*', arg, T.infix('^', v, T.int(expr.args.length+expr.degree-i-1))))
        return terms.slice(1).reduce((res, term) => T.infix('+', res, term), terms[0])
    }
}

export function simplify(expr){
    if (expr.type == "infix"){
        switch (expr.op){
        case "^":
            if (T.match(Zero, expr.args[1])) return One
            if (T.match(One, expr.args[1]))  return expr.args[0]
            break
        case "*":
            for (let i of [0, 1]){
                if (T.match(Zero, expr.args[i])) return Zero
                if (T.match(One, expr.args[i]))  return expr.args[1-i]
            }
            break
        case "+":
            for (let i of [0, 1]){
                if (T.match(Zero, expr.args[i])) return expr.args[1-i]
            }
            break
        case "-":
            if (T.match(Zero, expr.args[1])) return expr.args[0]
            break
        case "/":
            if (T.match(Zero, expr.args[0])) return Zero
            if (T.match(One, expr.args[1]))  return expr.args[0]
            break
        }
    }
}
