// flow-typed signature: 0a6065b1d2eda521f7cb131716afc650
// flow-typed version: <<STUB>>/@philgs/sodium_v^1.0.2/flow_v0.66.0


declare module '@philgs/sodium' {
    declare type PlainObject = { [name:string]:mixed }

    // `export default` doesn't work for `interface` or `type`, so I made a class.
    // source: https://github.com/facebook/flow/issues/4241#issuecomment-310970252
    declare class Sodium {
        static KEYBYTES:number,
        static MACBYTES:number,
        static NONCEBYTES:number,
        cipherFromHex:( hex:string ) => CipherText,
        clearFromObject:( object:PlainObject ) => ClearText,
        clearFromString:( message:string ) => ClearText,
        keyFromHex:( hex:string ) => Key,
        newKey:() => Key,
        newNonce:() => Nonce,
        nonceFromHex:(hex:string) => Nonce
    }
    declare export default typeof Sodium

    declare export interface CipherText {
        buffer:Buffer,
        decrypt: ( key:Key, nonce:Nonce ) => ClearText;
        hex:string
    }

    declare export interface ClearText {
        buffer:Buffer;
        encrypt: ( key:Key, nonce:Nonce ) => CipherText;
        json:?PlainObject;
        string:string;
    }

    declare export interface Key {
        buffer:Buffer;
        hex:string;
    }

    declare export interface Nonce {
        buffer:Buffer;
        hex:string;
    }


}
