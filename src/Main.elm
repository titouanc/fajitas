module Main exposing (..)

import Bootstrap.CDN as CDN
import Bootstrap.Grid as Grid
import Bootstrap.Navbar as Navbar
import Browser
import Browser.Navigation as Nav
import Complex
import Debug
import Expression exposing (BinaryOp(..), Expression(..), Keyword(..), UnaryOp(..))
import Expression.Parse exposing (parseExpression)
import Expression.Shader exposing (toShader)
import Expression.Simplify exposing (simplify)
import Html exposing (Html)
import Html.Attributes as Attr
import Ports
import Url


type alias Flags =
    {}


type Msg
    = NoMsg
    | NavbarMsg Navbar.State
    | WebGLReady (Maybe Ports.Size)


type alias Model =
    { nav : Navbar.State, contextSize : Maybe Ports.Size }


init : Flags -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    let
        ( nav, cmd ) =
            Navbar.initialState NavbarMsg
    in
    ( { nav = nav, contextSize = Nothing }, Cmd.batch [ cmd ] )


mandelbrot : Expression
mandelbrot =
    Binary
        { left = Binary { left = Keyword Zn, op = Exp, right = Complex.fromReal 2 |> Number }
        , op = Add
        , right = Keyword C
        }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NavbarMsg nav ->
            ( { model | nav = nav }, Cmd.none )

        WebGLReady size ->
            ( { model | contextSize = size }, Ports.setShader (toShader mandelbrot) )

        _ ->
            ( model, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    Ports.onWebGLReady (Ports.unpackInts >> WebGLReady)


onUrlRequest : Browser.UrlRequest -> Msg
onUrlRequest req =
    NoMsg


onUrlChange : Url.Url -> Msg
onUrlChange url =
    NoMsg


navBar : Model -> Html Msg
navBar model =
    Navbar.config NavbarMsg
        |> Navbar.withAnimation
        |> Navbar.brand [ Attr.href "#" ] [ Html.text "Fajitas" ]
        |> Navbar.items
            [ Navbar.itemLink [ Attr.href "#" ] [ Html.text "Item 1" ]
            , Navbar.itemLink [ Attr.href "#" ] [ Html.text "Item 2" ]
            ]
        |> Navbar.view model.nav


demo : Html Msg
demo =
    let
        rendered =
            Expression.toString mandelbrot
    in
    "Zn+1 = " ++ rendered |> Html.text


view : Model -> Browser.Document Msg
view model =
    { title = "Fajitas"
    , body = [ navBar model, Html.pre [] [ demo ] ]
    }


main =
    Browser.application
        { init = init
        , onUrlChange = onUrlChange
        , onUrlRequest = onUrlRequest
        , subscriptions = subscriptions
        , update = update
        , view = view
        }
