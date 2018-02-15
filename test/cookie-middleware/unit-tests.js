import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import debugAgent from 'debug';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import ms from 'ms';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import gladosCookies from '../../lib/cookie-middleware';

const debug = debugAgent( 'glados:unit-test' );

chai.use( sinonChai );
chai.use( chaiAsPromised );
chai.use( dirtyChai );

describe( 'Glados includes a Cookie Middleware module that', function() {
    it( 'parses an http `Cookie` header and stores cookies on the Express Request object' );
    context( 'manages cookies on the client. It', function() {
        it( 'deletes cookies from the client' );
        it( 'sends cookies to the client')
    } );
    it( 'encrypts data before sending to the client' );
    it( 'signs data before sending to the client' );
    it( 'decrypts data received from the client' );
    it( 'verifies data received from the client' );
} );
