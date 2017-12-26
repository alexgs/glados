# Glados

This package provides a server-side OAuth2 implementation for Express. This allows the server to use, for example, Auth0 to handle user logins and authentication. The user data is passed back to the server, which can then use the Express Session middleware to manage the user session.

## Example Usage

In the main Express application script, typically `app.js` or `index.js`:

```javascript
import express from 'express';
import session from 'express-session';

import GladosFactory from 'glados';
const gladosOptions = {
    domain: 'example.com',
    clientId: 'abcdefghijklmnopqrstuvwxyz',
    clientSecret: 'setec astronomy',
    callbackUrl: 'http://callback.url/hello'
};
GladosFactory.initialize( gladosOptions );

const app = express();

app.use( session( sessionOptions ) );
```

In the Express routes file, e.g. `routes.js`:

```javascript
import express from 'express';
import GladosFactory from 'glados';

const glados = GladosFactory.create();
const router = express.Router();

router.get(
    '/login',
    glados.startOAuth2(),
    glados.getLoginHandler()
);

router.get(
    '/callback',
    glados.completeOAuth2(),
    ( request, response ) => response.redirect( request.session.returnTo || '/user' )
);

router.get(
    '/user',
    glados.ensureAuthenticated(),
    ( request, response ) => response.render( 'user-details.ejs' )
);

router.get(
    '/logout',
    glados.logout(),
    ( request, response ) => response.redirect( '/logout-successful' )
);
```
