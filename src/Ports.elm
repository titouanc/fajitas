port module Ports exposing (Size, onWebGLReady, setShader, unpackInts)


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


port onWebGLReady : (Int -> msg) -> Sub msg


port setShader : String -> Cmd msg
