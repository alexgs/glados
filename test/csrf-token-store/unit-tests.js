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

// TODO >>> Add tests for `verifyToken` and other functions with failure modes <<<

describe( 'Glados includes a CRSF Token Store module that', function() {
    it( 'passes a canary test', function( done ) {
        // return expect( Promise.resolve( { foo: 'bar' } ) ).to.eventually.have.property( 'foo' );
        // return expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 );
        // expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 ).and.notify( done );
        expect( Promise.resolve( 4 ) ).to.eventually.equal( 4 ).and.notify( done );
    } );
} );
