module TestSimplifyExpression exposing (..)

import Complex
import Expect exposing (Expectation)
import Expression exposing (BinaryOp(..), Expression(..), Keyword(..), UnaryOp(..))
import Expression.Simplify exposing (simplify)
import Fixture exposing (..)
import Test exposing (Test)


testSimplify : Expression -> Expression -> Test
testSimplify expected expr =
    let
        title =
            Expression.toString expr ++ " -> " ++ Expression.toString expected

        expect _ =
            Expect.equal
                (Expression.toString <| simplify expr)
                (Expression.toString expected)
    in
    Test.test title expect


suite : Test
suite =
    Test.describe
        "Simplify Expression"
        [ Test.describe
            "Atomics cannot be simplified"
            [ testSimplify
                (real 2)
                (real 2)
            , testSimplify
                (key Zn)
                (key Zn)
            ]
        , Test.describe
            "Constant folding on"
            [ Test.describe
                "Real numbers"
                [ testSimplify
                    (real 5)
                    (bin (real 3) Add (real 2))
                , testSimplify
                    (real 1)
                    (bin (real 3) Sub (real 2))
                , testSimplify
                    (real 6)
                    (bin (real 3) Mul (real 2))
                , testSimplify
                    (real 1.5)
                    (bin (real 3) Div (real 2))
                , testSimplify
                    (real -2)
                    (un Neg (real 2))
                , testSimplify
                    (real 2)
                    (un Abs (real -2))
                ]
            , Test.describe
                "Imaginary numbers"
                [ testSimplify
                    (im 5)
                    (bin (im 3) Add (im 2))
                , testSimplify
                    (im 1)
                    (bin (im 3) Sub (im 2))
                , testSimplify
                    (real -6)
                    (bin (im 3) Mul (im 2))
                , testSimplify
                    (real 1.5)
                    (bin (im 3) Div (im 2))
                , testSimplify
                    (im -2)
                    (un Neg (im 2))
                , testSimplify
                    (im 2)
                    (un Abs (im -2))
                ]
            , Test.describe
                "Mixed numbers"
                [ testSimplify
                    (Number { real = 3, imag = 2 })
                    (bin (real 3) Add (im 2))
                ]
            , Test.describe
                "Multiple levels"
                [ testSimplify
                    (Number { real = 1 / 3, imag = 2 / 3 })
                    (un
                        Abs
                        (bin
                            (bin
                                (bin (real -1) Add (im 2))
                                Div
                                (bin (real 3) Add (im 0))
                            )
                            Exp
                            (real 1)
                        )
                    )
                ]
            ]
        , Test.describe
            "Zero is commutatively neutral for addition"
            [ testSimplify
                (key Zn)
                (bin (real 0) Add (key Zn))
            , testSimplify
                (key Zn)
                (bin (key Zn) Add (real 0))
            ]
        , Test.describe
            "Zero is neutral on the right for substraction"
            [ testSimplify
                (bin (real 0) Sub (key Zn))
                (bin (real 0) Sub (key Zn))
            , testSimplify
                (key Zn)
                (bin (key Zn) Sub (real 0))
            ]
        , Test.describe
            "Zero is commutatively absorbing for multiplication"
            [ testSimplify
                (real 0)
                (bin (real 0) Mul (key Zn))
            , testSimplify
                (real 0)
                (bin (key Zn) Mul (real 0))
            ]
        , Test.describe
            "Zero is absorbing on left for division"
            [ testSimplify
                (real 0)
                (bin (real 0) Div (key Zn))
            , testSimplify
                (bin (key Zn) Div (real 0))
                (bin (key Zn) Div (real 0))
            ]
        , Test.describe
            "One is commutatively neutral for multiplication"
            [ testSimplify
                (key Zn)
                (bin (real 1) Mul (key Zn))
            , testSimplify
                (key Zn)
                (bin (key Zn) Mul (real 1))
            ]
        , Test.describe
            "One is neutral on right for division"
            [ testSimplify
                (bin (real 1) Div (key Zn))
                (bin (real 1) Div (key Zn))
            , testSimplify
                (key Zn)
                (bin (key Zn) Div (real 1))
            ]
        , Test.describe
            "Exponentiation by zero or one"
            [ testSimplify
                (real 1)
                (bin (key Zn) Exp (real 0))
            , testSimplify
                (key Zn)
                (bin (key Zn) Exp (real 1))
            ]
        , Test.describe
            "Exponentiation in base zero or one"
            [ testSimplify
                (real 0)
                (bin (real 0) Exp (key Zn))
            , testSimplify
                (real 1)
                (bin (real 1) Exp (key Zn))
            ]
        , Test.describe
            "Mandelbrot is not simplifiable"
            [ testSimplify mandelbrot mandelbrot ]
        , Test.describe
            "Polynoms"
            [ Test.describe
                "Simplify terms"
                [ testSimplify
                    (poly (key Zn) [ real 3, real 2 ] 3)
                    (poly (key Zn) [ bin (real 1) Add (real 2), bin (real 5) Sub (real 3) ] 3)
                ]
            , Test.describe
                "Simplify base"
                [ testSimplify
                    (poly (real 3) [ real 1 ] 3)
                    (poly (bin (real 1) Add (real 2)) [ real 1 ] 3)
                ]
            , Test.describe
                "Polynom of base 0 is its free value"
                [ testSimplify
                    (real 3)
                    (poly (real 0) [ real 1, real 2, real 3 ] 0)
                ]
            ]
        ]
