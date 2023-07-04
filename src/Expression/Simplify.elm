module Expression.Simplify exposing (simplify)

import Complex exposing (Complex)
import Expression as E
    exposing
        ( BinaryExpression
        , BinaryOp(..)
        , Expression(..)
        , Keyword
        , UnaryExpression
        , UnaryOp(..)
        )


foldConstant : Complex -> BinaryOp -> Complex -> Expression
foldConstant left op right =
    case op of
        Add ->
            Complex.add left right |> Number

        Sub ->
            Complex.sub left right |> Number

        Mul ->
            Complex.mul left right |> Number

        Div ->
            Complex.div left right |> Number

        Exp ->
            Complex.pow left right |> Number


simplifyUnary : UnaryExpression -> Expression
simplifyUnary un =
    let
        expr =
            simplify un.expr
    in
    case ( un.op, expr ) of
        ( Neg, Number c ) ->
            Complex.neg c |> Number

        ( Abs, Number c ) ->
            Complex.abs c |> Number

        ( o, e ) ->
            Unary { op = o, expr = e }


simplifyBinary : BinaryExpression -> Expression
simplifyBinary bin =
    let
        left =
            simplify bin.left

        right =
            simplify bin.right

        default =
            Binary { left = left, op = bin.op, right = right }
    in
    case ( left, bin.op, right ) of
        -- Constant folding
        ( Number l, op, Number r ) ->
            foldConstant l op r

        -- Addition
        ( _, Add, Number n ) ->
            if Complex.isZero n then
                left

            else
                default

        ( Number n, Add, _ ) ->
            if Complex.isZero n then
                right

            else
                default

        -- Substraction
        ( _, Sub, Number n ) ->
            if Complex.isZero n then
                left

            else
                default

        -- Multiplication
        ( _, Mul, Number n ) ->
            if Complex.isOne n then
                left

            else if Complex.isZero n then
                right

            else
                default

        ( Number n, Mul, _ ) ->
            if Complex.isOne n then
                right

            else if Complex.isZero n then
                left

            else
                default

        -- Division
        ( _, Div, Number n ) ->
            if Complex.isOne n then
                left

            else
                default

        ( Number n, Div, _ ) ->
            if Complex.isZero n then
                left

            else
                default

        -- Exponentiation
        ( _, Exp, Number n ) ->
            if Complex.isZero n then
                Complex.fromReal 1 |> Number

            else if Complex.isOne n then
                left

            else
                default

        ( Number n, Exp, _ ) ->
            if Complex.isZero n || Complex.isOne n then
                left

            else
                default

        _ ->
            default


simplify : Expression -> Expression
simplify expr =
    case expr of
        Binary bin ->
            simplifyBinary bin

        Unary un ->
            simplifyUnary un

        e ->
            e
