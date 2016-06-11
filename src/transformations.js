import {Infix, Prefix} from './parsetree.js'

export function exp2mul(node){
    if (node.op == '^' && node.infix){
        let base = node.args[0]
        let power = parseInt(node.args[1].op)

        if (power == 1){
            return base
        }
        return Infix('*', Infix('^', base, power-1), base)
    }
}

export function mul2CMul(node){
    if (node.op == '*' && node.infix){
        return Prefix('CMul', ...node.args)
    }
}
