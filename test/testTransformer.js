import assert from 'assert'
import Parser from '../src/parser.js'
import T from '../src/transformer.js'
import {expandPolynom, simplify, toComplexTypes, toShader} from '../src/shaderTransform.js'

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

        it("should match expressions with subset template", () => {
            let template = {type:"integer"}
            let expr = T.int(42)
            assert(T.match(template, expr))
        })

        it("should match expressions with full template", () => {
            let template = T.int(42)
            let expr = T.int(42)
            assert(T.match(template, expr))
        })

        it("should find identifiers in tree", () => {
            let tpl = {type: "identifier"}
            let expr = Parser.parse("sqrt(3*z - 2 + 2i*x)")
            assert.deepEqual(T.findAll(tpl, expr), [T.identifier('z'), T.identifier('x')])
        })
    })

    describe('for shaders', () => {
        function testTransformation(initial, transformation, expected){
            return () => {
                let before = Parser.parse(initial)
                let after = T.mapExpr(transformation, before)
                assert.deepEqual(after, Parser.parse(expected))
            }
        }

        it("should expand polynomials",
           testTransformation('x[4, -16, 16]', expandPolynom,
                              '(4*x^2 + -16*x^1) + 16*x^0'))

        it("should transform multiplications to CMul",
            testTransformation('x*y', toComplexTypes, 'CMul(x, y)'))

        describe("simplifications", () => {
            it("should simplify ^0 to 1",testTransformation('x^0', simplify, '1'))
            it("should simplify x^1 to x",testTransformation('x^1', simplify, 'x'))
            it("should simplify x*1 to x",testTransformation('x*1', simplify, 'x'))
            it("should simplify 1*x to x",testTransformation('1*x', simplify, 'x'))
            it("should simplify x*0 to 0",testTransformation('x*0', simplify, '0'))
            it("should simplify 0*x to 0",testTransformation('0*x', simplify, '0'))
            it("should simplify x/1 to x",testTransformation('x/1', simplify, 'x'))
            it("should simplify 0/x to 0",testTransformation('0/x', simplify, '0'))
            it("should simplify x+0 to x",testTransformation('x+0', simplify, 'x'))
            it("should simplify 0+x to x",testTransformation('0+x', simplify, 'x'))
            it("should simplify x-0 to x",testTransformation('x-0', simplify, 'x'))
            it("should NOT simplify 0-x to x",testTransformation('0-x', simplify, '0-x'))

            it("should perform recursive simplification",
                testTransformation('Zn^0 * 3 + 0/2', simplify, '3'))
        })

        describe("full stack", () => {
            function testFullStack(initial, expected){
                return () => {
                    let before = Parser.parse(initial)
                    let after = toShader(before)
                    assert.deepEqual(after, Parser.parse(expected))
                }
            }

            it("should compile integers to vec2",
                testFullStack('3', 'vec2(3, 0)'))

            it("should compile floats to vec2",
                testFullStack('3.42', 'vec2(3.42, 0)'))

            it("should compile imaginary to vec2",
                testFullStack('3i', 'vec2(0, 3)'))

            it("should compile float+imaginary to a single vec2",
                testFullStack('2.2+3i', 'vec2(2.2, 3.0)'))

            it("should compile float-imaginary to a single vec2",
                testFullStack('2.2-3i', 'vec2(2.2, -3.0)'))

            it("should compile Mandelbrot",
                testFullStack('Zn^2 + C', 'CMul(Zn, Zn) + C'))

            it("should compile Burning ship",
                testFullStack('|Zn|^2 + C', 'CMul(abs(Zn), abs(Zn)) + C'))

            it("should compile a newtonian fractal",
                testFullStack(
                    'Zn[1, 1, 1]1 / Zn[3, 2, 1]',
                    'CMul((CMul(Zn, CMul(Zn, Zn)) + CMul(Zn, Zn)) + Zn, '+
                      'CInv((CMul(vec2(3, 0), CMul(Zn, Zn)) + CMul(vec2(2, 0), Zn)) + vec2(1, 0)))'))
        })
    })
})
