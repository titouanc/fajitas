import assert from 'assert'
import Parser from '../src/parser.js'

describe("Parser", () => {
    describe("for atoms", () => {
        describe("(integer)", () => {
            it("should parse positive", () => {
                let ast = Parser.parse("3")
                assert.deepEqual(ast, {type: "integer", value: 3})
            })

            it("should parse multiple digits", () => {
                let ast = Parser.parse("384")
                assert.deepEqual(ast, {type: "integer", value: 384})
            })

            it("should parse negative", () => {
                let ast = Parser.parse("-3")
                assert.deepEqual(ast, {type: "integer", value: -3})
            })
        })

        describe("(float)", () => {
            it("should parse positive", () => {
                let ast = Parser.parse("3.3")
                assert.deepEqual(ast, {type: "float", value: 3.3})
            })

            it("should parse positive without leading 0", () => {
                let ast = Parser.parse(".3")
                assert.deepEqual(ast, {type: "float", value: 0.3})
            })

            it("should parse negative", () => {
                let ast = Parser.parse("-3.3")
                assert.deepEqual(ast, {type: "float", value: -3.3})
            })

            it("should parse negative without leading 0", () => {
                let ast = Parser.parse("-.3")
                assert.deepEqual(ast, {type: "float", value: -0.3})
            })

            it("sould parse more than 1 decimal", () => {
                let ast = Parser.parse("497.241482")
                assert.deepEqual(ast, {type: "float", value: 497.241482})
            })
        })

        describe("(imaginary)", () => {
            it("should parse integer", () => {
                let ast = Parser.parse("3i")
                assert.deepEqual(ast, {type: "imaginary", value: 3})
            })

            it("should parse float", () => {
                let ast = Parser.parse("3.402i")
                assert.deepEqual(ast, {type: "imaginary", value: 3.402})
            })
        })
    })

    describe("for prefix calls", () => {
        it("should parse nullary", () => {
            let ast = Parser.parse("f()")
            assert.deepEqual(ast, {type: "prefix", op: "f", args: []})
        })

        it("should parse unary", () => {
            let ast = Parser.parse("f(x)")
            assert.deepEqual(ast, {type: "prefix", op: "f", args: [
                {type: "identifier", value: "x"}]})
        })

        it("should parse n-ary", () => {
            let ast = Parser.parse("f(x, y, 3)")
            assert.deepEqual(ast, {type: "prefix", op: "f", args: [
                {type: "identifier", value: "x"},
                {type: "identifier", value: "y"},
                {type: "integer", value: 3}]})
        })
    })

    describe("for infix calls", () => {
        it("should parse addition", () => {
            let ast = Parser.parse("x + y")
            assert.deepEqual(ast, {type: "infix", op: "+", args: [
                {type: "identifier", value: "x"},
                {type: "identifier", value: "y"}]})
        })

        it("should parse substraction", () => {
            let ast = Parser.parse("x - y")
            assert.deepEqual(ast, {type: "infix", op: "-", args: [
                {type: "identifier", value: "x"},
                {type: "identifier", value: "y"}]})
        })

        it("should parse multiplication", () => {
            let ast = Parser.parse("x * y")
            assert.deepEqual(ast, {type: "infix", op: "*", args: [
                {type: "identifier", value: "x"},
                {type: "identifier", value: "y"}]})
        })

        it("should parse division", () => {
            let ast = Parser.parse("x / y")
            assert.deepEqual(ast, {type: "infix", op: "/", args: [
                {type: "identifier", value: "x"},
                {type: "identifier", value: "y"}]})
        })

        it("should parse exponentiation", () => {
            let ast = Parser.parse("x ^ y")
            assert.deepEqual(ast, {type: "infix", op: "^", args: [
                {type: "identifier", value: "x"},
                {type: "identifier", value: "y"}]})
        })
    })

    describe("for groupers", () => {
        it("should parse parentheses transparently", () => {
            let ast = Parser.parse("(x)")
            assert.deepEqual(ast, {type: "identifier", value: "x"})
        })

        it("should parse parentheses with subexpression", () => {
            let ast = Parser.parse("(x + y)")
            assert.deepEqual(ast, {type: "infix", op: "+", args: [
                {type: "identifier", value: "x"},
                {type: "identifier", value: "y"}]})
        })

        it("should parse absolute values", () => {
            let ast = Parser.parse("|x|")
            assert.deepEqual(ast, {type: "absolute", value: {
                type: "identifier", value: "x"}})
        })

        it("should parse polynomials", () => {
            let ast = Parser.parse("x[1]")
            assert.deepEqual(ast, {
                type: "polynom",
                degree: 0,
                varname: "x",
                args: [{"type": "integer", value: 1}]
            })
        })

        it("should parse polynomials with explicit degree", () => {
            let ast = Parser.parse("x[2, a]42")
            assert.deepEqual(ast, {
                type: "polynom",
                degree: 42,
                varname: "x",
                args: [
                    {"type": "integer", value: 2},
                    {"type": "identifier", value: "a"}
                ]
            })
        })
    })
})
