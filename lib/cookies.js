import cookieTools from 'cookie';
import debugAgent from 'debug';
import khyron from 'khyron';
import _ from 'lodash';
import ms from 'ms';
import { COOKIE_NAME } from './constants';
import * as types from '../types';

const COOKIE_OPTIONS = {
    ANONYMOUS: {
        encode: ( value ) => value,
        httpOnly: true,
        maxAge: ms( '90d' ),
        secure: true
    },
    SECURE: {
        encode: ( value ) => value,
        httpOnly: true,
        maxAge: ms( '90d' ),
        sameSite: true,
        secure: true
    }
};

let crypto = null;
const debug = debugAgent( 'glados:cookies' );
let key = null;


// --- EXPORTS ---

const messages = {
    illegalCookies: () => `Illegal State: Both anonymous and secure session cookies are present!`,
    noSession: ( sessionType ) => `No ${sessionType} session cookie found. Check for the cookie first!`,
    propAlreadySet: ( propName ) => `Attempted to set the ${propName}, but it is already set.`,
    propNotSet: ( propName ) => `Attempted to retrieve the ${propName}, but it is not set.`
};

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
    removeSecureSessionCookie,
    _reset,
    setAnonSessionCookie,
    setSecureSessionCookie
};

export default gladosCookies;


// --- PUBLIC FUNCTIONS ---

khyron( gladosCookies, 'configure' ).pre( { type: 'array',
    items: [
        types.Sodium.Key,
        types.Glados.CookieCrypto
    ]
} );
function configure( sessionKey, cookieCrypto ) {
    if ( crypto != null ) {
        throw new Error( messages.propAlreadySet( 'crypto library' ) );
    }
    crypto = cookieCrypto;

    if ( key != null ) {
        throw new Error( messages.propAlreadySet( 'session key' ) );
    }
    key = sessionKey;
}

khyron( gladosCookies, 'getAnonSessionCookie' ).pre( { type: 'array',
    items: [
        _.merge( {}, types.Glados.Request, { required: [ 'cookies' ] } )
    ]
} );
function getAnonSessionCookie( request ) {
    return getSessionCookie( request, COOKIE_NAME.SESSION.ANONYMOUS, 'anonymous' );
}

function getCookieMiddleware() {
    return function cookieMiddleware( request, response, next ) {
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

        // TODO --> Get rid of Flow and use Khyron <--
        if ( hasAnonSessionCookie( request ) && hasSecureSessionCookie( request ) ) {
            throw new Error( messages.illegalCookies() );
        }
        if ( hasAnonSessionCookie( request ) ) {
            request.cookies[ COOKIE_NAME.SESSION.ANONYMOUS ] = getAnonSessionCookie( request );
        }
        if ( hasSecureSessionCookie( request ) ) {
            request.cookies[ COOKIE_NAME.SESSION.SECURE ] = getSecureSessionCookie( request );
        }

        next();
    };
}

khyron( gladosCookies, 'getSecureSessionCookie' ).pre( { type: 'array',
    items: [
        _.merge( {}, types.Glados.Request, { required: [ 'cookies' ] } )
    ]
} );
function getSecureSessionCookie( request ) {
    return getSessionCookie( request, COOKIE_NAME.SESSION.SECURE, 'secure' );
}

function getCrypto() {
    if ( crypto == null ) {
        throw new Error( messages.propNotSet( 'crypto library' ) );
    }
    return crypto;
}

function getSessionKey() {
    if ( key == null ) {
        throw new Error( messages.propNotSet( 'session key' ) );
    }
    return key;
}

khyron( gladosCookies, 'hasAnonSessionCookie' ).pre( { type: 'array',
    items: [
        types.Glados.Request
    ]
} );
function hasAnonSessionCookie( request ) {
    const anonCookie = hasCookie( request, COOKIE_NAME.SESSION.ANONYMOUS );
    const nonceCookie = hasCookie( request, COOKIE_NAME.NONCE );
    return anonCookie && nonceCookie;
}

khyron( gladosCookies, 'hasSecureSessionCookie' ).pre( { type: 'array',
    items: [
        types.Glados.Request
    ]
} );
function hasSecureSessionCookie( request ) {
    const secureCookie = hasCookie( request, COOKIE_NAME.SESSION.SECURE );
    const nonceCookie = hasCookie( request, COOKIE_NAME.NONCE );
    return secureCookie && nonceCookie;
}

function removeAnonSessionCookie( request, response ) {
    return removeSessionCookie( request, response, COOKIE_NAME.SESSION.ANONYMOUS, COOKIE_OPTIONS.ANONYMOUS, 'anonymous');
}

function removeSecureSessionCookie( request, response ) {
    return removeSessionCookie( request, response, COOKIE_NAME.SESSION.SECURE, COOKIE_OPTIONS.SECURE, 'secure');
}

/**
 * @private
 */
function _reset() {
    crypto = null;
    key = null;
}

function setAnonSessionCookie( response, cookiePayload ) {
    return setEncryptedCookie( response, COOKIE_NAME.SESSION.ANONYMOUS, cookiePayload, COOKIE_OPTIONS.ANONYMOUS );
}

function setSecureSessionCookie( response, cookiePayload ) {
    return setEncryptedCookie( response, COOKIE_NAME.SESSION.SECURE, cookiePayload, COOKIE_OPTIONS.SECURE );
}


// --- PRIVATE FUNCTIONS ---

function getSessionCookie( request, cookieName, cookieFriendlyName ) {
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

function hasCookie( request, cookieName ) {
    return _.has( request.cookies, cookieName );
}

function removeSessionCookie( request, response, cookieName, cookieOptions, cookieFriendlyName ) {
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

    response.clearCookie( cookieName, cookieOptions );
    response.clearCookie( COOKIE_NAME.NONCE, cookieOptions );
    debug( 'Removed encrypted cookie %s', cookieName );
}

function setEncryptedCookie( response, cookieName, cookiePayload, cookieOptions ) {
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
    debug( 'Set encrypted cookie %s', cookieName );
}
