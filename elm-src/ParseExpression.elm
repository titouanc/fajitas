module ParseExpression exposing (parseExpression)

import Complex
import Expression exposing (BinaryOp(..), Expression(..), Keyword(..), UnaryOp(..))
import Parser as P exposing ((|.), (|=))


polynomial : P.Parser Expression
polynomial =
    P.succeed Expression.Polynom
        |. P.symbol "@"
        |= P.lazy (\_ -> termExpression)
        |= P.sequence
            { start = "["
            , end = "]"
            , separator = ","
            , spaces = P.spaces
            , item = P.lazy (\_ -> additive)
            , trailing = P.Forbidden
            }
        |= P.oneOf [ P.int, P.succeed 0 ]
        |> P.map Poly


termExpression : P.Parser Expression
termExpression =
    P.oneOf
        [ parenthesized
        , abs
        , neg
        , polynomial
        , P.map Keyword keyword
        , P.map Number complex
        ]


neg : P.Parser Expression
neg =
    P.succeed Expression.UnaryExpression
        |. P.symbol "-"
        |= P.commit Neg
        |. P.spaces
        |= P.lazy (\_ -> termExpression)
        |> P.map Unary


abs : P.Parser Expression
abs =
    P.succeed Expression.UnaryExpression
        |. P.symbol "|"
        |= P.commit Abs
        |. P.spaces
        |= P.lazy (\_ -> additive)
        |. P.spaces
        |. P.symbol "|"
        |> P.map Unary


parenthesized : P.Parser Expression
parenthesized =
    P.succeed identity
        |. P.symbol "("
        |. P.spaces
        |= P.lazy (\_ -> additive)
        |. P.spaces
        |. P.symbol ")"


additive : P.Parser Expression
additive =
    P.oneOf [ P.backtrackable additive__, substractive ]


additive__ : P.Parser Expression
additive__ =
    P.succeed Expression.BinaryExpression
        |= substractive
        |. P.spaces
        |. P.symbol "+"
        |= P.commit Add
        |. P.spaces
        |= P.lazy (\_ -> additive)
        |> P.map Binary


substractive : P.Parser Expression
substractive =
    P.oneOf [ P.backtrackable substractive__, multiplicative ]


substractive__ : P.Parser Expression
substractive__ =
    P.succeed Expression.BinaryExpression
        |= multiplicative
        |. P.spaces
        |. P.symbol "-"
        |= P.commit Sub
        |. P.spaces
        |= P.lazy (\_ -> substractive)
        |> P.map Binary


multiplicative : P.Parser Expression
multiplicative =
    P.oneOf [ P.backtrackable multiplicative__, divide ]


multiplicative__ : P.Parser Expression
multiplicative__ =
    P.succeed Expression.BinaryExpression
        |= divide
        |. P.spaces
        |. P.symbol "*"
        |= P.commit Mul
        |. P.spaces
        |= P.lazy (\_ -> multiplicative)
        |> P.map Binary


divide : P.Parser Expression
divide =
    P.oneOf [ P.backtrackable divide__, exponent ]


divide__ : P.Parser Expression
divide__ =
    P.succeed Expression.BinaryExpression
        |= exponent
        |. P.spaces
        |. P.symbol "/"
        |= P.commit Div
        |. P.spaces
        |= P.lazy (\_ -> divide)
        |> P.map Binary


exponent : P.Parser Expression
exponent =
    P.oneOf [ P.backtrackable exponent__, termExpression ]


exponent__ : P.Parser Expression
exponent__ =
    P.succeed Expression.BinaryExpression
        |= termExpression
        |. P.spaces
        |. P.symbol "^"
        |= P.commit Exp
        |. P.spaces
        |= P.lazy (\_ -> exponent)
        |> P.map Binary


keyword : P.Parser Keyword
keyword =
    P.oneOf
        [ P.keyword "Zn" |> P.map (\_ -> Zn)
        , P.keyword "C" |> P.map (\_ -> C)
        ]


number : P.Parser Float
number =
    P.number { int = Just toFloat, hex = Nothing, octal = Nothing, binary = Nothing, float = Just identity }


real : P.Parser Complex.Complex
real =
    number |> P.map Complex.fromReal


imag : P.Parser Complex.Complex
imag =
    P.oneOf
        [ P.keyword "i" |> P.map (\_ -> Complex.fromImag 1.0)
        , (number |. P.keyword "i") |> P.map Complex.fromImag
        ]


complex : P.Parser Complex.Complex
complex =
    P.oneOf [ P.backtrackable imag, real ]


expression : P.Parser Expression
expression =
    P.succeed identity
        |. P.spaces
        |= additive
        |. P.spaces
        |. P.end


parseExpression : String -> Result (List P.DeadEnd) Expression
parseExpression =
    P.run expression
