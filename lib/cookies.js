// @flow
import cookieTools from 'cookie';
import debugAgent from 'debug';
import _ from 'lodash';
import sodium from '@philgs/sodium';
import type { $Response, NextFunction } from 'express';
import type { GladosRequest } from '../index';

interface CookieCrypto {
    encrypt( message:string|Buffer, nonce:Buffer, key:Buffer ):void;
    decrypt( cipher:string|Buffer, nonce:Buffer, key:Buffer ):void;
    key():Buffer;
    nonce():Buffer;
    KEYBYTES:number;
    MACBYTES:number;
    NONCEBYTES:number;
}
type CookiePayload = string|{ [name:string]:mixed }

const debug = debugAgent( 'glados:cookies' );
let crypto:?CookieCrypto = null;
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
    key = null;
}

function setAnonSessionCookie( response:$Response, cookiePayload:CookiePayload ) {

}

const gladosCookies = {
    configure,
    getCrypto,
    getMiddleware: getCookieMiddleware,
    getSessionKey,
    messages,
    _reset,
    setAnonSessionCookie
};

export default gladosCookies;
