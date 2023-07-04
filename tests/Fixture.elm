module Fixture exposing (..)

import Complex
import Expression exposing (BinaryOp(..), Expression(..), Keyword(..), UnaryOp(..))


im : Float -> Expression
im =
    Complex.fromImag >> Number


real : Float -> Expression
real =
    Complex.fromReal >> Number


key : Keyword -> Expression
key =
    Keyword


un : UnaryOp -> Expression -> Expression
un op expr =
    Expression.UnaryExpression op expr |> Unary


bin : Expression -> BinaryOp -> Expression -> Expression
bin left op right =
    Expression.BinaryExpression left op right |> Binary


poly : Expression -> List Expression -> Int -> Expression
poly var terms deg =
    Expression.Polynom var terms deg |> Poly



-------------------
-- @var[1, 2, 3]


poly123 : Expression -> Expression
poly123 var =
    poly var [ real 1, real 2, real 3 ] 0



-- @Zn[1, 2, 3]


poly123Zn : Expression
poly123Zn =
    poly123 (key Zn)



-- @var[6, 5, 4]3


poly6543 : Expression -> Expression
poly6543 var =
    poly var [ real 6, real 5, real 4 ] 3



-- @Zn[6, 5, 4]3


poly6543Zn : Expression
poly6543Zn =
    poly6543 (key Zn)


mandelbrot : Expression
mandelbrot =
    bin (bin (key Zn) Exp (real 2)) Add (key C)
