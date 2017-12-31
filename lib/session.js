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

function generateSessionId() {
    return uuid.v4();
}

/**
 * Return the name used for anonymous session cookies
 * @returns {string} Cookie name for anonymous session
 */
function getAnonSessionName() {
    return 'anon.sid';
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

function storeIdToken( sessionId, idToken ) {
    return new Promise( ( resolve, reject ) => {
        sessionStore.upsert( sessionId, idToken );
        debug( 'Stored JWT ID Token in session store' );
        resolve( { sessionId, idToken } );
    } );
}

const gladosSession = {
    generateSessionId,
    getAnonSessionName,
    getSessionKey,
    setAnonymousSession,
    login,
    setSessionKeyPath,
    storeIdToken
};

export default gladosSession;
