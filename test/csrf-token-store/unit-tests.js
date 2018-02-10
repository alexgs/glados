import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import csrfStore, { messageFactory, _reset as resetStore } from '../../lib/csrf-token-store';

chai.use( sinonChai );
chai.use( chaiAsPromised );
chai.use( dirtyChai );

describe( 'Glados includes a CRSF Token Store module that', function() {
    beforeEach( function() {
        resetStore();
    } );

    context.skip( '(working with "Chai as Promised")', function() {
        it( 'passes one canary test', function() {
            return expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 );
        } );

        it( 'passes another canary test', function( done ) {
            expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 ).and.notify( done );
        } );
    } );

    it( 'has a function `initialize`, which throws an error if store contains one or more items', function() {
        csrfStore.storeToken( 'ive-got-a-bad-feeling-about-this' );
        expect( function() {
            csrfStore.initialize( {} );
        } ).to.throw( Error, messageFactory.storeNotEmpty() );
    } );

    it( 'has a function `storeToken`, which throws an error if the `token` is already in the store', function() {
        const twofer = 'may-the-schwartz-be-with-you';
        expect( function() {
            csrfStore.storeToken( twofer )
        } ).to.not.throw();
        expect( function() {
            csrfStore.storeToken( twofer )
        } ).to.throw( Error, messageFactory.storeHasToken( twofer ) );
    } );

    context( 'has a function `verifyToken`, which', function() {
        const ludicrousSpeed = 'theyve-gone-to-plaid';

        context( '(if the token is in the store)', function() {
            it( 'returns true', function() {
                csrfStore.storeToken( ludicrousSpeed );
                expect( csrfStore.verifyToken( ludicrousSpeed ) ).to.equal( true );
            } );

            it( 'removes the token from the store', function() {
                // Store a token
                csrfStore.storeToken( ludicrousSpeed );

                // Try to store the same token and catch an error
                try {
                    csrfStore.storeToken( ludicrousSpeed );
                } catch ( error ) {
                    expect( error.message ).to.equal( messageFactory.storeHasToken( ludicrousSpeed ) );
                }

                // Verify the token
                expect( csrfStore.verifyToken( ludicrousSpeed ) ).to.equal( true );

                // Store the token without an error
                expect( function() {
                    csrfStore.storeToken( ludicrousSpeed );
                } ).to.not.throw();
            } );
        } );

        it( '(if the token is not the store) returns false', function() {
            expect( csrfStore.verifyToken( ludicrousSpeed ) ).to.equal( false );
        } );
    } );
} );
