// @flow

type UserLookupData = {
    email:string,
    providerId:string
};

type GladosUser = {
    email:string,
    id: string|number,
    providers:Array<string>
}

// TODO [2] >>> This should be in a module provided by the application; we should export a Flow interface for it <<<

function getOrCreate( userData:UserLookupData ):GladosUser {
    return {
        email: userData.email,
        providers: [ userData.providerId ],
        id: 27
    };
}

const userStore = {
    getOrCreate
};

export default userStore;
export type { UserLookupData, GladosUser };
