import crypto from 'crypto';
import _ from 'lodash';
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
        tokenUrl: 'https://' + options.domain + '/oauth/token',
        userInfoUrl: 'https://' + options.domain + '/userinfo',
        apiUrl: 'https://' + options.domain + '/api'
    };
    factoryOptions = _.merge( {}, options, derivedOptions );
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

function completeOAuth2() {}

function ensureAuthenticated() {}

function getLoginHandler() {}

function logout() {}

function startOAuth2() {
    if ( _.isNull( factoryOptions ) || !_.conformsTo( factoryOptions, allFactoryOptionsFields ) ) {
        throw new Error( messagesFactory.illegalState() );
    }

    const csrfToken = crypto.randomBytes( 32 ).toString( 'base64' );

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

    // Return an Express middleware function
    return function( request, response ) {
        response.redirect( authorizationUrl );
    };
}
