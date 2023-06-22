module Complex exposing (Complex, add, fromImag, fromReal, isI, isOne, isZero, toString)


type alias Complex =
    { real : Float, imag : Float }


isZero : Complex -> Bool
isZero c =
    c.real == 0.0 && c.imag == 0.0


isOne : Complex -> Bool
isOne c =
    c.real == 1.0 && c.imag == 0.0


isI : Complex -> Bool
isI c =
    c.real == 0.0 && c.imag == 1.0


fromImag : Float -> Complex
fromImag imag =
    { real = 0, imag = imag }


fromReal : Float -> Complex
fromReal real =
    { real = real, imag = 0 }


toString : Complex -> String
toString num =
    if num.real == 0.0 then
        if num.imag == 0.0 then
            "0"

        else
            String.fromFloat num.imag ++ "i"

    else if num.imag == 0.0 then
        String.fromFloat num.real

    else
        String.fromFloat num.real ++ " + " ++ String.fromFloat num.imag ++ "i"


add : Complex -> Complex -> Complex
add left right =
    { real = left.real + right.real, imag = left.imag + right.imag }
