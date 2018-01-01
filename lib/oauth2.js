import debugAgent from 'debug';
import _ from 'lodash';
import superagent from 'superagent';
import url from 'url';
import csrf, { _reset as csrfStoreReset } from './csrf-token-store';
import jwt from './json-web-tokens';
import session from './session';

const debug = debugAgent( 'glados:oauth2' );

let factoryOptions = null;

const allFactoryOptionsFields = {
    apiUrl: _.isString,
    authorizationUrl: _.isString,
    callbackUrl: _.isString,
    clientId: _.isString,
    clientSecret: _.isString,
    domain: _.isString,
    tokenUrl: _.isString,
    userInfoUrl: _.isString
};

const optionsFields = {
    callbackUrl: _.isString,
    clientId: _.isString,
    clientSecret: _.isString,
    domain: _.isString
};

const requestFields = {
    hostname: _.isString,
    protocol: _.isString,
    query: _.conforms( {
        code: _.isString,
        state: _.isString
    } )
};


// --- OAUTH2 APP FUNCTIONS ---

function configure( options, app ) {
    // TODO Update to work with capitalization pattern used by Passport
    debug( 'Receiving configuration' );
    if ( !_.conformsTo( options, optionsFields ) ) {
        throw new Error( messagesFactory.optionsObjectNotCorrect() );
    }
    if ( !_.isObject( app ) || !_.has( app, 'locals' ) ) {
        debug( JSON.stringify( app, null, 4 ) );
        throw new Error( messagesFactory.appIsNotValid() );
    }
    if ( !_.isNull( factoryOptions ) ) {
        debug( 'Illegal secondary configuration %O', options );
        throw new Error( messagesFactory.moduleAlreadyConfigured() );
    }

    const derivedOptions = {
        authorizationUrl: 'https://' + options.domain + '/authorize',
        tokenUrl: 'https://' + options.domain + '/oauth/token',
        userInfoUrl: 'https://' + options.domain + '/userinfo',
        apiUrl: 'https://' + options.domain + '/api'
    };
    factoryOptions = _.merge( {}, options, derivedOptions );

    csrf.initialize( app.locals );
    debug( 'Configuration complete' );
}

export const messagesFactory = {
    appIsNotValid: () => `The \`app\` argument must be an object with a \`locals\` field.`,
    moduleAlreadyConfigured: () => `The Glados OAuth2 module has already been configured.`,
    moduleNotInitialized: ( funcName ) => `The Glados OAuth2 module must be initialized before \`${funcName}\` is called.`,
    illegalRequest: () => `The request received by the Glados OAuth2 \`completeOAuth2\' function does not contain`
        + ` the necessary data`,
    illegalState: () => `The Glados OAuth2 module is in an illegal state`,
    optionsObjectNotCorrect: () => {
        return `The \`options\` object is missing one or more required fields (Double-check that your`
            + ` capitalization matches).`;
    }

};

/**
 * @private
 *
 * Reset the factory options so that `configure` can be called again. **WARNING:** For use only in **development**
 * and **testing;** use in a production environment may lead to unexpected and unpredictable results.
 */
export function _reset() {
    factoryOptions = null;
    csrfStoreReset();
}


// --- OAUTH2 MIDDLEWARE FUNCTIONS ---

function completeOAuth2( publicKey ) {
    // Return an Express middleware function *before* Glados is configured
    return function( request, response, next ) {
        if ( _.isNull( factoryOptions ) ) {
            throw new Error( messagesFactory.moduleNotInitialized( 'completeOAuth2' ) );
        }
        if ( !_.conformsTo( factoryOptions, allFactoryOptionsFields ) ) {
            throw new Error( messagesFactory.illegalState() );
        }

        if ( !_.conformsTo( request, requestFields ) ) {
            throw new Error( messagesFactory.illegalRequest() );
        }

        if ( !csrf.verifyToken( request.query.state ) ) {
            // TODO [Future] Allow this to be customized
            // TODO This seems to throw an error, "Error: Can't set headers after they are sent."
            response.redirect( '/' ).end();
        }

        const tokenUrlParams = {
            grant_type: 'authorization_code',
            client_id: factoryOptions.clientId,
            client_secret: factoryOptions.clientSecret,
            code: request.query.code,
            redirect_uri: factoryOptions.callbackUrl
        };

        superagent.post( factoryOptions.tokenUrl )
            .send( tokenUrlParams )
            .then( agentResponse => {
                if ( agentResponse.ok === true ) {
                    return Promise.resolve( agentResponse.body );
                } else {
                    throw new Error( 'Something happened when I tried to get the token' );
                }
            } )
            .then( data => Promise.resolve( {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    idToken: data.id_token
                } ) )
            .then( data => {
                // TODO [Future] Pass a custom handler to the `completeOAuth2` function, and execute it here
                // TODO Write tests for these functions and different scenarios (happy path, failure, etc.)
                return Promise.resolve( data.idToken );
            } )
            .then( idToken => jwt.verifySignature( idToken, publicKey ) )
            .then( idToken => jwt.validateClaims( idToken, factoryOptions.domain, factoryOptions.clientId ) )
            .then( idToken => session.setAnonymousSession( request, response, idToken ) )
            .then( ({ sessionId, idToken }) => session.storeIdToken( sessionId, idToken ) )
            .then( ({ sessionId, idToken }) => {
                // We **can** set a secure/strict cookie here, but it won't be immediately available because of
                // redirects and same-site policy. So we just call `next()` and let the route itself handle
                // redirection. The next route should use the middleware generated by `session.ensureAuthenticated`
                // to finish the authentication process.
                next();
            } )
            .catch( error => {
                // debug( 'Error: %s', error.message );
                debug( 'Error: %O', error );
                debug( 'URL: %s', factoryOptions.tokenUrl );
                debug( 'Params: %O', tokenUrlParams );
                next();
            } );
    };
}

/**
 * Returns a dummy route handler for use with redirecting middleware functions. Used correctly, this should never
 * be called.
 * @returns {Function} An Express route handler
 */
function getDummyHandler() {
    return function( request, response ) {
        debug( '[WARNING] Dummy route handler called' );
        response.redirect( '/' );
    };
}

function logout() {
    return getDummyHandler();
}

function startOAuth2() {
    // Return an Express middleware function *before* Glados is configured
    return function( request, response ) {
        if ( _.isNull( factoryOptions ) ) {
            throw new Error( messagesFactory.moduleNotInitialized( 'startOAuth2' ) );
        }
        if ( !_.conformsTo( factoryOptions, allFactoryOptionsFields ) ) {
            throw new Error( messagesFactory.illegalState() );
        }

        const csrfToken = csrf.generateToken();
        const oauthParams = {
            audience: `https://${factoryOptions.domain}/userinfo`,
            client_id: factoryOptions.clientId,
            redirect_uri: factoryOptions.callbackUrl,
            response_type: 'code',
            scope: 'openid email',
            state: csrfToken
        };

        let authorizationUrlParts = url.parse( factoryOptions.authorizationUrl, true );
        authorizationUrlParts.query = _.merge( {}, authorizationUrlParts.query, oauthParams );
        let authorizationUrl = url.format( authorizationUrlParts );

        session.setAnonymousSession( request, response )
            .then( () => {
                // Redirect to OAuth2 provider, instead of calling `next`
                response.redirect( authorizationUrl );
            } );
    };
}


// --- DEFAULT EXPORT ---
const oauth2module = {
    configure,
    completeOAuth2,
    getDummyHandler,
    logout,
    startOAuth2
};

export default oauth2module;
