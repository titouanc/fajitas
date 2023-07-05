module TestParseExpression exposing (..)

import Complex
import Expect exposing (Expectation)
import Expression exposing (BinaryOp(..), Expression(..), Keyword(..), UnaryOp(..))
import Expression.Parse exposing (parseExpression)
import Fixture exposing (..)
import Test exposing (Test)


expressions_to_test : List ( String, List ( String, Expression ) )
expressions_to_test =
    [ ( "Numbers and variables"
      , [ ( "3", real 3 )
        , ( "-1", un Neg (real 1) )
        , ( "12i", im 12 )
        , ( "Zn", key Zn )
        , ( "C", key C )
        ]
      )
    , ( "Addition/soustraction"
      , [ ( "3 + 2i", bin (real 3) Add (im 2) )
        , ( "3 - 2i", bin (real 3) Sub (im 2) )
        , ( "Zn + C + 1", bin (bin (key Zn) Add (key C)) Add (real 1) )
        , ( "Zn - C - 1", bin (bin (key Zn) Sub (key C)) Sub (real 1) )
        , ( "Zn + C - 1", bin (bin (key Zn) Add (key C)) Sub (real 1) )
        , ( "Zn - C + 1", bin (bin (key Zn) Sub (key C)) Add (real 1) )
        ]
      )
    , ( "grouping"
      , [ ( "(Zn)", key Zn )
        , ( "|Zn|", un Abs (key Zn) )
        , ( "Zn - (3 + 2i)", bin (key Zn) Sub (bin (real 3) Add (im 2)) )
        , ( "Zn^2 + C", mandelbrot )
        , ( "|Zn|^2 + C / 3", bin (bin (un Abs (key Zn)) Exp (real 2)) Add (bin (key C) Div (real 3)) )
        ]
      )
    , ( "polynomials"
      , [ ( "@Zn[1, 2, 3]", poly123Zn )
        , ( "@Zn[6, 5, 4]3", poly6543Zn )
        , ( "@3.14[1, 2, 3]", poly123 (real 3.14) )
        , ( "@|Zn|[1, 2, 3]", poly123 (un Abs (key Zn)) )
        , ( "@(Zn^2 + C)[1, 2, 3]", poly123 mandelbrot )
        ]
      )
    , ( "operations on polynomials"
      , [ ( "2 + @Zn[1, 2, 3]", bin (real 2) Add poly123Zn )
        , ( "@Zn[1, 2, 3] / @Zn[6, 5, 4]3", bin poly123Zn Div poly6543Zn )
        , ( "2 + @Zn[1, 2, 3] / @Zn[6, 5, 4]3", bin (real 2) Add (bin poly123Zn Div poly6543Zn) )
        ]
      )
    ]


toTestCase : ( String, Expression ) -> Test
toTestCase ( name, expected ) =
    let
        expect _ =
            case parseExpression name of
                Ok expr ->
                    Expect.equal (Expression.toString expr) (Expression.toString expected)

                Err err ->
                    Expect.fail (Debug.toString err)
    in
    Test.test name expect


toSuite : ( String, List ( String, Expression ) ) -> Test
toSuite ( category, to_test ) =
    Test.describe category <| List.map toTestCase to_test


suite : Test
suite =
    Test.describe "Parse Expression" <| List.map toSuite expressions_to_test
