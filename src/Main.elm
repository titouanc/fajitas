module Main exposing (..)

import Bootstrap.CDN as CDN
import Bootstrap.Form.Input as Input
import Bootstrap.Form.InputGroup as InputGroup
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
    | ChangeEquation String
    | WebGLReady ()
    | ShaderReady ()


type alias Model =
    { nav : Navbar.State
    , equation : String
    , center : ( Float, Float )
    , scale : Float
    }


initialEquation : String
initialEquation =
    "Zn*Zn + C"


init : Flags -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    let
        ( nav, cmd ) =
            Navbar.initialState NavbarMsg

        model =
            { nav = nav
            , equation = initialEquation
            , scale = 2
            , center = ( -0.5, 0 )
            }
    in
    ( model, cmd )


updateShader : Model -> Cmd Msg
updateShader model =
    case parseExpression model.equation of
        Ok expr ->
            Ports.loadProgram { zn_next = toShader expr, n_iterations = 100 }

        _ ->
            Cmd.none


render : Model -> Cmd Msg
render model =
    Ports.renderFrame
        { center = model.center
        , scale = model.scale
        , color0 = ( 0.7, 0.0, 0.0 )
        , color1 = ( 0.7, 0.8, 0.0 )
        }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoMsg ->
            ( model, Cmd.none )

        NavbarMsg nav ->
            ( { model | nav = nav }, Cmd.none )

        WebGLReady _ ->
            ( model, updateShader model )

        ShaderReady _ ->
            ( model, render model )

        ChangeEquation text ->
            let
                newModel =
                    { model | equation = text }
            in
            ( newModel, updateShader newModel )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Ports.onWebGLReady WebGLReady
        , Ports.onShaderReady ShaderReady
        ]


onUrlRequest : Browser.UrlRequest -> Msg
onUrlRequest req =
    NoMsg


onUrlChange : Url.Url -> Msg
onUrlChange url =
    NoMsg


equationInput : Model -> Html Msg
equationInput model =
    InputGroup.config
        (InputGroup.text
            [ Input.placeholder "username"
            , Input.value model.equation
            , Input.onInput ChangeEquation
            ]
        )
        |> InputGroup.large
        |> InputGroup.predecessors
            [ InputGroup.span [] [ Html.text "Z", Html.sub [] [ Html.text "n+1" ], Html.text " = " ] ]
        |> InputGroup.view


navBar : Model -> Html Msg
navBar model =
    Navbar.config NavbarMsg
        |> Navbar.withAnimation
        |> Navbar.brand [ Attr.href "#" ] [ Html.text "Fajitas 🌶️" ]
        |> Navbar.items
            []
        |> Navbar.customItems
            [ Navbar.formItem [] [ equationInput model ]
            ]
        |> Navbar.view model.nav


view : Model -> Browser.Document Msg
view model =
    { title = "Fajitas"
    , body = [ navBar model ]
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
