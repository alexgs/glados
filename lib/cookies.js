// @flow
import sodium from '@philgs/sodium';
import cookieTools from 'cookie';
import debugAgent from 'debug';
import _ from 'lodash';
import ms from 'ms';
import { COOKIE_NAME } from './constants';
import type Sodium, { Key } from '@philgs/sodium';
import type { $Response, NextFunction } from 'express';
import type { GladosRequest } from '../index';

interface CookieCrypto extends Sodium {}
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

let crypto:CookieCrypto|null = null;
const debug = debugAgent( 'glados:cookies' );
let key:Key|null = null;

function configure( sessionKey:Key, cookieCrypto:CookieCrypto ) {
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

function getSessionKey():Key {
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

    // Encrypt the payload
    let plainPayload = null;
    if ( typeof cookiePayload === 'string' ) {
        plainPayload = crypto.clearFromString( cookiePayload );
    } else if ( cookiePayload instanceof Object ) {
        plainPayload = crypto.clearFromObject( cookiePayload );
    } else {
        throw new Error( `Unknown data type for argument \`cookiePayload\`: ${typeof cookiePayload}.` );
    }
    const nonce = crypto.newNonce();
    const cipherPayload = plainPayload.encrypt( key, nonce );

    // Set the cookies
    response.cookie( COOKIE_NAME.SESSION.ANONYMOUS, cipherPayload.hex, COOKIE_OPTIONS.ANONYMOUS );
    response.cookie( COOKIE_NAME.NONCE, nonce.hex, COOKIE_OPTIONS.ANONYMOUS );
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
