import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import GladosFactory, { messagesFactory } from '../index';

chai.use( dirtyChai );

describe( 'Glados', function() {
    context( 'is created from a Glados Factory that', function() {
        context( 'throws an error if the `options` object is missing a required field:', function() {
            let options = null;
            beforeEach( function() {
                options = {
                    domain: 'example.com',
                    clientId: 'abcdefghijklmnopqrstuvwxyz',
                    clientSecret: 'setec astronomy',
                    callbackUrl: 'http://callback.url/hello'
                };
            } );

            it( 'the `domain` field is not a string', function() {
                delete options.domain;
                expect( function() {
                    GladosFactory( options );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `clientId` field is not a string', function() {
                delete options.clientId;
                expect( function() {
                    GladosFactory( options );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `clientSecret` field is not a string', function() {
                delete options.clientSecret;
                expect( function() {
                    GladosFactory( options );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `callbackUrl` field is not a string', function() {
                delete options.callbackUrl;
                expect( function() {
                    GladosFactory( options );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );
        } );

    } );
} );
