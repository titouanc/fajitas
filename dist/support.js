const fragmentShader = `
    precision highp float;

    varying vec2 coordinates;

    uniform vec2 zoom;
    uniform vec2 center;

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
        return cxexp(cxmul(cxlog(left), right));
    }

    const int MAX_ITERATIONS = 100;

    vec2 recurse(vec2 C, vec2 Zn);

    void main()
    {
        vec2 Zn = vec2(0, 0);
        vec2 C = center + coordinates * zoom;

        float n = cxnorm(C);
        gl_FragColor = vec4(n, n, n, 1.0);
        return;

        int iterations = -1;
        for (int i=0; i<MAX_ITERATIONS; i++){
            Zn = recurse(C, Zn);
            if (cxnorm(Zn) > 4.0){
                iterations = i;
                break;
            }
        }

        if (iterations == -1){
            iterations = MAX_ITERATIONS;
        }

        gl_FragColor = iterations > (MAX_ITERATIONS / 2) ? vec4(1.0, 1.0, 1.0, 1.0) : vec4(0.0, 0.0, 0.0, 1.0);
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

    const canvas = document.createElement("canvas");
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

    const loadProgram = (shaderExpr) => {
        const shaderCode = `${fragmentShader} vec2 recurse(vec2 C, vec2 Zn){return ${shaderExpr};}`
        console.log("Loading program: " + shaderCode);

        if (program !== undefined){
            gl.detachShader(vsh);
            gl.detachShader(fsh);
            gl.deleteShader(fsh);
            gl.deleteProgram(program);
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

        const coord = gl.getAttribLocation(program, "position");
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coord);

        const zoom = gl.getUniformLocation(program, "zoom");
        gl.uniform2fv(zoom, [1, 1]);
        const center = gl.getUniformLocation(program, "center");
        gl.uniform2fv(center, [0, 0]);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    app.ports.setShader.subscribe(loadProgram);
    app.ports.onWebGLReady.send(canvas.clientWidth * 65536 + canvas.clientHeight);
})();