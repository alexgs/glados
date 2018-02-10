// flow-typed signature: 8075655c007e3c1e27e253113b9e7acd
// flow-typed version: <<STUB>>/jsonwebtoken_v^8.1.0/flow_v0.65.0

/**
 * Once filled out, we encourage you to share your work with the
 * community by sending a pull request to:
 * https://github.com/flowtype/flow-typed
 */

declare module 'jsonwebtoken' {
  declare module.exports: any;
}

/**
 * We include stubs for each file inside this npm package in case you need to
 * require those files directly. Feel free to delete any files that aren't
 * needed.
 */
declare module 'jsonwebtoken/decode' {
  declare module.exports: {
    verify: (
        jwtString:string,
        secretOrPublicKey:Buffer|string,
        options:{ [name:string] : mixed },
        ( error:Error, decodedToken:{
            aud:string,
            exp:number,
            iat:number,
            iss:string
        } ) => void
    ) => void
  };
}

declare module 'jsonwebtoken/lib/JsonWebTokenError' {
  declare module.exports: any;
}

declare module 'jsonwebtoken/lib/NotBeforeError' {
  declare module.exports: any;
}

declare module 'jsonwebtoken/lib/timespan' {
  declare module.exports: any;
}

declare module 'jsonwebtoken/lib/TokenExpiredError' {
  declare module.exports: any;
}

declare module 'jsonwebtoken/sign' {
  declare module.exports: any;
}

declare module 'jsonwebtoken/verify' {
  declare module.exports: any;
}

// Filename aliases
declare module 'jsonwebtoken/decode.js' {
  declare module.exports: $Exports<'jsonwebtoken/decode'>;
}
declare module 'jsonwebtoken/index' {
  declare module.exports: $Exports<'jsonwebtoken'>;
}
declare module 'jsonwebtoken/index.js' {
  declare module.exports: $Exports<'jsonwebtoken'>;
}
declare module 'jsonwebtoken/lib/JsonWebTokenError.js' {
  declare module.exports: $Exports<'jsonwebtoken/lib/JsonWebTokenError'>;
}
declare module 'jsonwebtoken/lib/NotBeforeError.js' {
  declare module.exports: $Exports<'jsonwebtoken/lib/NotBeforeError'>;
}
declare module 'jsonwebtoken/lib/timespan.js' {
  declare module.exports: $Exports<'jsonwebtoken/lib/timespan'>;
}
declare module 'jsonwebtoken/lib/TokenExpiredError.js' {
  declare module.exports: $Exports<'jsonwebtoken/lib/TokenExpiredError'>;
}
declare module 'jsonwebtoken/sign.js' {
  declare module.exports: $Exports<'jsonwebtoken/sign'>;
}
declare module 'jsonwebtoken/verify.js' {
  declare module.exports: $Exports<'jsonwebtoken/verify'>;
}
