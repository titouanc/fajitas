const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const RB64 = {}
for (let i=0; i<B64.length; i++){
    RB64[B64[i]] = i
}

/* Bonjour, je suis Jean-Baptiste 64 */
export default class JB64 {

    // Return base64-encoded str
    static b64(str){
        let nBlocks = Math.floor(str.length / 3)
        let res = []

        // Encode by block of 3 bytes to 4 
        for (let i=0; i<nBlocks; i++){
            let block = str.substring(3*i, 3*(i+1))
            let [s1, s2, s3] = [0, 1, 2].map(i => block.charCodeAt(i))
            res.push(B64[s1>>2])
            res.push(B64[((s1 & 0x03) << 4) | (s2 >> 4)])
            res.push(B64[((s2 & 0x0f) << 2) | (s3 >> 6)])
            res.push(B64[s3 & 0x3f])
        }

        // Padding in last block
        let lastBlock = str.substring(3*nBlocks)
        let [s1, s2, s3] = [0, 1, 2].map(i => lastBlock.charCodeAt(i))
        if (lastBlock.length > 0){
            res.push(B64[s1>>2])
            res.push(B64[((s1 & 0x03) << 4) | (s2 >> 4)])
            if (lastBlock.length == 1){
                res.push('==')
            } else {
                res.push(B64[((s2 & 0x0f) << 2) | (s3 >> 6)])
                if (lastBlock.length == 2){
                    res.push('=')
                } else {
                    res.push(B64[s3 & 0x3f])
                }
            }
        }
        return res.join('')
    }

    // Return base64-decoded str
    static rb64(str){
        let nBlocks = Math.floor(str.length / 4)
        let res = []

        // Encode by block of 3 bytes to 4 
        for (let i=0; i<nBlocks; i++){
            let block = str.substring(4*i, 4*(i+1))
            let [b1, b2, b3, b4] = [0, 1, 2, 3].map(i => RB64[block[i]])
            res.push((b1 << 2) | (b2 >> 4))
            if (block[2] == '='){
                break
            }
            res.push(((b2 & 0x0f) << 4) | (b3 >> 2))
            if (block[3] == '='){
                break
            }
            res.push(((b3 & 0x03) << 6) | b4)
        }

        return String.fromCharCode(...res)
    }

    // Return base64 encoded json of obj
    static encode(obj){
        return this.b64(JSON.stringify(obj))
    }

    // Return obj from base64 encoded json
    static decode(str){
        return JSON.parse(this.rb64(str))
    }
}
