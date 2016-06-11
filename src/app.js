import {vertexShader, genericShader, shaderify} from './shaders.js'

export default class Fajitas {
    constructor(){
        /* Initialize context and compile shaders */
        let canvas = document.getElementById('canvas')

        this.impl = 'C + Zn^2';
        this.n_iter = 128
        this.gl = twgl.getWebGLContext(canvas)

        /* Initialize variables */
        let arrays = {
            position: [-1, -1, 0, 1, -1, 0, -1, 1, 0,
                       -1,  1, 0, 1, -1, 0,  1, 1, 0],
        }
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, arrays)
        this.uniforms = {
            zoom: 1,
            center: [-1.0, 0],
            scale: [1.92, -1.08]
        }
        this.fromCoordinates(window.location.hash.substring(1))
        this.buildProgram();
        this.update()

        /* Now the canvas is ready, attach events */
        canvas.addEventListener('mousewheel', evt => {
            evt.preventDefault()
            let z = this.uniforms.zoom;
            if (evt.deltaY > 0){
                this.setState('zoom', z*1.125)
            } else {
                this.setState('zoom', z*0.8)
            }
        })

        let drag = {
              active: false,
              fromX: 0, fromY: 0, // Drag start point
                 cX: 0,    cY: 0  // Initial center
        }

        let do_drag = evt => {
            if (drag.active){
                let dx = (1.0 * drag.fromX - evt.clientX)/this.gl.canvas.width
                let dy = (1.0 * evt.clientY - drag.fromY)/this.gl.canvas.height
                let newCenter = [
                    drag.cX + 2 * dx * this.uniforms.zoom * this.uniforms.scale[0],
                    drag.cY + 2 * dy * this.uniforms.zoom * this.uniforms.scale[1]
                ]
                this.setState('center', newCenter)
            }
        }

        canvas.addEventListener('mousedown', evt => {
            drag.active = true
            drag.fromX = evt.clientX
            drag.fromY = evt.clientY
            drag.cX = this.uniforms.center[0]
            drag.cY = this.uniforms.center[1]
        })

        canvas.addEventListener('mousemove', do_drag)
        canvas.addEventListener('mouseup', evt => {
            do_drag(evt)
            drag.active = false
        })

        document.addEventListener('keydown', evt => {
            if (evt.code == 'NumpadAdd'){
                this.n_iter *= 2
            } else if (evt.code == 'NumpadSubtract') {
                this.n_iter /= 2
            } else if (evt.code == 'Numpad1') {
                this.impl = 'C + Zn^2'
            } else if (evt.code == 'Numpad2') {
                this.impl = 'C + |Zn|^2'
            } else {
                console.log(evt.code)
                return
            }

            this.buildProgram()
            this.update()
        })
    }

    fromCoordinates(coords){
        let s = coords.split(',').map(e => parseFloat(e))
        let err = s.reduce((acc, x) => acc || isNaN(x), false)
        if (! err){
            let [i, z, x, y] = s
            this.uniforms.zoom = z
            this.uniforms.center = [x, y]
            this.n_iter = i;
        }
    }

    buildProgram(){
        shaderify(this.impl).then(expr => {
            let vertex = vertexShader()
            let fragment = genericShader(expr, this.n_iter)
            let shaders = [vertex, fragment]
            this.programInfo = twgl.createProgramInfo(this.gl, shaders)
        }).catch(alert)
    }

    setState(key, val){
        this.uniforms[key] = val
        this.update()
    }

    render(){
        twgl.resizeCanvasToDisplaySize(this.gl.canvas)
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
        
        this.gl.useProgram(this.programInfo.program)
        twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo)
        twgl.setUniforms(this.programInfo, this.uniforms)
        twgl.drawBufferInfo(this.gl, this.gl.TRIANGLES, this.bufferInfo)
    }

    update(){
        let [x, y] = this.uniforms.center
        let z = this.uniforms.zoom
        window.location.hash = `${this.n_iter},${z},${x},${y}`
        requestAnimationFrame(t => this.render());
    }
}

new Fajitas()
