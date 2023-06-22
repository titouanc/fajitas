module Main exposing (..)

import Browser
import Complex
import Debug
import Expression exposing (BinaryOp(..), Expression(..), Keyword(..), UnaryOp(..))
import Html exposing (Html)
import Html.Attributes as Attr
import ParseExpression exposing (parseExpression)
import Parser as P exposing ((|.), (|=))


type alias Msg =
    ()


type alias Model =
    { exprs : List ( String, List ( String, Expression ) ) }


init : Model
init =
    let
        im =
            Complex.fromImag >> Number

        real =
            Complex.fromReal >> Number

        key =
            Keyword

        un op expr =
            Expression.UnaryExpression op expr |> Unary

        bin left op right =
            Expression.BinaryExpression left op right |> Binary

        poly var terms deg =
            Expression.Polynom var terms deg |> Poly

        -------------------
        poly123 var =
            poly var [ real 1, real 2, real 3 ] 0

        -- @var[1, 2, 3]
        poly123Zn =
            poly123 (key Zn)

        poly6543 var =
            poly var [ real 6, real 5, real 4 ] 3

        -- @var[6, 5, 4]3
        poly6543Zn =
            poly6543 (key Zn)

        mandelbrot =
            bin (bin (key Zn) Exp (real 2)) Add (key C)

        -- Zn^2 + C
    in
    { exprs =
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
    }


update : Msg -> Model -> Model
update msg model =
    model


viewParseExpr : ( String, Expression ) -> Html Msg
viewParseExpr ( text, expected ) =
    let
        parsed =
            parseExpression text

        parseEmoji =
            case parsed of
                Ok _ ->
                    "✅"

                Err _ ->
                    "🔴"

        checkEmoji =
            case parsed of
                Ok expr ->
                    if expr == expected then
                        "✅"

                    else
                        "🔴"

                Err _ ->
                    "❌"

        parsedText =
            case parsed of
                Ok expr ->
                    Html.code [] [ Expression.toString expr |> Html.text ]

                Err err ->
                    Html.code [] [ Debug.toString err |> Html.text ]
    in
    Html.tr []
        [ Html.th [] [ Html.code [] [ Html.text text ] ]
        , Html.td [] [ Html.text parseEmoji, Html.text " ", parsedText ]
        , Html.td [] [ Html.text checkEmoji, Html.text " ", Html.code [] [ Html.text (Expression.toString expected) ] ]
        ]


viewCategory : ( String, List ( String, Expression ) ) -> List (Html Msg)
viewCategory ( name, expressions ) =
    let
        columns =
            [ "Input", "Parse", "Expected" ]
                |> List.map (Html.text >> List.singleton >> Html.th [])
                |> Html.tr []

        title =
            Html.tr [] [ Html.td [ Attr.colspan 3 ] [ Html.h1 [] [ Html.text name ] ] ]

        rows =
            List.map viewParseExpr expressions
    in
    title :: columns :: rows


view : Model -> Html Msg
view model =
    List.map viewCategory model.exprs
        |> List.foldr (++) []
        |> Html.table []


main =
    Browser.sandbox { init = init, view = view, update = update }
