/**
 * Created by william on 26.03.15.
 */

var express = require('express'),
    http = require('http'),
    favicon = require('serve-favicon'),
    morgan = require('morgan'),
    compression = require("compression"),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    cookieSession = require('cookie-session'),

    config = require('./config'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    protectJSON = require('./lib/protectJSON'),
    security = require('./lib/security');

var app = express();
// Get connection to MongoDB
var connection = mongoose.connect(config.mongo.dbUrl + '/' + config.security.dbName);

/***** Server set up *****/
app.use(express.static(config.server.distFolder));                              // serve application files
app.use(config.server.staticUrl, express.static(config.server.distFolder));     // serve static files
app.use(favicon(config.server.distFolder + '/favicon.png'));                    // serve favicon
app.use(protectJSON);                                                           // apply JSON protection
app.set('port', config.server.listenPort);                                      // set up port number
app.set('securePort', config.server.securePort);                                // set up secure port number
app.use(morgan('combined'));                                                    // set up logger
app.use(compression());                                                         // apply compression to all request
app.use(config.server.staticUrl, compression());                                // apply compression to static files
app.use(bodyParser.json());                                                     // set up JSON paser
app.use(methodOverride());                                                      // overwrite request header
app.use(cookieParser(config.server.cookieSecret));                              // set up cookie paser with secrets
// provide guests sessions
app.use(cookieSession({name: config.server.cookieName, secret: config.server.cookieSecret}));
// Initialize PassportJS
app.use(passport.initialize());
// Use Passport's session authentication strategy - this stores the logged in user in the session and will now run on any request
app.use(passport.session());

// Add Mongo strategy for authentication
security.initialize(config.mongo.dbUrl, config.security.dbName, config.security.usersCollection);

app.use(function(req, res, next) {
    var t="[" + new Date().toUTCString() + "]";
    if (req.user) {
        console.log(t, "- Current User:", req.user.username);
    } else {
        console.log(t, "- Unauthenticated");
    }
    next();
});

// Basic access api
app.post('/login', security.login);
app.post('/logout', security.logout);
app.get('/current-user', security.sendCurrentUser);

// Api endpoints
require('./routes')(app, security);

// Handle unmatched api
app.get('/api/*', function(req, res) {
    res.status(400).json({ message: 'Bad request.' });
});
app.get('/*',function(req, res) {
    res.sendFile('index.html', { root: config.server.distFolder });
});

// Start server
http.createServer(app).listen(config.server.listenPort, config.server.ip, function() {
    console.log("Code Craft - listening on port " + config.server.listenPort);
});