// @flow
import sodium from '@philgs/sodium';
import cookieTools from 'cookie';
import debugAgent from 'debug';
import _ from 'lodash';
import ms from 'ms';
import { COOKIE_NAME } from './constants';
import type Sodium, { Key } from '@philgs/sodium';
import type { CookieOptions, $Response, NextFunction } from 'express';
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

let crypto:CookieCrypto|null = null;
const debug = debugAgent( 'glados:cookies' );
let key:Key|null = null;


// --- PUBLIC FUNCTIONS ---

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

function getAnonSessionCookie( request:GladosRequest ):CookiePayload {
    return getSessionCookie( request, COOKIE_NAME.SESSION.ANONYMOUS, 'anonymous' );
}

function getSecureSessionCookie( request:GladosRequest ):CookiePayload {
    return getSessionCookie( request, COOKIE_NAME.SESSION.SECURE, 'secure' );
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

function hasAnonSessionCookie( request:GladosRequest ):boolean {
    const anonCookie = hasCookie( request, COOKIE_NAME.SESSION.ANONYMOUS );
    const nonceCookie = hasCookie( request, COOKIE_NAME.NONCE );
    return anonCookie && nonceCookie;
}

function hasSecureSessionCookie( request:GladosRequest ):boolean {
    const secureCookie = hasCookie( request, COOKIE_NAME.SESSION.SECURE );
    const nonceCookie = hasCookie( request, COOKIE_NAME.NONCE );
    return secureCookie && nonceCookie;
}

const messages = {
    noSession: ( sessionType:string ) => `No ${sessionType} session cookie found. Check for the cookie first!`,
    propAlreadySet: ( propName:string ) => `Attempted to set the ${propName}, but it is already set.`,
    propNotSet: ( propName:string ) => `Attempted to retrieve the ${propName}, but it is not set.`
};

function removeAnonSessionCookie( request:GladosRequest, response:$Response ) {
    if ( crypto == null ) {
        throw new Error( messages.propNotSet( 'crypto library' ) );
    }
    if ( key == null ) {
        throw new Error( messages.propNotSet( 'session key' ) );
    }
    if ( !hasAnonSessionCookie( request ) ) {
        throw new Error( messages.noSession( 'anonymous' ) );
    }

    response.clearCookie( COOKIE_NAME.SESSION.ANONYMOUS, COOKIE_OPTIONS.ANONYMOUS );
    response.clearCookie( COOKIE_NAME.NONCE, COOKIE_OPTIONS.ANONYMOUS );
}

/**
 * @private
 */
function _reset() {
    crypto = null;
    key = null;
}

function setAnonSessionCookie( response:$Response, cookiePayload:CookiePayload ):void {
    return setEncryptedCookie( response, COOKIE_NAME.SESSION.ANONYMOUS, cookiePayload, COOKIE_OPTIONS.ANONYMOUS );
}

function setSecureSessionCookie( response:$Response, cookiePayload:CookiePayload ):void {
    return setEncryptedCookie( response, COOKIE_NAME.SESSION.SECURE, cookiePayload, COOKIE_OPTIONS.SECURE );
}


// --- PRIVATE FUNCTIONS ---

function getSessionCookie( request:GladosRequest, cookieName:string, cookieFriendlyName:string ):CookiePayload {
    if ( crypto == null ) {
        throw new Error( messages.propNotSet( 'crypto library' ) );
    }
    if ( key == null ) {
        throw new Error( messages.propNotSet( 'session key' ) );
    }
    if ( !hasCookie( request, cookieName ) ) {
        throw new Error( messages.noSession( cookieFriendlyName ) );
    }
    if ( !hasCookie( request, COOKIE_NAME.NONCE ) ) {
        throw new Error( messages.noSession( 'nonce' ) );
    }

    const cipher = crypto.cipherFromHex( request.cookies[ cookieName ] );
    const nonce = crypto.nonceFromHex( request.cookies[ COOKIE_NAME.NONCE ] );
    const clear = cipher.decrypt( key, nonce );
    return clear.json || clear.string;
}

function hasCookie( request:GladosRequest, cookieName:string ):boolean {
    return _.has( request.cookies, cookieName );
}

function setEncryptedCookie(
    response:$Response,
    cookieName:string,
    cookiePayload:CookiePayload,
    cookieOptions:CookieOptions
):void {
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
    } else if ( typeof cookiePayload === 'object' ) {
        plainPayload = crypto.clearFromObject( cookiePayload );
    } else {
        throw new Error( `Unknown data type for argument \`cookiePayload\`: ${typeof cookiePayload}.` );
    }
    const nonce = crypto.newNonce();
    const cipherPayload = plainPayload.encrypt( key, nonce );

    // Set the cookies
    response.cookie( cookieName, cipherPayload.hex, cookieOptions );
    response.cookie( COOKIE_NAME.NONCE, nonce.hex, cookieOptions );
}

// --- EXPORTS ---

const gladosCookies = {
    COOKIE_OPTIONS,
    configure,
    getAnonSessionCookie,
    getSecureSessionCookie,
    getCrypto,
    getMiddleware: getCookieMiddleware,
    getSessionKey,
    hasAnonSessionCookie,
    hasSecureSessionCookie,
    messages,
    removeAnonSessionCookie,
    _reset,
    setAnonSessionCookie,
    setSecureSessionCookie
};

export default gladosCookies;
