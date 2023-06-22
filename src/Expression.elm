module Expression exposing (BinaryExpression, BinaryOp(..), Expression(..), Keyword(..), Polynom, UnaryExpression, UnaryOp(..), toString)

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
                    toString term ++ "x" ++ toString variable

                n ->
                    toString term ++ "x" ++ toString variable ++ "^" ++ String.fromInt n
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
