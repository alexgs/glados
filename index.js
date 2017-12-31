import oauth2 from './lib/oauth2';
import session from './lib/session';

function getCookieMiddleware() {
    // TODO Copy the guts of the `cookie-parser` library here
}

function getSessionMiddleware() {
    return function( request, response, next ) {
        request.session = request.session || {};
    //     session.setAnonymousSession( request, response )
    //         .then( sessionId => next() );
        next();
    }
}

const glados = {
    completeOAuth2: oauth2.completeOAuth2,
    configureOAuth2: oauth2.configure,
    getCookieMiddleware,
    getDummyHandler: oauth2.getDummyHandler,
    getRequireAuthMiddleware: session.getRequireAuthMiddleware,
    getSessionMiddleware,
    logout: oauth2.logout,
    startOAuth2: oauth2.startOAuth2
};

export default glados;
