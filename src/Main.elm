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
import Html.Events.Extra.Mouse as Mouse
import Html.Events.Extra.Wheel as Wheel
import Ports
import Url


type alias Flags =
    {}


type Msg
    = NoMsg
    | NavbarMsg Navbar.State
    | ChangeEquation String
    | ContextReady Ports.Size
    | ShaderReady ()
    | GrabStart ( Float, Float )
    | GrabMove ( Float, Float )
    | GrabEnd ( Float, Float )
    | ZoomIn
    | ZoomOut


type alias Model =
    { nav : Navbar.State
    , equation : String
    , center : ( Float, Float )
    , scale : Float
    , grab : Maybe ( Float, Float )
    , size : Maybe Ports.Size
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
            , grab = Nothing
            , size = Nothing
            }
    in
    ( model, Cmd.batch [ Ports.setupContext (), cmd ] )


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
        , color0 = ( 0.55, 0.06, 0.06 )
        , color1 = ( 1.0, 0.75, 0.0 )
        }


translateCenter : Model -> ( Float, Float ) -> ( Float, Float ) -> ( Float, Float )
translateCenter model ( fromX, fromY ) ( toX, toY ) =
    let
        s =
            Maybe.withDefault { width = 1, height = 1 } model.size

        x =
            Tuple.first model.center - 2 * model.scale * (toX - fromX) / toFloat s.width

        y =
            Tuple.second model.center - 2 * model.scale * (toY - fromY) / toFloat s.height
    in
    ( x, y )


mouseMove : ( Float, Float ) -> Model -> Model
mouseMove ( toX, toY ) model =
    case ( model.grab, model.size ) of
        ( Just ( fromX, fromY ), Just { width, height } ) ->
            let
                x =
                    Tuple.first model.center - 2 * model.scale * (toX - fromX) / toFloat width

                y =
                    Tuple.second model.center - 2 * model.scale * (toY - fromY) / toFloat height
            in
            { model | center = ( x, y ) }

        _ ->
            model


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NavbarMsg nav ->
            ( { model | nav = nav }, Cmd.none )

        ContextReady size ->
            ( { model | size = Just size }, updateShader model )

        ShaderReady _ ->
            ( model, render model )

        ChangeEquation text ->
            let
                newModel =
                    { model | equation = text }
            in
            ( newModel, updateShader newModel )

        GrabStart pos ->
            ( { model | grab = Just pos }, Cmd.none )

        GrabMove to ->
            ( model, mouseMove to model |> render )

        GrabEnd to ->
            let
                newModel =
                    mouseMove to model
            in
            ( { newModel | grab = Nothing }, render newModel )

        ZoomIn ->
            let
                newModel =
                    { model | scale = model.scale * 0.925 }
            in
            ( newModel, render newModel )

        ZoomOut ->
            let
                newModel =
                    { model | scale = model.scale * 1.08 }
            in
            ( newModel, render newModel )

        NoMsg ->
            ( model, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Ports.onContextReady ContextReady
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


filterButtonEvent : (( Float, Float ) -> Msg) -> Mouse.Event -> Msg
filterButtonEvent msg event =
    if event.button == Mouse.MainButton then
        msg event.offsetPos

    else
        NoMsg


view : Model -> Browser.Document Msg
view model =
    let
        mouseEvents =
            case model.grab of
                Nothing ->
                    [ Mouse.onDown <| filterButtonEvent GrabStart ]

                Just _ ->
                    [ Mouse.onMove <| filterButtonEvent GrabMove
                    , Mouse.onUp <| filterButtonEvent GrabEnd
                    ]

        wheelEvents =
            [ Wheel.onWheel
                (\{ deltaY } ->
                    if deltaY > 0 then
                        ZoomOut

                    else
                        ZoomIn
                )
            ]
    in
    { title = "Fajitas"
    , body =
        [ navBar model
        , Html.canvas
            (mouseEvents ++ wheelEvents)
            []
        ]
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
