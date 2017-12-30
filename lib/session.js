import debugAgent from 'debug';
import fs from 'fs';
import ms from 'ms';
import uuid from 'uuid';

import sessionStore from './session-store';

const COOKIE_OPTIONS = {
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

function getSessionCookieName() {
    return 'sid';
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

function initializeSessionCookie( request, response, idToken ) {
    const sessionCookie = getSessionCookieName();
    return new Promise( ( resolve, reject ) => {
        if ( request.cookies && request.cookies[ sessionCookie ] ) {
            const sessionId = request.cookies[ sessionCookie ];
            debug( 'Existing session cookie with ID %s', sessionId );
            resolve( { sessionId, idToken } );
        } else {
            const sessionId = generateSessionId();
            response.cookie( sessionCookie, sessionId, COOKIE_OPTIONS );
            debug( 'New session cookie with ID %s', sessionId );
            resolve( { sessionId, idToken } );
        }
    } );
}

function login( jwtIdToken, request, response ) {
    debug( 'Function `login` started' );
    return new Promise( ( resolve, reject ) => {
        response.cookie( 'glados', jwtIdToken, COOKIE_OPTIONS );
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

function _temp_StoreValues( sessionId, idToken ) {
    sessionStore.upsert( sessionId, idToken );
    debug( 'Stored ID token in session store' );
}

const gladosSession = {
    _temp_StoreValues,
    generateSessionId,
    getSessionCookieName,
    getSessionKey,
    initializeSessionCookie,
    login,
    setSessionKeyPath
};

export default gladosSession;
