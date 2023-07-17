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
    | ZoomIn ( Float, Float )
    | ZoomOut ( Float, Float )


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


zoomWithFixedPoint : Model -> Float -> ( Float, Float ) -> Model
zoomWithFixedPoint model zoomFactor ( pX, pY ) =
    case ( model.center, model.size ) of
        ( ( cX, cY ), Just { width, height } ) ->
            let
                aspectRatio =
                    toFloat width / toFloat height

                z1 =
                    model.scale

                z2 =
                    model.scale * zoomFactor

                x =
                    cX + 2 * aspectRatio * (0.5 - pX / toFloat width) * (z2 - z1)

                y =
                    cY + 2 * (0.5 - pY / toFloat height) * (z2 - z1)
            in
            { model | center = ( x, y ), scale = z2 }

        _ ->
            model


mouseMove : Model -> ( Float, Float ) -> Model
mouseMove model ( toX, toY ) =
    case ( model.center, model.grab, model.size ) of
        ( ( cX, cY ), Just ( fromX, fromY ), Just { width, height } ) ->
            let
                aspectRatio =
                    toFloat width / toFloat height

                x =
                    cX - 2 * model.scale * aspectRatio * (toX - fromX) / toFloat width

                y =
                    cY - 2 * model.scale * (toY - fromY) / toFloat height
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
            ( model, mouseMove model to |> render )

        GrabEnd to ->
            let
                newModel =
                    mouseMove model to
            in
            ( { newModel | grab = Nothing }, render newModel )

        ZoomIn point ->
            let
                newModel =
                    zoomWithFixedPoint model 0.925 point
            in
            ( newModel, render newModel )

        ZoomOut point ->
            let
                newModel =
                    zoomWithFixedPoint model 1.08 point
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
                (\{ deltaY, mouseEvent } ->
                    if deltaY > 0 then
                        ZoomOut mouseEvent.offsetPos

                    else
                        ZoomIn mouseEvent.offsetPos
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
