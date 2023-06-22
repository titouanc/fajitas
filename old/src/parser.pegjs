{
    /* Left fold list of expression with infix operation and initial value */
    function ifxFold(op, lst, initial){
        if (lst.length == 0){
            return initial
        }

        return {
            type: "infix",
            op: op,
            args: [initial, ifxFold(op, lst.slice(1), lst[0])]
        }
    }
}

start = Expression
_ = [ ]* // Whitespaces
Expression = Add

/* Priority escalation in infix calls */
Add = left:Sub right:((_ "+" _ x:Sub {return x})*){return ifxFold("+", right, left)}
Sub = left:Mul right:((_ "-" _ x:Mul {return x})*){return ifxFold("-", right, left)}
Mul = left:Div right:((_ "*" _ x:Div {return x})*){return ifxFold("*", right, left)}
Div = left:Exp right:((_ "/" _ x:Exp {return x})*){return ifxFold("/", right, left)}
Exp = left:Primary right:((_ "^" _ x:Primary {return x})*){return ifxFold("^", right, left)}
Primary = Group / Absolute / Prefix / Literal

/* Literals */
Literal = Identifier / Imaginary / Number
Imaginary = n:Number "i" {return {type: "imaginary", value: n.value}}
Number = Float / Integer
Integer = x:("-"? [0-9]+) {
    var y = (x[0] ? x[0] : '') + x[1].join('')
    return {type: "integer", value: parseInt(y)}
}
Float = x:("-"? [0-9]*[\.][0-9]+) {
    var y = (x[0] ? x[0] : '') + x[1].join('') + '.' + x[3].join('')
    return {type: "float", value: parseFloat(y)}
}
Identifier = name:([a-zA-Z_][a-zA-Z0-9_]*) {
    return {type: "identifier", value: name[0] + name[1].join('')}
}

/* Prefix calls */
Prefix = func:Identifier _ "(" args:(Arglist) ")" {
    return {type: "prefix", op: func.value, args: args}
}
Arglist0 = _ {return []}
ArglistN = first:Expression rest:((_ "," _ e:Expression)*) {
    return [first].concat(rest.map(function(arr){return arr[arr.length-1]}))
}
Arglist = ArglistN / Arglist0

/* Groupers */
Group = Parenthesis / Absolute / Polynom
Parenthesis = "(" _ expr:Expression _ ")" {return expr}
Absolute = "|" _ expr:Expression _ "|" {
    return {type: "absolute", value: expr}
}
Polynom = name:Identifier "[" coefs:Arglist "]" deg:(Integer?) {
    var degree = deg ? deg.value : 0
    return {type: "polynom", varname: name.value, args: coefs, degree: degree}
}
