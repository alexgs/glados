import debugAgent from 'debug';
import _ from 'lodash';

const SESSION_STORE_FIELD = 'glados-session-store';
const debug = debugAgent( 'glados:session-store' );

let store = new Map();

function configure( context ) {
    if ( !_.isObject( context ) ) {
        throw new Error( messages.contextMustBeObject( context ) );
    }
    if ( store.size > 0 ) {
        throw new Error( messages.storeNotEmpty() );
    }
    context[ SESSION_STORE_FIELD ] = store;
    debug( 'Session Store configuration complete.' );
}

function deleteData( key ) {
    debug( 'Deleted data and key %s', key );
    return store.delete( key );
}

function get( key ) {
    debug( 'Retrieved data for key %s', key );
    return store.get( key );
}

export const messages = {
    contextMustBeObject: ( badContext ) => `The context argument must be an object, but the \`configure\` function`
        + ` received a ${typeof badContext}.`,
    storeHasKey: ( key ) => `The store already contains the session ID ${key}.`,
    storeNotEmpty: () => `The store must be empty.`
};

function upsert( key, data ) {
    let currentData = null;
    if ( store.has( key ) ) {
        currentData = store.get( key );
    } else {
        currentData = {};
    }
    const newData = _.merge( {}, currentData, data );
    store.set( key, newData );
    debug( 'Upsert for key %s complete', key );
}

const sessionStore = {
    configure,
    delete: deleteData,
    get,
    upsert
};

export default sessionStore;
