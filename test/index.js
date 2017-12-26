import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import GladosFactory, { messagesFactory } from '../index';

chai.use( dirtyChai );

describe( 'Glados', function() {
    context( 'is created from a Glados Factory that', function() {
        context( 'has an `initialize` method. This method', function() {
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

                it( 'the `domain` field must be a string', function() {
                    delete options.domain;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );

                it( 'the `clientId` field must be a string', function() {
                    delete options.clientId;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );

                it( 'the `clientSecret` field must be a string', function() {
                    delete options.clientSecret;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );

                it( 'the `callbackUrl` field must be a string', function() {
                    delete options.callbackUrl;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );
            } );

            it( 'throws an error if called more than once', function() {
                const options = {
                    domain: 'example.com',
                    clientId: 'abcdefghijklmnopqrstuvwxyz',
                    clientSecret: 'setec astronomy',
                    callbackUrl: 'http://callback.url/hello'
                };
                expect( function() {
                    GladosFactory.initialize( options );
                    GladosFactory.initialize( options );
                } ).to.throw( Error, messagesFactory.factoryAlreadyInitialized() );

            } );
        } );

    } );
} );
