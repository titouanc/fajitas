import assert from 'assert'
import Parser from '../src/parser.js'
import T from '../src/transformer.js'
import {expandPolynom} from '../src/shaderTransform.js'

function trDouble(expr){
    if (T.isNumber(expr)){
        let res = JSON.parse(JSON.stringify(expr))
        res.value *= 2;
        return res
    }
}

function trInc(expr){
    if (T.isNumber(expr)){
        let res = JSON.parse(JSON.stringify(expr))
        res.value++;
        return res
    }
}

describe('Transformer', () => {
    describe('core', () => {
        it("should map the expression tree", () => {
            let before = T.infix('+', T.identifier('a'), T.identifier('b'))
            let after = T.mapExpr(expr => T.identifier('z'), before)
            assert.deepEqual(after, T.identifier('z'))
        })

        it("should return the original expression if no transformation", () => {
            let before = T.infix('+', T.identifier('a'), T.identifier('b'))
            let after = T.mapExpr(expr => {}, before)
            assert.deepEqual(after, before)
        })

        it("should chain transformers", () => {
            let before = Parser.parse('x[1, 2+3i]')
            let after = T.chain(trDouble, trInc)(before)
            assert.deepEqual(after, {
                type:"polynom",
                varname:"x",
                degree:0,
                args: [T.int(3), T.infix("+", T.int(5), T.imag(7))]
            })
        })
    })
})

describe('Shader transformation', () => {
    it("should expand polynomials", () => {
        let before = Parser.parse('x[4, 16, 16]')
        let after = T.mapExpr(expandPolynom, before)
        assert.deepEqual(after, T.infix('+',
            T.infix('*', T.int(4), T.infix('^', T.identifier('x'), T.int(2))),
            T.infix('+', 
                T.infix('*', T.int(16), T.infix('^', T.identifier('x'), T.int(1))),
                T.infix('*', T.int(16), T.infix('^', T.identifier('x'), T.int(0))))))
    })
})
