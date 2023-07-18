port module Ports exposing (..)


base : Int
base =
    65536


type alias Size t =
    { width : t, height : t }


type alias ReadyContext =
    { size : Size Int -- The size of the rendering context, in pixels
    , aspect_ratio : Size Float -- The aspect ratio used by the renderer
    }


port onContextReady : (ReadyContext -> msg) -> Sub msg


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
