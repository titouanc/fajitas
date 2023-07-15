module Expression exposing (BinaryExpression, BinaryOp(..), Expression(..), Keyword(..), Polynom, UnaryExpression, UnaryOp(..), expandPoly, polyFreeValue, toString)

import Complex exposing (Complex)


type Keyword
    = Zn
    | C


type UnaryOp
    = Abs
    | Neg


type alias UnaryExpression =
    { op : UnaryOp, expr : Expression }


type BinaryOp
    = Add
    | Sub
    | Mul
    | Div
    | Exp


type alias BinaryExpression =
    { left : Expression, op : BinaryOp, right : Expression }


type alias Polynom =
    { variable : Expression, terms : List Expression, degree : Int }


type Expression
    = Keyword Keyword
    | Number Complex
    | Unary UnaryExpression
    | Binary BinaryExpression
    | Poly Polynom


unaryToString : UnaryExpression -> String
unaryToString { op, expr } =
    case op of
        Neg ->
            "-(" ++ toString expr ++ ")"

        Abs ->
            "|" ++ toString expr ++ "|"


binaryToString : BinaryExpression -> String
binaryToString { op, left, right } =
    let
        optext =
            case op of
                Add ->
                    " + "

                Sub ->
                    " - "

                Mul ->
                    " * "

                Div ->
                    " / "

                Exp ->
                    "^"
    in
    "(" ++ toString left ++ optext ++ toString right ++ ")"


expandPoly : Polynom -> Expression
expandPoly { variable, terms, degree } =
    let
        max =
            List.length terms + degree - 1

        renderTerm i term =
            Binary
                { left = term
                , op = Mul
                , right =
                    Binary
                        { left = variable
                        , op = Exp
                        , right = max - i |> toFloat |> Complex.fromReal |> Number
                        }
                }
    in
    List.indexedMap renderTerm terms
        |> List.foldl (\l -> \r -> Binary { left = l, op = Add, right = r }) (Complex.fromReal 0 |> Number)


polyFreeValue : Polynom -> Expression
polyFreeValue { terms, degree } =
    if degree > 0 then
        Complex.fromReal 0 |> Number

    else
        List.reverse terms |> List.head |> Maybe.withDefault (Complex.fromReal 0 |> Number)


polyToString : Polynom -> String
polyToString { variable, terms, degree } =
    let
        max =
            List.length terms + degree - 1

        renderTerm i term =
            case max - i of
                0 ->
                    toString term

                1 ->
                    toString term ++ "*" ++ toString variable

                n ->
                    toString term ++ "*" ++ toString variable ++ "^" ++ String.fromInt n
    in
    List.indexedMap renderTerm terms |> String.join " + "


toString : Expression -> String
toString expr =
    case expr of
        Keyword Zn ->
            "Zn"

        Keyword C ->
            "C"

        Number x ->
            Complex.toString x

        Unary un ->
            unaryToString un

        Binary bin ->
            binaryToString bin

        Poly p ->
            "(" ++ polyToString p ++ ")"
