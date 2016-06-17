export default class Transformer {
    /* Cosntructors */
    static infix(op, ...args){
        return {type: "infix", op: op, args: args}
    }

    static prefix(op, ...args){
        return {type: "prefix", op: op, args: args}
    }

    static int(x){
        return {type: "integer", value: parseInt(x)}
    }

    static float(x){
        return {type: "float", value: parseFloat(x)}
    }

    static imag(x){
        return {type: "imaginary", value: parseFloat(x)}
    }    

    static identifier(x){
        return {type: "identifier", value: x}
    }

    /* Helpers */
    static isLiteral(expr){
        switch (expr.type){
            case "integer":
            case "float":
            case "identifier":
            case "imaginary": return true
            default: return false
        }
    }

    static isIdentifier(expr){
        return expr.type == "identifier"
    }

    static isNumber(expr){
        return this.isLiteral(expr) && ! this.isIdentifier(expr)
    }

    static mapExpr(transformation, expr){
        var res = transformation(expr)
        if (res == undefined){
            res = JSON.parse(JSON.stringify(expr)) // Cheap clone \o/
        }
        if (! this.isLiteral(res)){
            res.args = res.args.map(x => this.mapExpr(transformation, x))
        }
        return res
    }

    static chain(...transformers){
        return expr => transformers.reduce((e, t) => this.mapExpr(t, e), expr)
    }
}
