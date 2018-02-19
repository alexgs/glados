import { COOKIE_NAME } from './lib/constants';

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
    },

    CookiePayload: { type: [ 'object', 'string' ] },

    Request: {
        type: 'object',
        properties: {
            cookies: {
                type: 'object',
                properties: {
                    [COOKIE_NAME.NONCE]: { type: 'string' },
                    [COOKIE_NAME.SESSION.ANONYMOUS]: { type: [ 'object', 'string' ] },
                    [COOKIE_NAME.SESSION.SECURE]: { type: [ 'object', 'string' ] }
                }
            },
            session: {
                type: 'object',
                properties: {
                    isAuthenticated: { instanceof: 'Function' }
                }
            },
            user: { type: 'object' }        // TODO [2] >>> The user object can be expanded/better defined <<<
        }
    },

    Response: {
        type: 'object',
        properties: {
            clearCookie: { instanceof: 'Function' },
            cookie: { instanceof: 'Function' }
        }
    }
};
