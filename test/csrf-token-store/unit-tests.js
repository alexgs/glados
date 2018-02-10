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
    const badTokens = [ 9, [ 'one', 'two' ], { foo: 'bar' }, false ];

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

    context( 'has a function `initialize`, which', function() {
        it( 'throws an error if the `context` argument is not an object', function() {
            [
                9,
                'context',
                false
            ].forEach( function( badContext ) {
                expect( function() {
                    csrfStore.initialize( badContext );
                } ).to.throw( Error, messageFactory.contextMustBeObject( badContext ) )
            } );
        } );

        it( 'throws an error if store contains one or more items', function() {
            csrfStore.storeToken( 'ive-got-a-bad-feeling-about-this' );
            expect( function() {
                csrfStore.initialize( {} );
            } ).to.throw( Error, messageFactory.storeNotEmpty() );
        } );
    } );

    context( 'has a function `storeToken`, which', function() {
        it( 'throws an error if the `token` argument is not a string', function() {
            badTokens.forEach( function( badToken ) {
                expect( function() {
                    csrfStore.storeToken( badToken );
                } ).to.throw( Error, messageFactory.tokenMustBeString( badToken ) )
            } );
        } );

        it( 'throws an error if the `token` is already in the store', function() {
            const twofer = 'may-the-schwartz-be-with-you';
            expect( function() {
                csrfStore.storeToken( twofer )
            } ).to.not.throw();
            expect( function() {
                csrfStore.storeToken( twofer )
            } ).to.throw( Error, messageFactory.storeHasToken( twofer ) );
        } );
    } );

    context( 'has a function `verifyToken`, which', function() {
        const ludicrousSpeed = 'theyve-gone-to-plaid';

        it( 'throws an error if the `token` argument is not a string', function() {
            badTokens.forEach( function( badToken ) {
                expect( function() {
                    csrfStore.verifyToken( badToken );
                } ).to.throw( Error, messageFactory.tokenMustBeString( badToken ) )
            } );
        } );

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
