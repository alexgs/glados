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
    it( 'passes a canary test', function( done ) {
        // TODO ? None of these seem to work :-(
        // return expect( Promise.resolve( { foo: 'bar' } ) ).to.eventually.have.property( 'foo' );
        // return expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 );
        // expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 ).and.notify( done );
        expect( Promise.resolve( 4 ) ).to.eventually.equal( 4 ).and.notify( done );
    } );
} );
