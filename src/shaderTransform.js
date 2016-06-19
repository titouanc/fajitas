import T from './transformer.js'

const Zero = {value: "0"}
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
                if (T.match(Zero, expr.args[i])) return T.int(0)
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
            if (T.match(Zero, expr.args[0])) return T.int(0)
            if (T.match(One, expr.args[1]))  return expr.args[0]
            break
        }
    }
}

function mulAcc(base, power){
    if (power == 1){
        return base
    }
    if (power < 0){
        return T.infix('/', 1, mulAcc(base, -power))
    }
    return T.infix('*', base, mulAcc(base, power-1))
}

export function expandExp(expr){
    if (expr.type == "infix" && expr.op == "^"){
        let [base, power] = expr.args
        if (power.type == "integer"){
            return mulAcc(base, power.value)
        }
    }
}

export function toComplexTypes(expr){
    if (expr.type == "infix" && expr.op == "*"){
        return T.prefix('CMul', ...expr.args)
    }
    if (expr.type == "infix" && expr.op == "/"){
        return T.prefix('CMul', expr.args[0], T.prefix('CInv', expr.args[1]))
    }
    if (expr.type == "absolute"){
        return T.prefix('abs', expr.value)
    }
    if (expr.type == "integer" || expr.type == "float"){
        return T.prefix('vec2', expr, T.int(0))
    }
    if (expr.type == "imaginary"){
        return T.prefix('vec2', T.int(0), T.int(expr.value))
    }
}

export function sumVectors(expr){
    if (expr.type == "infix"){
        let [left, right] = expr.args
        if (left.type == "prefix" && left.op == "vec2" && 
            right.type == "prefix" && right.op == "vec2"){
            if (expr.op == "+"){
                return T.prefix('vec2', ...left.args.map((x, i) => {
                    return T.float(x.value + right.args[i].value)
                }))
            }
            if (expr.op == "-"){
                return T.prefix('vec2', ...left.args.map((x, i) => {
                    return T.float(x.value - right.args[i].value)
                }))
            }
        }
    }
}

export const toShader = T.chain(
    expandPolynom,
    simplify,
    expandExp,
    toComplexTypes,
    sumVectors)
