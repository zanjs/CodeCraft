/**
 * Created by william on 26.03.15.
 */

path = require('path');

module.exports = {
    mongo: {
        dbUrl: 'mongodb://127.0.0.1:27017'
    },
    security: {
        saltLength: 25,                                     // The length of the salt used for encryption
        dbName: 'YOURDBNAME',
        usersCollection: 'USERSCOLLECTIONNAME'              // The name of the collection contains user information
    },
    server: {
        ip: 'localhost',
        domain: 'www.codecraft.cn',
        listenPort: 3000,                                   // The port on which the server is to listen (means that the app is at http://localhost:3000 for instance)
        securePort: 8434,                                   // The HTTPS port on which the server is to listen (means that the app is at https://localhost:8433 for instance)
        distFolder: path.resolve(__dirname, './public'),    // The folder that contains the application files
        staticUrl: '/static',                               // The base url from which we serve static files (such as js, css and images)
        cookieSecret: 'YOURSECRET',                         // The secret for encrypting the cookie
        cookieName: 'YOURCOOKIENAME'                        // The cookie name
    },
    mail: {
        emailAddress: 'EMAILADDRESS',                       // Email accound that used by the system
        emailPassword: 'EMAILPASSWORD'                      // Email Password
    }
};