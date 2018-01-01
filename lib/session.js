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
}

function isAuthenticated( request ) {
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
}

function getSessionKey() {
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
}

export const messages = {
    invalidKeyPath: ( path ) => `The key at ${path} does not exist.`,
    emptyKeyPath: ( funcName ) => `You must set the path to the session key file before invoking ${funcName}.`
};

function setSessionKeyPath( path ) {
}

function upgradeAnonSession( request, response ) {
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
