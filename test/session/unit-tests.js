import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import url from 'url';
import defaultCsrfStore from '../../lib/csrf-token-store';

import session from '../../lib/session';

chai.use( sinonChai );
chai.use( chaiAsPromised );
chai.use( dirtyChai );

// TODO >>> Add tests for `setAnonymousSession` <<<

describe( 'Glados includes a Session module that', function() {
    context( 'has a `setAnonymousSession` function, which', function() {
        context( 'returns a Promise that', function() {
            it( '(if the cookie is sent from the client) resolves with the session ID and JWT token' );

            context( '(if the cookie is not sent by the client)', function() {
                it( 'sends a cookie to the client' );

                it('resolves with the session ID and JWT token' );
            } );
        } );

        it( 'accepts an undefined JWT token' );
    } );
} );
