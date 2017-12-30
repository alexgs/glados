import debugAgent from 'debug';

const debug = debugAgent( 'glados:session' );

function login( jwtIdToken ) {
    debug( 'Function `login` started' );
    return new Promise( ( resolve, reject ) => {

        resolve( jwtIdToken );
    } );
}

const gladosSession = {
    login
};

export default gladosSession;
