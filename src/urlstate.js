import JB64  from './jb64.js'

/* A React-like state as a b64 json in the URL hash */
export default class UrlState {
    constructor(initialState={}){
        let state = this.getState()
        let missing = {}
        Object.keys(initialState).map(key => {
            if (! state[key]){
                missing[key] = initialState[key]
            }
        })

        this.observers = []
        window.addEventListener("hashchange", _ => {
            let state = this.getState()
            this.observers.map(f => f(state))
        }, false)
        this.setState(missing)
    }

    /* Return current state */
    getState(){
        let hash = window.location.hash.substring(1)
        if (hash && hash.length > 0){
            try {
                return JB64.decode(hash)
            } catch (err){
                return {}
            }
        } else {
            return {}
        }
    }

    /* Like react.Component.setState */
    setState(newState){
        let state = this.getState()
        var changed = 0
        Object.keys(newState).map(key => {
            if (state[key] != newState[key]){
                state[key] = newState[key]
                changed++
            }
        })
        if (changed > 0){
            window.location.hash = '#' + JB64.encode(state)
        }
    }

    /* Register a function to be called on new state */
    observe(func){
        this.observers.push(func)
    }

    /* Register a function to be called when one of keys changes */
    observeAny(keys, func){
        let lastValues = {}
        this.observe(state => {
            var diff = 0
            keys.map(k => {
                if (state[k] != lastValues[k]){
                    if (diff == 0){
                        func(state)
                    }
                    lastValues[k] = state[k]
                    diff++
                }
            })
        })
    }

    /* Register a function to be called when a specific key changes */
    observeKey(key, func){
        this.observeAny([key], state => func(state[key]))
    }
}
