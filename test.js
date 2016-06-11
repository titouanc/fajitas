import assert from 'assert'
import {Literal, Infix, Prefix} from './src/parsetree.js'
import parse from './src/mathparser.js'
import {mul2CMul, exp2mul, shaderPipeline} from './src/transformations.js'

function infixMulToCMul(node){
  if (node.op == '*' && node.infix){
    return Prefix('CMul', ...node.args)
  }
}

describe('Parse Tree', () => {
  it("should wrap args as literals", () => {
    let t = Infix('+', 3, 4)
    assert(t.args[0].isLitteral())
    assert(t.args[1].isLitteral())
  })

  describe('rendering', () => {
    it("should render infix operators", () => {
      let t = Infix('+', 42, 7)
      assert.equal(t.render(), '(42 + 7)')
    })

    it("should render prefix calls", () => {
      let t = Prefix('abs', -42)
      assert.equal(t.render(), 'abs(-42)')
    })

    it("should render variables", () => {
      let t = Literal('z')
      assert.equal(t.render(), 'z')
    })

    it("should render constants", () => {
      let t = Literal(42)
      assert.equal(t.render(), '42')
    })
  })

  describe('equality', () => {
    it("should equals Literal constants", () => {
      assert(Literal(3).equals(Literal(3)))
      assert(! Literal(3).equals(Literal(4)))
      assert(! Literal(3).equals(Prefix('f', 4)))
    })

    it("should equals Literal variables", () => {
      assert(Literal("variable").equals(Literal("variable")))
      assert(! Literal("variable").equals(Literal("constant")))
      assert(! Literal("variable").equals(Prefix('f', 4)))
    })

    it("should equals infix operations", () => {
      assert(Infix('+', 3, 4).equals(Infix('+', 3, 4)))
      assert(! Infix('+', 3, 4).equals(Infix('+', 7, 4)), "Different operands")
      assert(! Infix('+', 3, 4).equals(Infix('-', 3, 4)), "Different operation")
      assert(! Infix('+', 3, 4).equals(Prefix('+', 3, 4)), "Different order")
    })

    it("should equals prefix operations", () => {
      assert(Prefix('+', 3, 4).equals(Prefix('+', 3, 4)))
      assert(! Prefix('+', 3, 4).equals(Prefix('+', 7, 4)), "Different operands")
      assert(! Prefix('+', 3, 4).equals(Prefix('-', 3, 4)), "Different operation")
      assert(! Prefix('+', 3, 4).equals(Infix('+', 3, 4)), "Different order")
    })
  })

  describe('transformations', () => {
    it("should be equal with nothing", () => {
      let expr = Infix('*', Infix('+', 1, 2), 3)
      assert(expr.transform(x => {}).equals(expr))
    })

    it("should convert multiplications to CMul", () => {
      let expr = Infix('*', 3, 4).transform(infixMulToCMul)
      assert.deepEqual(expr, Prefix('CMul', 3, 4))
    })

    it("should find nodes", () => {
      let expr = Prefix('f', 'a', 3, 'b')
      let vars = expr.find(x => (! x.call) && isNaN(parseInt(x.op)))
      assert.equal(vars.length, 2)
      assert(Literal('a').equals(vars[0]))
      assert(Literal('b').equals(vars[1]))
    })
  })
})

describe('Math parser', () => {
  describe('atoms', () => {
    it("should parse Literal constants", () => {
      let expr = parse("3")
      assert.deepEqual(expr, Literal(3))
    })

    it("should parse Literal symbols", () => {
      let expr = parse("variable")
      assert.deepEqual(expr, Literal('variable'))
    })

    it("should parse addition", () => {
      let expr = parse("3 + 4")
      assert.deepEqual(expr, Infix('+', 3, 4))
    })

    it("should parse substraction", () => {
      let expr = parse("3 - 4")
      assert.deepEqual(expr, Infix('-', 3, 4))
    })

    it("should parse multiplication", () => {
      let expr = parse("3 * 4")
      assert.deepEqual(expr, Infix('*', 3, 4))
    })

    it("should parse division", () => {
      let expr = parse("3 / 4")
      assert.deepEqual(expr, Infix('/', 3, 4))
    })

    it("should parse exponentiation with ^", () => {
      let expr = parse("3 ^ 4")
      assert.deepEqual(expr, Infix('^', 3, 4))
    })

    it("should parse parenthesis with single content", () => {
      let expr = parse("(3)")
      assert.deepEqual(expr, Literal(3))
    })

    it("should parse parenthesis as argument", () => {
      let expr = parse('3 + (4)')
      assert.deepEqual(expr, Infix('+', Literal(3), Literal(4)))
    })

    it("should parse absolute values", () => {
      let expr = parse("|x|")
      assert.deepEqual(expr, Prefix('abs', 'x'))
    })
  })

  describe('priorities', () => {
    it("should respect priority of + and -", () => {
      let expr = parse("4 - 5 + 3")
      assert.deepEqual(expr, Infix('+', Infix('-', 4, 5), 3))
    })

    it("should respect priotity of * and +", () => {
      let expr = parse("3*4 + 6*7")
      assert(expr.equals(Infix('+', Infix('*', 3, 4),
                                        Infix('*', 6, 7))))
    })

    it("should respect priotity of + and *", () => {
      let expr = parse("3 + 4*6 + 7")
      assert.deepEqual(expr, Infix('+', Infix('+', 3, Infix('*', 4, 6)), 7))
    })

    it("should respect priority of * and /", () => {
      let expr = parse("3 / 4 * 2")
      assert(expr.equals(Infix('*', Infix('/', 3, 4),
                                        2)))
    })

    it("should respect priority of ^ and +", () => {
      let expr = parse("1 + 2^3")
      assert.deepEqual(expr, Infix('+', 1, Infix('^', 2, 3)))
    })

    it("should respect priority of ^ and *", () => {
      let expr = parse("1 * 2^3")
      assert.deepEqual(expr, Infix('*', 1, Infix('^', 2, 3)))
    })

    it("should respect priority of parenthesis", () => {
      let expr = parse("3 * (4 + 6)")
      assert.deepEqual(expr, Infix('*', 3, Infix('+', 4, 6)))
    })

    it("should parse recursive expressions", () => {
      let expr = parse('(2 * (3 * (4 * 5)))')
      assert(expr.equals(Infix('*', 2,
                         Infix('*', 3,
                         Infix('*', 4, 5)))))
    })

    it("should respect priority of |abs|", () => {
      let expr = parse('3 + |2 - 4|')
      assert.deepEqual(expr, Infix('+', 3, Prefix('abs', Infix('-', 2, 4))))
    })
  })

  describe('exceptions', () => {
    it("should throw an exception on empty string", () => {
      assert.throws(() => parse(""))
    })

    it("should throw an exception on unmatched parenthesis", () => {
      assert.throws(() => parse("(32 + 5"))
    })

    it("should throw an exception on unmatched |", () => {
      assert.throws(() => parse("|a"))
    })
  })

  describe('groupers', () => {
    it("should parse parenthesis with op inside", () => {
      let expr = parse("(3 + 4)")
      assert.deepEqual(expr, Infix('+', 3, 4))
    })

    it("should parse infix with parenthesis head", () => {
      let expr = parse('(3 + 4) * 2')
      assert.deepEqual(expr, Infix('*', Infix('+', 3, 4), 2))
    })

    it("should parse infix with |abs| head", () => {
      let expr = parse('|3 - 4| * 2')
      assert.deepEqual(expr, Infix('*', Prefix('abs', Infix('-', 3, 4)), 2))
    })
  })
})

describe('Transformations', () => {
  it("should convert exponentiation to multiplications", () => {
    let expr = parse('2 ^ 5').transform(exp2mul)
    let res = parse('2*2*2*2*2')
    assert(res.equals(expr))
  })

  it("should convert * to CMul", () => {
    let expr = parse('2 * 5').transform(mul2CMul)
    let res = Prefix('CMul', 2, 5)
    assert(res.equals(expr))
  })

  describe('shader generation', () => {
    it("should render the Mandelbrodt function from its definition", () => {
      let expr = parse("C + Zn^2")
      let statement = shaderPipeline(expr)
      assert.equal(statement.render(), '((C . xy) + CMul(Zn, Zn))')
    })

    it("should render the Burning Ship function from its definition", () => {
      let expr = parse("C + |Zn|^2")
      let statement = shaderPipeline(expr)
      assert.equal(statement.render(), '((C . xy) + CMul(abs(Zn), abs(Zn)))')
    })
  })
})
