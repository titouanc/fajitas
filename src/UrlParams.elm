module UrlParams exposing (UrlParams, fromString, toString)

import Color exposing (Color)
import Utils

type alias UrlParams =
    { equation : Maybe String
    , center : Maybe ( Float, Float )
    , scale : Maybe Float
    , color0 : Maybe Color
    , color1 : Maybe Color
    , iterations : Maybe Int
    }


toString : UrlParams -> String
toString params =
    let
        toQ name f = Maybe.map (\x -> [name ++ "=" ++ (f x)]) >> Maybe.withDefault []
        p = List.concat
            [ toQ "e" identity params.equation
            , toQ "s" Debug.toString params.scale
            , toQ "c" Debug.toString params.center
            , toQ "c0" (Utils.toCssHex >> String.slice 1 6) params.color0
            , toQ "c1" (Utils.toCssHex >> String.slice 1 6) params.color1
            , toQ "i" String.fromInt params.iterations
            ]
    in String.join "," p



fromString : String -> UrlParams
fromString repr =
    { equation = Nothing
    , center = Nothing
    , scale = Nothing
    , color0 = Nothing
    , color1 = Nothing
    , iterations = Nothing
    }
