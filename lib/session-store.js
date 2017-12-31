import debugAgent from 'debug';
import _ from 'lodash';

const SESSION_STORE_FIELD = 'glados-session-store';
const debug = debugAgent( 'glados:session-store' );

let store = new Map();

function configure( context ) {
}

function deleteData( key ) {
}

function get( key ) {
}

export const messages = {
    contextMustBeObject: ( badContext ) => `The context argument must be an object, but the \`configure\` function`
        + ` received a ${typeof badContext}.`,
    storeHasKey: ( key ) => `The store already contains the session ID ${key}.`,
    storeNotEmpty: () => `The store must be empty.`
};

function upsert( key, data ) {
}

const sessionStore = {
    configure,
    delete: deleteData,
    get,
    upsert
};

export default sessionStore;
