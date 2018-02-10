// @flow
import debugAgent from 'debug';
import _ from 'lodash';
import superagent from 'superagent';
import url from 'url';
import csrf, { _reset as csrfStoreReset } from './csrf-token-store';
import jwt from './json-web-tokens';
import session from './session';
import type { $Request, $Response, NextFunction } from 'express';
import type { GladosContext } from '../index';

type DerivedOptions = {
    apiUrl:string,
    authorizationUrl:string,
    tokenUrl:string,
    userInfoUrl:string
};
type GladosOAuthOptions = {
    callbackUrl:string,
    clientId:string,
    clientSecret:string,
    domain:string
};
type MiddlewareOptions = GladosOAuthOptions & DerivedOptions;

const debug = debugAgent( 'glados:oauth2' );

let middlewareOptions = null;


// --- OAUTH2 APP FUNCTIONS ---

function configure( options:GladosOAuthOptions, app:GladosContext ) {
    // TODO Update to work with capitalization pattern used by Passport
    if ( middlewareOptions != null ) {
        debug( 'Illegal secondary configuration %O', options );
        throw new Error( messagesFactory.moduleAlreadyConfigured() );
    }

    middlewareOptions = makeMiddlewareOptionsObject( options );
    csrf.initialize( app.locals );
    debug( 'OAuth2 configuration complete.' );
}

export const messagesFactory = {
    appIsNotValid: () => `The \`app\` argument must be an object with a \`locals\` field.`,
    moduleAlreadyConfigured: () => `The Glados OAuth2 module has already been configured.`,
    moduleNotInitialized: ( funcName:string ) => `The Glados OAuth2 module must be initialized before \`${funcName}\` is called.`,
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
    middlewareOptions = null;
    csrfStoreReset();
}


// --- OAUTH2 MIDDLEWARE FUNCTIONS ---

function completeOAuth2( publicKey:Buffer|string ) {
    // Return an Express middleware function *before* Glados is configured
    return function( request:$Request, response:$Response, next:NextFunction ) {
        if ( middlewareOptions == null ) {
            throw new Error( messagesFactory.moduleNotInitialized( 'completeOAuth2' ) );
        }
        if ( !csrf.verifyToken( request.query.state ) ) {
            // TODO [Future] Allow this to be customized
            // TODO This seems to throw an error, "Error: Can't set headers after they are sent."
            response.redirect( '/' ).end();
        }

        const tokenUrlParams = {
            grant_type: 'authorization_code',
            client_id: middlewareOptions.clientId,
            client_secret: middlewareOptions.clientSecret,
            code: request.query.code,
            redirect_uri: middlewareOptions.callbackUrl
        };

        type JwtResponsePayload = {
            access_token:string,
            refresh_token:string,
            id_token:string
        };
        superagent.post( middlewareOptions.tokenUrl )
            .send( tokenUrlParams )
            .then( agentResponse => {
                if ( agentResponse.ok === true ) {
                    return Promise.resolve( agentResponse.body );
                } else {
                    throw new Error( 'Something happened when I tried to get the token' );
                }
            } )
            .then( ( data:JwtResponsePayload ) => Promise.resolve( {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    jwtToken: data.id_token
                } ) )
            .then( data => {
                // TODO [Future] Pass a custom handler to the `completeOAuth2` function, and execute it here
                // TODO >>> Write tests for these functions and different scenarios (happy path, failure, etc.)
                return Promise.resolve( data.jwtToken );
            } )
            .then( jwtToken => jwt.verifySignature( jwtToken, publicKey ) )
            .then( jwtToken => {
                if ( middlewareOptions == null ) {
                    throw new Error( messagesFactory.moduleNotInitialized( 'completeOAuth2' ) );
                }
                jwt.validateClaims( jwtToken, middlewareOptions.domain, middlewareOptions.clientId )
            } )
            .then( jwtToken => session.handleAnonymousSession( request, response, jwtToken ) )
            .then( ({ sessionId, jwtToken }) => session.storeJwtToken( sessionId, jwtToken ) )
            .then( ({ sessionId, jwtToken }) => {
                // We **can** set a secure/strict cookie here, but it won't be immediately available because of
                // redirects and same-site policy. So we just call `next()` and let the route itself handle
                // redirection. The next route should use the middleware generated by `session.ensureAuthenticated`
                // to finish the authentication process.
                next();
            } )
            .catch( error => {
                // debug( 'Error: %s', error.message );
                debug( 'Error: %O', error );
                if ( middlewareOptions != null ) {
                    debug( 'URL: %s', middlewareOptions.tokenUrl );
                    debug( 'Params: %O', tokenUrlParams );
                }
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
    return function( request:$Request, response:$Response ) {
        debug( '[WARNING] Dummy route handler called' );
        response.redirect( '/' );
    };
}

function logout() {
    return getDummyHandler();
}

function startOAuth2() {
    // Return an Express middleware function *before* Glados is configured
    return function( request:$Request, response:$Response ) {
        if ( middlewareOptions == null ) {
            throw new Error( messagesFactory.moduleNotInitialized( 'startOAuth2' ) );
        }

        const csrfToken = csrf.generateToken();
        const oauthParams = {
            audience: `https://${middlewareOptions.domain}/userinfo`,
            client_id: middlewareOptions.clientId,
            redirect_uri: middlewareOptions.callbackUrl,
            response_type: 'code',
            scope: 'openid email',
            state: csrfToken
        };

        let authorizationUrlParts = url.parse( middlewareOptions.authorizationUrl, true );
        authorizationUrlParts.query = _.merge( {}, authorizationUrlParts.query, oauthParams );
        let authorizationUrl = url.format( authorizationUrlParts );

        session.startAnonymousSession( request, response )
            .then( () => {
                // Redirect to OAuth2 provider, instead of calling `next`
                response.redirect( authorizationUrl );
            } );
    };
}


// --- PRIVATE HELPERS ---

function makeMiddlewareOptionsObject( options:GladosOAuthOptions ):MiddlewareOptions {
    const derivedOptions:DerivedOptions = {
        authorizationUrl: 'https://' + options.domain + '/authorize',
        tokenUrl: 'https://' + options.domain + '/oauth/token',
        userInfoUrl: 'https://' + options.domain + '/userinfo',
        apiUrl: 'https://' + options.domain + '/api'
    };
    return _.merge( {}, options, derivedOptions );
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
export type { GladosOAuthOptions };
