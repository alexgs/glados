import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import jwtLibrary from 'jsonwebtoken';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import jwt from '../../lib/json-web-tokens';

chai.use( sinonChai );
chai.use( dirtyChai );

describe.only( 'Glados includes a JWT module that', function() {
    const key = 'dummy-key';
    const token = 'dummy-token';

    context( 'has a `validateClaims` function, which returns a Promise that', function() {
        context( 'throws an error if the token', function() {
            it( 'has expired' );

            it( 'has an invalid issuer' );

            it( 'has an invalid audience' );
        } );
    } );

    context( 'has a `verifySignature` function, which returns a Promise that', function() {
        it( 'rejects with an Error if verification fails', function( done ) {
            const errorMessage = 'The JWT failed verification';
            const libraryStub = sinon.stub( jwtLibrary, 'verify' )
                .callsFake( function( idToken, publicKey, callback ) {
                    expect( idToken ).to.equal( token );
                    expect( publicKey ).to.equal( key );
                    callback( new Error( errorMessage ), null );
                } );

            jwt.verifySignature( token, key )
                .then( () => { throw new Error( 'This should never get invoked' ) } )
                .catch( error => {
                    expect( error.message ).to.equal( errorMessage );
                    expect( libraryStub ).to.have.been.calledOnce();
                    libraryStub.restore();
                    done();
                } );
        } );

        it( 'resolves with a decoded token if verification succeeds', function( done ) {
            const decodedToken = 'this-is-some-encrypted-info';
            const libraryStub = sinon.stub( jwtLibrary, 'verify' )
                .callsFake( function( idToken, publicKey, callback ) {
                    expect( idToken ).to.equal( token );
                    expect( publicKey ).to.equal( key );
                    callback( null, decodedToken );
                } );

            jwt.verifySignature( token, key )
                .then( tokenData => {
                    expect( tokenData ).to.equal( decodedToken );
                    expect( libraryStub ).to.have.been.calledOnce();
                    libraryStub.restore();
                    done();
                } );
        } );
    } );
} );
