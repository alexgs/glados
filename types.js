
export const Sodium = {
    Key: {
        type: 'object',
        properties: {
            buffer: { instanceof: 'Buffer' },
            hex: { type: 'string' }
        },
        required: [ 'buffer', 'hex' ]
    }
};

export const Glados = {
    CookieCrypto: {
        type: 'object',
        properties: {
            KEYBYTES: { type: 'number' },
            MACBYTES: { type: 'number' },
            NONCEBYTES: { type: 'number' },
            cipherFromHex: { instanceof: 'Function' },
            clearFromObject: { instanceof: 'Function' },
            clearFromString: { instanceof: 'Function' },
            keyFromHex: { instanceof: 'Function' },
            newKey: { instanceof: 'Function' },
            newNonce: { instanceof: 'Function' },
            nonceFromHex: { instanceof: 'Function' }
        },
        required: [
            'KEYBYTES',
            'MACBYTES',
            'NONCEBYTES',
            'cipherFromHex',
            'clearFromObject',
            'clearFromString',
            'keyFromHex',
            'newKey',
            'newNonce',
            'nonceFromHex',
        ]
    }
};