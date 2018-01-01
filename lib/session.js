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

function setAnonymousSession( request, response, idToken ) {
    const sessionCookie = getAnonSessionName();
    return new Promise( ( resolve, reject ) => {
        if ( request.cookies && request.cookies[ sessionCookie ] ) {
            const sessionId = request.cookies[ sessionCookie ];
            debug( 'Existing session cookie with ID %s', sessionId );
            resolve( { sessionId, idToken } );
        } else {
            const sessionId = generateSessionId();
            response.cookie( sessionCookie, sessionId, ANONYMOUS_COOKIE_OPTIONS );
            debug( 'New session cookie with ID %s', sessionId );
            resolve( { sessionId, idToken } );
        }
    } );
}

function storeIdToken( sessionId, idToken ) {
    return new Promise( ( resolve, reject ) => {
        sessionStore.upsert( sessionId, idToken );
        debug( 'Saved JWT ID Token to session store' );
        resolve( { sessionId, idToken } );
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
        if ( request.cookies && request.cookies[ anonSession ] ) {
            // TODO [Future] Generate a new session ID, update data in the store and cookie, encrypt the cookie, etc.
            const anonSessionId = request.cookies[ anonSession ];

            // Manually replace cookies in the current request
            delete request.cookies[ anonSession ];
            request.cookies[ secureSession ] = anonSessionId;

            // Replace cookies on the client
            response.clearCookie( anonSession );
            response.cookie( secureSession, anonSessionId, STRICT_COOKIE_OPTIONS );

            debug( 'Upgraded anonymous session' );
            resolve( anonSessionId );
            // TODO >>> What if there is already a secure session?
        } else {
            debug( 'No anonymous session to upgrade' );
            resolve( null );
        }
    } );
}

const gladosSession = {
    configureStore: sessionStore.configure,
    generateSessionObject,
    getRequireAuthMiddleware,
    getSessionKey,
    setAnonymousSession,
    storeIdToken,
};

export default gladosSession;
