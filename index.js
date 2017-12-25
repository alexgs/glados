import _ from 'lodash';

const optionsTemplate = {
    domain: _.isString,
    clientId: _.isString,
    clientSecret: _.isString,
    callbackUrl: _.isString
};

export default function GladosFactory( options ) {
    if ( !_.conformsTo( options, optionsTemplate ) ) {
        throw new Error( messagesFactory.optionsObjectNotCorrect() );
    }
}

export const messagesFactory = {
    optionsObjectNotCorrect: () => `The \`options\` object does not have the correct fields and types.`
};
