// @flow
import cookieTools from 'cookie';
import debugAgent from 'debug';
import _ from 'lodash';
import ms from 'ms';
import sodium from '@philgs/sodium';
import type { $Response, NextFunction } from 'express';
import type { GladosRequest } from '../index';
import { COOKIE_NAME } from './constants';

interface CookieCrypto {
    encrypt( message:Buffer, nonce:Buffer, key:Buffer ):Buffer;
    decrypt( cipher:Buffer, nonce:Buffer, key:Buffer ):Buffer;
    key():Buffer;
    nonce():Buffer;
    KEYBYTES:number;
    MACBYTES:number;
    NONCEBYTES:number;
}
type CookiePayload = string|{ [name:string]:mixed }

const COOKIE_OPTIONS = {
    ANONYMOUS: {
        encode: ( value:string ) => value,
        httpOnly: true,
        maxAge: ms( '90d' ),
        secure: true
    },
    SECURE: {
        encode: ( value:string ) => value,
        httpOnly: true,
        maxAge: ms( '90d' ),
        sameSite: true,
        secure: true
    }
};
const PAYLOAD_ENCODING = 'hex';

let crypto:?CookieCrypto = null;
const debug = debugAgent( 'glados:cookies' );
let key:?Buffer = null;

function configure( sessionKey:Buffer, cookieCrypto:CookieCrypto ) {
    if ( sessionKey.length < sodium.KEYBYTES ) {
        throw new Error( messages.incorrectKeySize( sessionKey ) );
    }

    if ( crypto != null ) {
        throw new Error( messages.propAlreadySet( 'crypto library' ) );
    }
    crypto = cookieCrypto;

    if ( key != null ) {
        throw new Error( messages.propAlreadySet( 'session key' ) );
    }
    key = sessionKey;
}

function getCookieMiddleware() {
    return function cookieMiddleware( request:GladosRequest, response:$Response, next:NextFunction ) {
        // If we've already processed cookies, bail
        if ( request.cookies ) {
            return next();
        }

        // If there are no cookies on the Request, bail
        const cookieHeader = request.headers.cookie;
        if ( !cookieHeader ) {
            return next();
        }

        // Parse header and JSON strings
        request.cookies = cookieTools.parse( cookieHeader );
        request.cookies = _.mapValues( request.cookies, value => {
            try {
                return JSON.parse( value );
            } catch( error ) {
                // Continue on `SyntaxError`, rethrow on other error types
                if ( error instanceof SyntaxError ) {
                    return value;
                } else {
                    throw error;
                }
            }
        } );

        // TODO [1] >>> Implement signing and encrypting cookies <<<
        next();
    };
}

function getCrypto():CookieCrypto {
    if ( crypto == null ) {
        throw new Error( messages.propNotSet( 'crypto library' ) );
    }
    return crypto;
}

function getSessionKey():Buffer {
    if ( key == null ) {
        throw new Error( messages.propNotSet( 'session key' ) );
    }
    return key;
}

const messages = {
    incorrectKeySize: ( badKey:Buffer ) => {
        return `Session key must be ${sodium.KEYBYTES} bytes, but the provided key is only ${badKey.length} bytes.`;
    },
    propAlreadySet: ( propName:string ) => `Attempted to set the ${propName}, but it is already set.`,
    propNotSet: ( propName:string ) => `Attempted to retrieve the ${propName}, but it is not set.`
};

/**
 * @private
 */
function _reset() {
    crypto = null;
    key = null;
}

function setAnonSessionCookie( response:$Response, cookiePayload:CookiePayload ) {
    if ( crypto == null ) {
        throw new Error( messages.propNotSet( 'crypto library' ) );
    }
    if ( key == null ) {
        throw new Error( messages.propNotSet( 'session key' ) );
    }

    // Convert the payload to a Buffer, then encrypt the payload
    const payloadBuffer = Buffer.from( JSON.stringify( cookiePayload ) );
    const nonce = crypto.nonce();
    const cipherPayload = crypto.encrypt( payloadBuffer, nonce, key ).toString( PAYLOAD_ENCODING );

    // Set the cookies
    response.cookie( COOKIE_NAME.SESSION.ANONYMOUS, cipherPayload, COOKIE_OPTIONS.ANONYMOUS );
    response.cookie( COOKIE_NAME.NONCE, nonce.toString( PAYLOAD_ENCODING ), COOKIE_OPTIONS.ANONYMOUS );
}

const gladosCookies = {
    COOKIE_OPTIONS,
    PAYLOAD_ENCODING,
    configure,
    getCrypto,
    getMiddleware: getCookieMiddleware,
    getSessionKey,
    messages,
    _reset,
    setAnonSessionCookie
};

export default gladosCookies;
