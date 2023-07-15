port module Ports exposing (Size, loadProgram, onContextReady, onShaderReady, renderFrame, setupContext, unpackInts)


base : Int
base =
    65536


type alias Size =
    { width : Int, height : Int }


unpackInts : Int -> Maybe Size
unpackInts x =
    if x == 0 then
        Nothing

    else
        Just { width = x // base, height = x |> modBy base }


port onContextReady : (Size -> msg) -> Sub msg


port onShaderReady : (() -> msg) -> Sub msg


type alias LoadProgramCommand =
    { zn_next : String, n_iterations : Int }


port loadProgram : LoadProgramCommand -> Cmd msg


type alias RenderFrameCommand =
    { center : ( Float, Float )
    , scale : Float
    , color0 : ( Float, Float, Float )
    , color1 : ( Float, Float, Float )
    }


port renderFrame : RenderFrameCommand -> Cmd msg


port setupContext : () -> Cmd msg
