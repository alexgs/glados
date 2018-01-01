import oauth2 from './lib/oauth2';
import session from './lib/session';

function getCookieMiddleware() {
    // TODO Copy the guts of the `cookie-parser` library here
}

function getSessionMiddleware() {
    return function( request, response, next ) {
        // TODO >>> Does the session object persist between requests, or is it reloaded every time?
        request.session = request.session || session.generateSessionObject();
        next();
    }
}

// TODO >>> Create a `configure` function here that allows for DI but uses reasonable defaults, then configures the separate submodules

const glados = {
    completeOAuth2: oauth2.completeOAuth2,
    configureOAuth2: oauth2.configure,
    configureSessionStore: session.configureStore,
    generateSessionObject: session.generateSessionObject,
    getCookieMiddleware,
    getDummyHandler: oauth2.getDummyHandler,
    getRequireAuthMiddleware: session.getRequireAuthMiddleware,
    getSessionMiddleware,
    logout: oauth2.logout,
    startOAuth2: oauth2.startOAuth2
};

export default glados;
