module Expression.Shader exposing (toShader)

import Expression
    exposing
        ( BinaryExpression
        , BinaryOp(..)
        , Expression(..)
        , Keyword
        , UnaryExpression
        , UnaryOp(..)
        )
import Expression.Simplify exposing (simplify)


toShader : Expression -> String
toShader expression =
    case simplify expression of
        Keyword k ->
            Debug.toString k

        Number { real, imag } ->
            "vec2(" ++ String.fromFloat real ++ "," ++ String.fromFloat imag ++ ")"

        Unary { op, expr } ->
            case op of
                Abs ->
                    "abs(" ++ toShader expr ++ ")"

                Neg ->
                    "-(" ++ toShader expr ++ ")"

        Binary { left, op, right } ->
            case op of
                Add ->
                    "(" ++ toShader left ++ " + " ++ toShader right ++ ")"

                Sub ->
                    "(" ++ toShader left ++ " - " ++ toShader right ++ ")"

                Mul ->
                    "cxmul(" ++ toShader left ++ "," ++ toShader right ++ ")"

                Div ->
                    "cxdiv(" ++ toShader left ++ "," ++ toShader right ++ ")"

                Exp ->
                    "cxpow(" ++ toShader left ++ "," ++ toShader right ++ ")"

        Poly p ->
            Expression.expandPoly p |> simplify |> toShader
