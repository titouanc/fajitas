export default class ParseTree {
    constructor(op, infix, call, ...args){
        this.op = op
        this.infix = infix
        this.call = call
        this.args = args.map(x => {
            if (! (x instanceof ParseTree)){
                return Literal(x)
            }
            return x
        })
    }

    isLitteral(){
        return (! this.call)
    }

    render(){
        if (this.infix){
            return `(${this.args[0].render()} ${this.op} ${this.args[1].render()})`
        } else if (this.call) {
            let args = this.args.map(x => x.render()).join(', ')
            return `${this.op}(${args})`
        } else {
            return this.op
        }
    }

    equals(other){
        return (this.op == other.op) &&
               (this.infix == other.infix) &&
               (this.call == other.call) &&
               (this.args.map((x, i) => x.equals(other.args[i]))
                         .reduce((acc, x) => acc && x, true))
    }

    transform(mapper){
        let args = this.args.map(x => x.transform(mapper))
        let clone = new ParseTree(this.op, this.infix, this.call, ...args)
        var res = mapper(clone)
        return res ? res : clone
    }

    find(filter, acc=[]){
        if (filter(this)){
            acc.push(this)
        }
        this.args.map(c => c.find(filter, acc))
        return acc
    }
}

export const Literal = name => new ParseTree(name, false, false)
export const Infix = (name, ...args) => new ParseTree(name, true, true, ...args)
export const Prefix = (name, ...args) => new ParseTree(name, false, true, ...args)
