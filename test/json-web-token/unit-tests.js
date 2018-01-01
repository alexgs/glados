import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import jwtLibrary from 'jsonwebtoken';
import _ from 'lodash';
import ms from 'ms';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import jwt, { messages } from '../../lib/json-web-tokens';

chai.use( sinonChai );
chai.use( dirtyChai );

describe( 'Glados includes a JWT module that', function() {
    const encryptedToken = 'this-is-some-encrypted-data';
    const key = 'dummy-key';
    const plainTextToken = 'this-is-some-secret-info';

    context( 'has a `validateClaims` function, which returns a Promise that', function() {
        const fakeClientId = 'fly-by-night';
        const fakeDomain = 'rush.auth0.com';
        const now = Date.now();
        const validToken = {
            exp: now + ms( '1d' ),
            iss: `https://${fakeDomain}/`,
            aud: fakeClientId,
        };
        context( 'throws an error if the token', function() {
            it( 'has expired', function() {
                const dateStub = sinon.stub( Date, 'now' ).returns( now );

                const expires = now - ms( '1d' );
                const badToken = _.merge( {}, validToken, { exp: expires } );
                expect( function() {
                    jwt.validateClaims( badToken, fakeDomain, fakeClientId );
                } ).to.throw( Error, messages.expiredToken( now, expires ) );

                dateStub.restore();
            } );

            it( 'has an invalid issuer', function() {
                const badIssuer = 'https://bad-issuer.xyz';
                const badToken = _.merge( {}, validToken, { iss: badIssuer } );
                expect( function() {
                    jwt.validateClaims( badToken, fakeDomain, fakeClientId );
                } ).to.throw( Error, messages.invalidIssuer( badIssuer ) );
            } );

            it( 'has an invalid audience', function() {
                const badAudience = 'i-r-baboon';
                const badToken = _.merge( {}, validToken, { aud: badAudience } );
                expect( function() {
                    jwt.validateClaims( badToken, fakeDomain, fakeClientId );
                } ).to.throw( Error, messages.invalidAudience( badAudience ) );
            } );
        } );

        it( '(if the claims are valid) returns a Promise that resolves with the plain text of the token', function( done ) {
            jwt.validateClaims( validToken, fakeDomain, fakeClientId )
                .then( token => {
                    expect( token ).to.deep.equal( validToken );
                    done();
                } );
        } );
    } );

    context( 'has a `verifySignature` function, which returns a Promise that', function() {
        it( 'rejects with an Error if verification fails', function( done ) {
            const errorMessage = 'The JWT failed verification';
            const libraryStub = sinon.stub( jwtLibrary, 'verify' )
                .callsFake( function( idToken, publicKey, callback ) {
                    expect( idToken ).to.equal( encryptedToken );
                    expect( publicKey ).to.equal( key );
                    callback( new Error( errorMessage ), null );
                } );

            jwt.verifySignature( encryptedToken, key )
                .then( () => { throw new Error( 'This should never get invoked' ) } )
                .catch( error => {
                    expect( error.message ).to.equal( errorMessage );
                    expect( libraryStub ).to.have.been.calledOnce();
                    libraryStub.restore();
                    done();
                } );
        } );

        it( 'resolves with a decoded token if verification succeeds', function( done ) {
            const libraryStub = sinon.stub( jwtLibrary, 'verify' )
                .callsFake( function( idToken, publicKey, callback ) {
                    expect( idToken ).to.equal( encryptedToken );
                    expect( publicKey ).to.equal( key );
                    callback( null, plainTextToken );
                } );

            jwt.verifySignature( encryptedToken, key )
                .then( tokenData => {
                    expect( tokenData ).to.equal( plainTextToken );
                    expect( libraryStub ).to.have.been.calledOnce();
                    libraryStub.restore();
                    done();
                } );
        } );
    } );
} );
