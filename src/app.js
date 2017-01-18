import {vertexShader, genericShader, shaderify} from './shaders.js'
import {color2vec} from './utils.js'
import $ from 'jquery'
import UrlState from './urlstate.js'

let repo = new UrlState({
    eq: "C + Zn^2",
    zoom: 1,
    center: [-1.0, 0.0],
    c0: "#8c1010",
    c1: "#ffc000",
    iters: 200,
})

// This function checks if the specified event is supported by the browser.
// Source: http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
function isEventSupported(eventName) {
    var el = document.createElement('div');
    eventName = 'on' + eventName;
    var isSupported = (eventName in el);
    if (!isSupported) {
        el.setAttribute(eventName, 'return;');
        isSupported = typeof el[eventName] == 'function';
    }
    el = null;
    return isSupported;
}

export default class Fajitas {
    constructor(){
        /* Initialize context and compile shaders */
        let canvas = document.getElementById('canvas')
        this.gl = twgl.getWebGLContext(canvas)

        let S = repo.getState()

        /* Initialize variables */
        let arrays = {
            position: [-1, -1, 0, 1, -1, 0, -1, 1, 0,
                       -1,  1, 0, 1, -1, 0,  1, 1, 0],
        }
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, arrays)        
        this.buildProgram(S)

        /* Canvas is ready; attach events */
        this.initDrag(S, canvas) // move
        this.initZoom(S, canvas) // zoom
        this.initControls(S)   // Peripheral controls

        document.addEventListener('keydown', evt => {
            let iters = repo.getState().iters
            if (evt.code == 'NumpadAdd'){
                repo.setState({iters: 2 * iters})
            } else if (evt.code == 'NumpadSubtract') {
                repo.setState({iters: Math.floor(iters/2)})
            }
        })

        // React on repository changes
        repo.observeAny(["eq", "iters"],
                        state => this.buildProgram(state))
        repo.observeAny(["zoom", "center", "c0", "c1"],
                        state => this.render(state))
    }

    initControls(initialState){
        /* Formula input */
        $('#formula').val(initialState.eq)
        let changeFormula = evt => {
            let text = $('#formula').val()
            $('#formula').popover('destroy')
            repo.setState({eq: text})
        }
        $('#formula').on('change', changeFormula)
                     .on('input', changeFormula)
        
        $('#formula-head').popover({
            html: true,
            content: $('#help-tooltip').html(),
            container: 'body',
            placement: 'bottom',
            trigger: 'hover click',
            delay: {show: 500, hide: 1500}
        }); // This ';' is actually required !

        /* Color inputs */
        $('#color0').val(initialState.c0)
        $('#color1').val(initialState.c1)

        $('#color0').on('input', _ => {
            repo.setState({c0: $('#color0').val()})
        })
        $('#color1').on('input', _ => {
            repo.setState({c1: $('#color1').val()})
        })
    }

    initZoom(initialState, canvas){
        // Weel zoom
        let wheelEvt = isEventSupported('mousewheel') ? 'mousewheel' : 'wheel'
        canvas.addEventListener(wheelEvt, evt => {
            evt.preventDefault()
            let z = repo.getState().zoom;
            if (evt.deltaY > 0){
                repo.setState({zoom: z*1.125})
            } else {
                repo.setState({zoom: z*0.8})
            }
        })

        // Double-click zoom
        canvas.addEventListener('dblclick', evt => {
            evt.preventDefault()
            var z = repo.getState().zoom;
            var i = 0
            let progressive_zoom = _ => {
                z *= 0.9
                repo.setState({zoom: z})
                if (i < 5){
                    setTimeout(progressive_zoom, 25)
                }
                i++;
            }
            progressive_zoom()
        })

        window.addEventListener('resize', evt => {
            this.render(repo.getState())
        })
    }

    initDrag(initialState, canvas){
        let drag = {
              active: false,
              z: initialState.zoom,
              fromX: 0, fromY: 0, // Drag start point
                 cX: 0,    cY: 0  // Initial center
        }

        let do_drag = evt => {
            let z = repo.getState().zoom
            let [sx, sy] = this.getScale()
            if (drag.active){
                let dx = (1.0 * drag.fromX - evt.clientX)/this.gl.canvas.width
                let dy = (1.0 * evt.clientY - drag.fromY)/this.gl.canvas.height
                repo.setState({center: [
                    drag.cX + 2 * dx * z * sx,
                    drag.cY + 2 * dy * z * sy
                ]})
            }
        }

        canvas.addEventListener('mousedown', evt => {
            let state = repo.getState()
            drag.cX = state.center[0]
            drag.cY = state.center[1]
            drag.active = true
            drag.fromX = evt.clientX
            drag.fromY = evt.clientY
            drag.z = state.zoom
        })

        canvas.addEventListener('mousemove', do_drag)
        canvas.addEventListener('mouseup', evt => {
            do_drag(evt)
            drag.active = false
        })
    }

    showFormulaError(error){
        console.error(error)
        $('#formula').popover('destroy')
                     .popover({
                         title: "Error in the formula",
                         content: error,
                         container: 'body',
                         placement: 'bottom',
                         trigger: 'focus click hover',
                         template: $('#error-tooltip').html()})
                     .popover('show')
    }

    buildProgram(state){
        shaderify(state.eq).then(expr => {
            let vertex = vertexShader()
            let fragment = genericShader(expr, state.iters)
            let shaders = [vertex, fragment]
            this.programInfo = twgl.createProgramInfo(this.gl, shaders)
            this.render(state)
        }).catch(err => this.showFormulaError(err))
    }

    getScale(){
        return [2*this.gl.canvas.width/this.gl.canvas.height, -2]
    }

    render(state){
        let uniforms = {
            zoom: state.zoom,
            center: state.center,
            scale: this.getScale(),
            c0: color2vec(state.c0),
            c1: color2vec(state.c1),
        }
        twgl.resizeCanvasToDisplaySize(this.gl.canvas)
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
        
        this.gl.useProgram(this.programInfo.program)
        twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo)
        twgl.setUniforms(this.programInfo, uniforms)
        twgl.drawBufferInfo(this.gl, this.gl.TRIANGLES, this.bufferInfo)
    }
}

$(document).ready(_ => new Fajitas())

window.jQuery = $
window.$ = $
