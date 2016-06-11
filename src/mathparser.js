import {Literal, Infix, Prefix} from './parsetree.js'

class ParseError extends Error {}

const INFIX = ['+', '-', '*', '/', '^']

export default function parse(text){
    text = text.trim()

    if (text.length == 0){
        throw new ParseError("Empty input")
    }

    if (text[0] == '('){
        return parseParenthesis(text)
    }

    if (text[0] == '|'){
        return parseAbs(text)
    }
    
    let res = parseInfix(text)
    if (res){
        return res
    }

    return new Literal(text)
}

/* Escape from a group parser and try to parse an infix operation  */
function escapeGroup(group, rest){
    let res = INFIX.reduce((r, x) => {
        if (r){
            return r
        }

        let match = rest.match(`^ *\\${x} *(.+)`)
        if (match){
            return new Infix(x, group, parse(match[1]))
        }
    }, undefined)
    return res ? res : group
}

function parseInfix(text){
    /* First pass of infix operator between parenthesis (Lower precedence) */
    let res = INFIX.reduce((r, x) => {
        if (r){
            return r
        }

        // Infix, parenthesis on the right
        var match = text.match(`^(.+?) *\\${x} *(.*\\(.+)`)
        if (match){
            return new Infix(x, parse(match[1]), parse(match[2]))
        }

        // Infix, parenthesis on the left
        match = text.match(`^(.+?\\).*) *\\${x} *(.+)`)
        if (match){
            return new Infix(x, parse(match[1]), parse(match[2]))
        }
    }, undefined)

    /* Second pass of infix operator */
    return INFIX.reduce((r, x) => {
        if (r){
            return r
        }

        // Infix no parenthesis
        let match = text.match(`^(.+) *\\${x} *(.+)`)
        if (match){
            return new Infix(x, parse(match[1]), parse(match[2]))
        }
    }, res)

}

function parseAbs(text){
    for (let i=1; i<text.length; i++){
        if (text[i] == '|'){
            let res = Prefix('abs', parse(text.substring(1, i)))
            return escapeGroup(res, text.substring(i+1))
        }
    }
    throw new ParseError(`Missing closing '|' in: ${text}`)
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
                let content = parse(text.substring(1, i))
                return escapeGroup(content, text.substring(i+1))
            }
        }
    }
    throw new ParseError(`Missing ')' in: ${text}`)
}
