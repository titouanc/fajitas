export function parseQueryString(queryString, defaults={}){
    let res = {}
    Object.keys(defaults).map(k => res[k] = defaults[k])
    decodeURI(queryString).split('&').map(x => {
        let [key, val] = x.split('=')
        res[key] = val
    })
    return res
}

export function toQueryString(obj){
    return Object.keys(obj).map(k => `${k}=${obj[k]}`).join('&')
}

export function color2vec(cssColor){
    let res = [1, 3, 5].map(x => parseInt(cssColor.substring(x, x+2), 16)/255)
    res.push(1)
    return res
}

export function vec2color(vec4){
    return '#' + [0, 1, 2].map(i => {
        var x = parseInt(255*vec4[i]).toString(16)
        if (x.length == 1){
            x = '0'+x
        }
        return x
    }).join('')
}
