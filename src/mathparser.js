import {Literal, Infix, Prefix} from './parsetree.js'

class ParseError extends Error {}

export function parse(text){
    text = text.trim()

    if (text.length == 0){
        throw new ParseError("Empty input")
    }

    if (text[0] == '('){
        return parseParenthesis(text)
    }

    /* First pass of infix operator between parenthesis */
    var res = ['+', '-', '*', '/', '^'].reduce((r, x) => {
        if (r){
            return r
        }

        var match = text.match(`^(.+?) *([\\${x}]) *(.*\\(.+)`)
        if (match){
            return new Infix(match[2], parse(match[1]), parse(match[3]))
        }

        match = text.match(`^(.+?\\).*) *([\\${x}]) *(.+)`)
        if (match){
            return new Infix(match[2], parse(match[1]), parse(match[3]))
        }
    }, undefined)

    /* Second pass of infix operator */
    if (! res){
        res = ['+', '-', '*', '/', '^'].reduce((r, x) => {
            if (r){
                return r
            }

            let match = text.match(`^(.+) *([\\${x}]) *(.+)`)
            if (match){
                return new Infix(match[2], parse(match[1]), parse(match[3]))
            }
        }, undefined)
    }

    if (res){
        return res
    }

    return new Literal(text)
}

function parseParenthesis(text){
    let contents = []
    var cnt = 0
    for (let i=0; i<text.length; i++){
        if (text[i] == '('){
            cnt++;
        } else if (text[i] == ')'){
            cnt--;
            if (cnt == 0){
                return parse(text.substring(1, i))
            }
        }
    }
    throw new ParseError(`Missing ')' in: ${text}`)
}

export default function math2shader(mathText){
    var expr = parse(mathText)
    return expr.render()
}
