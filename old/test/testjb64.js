import assert from 'assert'
import JB64 from '../src/jb64.js'

describe("JB64", _ => {
    describe("to base 64", _ => {
        it("should encode text to base64", () => {
            assert.deepEqual(JB64.b64('\x00\x00\x00'), 'AAAA')
            assert.deepEqual(JB64.b64('\x03\xf0\x3f'), 'A/A/')
        })

        it("should encde text to base64 with padding 1", () => {
            assert.deepEqual(JB64.b64('\x00\x00'), 'AAA=')
            assert.deepEqual(JB64.b64('\x03\xf0'), 'A/A=')
        })

        it("should encode text to base64 with padding 2", () => {
            assert.deepEqual(JB64.b64('\x00'), 'AA==')
            assert.deepEqual(JB64.b64('\x03'), 'Aw==')
        })
    })

    describe("from base 64", _ => {
        it("should decode base64 string", () => {
            assert.deepEqual(JB64.rb64('AAAA'), '\x00\x00\x00')
            assert.deepEqual(JB64.rb64('A/A/'), '\x03\xf0\x3f')
        })

        it("should decode base64 string with padding 1", () => {
            assert.deepEqual(JB64.rb64('AAA='), '\x00\x00')
            assert.deepEqual(JB64.rb64('A/A='), '\x03\xf0')
        })

        it("should decode base64 string with padding 2", () => {
            assert.deepEqual(JB64.rb64('AA=='), '\x00')
            assert.deepEqual(JB64.rb64('Aw=='), '\x03')
        })
    })

    describe("base 64 meta circular test", _ => {
        it("should metacode no padding", () => {
            let s = "Hello my dear !"
            assert.deepEqual(JB64.rb64(JB64.b64(s)), s)
        })

        it("should metacode padding 1", () => {
            let s = "Hello my dear."
            assert.deepEqual(JB64.rb64(JB64.b64(s)), s)
        })

        it("should metacode padding 2", () => {
            let s = "Hello my dear"
            assert.deepEqual(JB64.rb64(JB64.b64(s)), s)
        })
    })

    describe("JSON base 64", _ => {
        let simpleEnc = "eyJhIjozfQ=="
        let simpleObj = {a: 3}

        it("should encode json", () => {
            assert.deepEqual(JB64.encode(simpleObj), simpleEnc)
        })

        it("should decode json", () => {
            assert.deepEqual(JB64.decode(simpleEnc), simpleObj)
        })

        it("should meta-circular parse what it generated",  () => {
            let obj = {"a": "value a", "b": [{1: null, "pi": 3.14}]}
            let str = JB64.encode(obj)
            assert.deepEqual(JB64.decode(str), obj)
        })
    })
})
