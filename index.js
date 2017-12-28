import crypto from 'crypto';
import _ from 'lodash';
import superagent from 'superagent';
import url from 'url';

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

const optionsTemplate = {
    callbackUrl: _.isString,
    clientId: _.isString,
    clientSecret: _.isString,
    domain: _.isString
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

function initialize( options ) {
    if ( !_.conformsTo( options, optionsTemplate ) ) {
        throw new Error( messagesFactory.optionsObjectNotCorrect() );
    }
    if ( !_.isNull( factoryOptions ) ) {
        throw new Error( messagesFactory.factoryAlreadyInitialized() );
    }

    const derivedOptions = {
        authorizationUrl: 'https://' + options.domain + '/authorize',
        tokenUrl:         'https://' + options.domain + '/oauth/token',
        userInfoUrl:      'https://' + options.domain + '/userinfo',
        apiUrl:           'https://' + options.domain + '/api'
    };
    factoryOptions = _.merge( {}, options, derivedOptions );
    // console.log( `45: ${JSON.stringify( factoryOptions, null, 4 )}` );
}

export const messagesFactory = {
    factoryAlreadyInitialized: () => `The Glados Factory has already been initialized.`,
    factoryNotInitialized: () => `The Glados Factory must be initialized before \`create\` is called.`,
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
}

const GladosFactory = {
    create,
    initialize,
    _reset
};

export default GladosFactory;


// --- GLADOS OBJECT FUNCTIONS ---

function completeOAuth2() {
    const callbackUrl = 'https://calypso.sword:5426/login/auth-complete?code=jaWcnFTvfS00SfSA&state=mYLMVTE2mDvtBV9WpEnsyyET%2F%2B6qNY2YoZ2ROAD05WY%3D';
    const callbackUrlParts = url.parse( callbackUrl );
    console.log( JSON.stringify( callbackUrlParts, null, 4 ) );
}

function ensureAuthenticated() {}

function getLoginHandler() {}

function logout() {}

function startOAuth2() {
    if ( _.isNull( factoryOptions ) || !_.conformsTo( factoryOptions, allFactoryOptionsFields ) ) {
        throw new Error( messagesFactory.illegalState() );
    }
    // const params = {
    //     clientId: factoryOptions.clientId,
    //     domain: factoryOptions.domain,
    //     redirectUri: factoryOptions.callbackUrl,
    //     audience: `https://${factoryOptions.domain}/userinfo`,
    //     responseType: 'code',
    //     scope: 'openid email'
    // };

    // TODO Run this asynchronously
    const csrfToken = crypto.randomBytes(32).toString('base64');

    const oauthParams = {
        audience: `https://${factoryOptions.domain}/userinfo`,
        client_id: factoryOptions.clientId,
        // connection: '',
        // prompt: '',
        redirect_uri: factoryOptions.callbackUrl,
        // redirect_uri: 'https://calypso.sword:5426/login/auth-complete',
        response_type: 'code',
        scope: 'openid email',
        state: csrfToken
    };

    // const actualQueryParams = {
    //     url: 'https://ickyzoo.auth0.com/login',
    //     client: 'JoVzWhQOwQwIkialwg6uY5GfOAhfdI_A',
    //     protocol: 'oauth2',
    //     redirect_uri: 'https://calypso.sword:5426/login/auth-complete',
    //     audience: 'https://ickyzoo.auth0.com/userinfo',
    //     response_type: 'code',
    //     scope: 'openid email',
    //     state: 'ICYdxeXGLiWmUE_8CHl3WbELnfJQt3Zz'
    // };

    // console.log( `102: ${JSON.stringify( factoryOptions, null, 4 )}` );
    let authorizationUrlParts = url.parse( factoryOptions.authorizationUrl, true );
    authorizationUrlParts.query = _.merge( {}, authorizationUrlParts.query, oauthParams );
    let authorizationUrl = url.format(authorizationUrlParts);
    // console.log( JSON.stringify( authorizationUrlParts, null, 4 ) );
    // console.log( authorizationUrl );

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
