module TestUtils exposing (..)

import Color exposing (Color)
import Expect exposing (Expectation)
import Test exposing (Test)
import Utils


testEq : a -> a -> Test
testEq expected got =
    Test.test (Debug.toString expected) (\_ -> Expect.equal expected got)


red : Color
red =
    Color.rgb 1.0 0 0


suite : Test
suite =
    Test.describe
        "Utils module"
        [ Test.describe
            "Hex Str <-> Int"
            [ Test.describe
                "fromHex"
                [ testEq 1 (Utils.fromHex "1")
                , testEq 16 (Utils.fromHex "10")
                , testEq 260 (Utils.fromHex "104")
                ]
            , Test.describe
                "toHex"
                [ testEq "1" (Utils.toHex 1)
                , testEq "10" (Utils.toHex 16)
                , testEq "104" (Utils.toHex 260)
                ]
            ]
        , Test.describe
            "Color <-> CSS"
            [ Test.describe
                "toCssHex"
                [ testEq "#ff0000" (Utils.toCssHex red)
                ]
            , Test.describe
                "fromCssHex"
                [ testEq (Just red) (Utils.fromCssHex "#ff0000")
                ]
            ]
        ]
