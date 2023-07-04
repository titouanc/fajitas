module Complex exposing (Complex, abs, add, div, exp, fromImag, fromReal, isI, isOne, isZero, mul, neg, pow, sub, toString)


type alias Complex =
    { real : Float, imag : Float }


type alias Polar =
    { rho : Float, theta : Float }


toPolar : Complex -> Polar
toPolar { real, imag } =
    let
        rho =
            real * real + imag * imag |> sqrt
    in
    { theta = acos (real / rho), rho = rho }


fromPolar : Polar -> Complex
fromPolar { rho, theta } =
    { real = rho * cos theta, imag = rho * sin theta }


isZero : Complex -> Bool
isZero c =
    c.real == 0.0 && c.imag == 0.0


isOne : Complex -> Bool
isOne c =
    c.real == 1.0 && c.imag == 0.0


isI : Complex -> Bool
isI c =
    c.real == 0.0 && c.imag == 1.0


isReal : Complex -> Bool
isReal c =
    c.imag == 0.0


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
        "(" ++ String.fromFloat num.real ++ " + " ++ String.fromFloat num.imag ++ "i" ++ ")"


abs : Complex -> Complex
abs { real, imag } =
    { real = Basics.abs real, imag = Basics.abs imag }


neg : Complex -> Complex
neg { real, imag } =
    { real = -real, imag = -imag }


add : Complex -> Complex -> Complex
add left right =
    { real = left.real + right.real, imag = left.imag + right.imag }


sub : Complex -> Complex -> Complex
sub left right =
    { real = left.real - right.real, imag = left.imag - right.imag }


mul : Complex -> Complex -> Complex
mul left right =
    { real = left.real * right.real - left.imag * right.imag
    , imag = left.real * right.imag + left.imag * right.real
    }


div : Complex -> Complex -> Complex
div left right =
    let
        d =
            right.real * right.real + right.imag * right.imag
    in
    { real = (left.real * right.real + left.imag * right.imag) / d
    , imag = (left.imag * right.real - left.real * right.imag) / d
    }


exp : Complex -> Complex
exp { real, imag } =
    fromPolar { rho = Basics.e ^ real, theta = imag }


log : Complex -> Complex
log num =
    let
        { rho, theta } =
            toPolar num
    in
    { real = Basics.logBase Basics.e rho, imag = theta }


pow : Complex -> Complex -> Complex
pow left right =
    mul (log left) right |> exp
