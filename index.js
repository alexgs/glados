import oauth2 from './lib/oauth2';
import session from './lib/session';

function getCookieMiddleware() {
    // TODO Copy the guts of the `cookie-parser` library here
}

function getSessionMiddleware() {
    return function( request, response, next ) {
    //     session.initializeSessionCookie( request, response )
    //         .then( sessionId => next() );
        next();
    }
}

const glados = {
    completeOAuth2: oauth2.completeOAuth2,
    configureOAuth2: oauth2.configure,
    ensureAuthenticated: oauth2.ensureAuthenticated,
    getCookieMiddleware,
    getDummyHandler: oauth2.getDummyHandler,
    getSessionMiddleware,
    logout: oauth2.logout,
    startOAuth2: oauth2.startOAuth2
};

export default glados;
