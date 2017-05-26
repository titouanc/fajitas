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

    static absolute(x){
        return {type: "absolute", value: x}
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

    static isAbs(expr){
        return expr.type == "absolute"
    }

    static mapExpr(transformation, expr){
        var clone = JSON.parse(JSON.stringify(expr))
        if (this.isAbs(clone)){
            clone.value = this.mapExpr(transformation, clone.value)
        }
        else if (! this.isLiteral(clone)){
            clone.args = clone.args.map(x => this.mapExpr(transformation, x))
        }

        var res = transformation(clone)
        if (res == undefined){
            res = clone
        }
        return res
    }

    static chain(...transformers){
        return expr => transformers.reduce((e, t) => this.mapExpr(t, e), expr)
    }

    static str(expr){
        switch (expr.type){
            case "integer":
            case "float":
            case "identifier": return expr.value
            case "imaginary": return expr.value + "i"
            case "prefix":
                return expr.op + "(" + expr.args.map(x => this.str(x)).join(', ') + ")"
            case "infix":
                return "(" + this.str(expr.args[0]) + " " + expr.op + " " + this.str(expr.args[1]) + ")"
            case "absolute":
                return "|" + this.str(expr.value) + "|"
            case "polynom":
                return expr.varname + "[" + expr.args.map(this.str).join(', ') + "]" + expr.degree
        }
    }

    static match(template, expr){
        return Object.keys(template)
                     .reduce((res, k) => res && expr[k] == template[k], true)
    }

    static find(template, expr, whenFound){
        if (this.match(template, expr)){
            whenFound(expr)
        }
        if (this.isAbs(expr)){
            this.find(template, expr.value, whenFound)
        } else if (! this.isLiteral(expr)){
            expr.args.map(x => this.find(template, x, whenFound))
        }
    }

    static findAll(template, expr){
        let res = []
        this.find(template, expr, x => res.push(x))
        return res
    }
}
