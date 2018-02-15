// @flow
import debugAgent from 'debug';
import ms from 'ms';
import uuid from 'uuid';
import { ERROR_SOURCE, SESSION_DOCUMENT } from './constants';
import sessionStore from './session-store';
import userStore from './user-store';
import type { $Request, $Response, NextFunction } from 'express';
import type { JwtToken } from './json-web-tokens';

type AnonymousSessionData = {
    jwtToken:JwtToken,
    sessionId:string
}
type AnonymousSessionDocument = {
    jwtToken:JwtToken,
    type:string
}
type AuthenticationResult = {
    reason:string,
    value:boolean
};
type GladosRequest = $Request & {
    session: {
        isAuthenticated: GladosRequest => AuthenticationResult
    },
    user:?mixed         // TODO [2] >>> The user object can be expanded/better defined <<<
};
type SecureSessionDocument = {
    email:string,
    id:string,
    providers:Array<string>,
    type:string,
    userId:string|number
}

const ANONYMOUS_COOKIE_OPTIONS = {
    encode: value => value,
    httpOnly: true,
    maxAge: ms( '90d' ),
    secure: true
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

function isAuthenticated( request:GladosRequest ) {
    const cookieId = getSecureSessionName();
    if ( request.cookies && request.cookies[ cookieId ] ) {
        const sessionId = request.cookies[ cookieId ];

        const sessionDocument = sessionStore.get( sessionId );
        if ( !!sessionDocument ) {
            debug( 'Authentication succeeded' );
            request.user = sessionDocument;
            return {
                value: true,
                reason: null
            };
        } else {
            debug( 'Authentication failed: invalid session');
            return {
                value: false,
                reason: ERROR_SOURCE.SECURE_SESSION.INVALID
            };
        }
    } else {
        debug( 'Authentication failed: missing session' );
        return {
            value: false,
            reason: ERROR_SOURCE.SECURE_SESSION.MISSING
        };
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
function getRequireAuthMiddleware( loginPath:string ) {
    debug( 'Generating "require authentication" middleware' );
    return function( request:GladosRequest, response:$Response, next:NextFunction ) {
        upgradeAnonSession( request, response )
            .then( ({ request, response }) => authenticateSecureSession( request, response ) )
            .then( () => next() )
            .catch( error => {
                // TODO Add flash messages
                switch ( error ) {
                    case ERROR_SOURCE.ANON_SESSION.INVALID:
                        debug( 'Redirecting to %s (invalid anonymous session)', loginPath );
                        return response.redirect( loginPath );
                    case ERROR_SOURCE.ANON_SESSION.MISSING:
                        debug( 'Redirecting to %s (missing anonymous session)', loginPath );
                        return response.redirect( loginPath );
                    case ERROR_SOURCE.SECURE_SESSION.INVALID:
                        debug( 'Redirecting to %s (invalid secure session)', loginPath );
                        return response.redirect( loginPath );
                    case ERROR_SOURCE.SECURE_SESSION.MISSING:
                        debug( 'Redirecting to %s (missing secure session)', loginPath );
                        return response.redirect( loginPath );
                    case ERROR_SOURCE.MISSING_SESSION:
                        debug( 'Redirecting to %s (no session)', loginPath );
                        return response.redirect( loginPath );
                    default:
                        throw error;
                }
            } );
    };
}

function getSessionKey() {
}

function handleAnonymousSession(
    request:$Request,
    response:$Response,
    jwtToken:?JwtToken
):Promise<AnonymousSessionData|void> {
    const sessionCookie = getAnonSessionName();
    return new Promise( ( resolve, reject ) => {
        // If the client sends a cookie, then use it. Otherwise, generate a new session ID
        if ( request.cookies && request.cookies[ sessionCookie ] ) {
            const sessionId = request.cookies[ sessionCookie ];
            const payload = jwtToken ? { sessionId, jwtToken } : undefined;
            debug( 'Existing session cookie with ID %s', sessionId );
            resolve( payload );
        } else {
            const sessionId = generateSessionId();
            const payload = jwtToken ? { sessionId, jwtToken } : undefined;
            response.cookie( sessionCookie, sessionId, ANONYMOUS_COOKIE_OPTIONS );
            debug( 'New session cookie with ID %s', sessionId );
            resolve( payload );
        }
    } );
}

function storeJwtToken( sessionId:string, jwtToken:JwtToken ):Promise<AnonymousSessionData> {
    return new Promise( ( resolve, reject ) => {
        const sessionDocument = {
            jwtToken,
            type: SESSION_DOCUMENT.TYPE.ANONYMOUS
        };
        sessionStore.upsert( sessionId, sessionDocument );
        debug( 'Saved JWT ID Token to session store' );
        resolve( { sessionId, jwtToken } );
    } );
}


// --- INTERNAL UTILITY FUNCTIONS ---

function authenticateSecureSession( request:GladosRequest, response ) {
    return new Promise( ( resolve, reject ) => {
        // Assume that `request.session` and `request.session.isAuthenticated` both exist
        const authResult = request.session.isAuthenticated( request );
        if ( authResult.value ) {
            // Authentication successful --> resolve the promise!
            debug( 'Secure session authenticated' );
            resolve();
        } else {
            reject( authResult.reason );
        }
    } );
}

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
}

function setSessionKeyPath( path ) {
}

function storeSecureSessionData( sessionId, jwtToken ) {
    // Delete the existing "anonymous session"
    sessionStore.delete( sessionId );

    // Generate a new "secure session"
    const userRecord = userStore.getOrCreate( {
        email: jwtToken.email,
        providerId: jwtToken.sub
    } );
    const secureSessionDocument = {
        email: userRecord.email,
        id: sessionId,
        providers: userRecord.providers,
        type: SESSION_DOCUMENT.TYPE.SECURE,
        userId: userRecord.id
    };

    // Store the "secure session"
    sessionStore.upsert( sessionId, secureSessionDocument );
}

function upgradeAnonSession( request, response ) {
    const anonSession = getAnonSessionName();
    const secureSession = getSecureSessionName();

    return new Promise( ( resolve, reject ) => {
        if ( request.cookies ) {
            if ( request.cookies[ anonSession ] ) {
                // TODO [1] >>> Generate a new session ID, update data in the store and cookie, encrypt the cookie, etc. <<<
                const sessionId = request.cookies[ anonSession ];

                // Check for a valid session
                const sessionData = sessionStore.get( sessionId );
                if ( sessionData && sessionData.jwtToken ) {

                    // Manually replace cookies in the current request
                    delete request.cookies[ anonSession ];
                    request.cookies[ secureSession ] = sessionId;

                    // Replace cookies on the client
                    // TODO [1] >>> This should be handled by the Glados Cookie middleware, not the regular Express one
                    response.clearCookie( anonSession );
                    response.cookie( secureSession, sessionId, STRICT_COOKIE_OPTIONS );

                    // Update data in session store
                    storeSecureSessionData( sessionId, sessionData.jwtToken );

                    // Upgrade complete --> resolve the promise
                    debug( 'Upgraded anonymous session' );
                    resolve({ request, response });
                } else {
                    // Session is invalid, so reject
                    debug( 'Found invalid anonymous session' );
                    reject( ERROR_SOURCE.ANON_SESSION.INVALID );
                }
            } else if ( request.cookies[ secureSession ] ) {
                // Found secure session --> resolve the promise
                debug( 'Found secure session' );
                resolve({ request, response });
            } else {
                debug( 'No anonymous session found. No secure session found.' );
                reject( ERROR_SOURCE.ANON_SESSION.MISSING );
            }
        } else {
            debug( 'Missing session' );
            reject( ERROR_SOURCE.MISSING_SESSION );
        }
    } );
}

const gladosSession = {
    configureStore: sessionStore.configure,
    generateSessionObject,
    getRequireAuthMiddleware,
    getSessionKey,
    handleAnonymousSession,
    storeJwtToken,
};

export default gladosSession;
export type { AnonymousSessionDocument, SecureSessionDocument };
