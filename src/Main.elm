module Main exposing (..)

import Bootstrap.CDN as CDN
import Bootstrap.Dropdown as Dropdown
import Bootstrap.Form.Input as Input
import Bootstrap.Form.InputGroup as InputGroup
import Bootstrap.Grid as Grid
import Bootstrap.Navbar as Navbar
import Browser
import Browser.Events as BrowserEvents
import Browser.Navigation as Nav
import Color exposing (Color)
import Complex
import Debug
import Expression exposing (BinaryOp(..), Expression(..), Keyword(..), UnaryOp(..))
import Expression.Parse exposing (parseExpression)
import Expression.Shader exposing (toShader)
import Expression.Simplify exposing (simplify)
import Html exposing (Html)
import Html.Attributes as Attr
import Html.Events as Events
import Html.Events.Extra.Mouse as Mouse
import Html.Events.Extra.Wheel as Wheel
import Ports
import Url
import UrlParams exposing (UrlParams)
import Utils


type alias Flags =
    {}


type ColorRef
    = Color0
    | Color1


type Msg
    = NoMsg
    | NavbarMsg Navbar.State
    | DropdownMsg Dropdown.State
    | ChangeEquation String
    | ContextReady Ports.ReadyContext
    | ShaderReady ()
    | GrabStart ( Float, Float )
    | GrabMove ( Float, Float )
    | GrabEnd ( Float, Float )
    | ZoomIn ( Float, Float )
    | ZoomOut ( Float, Float )
    | SetColor ColorRef String
    | SetIterations String
    | LoadUrlFragment UrlParams


type alias Model =
    { nav : Navbar.State
    , dropdown : Dropdown.State
    , equation : String
    , center : ( Float, Float )
    , scale : Float
    , grab : Maybe ( Float, Float )
    , renderContext : Maybe Ports.ReadyContext
    , color0 : Color
    , color1 : Color
    , key : Nav.Key
    , urlFrag : String
    , iterations : Int
    }


getUrlParams : Model -> UrlParams
getUrlParams model =
    { equation = Just model.equation
    , center = Just model.center
    , scale = Just model.scale
    , color0 = Just model.color0
    , color1 = Just model.color1
    , iterations = Just model.iterations
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
            , dropdown = Dropdown.initialState
            , equation = initialEquation
            , scale = 2
            , center = ( -0.5, 0 )
            , grab = Nothing
            , renderContext = Nothing
            , color0 = Color.rgb 0.55 0.06 0.06
            , color1 = Color.rgb 1.0 0.75 0.0
            , key = key
            , urlFrag = url.fragment |> Maybe.withDefault ""
            , iterations = 100
            }
    in
    ( model, Cmd.batch [ Ports.setupContext (), cmd ] )


updateShader : Model -> Cmd Msg
updateShader model =
    case parseExpression model.equation of
        Ok expr ->
            Ports.loadProgram { zn_next = toShader expr, n_iterations = model.iterations }

        _ ->
            Cmd.none


tupleRGBf : Color -> ( Float, Float, Float )
tupleRGBf color =
    let
        c =
            Color.toRgba color
    in
    ( c.red, c.green, c.blue )


render : Model -> Cmd Msg
render model =
    Ports.renderFrame
        { center = model.center
        , scale = model.scale
        , color0 = tupleRGBf model.color0
        , color1 = tupleRGBf model.color1
        }


zoomWithFixedPoint : Model -> Float -> ( Float, Float ) -> Model
zoomWithFixedPoint model zoomFactor ( pX, pY ) =
    case ( model.center, model.renderContext ) of
        ( ( cX, cY ), Just { size, aspect_ratio } ) ->
            let
                z =
                    model.scale * (1 - zoomFactor)

                dX =
                    2 * (pX / toFloat size.width - 0.5) * aspect_ratio.width

                dY =
                    2 * (0.5 - pY / toFloat size.height) * aspect_ratio.height
            in
            { model
                | center = ( cX + dX * z, cY + dY * z )
                , scale = model.scale * zoomFactor
            }

        _ ->
            model


grabMove : Model -> ( Float, Float ) -> Model
grabMove model ( toX, toY ) =
    case ( model.center, model.grab, model.renderContext ) of
        ( ( cX, cY ), Just ( fromX, fromY ), Just { size, aspect_ratio } ) ->
            let
                x =
                    cX - 2 * model.scale * aspect_ratio.width * (toX - fromX) / toFloat size.width

                y =
                    cY - 2 * model.scale * aspect_ratio.height * (fromY - toY) / toFloat size.height
            in
            { model | center = ( x, y ) }

        _ ->
            model


update_ : Msg -> Model -> ( Model, Cmd Msg )
update_ msg model =
    case msg of
        NavbarMsg nav ->
            ( { model | nav = nav }, Cmd.none )

        DropdownMsg dropdown ->
            ( { model | dropdown = dropdown }, Cmd.none )

        ContextReady ctx ->
            ( { model | renderContext = Just ctx }, updateShader model )

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
            ( model, grabMove model to |> render )

        GrabEnd to ->
            let
                newModel =
                    grabMove model to
            in
            ( { newModel | grab = Nothing }, render newModel )

        ZoomIn point ->
            let
                newModel =
                    zoomWithFixedPoint model 0.8 point
            in
            ( newModel, render newModel )

        ZoomOut point ->
            let
                newModel =
                    zoomWithFixedPoint model 1.25 point
            in
            ( newModel, render newModel )

        SetColor ref repr ->
            case Utils.fromCssHex repr of
                Just color ->
                    let
                        newModel =
                            case ref of
                                Color0 ->
                                    { model | color0 = color }

                                Color1 ->
                                    { model | color1 = color }
                    in
                    ( newModel, render newModel )

                Nothing ->
                    ( model, Cmd.none )

        LoadUrlFragment urlparams ->
            let
                _ =
                    Debug.log "LoadUrlFragment" urlparams
            in
            ( model, Cmd.none )

        SetIterations str ->
            case String.toInt str of
                Just it ->
                    let
                        newModel =
                            { model | iterations = it }
                    in
                    ( newModel, updateShader newModel )

                _ ->
                    ( model, Cmd.none )

        NoMsg ->
            ( model, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        ( newModel, cmd ) =
            update_ msg model

        urlFrag =
            getUrlParams newModel |> UrlParams.toString
    in
    if urlFrag == model.urlFrag then
        ( newModel, cmd )

    else
        ( { newModel | urlFrag = urlFrag }, Cmd.batch [ cmd, Nav.replaceUrl model.key ("#" ++ urlFrag) ] )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Ports.onContextReady ContextReady
        , Ports.onShaderReady ShaderReady
        ]


onUrlRequest : Browser.UrlRequest -> Msg
onUrlRequest req =
    let
        _ =
            Debug.log "onUrlRequest" req
    in
    NoMsg


onUrlChange : Url.Url -> Msg
onUrlChange =
    .fragment
        >> Maybe.map (UrlParams.fromString >> LoadUrlFragment)
        >> Maybe.withDefault NoMsg


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
            [ InputGroup.span
                []
                [ Dropdown.dropdown
                    model.dropdown
                    { options = []
                    , toggleMsg = DropdownMsg
                    , toggleButton =
                        Dropdown.toggle
                            []
                            [ Html.text "Z"
                            , Html.sub [] [ Html.text "n+1" ]
                            , Html.text " = "
                            ]
                    , items =
                        [ Dropdown.buttonItem
                            []
                            [ Html.input
                                [ Attr.type_ "color"
                                , Attr.value (Utils.toCssHex model.color0)
                                , Events.onInput <| SetColor Color0
                                ]
                                []
                            , Html.text " Background"
                            ]
                        , Dropdown.buttonItem
                            []
                            [ Html.input
                                [ Attr.type_ "color"
                                , Attr.value (Utils.toCssHex model.color1)
                                , Events.onInput <| SetColor Color1
                                ]
                                []
                            , Html.text " Foreground"
                            ]
                        , Dropdown.buttonItem
                            []
                            [ Html.input
                                [ Attr.type_ "range"
                                , Attr.min "1"
                                , Attr.max "1000"
                                , Attr.value (String.fromInt model.iterations)
                                , Events.onInput SetIterations
                                ]
                                []
                            , Html.text <| " Iterations: " ++ String.fromInt model.iterations
                            ]
                        ]
                    }
                ]
            ]
        |> InputGroup.view


navBar : Model -> Html Msg
navBar model =
    Navbar.config NavbarMsg
        |> Navbar.dark
        |> Navbar.withAnimation
        |> Navbar.brand [ Attr.href "#" ] [ Html.text "🌶️ Fajitas" ]
        |> Navbar.items
            []
        |> Navbar.customItems
            [ Navbar.formItem [] [ equationInput model ] ]
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
