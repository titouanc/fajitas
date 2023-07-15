const complexLib = `
    float cxnorm(vec2 cartesian)
    {
        return sqrt(cartesian.x*cartesian.x + cartesian.y*cartesian.y);
    }

    vec2 fromPolar(vec2 polar)
    {
        return vec2(polar.y*cos(polar.x), polar.y*sin(polar.x));
    }

    vec2 toPolar(vec2 cartesian)
    {
        float rho = cxnorm(cartesian);
        return vec2(acos(cartesian.x / rho), rho);
    }

    vec2 cxmul(vec2 left, vec2 right)
    {
        return vec2(
            left.x*right.x - left.y*right.y,
            left.x*right.y + left.y*right.x
        );
    }

    vec2 cxdiv(vec2 left, vec2 right)
    {
        float d = right.x * right.x + right.y * right.y;
        return vec2(
            (left.x * right.x + left.y * right.y) / d,
            (left.y * right.x - left.x * right.y) / d
        );
    }

    vec2 cxexp(vec2 cartesian)
    {
        return fromPolar(vec2(exp(cartesian.x), cartesian.y));
    }

    vec2 cxlog(vec2 cartesian)
    {
        vec2 polar = toPolar(cartesian);
        return vec2(log(polar.y), polar.x);
    }

    vec2 cxpow(vec2 left, vec2 right)
    {
        if (left == vec2(0, 0)){
            return vec2(0, 0);
        }
        return cxexp(cxmul(cxlog(left), right));
    }
`;

const fragmentShader = ({zn_next, n_iterations}) => `
precision highp float;

${complexLib}

varying vec2 coordinates;

uniform float scale;
uniform vec2 aspect_ratio;
uniform vec2 center;
uniform vec4 color0;
uniform vec4 color1;

void main()
{
    float d = 0.0;
    vec4 dcolor = color1 - color0;
    vec2 C = center + coordinates * scale * aspect_ratio;
    vec2 Zn = vec2(0, 0);
    vec2 Znn = Zn;

    /*
    d = cxnorm(C);
    gl_FragColor = color0 + d * dcolor;
    return;
    */


    int iterations = 0;
    for (int i=0; i<${n_iterations}; i++){
        iterations = i;
        
        Znn = ${zn_next};
        if (cxnorm(Znn - Zn) > 4.0){
            break;
        }
        Zn = Znn;
    }

    d = float(iterations) / float(${n_iterations});
    gl_FragColor = color0 + d * dcolor;
}
`;

const vertexShader = `
precision highp float;

attribute vec2 position;
varying vec2 coordinates;

void main() {
    gl_Position = vec4(position, 0, 1);
    coordinates = position;
}
`;

(() => {
    const app = Elm.Main.init({});

    const nav = document.querySelector("nav");
    const canvas = document.createElement("canvas");
    canvas.setAttribute("height", window.innerHeight);
    canvas.setAttribute("width", window.innerWidth);
    document.body.appendChild(canvas);

    //const canvas = document.querySelector("#the-canvas");
    const gl = canvas.getContext("webgl");
    if (! gl){
        console.error("WebGL is not supported");
        app.ports.onWebGLReady.send(0);
        return;
    }

    const vertices = [
        -1, -1, -1, 1, 1, -1,
        1, -1, -1, 1, 1, 1,
    ];
    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const loadShader = (type, source) => {
        const shader = gl.createShader(type);
        console.log("Load shader");
        console.log(source);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            alert(`Shader compile failed: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    let program = undefined;
    let fsh = undefined;
    const vsh = loadShader(gl.VERTEX_SHADER, vertexShader);

    const renderFrame = ({center, scale, color0, color1}) => {
        console.log(`Render frame ${JSON.stringify({center, scale, color0, color1})} !`);

        gl.uniform1f(
            gl.getUniformLocation(program, "scale"),
            scale
        );

        gl.uniform4fv(
            gl.getUniformLocation(program, "color0"),
            [...color0, 1.0]
        );

        gl.uniform4fv(
            gl.getUniformLocation(program, "color1"),
            [...color1, 1.0]
        );

        gl.uniform2fv(
            gl.getUniformLocation(program, "center"),
            center
        );

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    const loadProgram = (loadProgramCommand) => {
        const shaderCode = fragmentShader(loadProgramCommand);
        if (program !== undefined){
            gl.detachShader(program, vsh);
            gl.detachShader(program, fsh);
            gl.deleteShader(fsh);
            gl.deleteProgram(program);
            program = undefined;
        }

        fsh = loadShader(gl.FRAGMENT_SHADER, shaderCode);
        program = gl.createProgram();
        gl.attachShader(program, fsh);
        gl.attachShader(program, vsh)
        gl.linkProgram(program);
        if (! gl.getProgramParameter(program, gl.LINK_STATUS)){
            alert(`Shader link failed: ${gl.getProgramInfoLog(program)}`);
        }
        gl.useProgram(program);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);

        const coord = gl.getAttribLocation(program, "position");
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coord);

        const W = canvas.width
        const H = canvas.height
        const aspect_ratio_value = (W > H) ? [1, -H/W] : [W/H, -1];
        const aspect_ratio = gl.getUniformLocation(program, "aspect_ratio");
        gl.uniform2fv(aspect_ratio, aspect_ratio_value);

        app.ports.onShaderReady.send(null);
    }

    app.ports.loadProgram.subscribe(loadProgram);
    app.ports.renderFrame.subscribe(renderFrame);
    app.ports.onWebGLReady.send(null);
})();