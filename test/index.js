import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import GladosFactory from '../index';

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
                } ).to.throw( Error, 'some message' );
            } );

            it( 'the `clientId` field is not a string' );
            it( 'the `clientSecret` field is not a string' );
            it( 'the `callbackUrl` field is not a string' );
        } );

    } );
} );
