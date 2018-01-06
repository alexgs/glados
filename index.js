import debugAgent from 'debug';
import oauth2 from './lib/oauth2';
import session from './lib/session';

const debug = debugAgent( 'glados:core' );

function getCookieMiddleware() {
    // TODO >>> Copy the guts of the `cookie-parser` library here
    // TODO >>> Implement signing and encrypting cookies
}

function getSessionMiddleware() {
    return function( request, response, next ) {
        if ( request.session ) {
            // The session object **DOES NOT** persist between requests. This never gets called; it's just here to
            // document this behavior
            debug( 'Existing session: %O', request.session );
        } else {
            debug( 'Generating new session' );
            request.session = session.generateSessionObject();
        }
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
