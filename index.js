import debugAgent from 'debug';
import oauth2 from './lib/oauth2';
import session from './lib/session';

const debug = debugAgent( 'glados:core' );


// TODO >>> Create a `configure` function here that allows for DI but uses reasonable defaults, then configures the separate submodules
function configure( options ) {
    if ( !_.has( options, 'expressApp' ) ) {
        throw new error( messages.optionsMustHaveField( 'an "expressApp"' ) );
    }
    if ( !_.has( options, 'oauth' ) ) {
        throw new error( messages.optionsMustHaveField( 'an "oauth"' ) );
    }
    if ( !_.has( options, 'userStore' ) ) {
        throw new error( messages.optionsMustHaveField( 'a "userStore"' ) );
    }


}

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

export const messages = {
    optionsMustHaveField: ( fieldWithArticle ) => {
        // The `fieldsWithArticle` should have double-quotes around the field name (e.g., 'an "awesome"')
        `The \`options\` argument to \`Glados.configure\` must have ${fieldWithArticle} property.`
    }
};

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
