import debugAgent from 'debug';
import fs from 'fs';
import ms from 'ms';
import uuid from 'uuid';

import sessionStore from './session-store';

const ANONYMOUS_COOKIE_OPTIONS = {
    encode: value => value,
    httpOnly: true,
    maxAge: ms( '90d' ),
    secure: true
};
const ERROR_CODES = {
    INVALID_SESSION_ID: 'error-code:anonymous-session-id-is-not-valid',
    MISSING_SESSION_COOKIE: 'error-code:no-anon-or-secure-session-cookie',
    NO_COOKIES: 'error-code:no-cookies'
};
const STRICT_COOKIE_OPTIONS = {
    encode: value => value,
    httpOnly: true,
    maxAge: ms( '90d' ),
    sameSite: true,
    secure: true
};
const debug = debugAgent( 'glados:session' );

let sessionKeyPath = null;
let sessionKey = null;


// --- SESSION OBJECT ---

function generateSessionObject() {
    return {
        isAuthenticated
    };
}

function isAuthenticated( request ) {
    const cookieId = getSecureSessionName();
    if ( request.cookies && request.cookies[ cookieId ] ) {
        const sessionId = request.cookies[ cookieId ];
        const result = !!sessionStore.get( sessionId );
        debug( 'Authentication result: %s', result);
        return result;
    } else {
        debug( 'Authentication failed: no cookie' );
        return false;
    }
}


// --- EXPORTED FUNCTIONS ---

function generateSessionId() {
    return uuid.v4();
}

/**
 * Creates a middleware to check that a user is logged in. Adapted from [connect-ensure-login][1].
 *
 * [1]: https://github.com/jaredhanson/connect-ensure-login
 * @param loginPath
 * @returns {Function}
 */
function getRequireAuthMiddleware( loginPath ) {
    // TODO >>> Load user data into the session object
    debug( 'Generating "require authentication" middleware' );
    return function( request, response, next ) {
        upgradeAnonSession( request, response )
            .then( sessionId => {
                const session = request.session;
                if ( !session ) {
                    debug( 'Redirecting to %s (no session)', loginPath );
                    return response.redirect( loginPath );
                } else if ( !( session.isAuthenticated && session.isAuthenticated( request ) ) ) {
                    session.returnTo = request.originalUrl || request.url;
                    debug( 'Redirecting to %s (missing or failed authentication)', loginPath );
                    return response.redirect( loginPath );
                }
                debug( 'User authentication verified' );
                next();
            } )
            .catch( error => {
                // TODO Add flash messages
                switch ( error ) {
                    case ERROR_CODES.INVALID_SESSION_ID:
                        debug( 'Redirecting to %s (invalid anonymous session)', loginPath );
                        return response.redirect( loginPath );
                    case ERROR_CODES.MISSING_SESSION_COOKIE:
                        debug( 'Redirecting to %s (missing session cookie)', loginPath );
                        return response.redirect( loginPath );
                    case ERROR_CODES.NO_COOKIES:
                        debug( 'Redirecting to %s (no cookies)', loginPath );
                        return response.redirect( loginPath );
                    default:
                        throw error;
                }
            } );
    };
}

function getSessionKey() {
    if ( _.isNull( sessionKeyPath ) ) {
        throw new Error( messages.emptyKeyPath( 'getSessionKey' ) );
    }

    if ( _.isNull( sessionKey ) ) {
        const rawData = fs.readFileSync( sessionKeyPath, 'utf8' );
        sessionKey = rawData.split('\n').join('');
    }
    return sessionKey;
}

function setAnonymousSession( request, response, jwtToken ) {
    const sessionCookie = getAnonSessionName();
    return new Promise( ( resolve, reject ) => {
        if ( request.cookies && request.cookies[ sessionCookie ] ) {
            const sessionId = request.cookies[ sessionCookie ];
            debug( 'Existing session cookie with ID %s', sessionId );
            resolve( { sessionId, jwtToken } );
        } else {
            const sessionId = generateSessionId();
            response.cookie( sessionCookie, sessionId, ANONYMOUS_COOKIE_OPTIONS );
            debug( 'New session cookie with ID %s', sessionId );
            resolve( { sessionId, jwtToken } );
        }
    } );
}

function storeJwtToken( sessionId, jwtToken ) {
    return new Promise( ( resolve, reject ) => {
        sessionStore.upsert( sessionId, jwtToken );
        debug( 'Saved JWT ID Token to session store' );
        resolve( { sessionId, jwtToken } );
    } );
}


// --- INTERNAL UTILITY FUNCTIONS ---

/**
 * Return the name used for anonymous session cookies
 * @returns {string} Cookie name for anonymous session
 */
export function getAnonSessionName() {
    return 'anon.sid';
}

/**
 * Return the name used for secure session cookies
 * @returns {string} Cookie name for secure session
 */
export function getSecureSessionName() {
    return 'aegis.sid';
}

function login( jwtIdToken, request, response ) {
    debug( 'Function `login` started' );
    return new Promise( ( resolve, reject ) => {
        response.cookie( 'glados', jwtIdToken, STRICT_COOKIE_OPTIONS );
        request.user = jwtIdToken;

        debug( 'Function `login` completed successfully' );
        resolve( jwtIdToken );
    } );
}

export const messages = {
    invalidKeyPath: ( path ) => `The key at ${path} does not exist.`,
    emptyKeyPath: ( funcName ) => `You must set the path to the session key file before invoking ${funcName}.`
};

function setSessionKeyPath( path ) {
    if ( !fs.existsSync( path ) ) {
        throw new Error( messages.invalidKeyPath( path ) );
    }
    sessionKeyPath = path;
}

function upgradeAnonSession( request, response ) {
    const anonSession = getAnonSessionName();
    const secureSession = getSecureSessionName();

    return new Promise( ( resolve, reject ) => {
        if ( request.cookies ) {
            if ( request.cookies[ anonSession ] ) {
                // TODO [Future] Generate a new session ID, update data in the store and cookie, encrypt the cookie, etc.
                const sessionId = request.cookies[ anonSession ];

                // Check for a valid session
                if ( !!sessionStore.get( sessionId ) ) {

                    // Manually replace cookies in the current request
                    delete request.cookies[ anonSession ];
                    request.cookies[ secureSession ] = sessionId;

                    // Replace cookies on the client
                    response.clearCookie( anonSession );
                    response.cookie( secureSession, sessionId, STRICT_COOKIE_OPTIONS );

                    debug( 'Upgraded anonymous session' );
                    resolve( sessionId );
                } else {
                    // Session is invalid, so reject
                    debug( 'Found invalid anonymous session' );
                    reject( ERROR_CODES.INVALID_SESSION_ID );
                }
            } else if ( request.cookies[ secureSession ] ) {
                debug( 'Found secure session' );
                const sessionId = request.cookies[ secureSession ];
                resolve( sessionId );
            } else {
                debug( 'No anonymous session or secure session' );
                reject( ERROR_CODES.MISSING_SESSION_COOKIE );
            }
        } else {
            debug( 'No cookies' );
            reject( ERROR_CODES.NO_COOKIES );
        }
    } );
}

const gladosSession = {
    configureStore: sessionStore.configure,
    generateSessionObject,
    getRequireAuthMiddleware,
    getSessionKey,
    setAnonymousSession,
    storeJwtToken,
};

export default gladosSession;
