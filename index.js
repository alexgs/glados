import _ from 'lodash';

let factoryOptions = null;

const optionsTemplate = {
    domain: _.isString,
    clientId: _.isString,
    clientSecret: _.isString,
    callbackUrl: _.isString
};

function initialize( options ) {
    if ( !_.conformsTo( options, optionsTemplate ) ) {
        throw new Error( messagesFactory.optionsObjectNotCorrect() );
    }
    if ( !_.isNull( factoryOptions ) ) {
        throw new Error( messagesFactory.factoryAlreadyInitialized() );
    }
    factoryOptions = options;
}

export const messagesFactory = {
    factoryAlreadyInitialized: () => `The Glados Factory has already been initialized`,
    optionsObjectNotCorrect: () => `The \`options\` object does not have the correct fields and types.`
};

const GladosFactory = {
    initialize
};

export default GladosFactory;
