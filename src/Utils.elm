module Utils exposing (..)

import Color exposing (Color)


intChar : Int -> Char
intChar n =
    if 0 <= n && n <= 9 then
        n + Char.toCode '0' |> Char.fromCode

    else if 10 <= n && n <= 36 then
        (n - 10) + Char.toCode 'a' |> Char.fromCode

    else
        ' '


charInt : Char -> Int
charInt ch =
    let
        c =
            Char.toCode ch
    in
    if Char.toCode 'a' <= c && c <= Char.toCode 'z' then
        10 + c - Char.toCode 'a'

    else if Char.toCode '0' <= c && c <= Char.toCode '9' then
        c - Char.toCode '0'

    else
        -1


fromHex : String -> Int
fromHex =
    let
        newChar c acc =
            16 * acc + charInt c
    in
    String.foldl newChar 0


toHex : Int -> String
toHex value =
    let
        c =
            value |> modBy 16 |> intChar |> String.fromChar

        d =
            value // 16

        e =
            if d == 0 then
                ""

            else
                toHex d
    in
    e ++ c


hexpad : Int -> Int -> String
hexpad padding value =
    let
        repr =
            toHex value

        pad =
            padding - String.length repr

        prefix =
            if pad <= 0 then
                ""

            else
                String.repeat pad "0"
    in
    prefix ++ repr


toCssHex : Color -> String
toCssHex color =
    let
        { red, green, blue } =
            Color.toRgba color

        repr f =
            255 * f |> round |> hexpad 2
    in
    "#" ++ repr red ++ repr green ++ repr blue


fromCssHex : String -> Maybe Color
fromCssHex repr =
    case String.uncons repr of
        Just ( '#', rest ) ->
            let
                parse s =
                    toFloat (fromHex s) / 255.0

                c =
                    { red = String.slice 0 2 rest |> parse
                    , green = String.slice 2 4 rest |> parse
                    , blue = String.slice 4 6 rest |> parse
                    , alpha = 1.0
                    }
            in
            Color.fromRgba c |> Just

        _ ->
            Nothing
