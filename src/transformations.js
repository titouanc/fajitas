import {Infix, Prefix} from './parsetree.js'

export function variable(node){
    return (! node.call) && isNaN(parseInt(node.op))
}

export function numeric(node){
    return (! node.call) && ! isNaN(parseInt(node.op))
}

function unrollExp(base, power){
    if (power == 0){
        return 1
    }
    if (power == 1){
        return base
    }
    return Infix('*', unrollExp(base, power-1), base)
}

/* Replace an exponentiation by a multiplication (useful for complex product) */
export function exp2mul(node){
    if (node.op == '^' && node.infix){
        let base = node.args[0]
        let power = parseInt(node.args[1].op)
        return unrollExp(base, power)
    }
}

/* Replace a multiplication with a complex product */
export function mul2CMul(node){
    if (node.op == '*' && node.infix){
        return Prefix('CMul', ...node.args)
    } else if (node.op == '/' && node.infix){
        return Prefix('CMul', node.args[0], Prefix('CInv', node.args[1]))
    }
}

export function addXYtoC(node){
    if (variable(node) && node.op == 'C'){
        return Infix('.', 'C', 'xy')
    }
}

export function vectorizeConstants(node){
    if (node.infix && "+-*/".indexOf(node.op) >= 0){
        let args = node.args.map(x => {
            if (numeric(x)){
                if ("+-".indexOf(node.op) >= 0){
                    // [n, 0] for add/sub
                    return Prefix('vec2', x.op, 0)
                } else {
                    // [n, n] for mul/div
                    return Prefix('vec2', x.op, x.op)
                }
            } else {
                return x
            }
        })
        return Infix(node.op, ...args)
    }
}

export function chain(...fs){
    return initial => fs.reduce((expr, f) => expr.transform(f), initial)
}

export const shaderPipeline = chain(exp2mul, mul2CMul, addXYtoC, vectorizeConstants)
