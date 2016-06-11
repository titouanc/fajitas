import {Infix, Prefix} from './parsetree.js'

export function variable(node){
    return (! node.call) && isNaN(parseInt(node.op))
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
    }
}

export function addXYtoC(node){
    if (variable(node) && node.op == 'C'){
        return Infix('.', 'C', 'xy')
    }
}

export function chain(...fs){
    return initial => fs.reduce((expr, f) => expr.transform(f), initial)
}

export const shaderPipeline = chain(exp2mul, mul2CMul, addXYtoC)
