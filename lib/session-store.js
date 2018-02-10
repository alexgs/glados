// @flow
import debugAgent from 'debug';
import _ from 'lodash';
import type { AnonymousSessionDocument, SecureSessionDocument } from './session';
import type { GladosContext } from '../index';

const SESSION_STORE_FIELD = 'glados-session-store';
const debug = debugAgent( 'glados:session-store' );

let store = new Map();

function configure( express:GladosContext ) {
    if ( store.size > 0 ) {
        throw new Error( messages.storeNotEmpty() );
    }
    express.locals[ SESSION_STORE_FIELD ] = store;
    debug( 'Session Store configuration complete.' );
}

function deleteData( key:mixed ) {
    debug( 'Deleted data and key %s', key );
    return store.delete( key );
}

function get( key:mixed ) {
    debug( 'Retrieved data for key %s', key );
    return store.get( key );
}

export const messages = {
    // contextMustBeObject: ( badContext:mixed ) => `The context argument must be an object, but the \`configure\` function`
    //     + ` received a ${typeof badContext}.`,
    storeNotEmpty: () => `The store must be empty.`
};

function upsert( key:mixed, data:AnonymousSessionDocument|SecureSessionDocument ) {
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
