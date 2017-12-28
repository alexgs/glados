import _ from 'lodash';
import superagent from 'superagent';
import url from 'url';
import defaultCsrfStore from './lib/csrf-token-store';

let csrf = null;
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


// --- GLADOS FACTORY METHODS ---

function create() {
    if ( _.isNull( factoryOptions ) ) {
        throw new Error( messagesFactory.factoryNotInitialized() );
    }

    return {
        completeOAuth2,
        ensureAuthenticated,
        getLoginHandler,
        logout,
        startOAuth2
    };
}

function initialize( options, app, csrfStore = defaultCsrfStore ) {
    if ( !_.conformsTo( options, optionsFields ) ) {
        throw new Error( messagesFactory.optionsObjectNotCorrect() );
    }
    if ( !_.isObject( app ) || !_.has( app, 'locals' ) ) {
        throw new Error( messagesFactory.appIsNotValid() );
    }
    if ( !_.isNull( factoryOptions ) ) {
        throw new Error( messagesFactory.factoryAlreadyInitialized() );
    }
    // TODO Validations for `csrfStore`

    const derivedOptions = {
        authorizationUrl: 'https://' + options.domain + '/authorize',
        tokenUrl: 'https://' + options.domain + '/oauth/token',
        userInfoUrl: 'https://' + options.domain + '/userinfo',
        apiUrl: 'https://' + options.domain + '/api'
    };
    factoryOptions = _.merge( {}, options, derivedOptions );

    csrf = csrfStore;
    csrf.initialize( app.locals );
}

export const messagesFactory = {
    appIsNotValid: () => `The \`app\` argument must be an object with a \`locals\` field.`,
    factoryAlreadyInitialized: () => `The Glados Factory has already been initialized.`,
    factoryNotInitialized: () => `The Glados Factory must be initialized before \`create\` is called.`,
    illegalRequest: () => `The request received by the callback does not contain the necessary data`,
    illegalState: () => `Glados or her factory is in an illegal state`,
    optionsObjectNotCorrect: () => `The \`options\` object does not have the correct fields and types.`
};

/**
 * @private
 *
 * Reset the factory options so that `initialize` can be called again. **WARNING:** For use only in **development**
 * and **testing;** use in a production environment may lead to unexpected and unpredictable results.
 */
function _reset() {
    factoryOptions = null;
    if ( !_.isNull( csrf ) ) {
        csrf._reset();
        csrf = null;
    }
}

const GladosFactory = {
    create,
    initialize,
    _reset
};

export default GladosFactory;


// --- GLADOS OBJECT FUNCTIONS ---

function completeOAuth2() {
/*
"Get Token" Request
POST https://ickyzoo.auth0.com/oauth/token
Content-Type: application/json
{
  "grant_type": "authorization_code",
  "client_id": "JoVzWhQOwQwIkialwg6uY5GfOAhfdI_A",
  "client_secret": "n8K9Yfi8yGwCWKUZyk01A8t9MjJVsKzasUlHpXrpfMzhZr48ahvOrVMAc_eiwAZo",
  "code": "AUTHORIZATION_CODE",
  "redirect_uri": https://atlas.sword:5481/login/auth-complete
}
*/

    // Return an Express middleware function
    return function( request, response ) {
        if ( !_.conformsTo( request, requestFields ) ) {
            throw new Error( messagesFactory.illegalRequest() );
        }

        if ( !csrf.verifyToken( request.query.state ) ) {
            // TODO Allow this to be customized
            response.redirect( '/' );
        }

        const tokenUrlParams = {
            grant_type: 'authorization_code',
            client_id: factoryOptions.clientId,
            client_secret: factoryOptions.clientSecret,
            code: request.query.code,
            redirect_uri: factoryOptions.callbackUrl
        };

/*
"Get Token" Response
HTTP/1.1 200 OK
Content-Type: application/json
{
  "access_token":"eyJz93a...k4laUWw",
  "refresh_token":"GEbRxBN...edjnXbL",
  "id_token":"eyJ0XAi...4faeEoQ",
  "token_type":"Bearer",
  "expires_in":86400
}
*/
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
                } )
            )
            .then( data => {
                // TODO Verify `id_token`, initiate session store, set cookie, etc.
                // TODO [Future] Pass a custom handler to the `completeOAuth2` function, and execute it here
            } )
            .then( () => {
                // TODO Redirect to callback URL
            } )
            .catch( error => {
                // TODO
            } );
    };
}

function ensureAuthenticated() {}

function getLoginHandler() {}

function logout() {}

function startOAuth2() {
    if ( _.isNull( factoryOptions ) || !_.conformsTo( factoryOptions, allFactoryOptionsFields ) ) {
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

    // superagent
    //     .get( authorizationUrl )
    //     .then( response => {
    //         console.log( JSON.stringify( response, null, 4 ) );
    //     } )
    //     .catch( error => console.error( error ) );

    // Return an Express middleware function
    return function( request, response ) {
        response.redirect( authorizationUrl );
    };
}


// --- UTILITY FUNCTIONS ---
