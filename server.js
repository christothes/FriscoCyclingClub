/*
 Copyright (c) Microsoft Open Technologies, Inc.
 All Rights Reserved
 Apache License 2.0

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var passport = require('passport');
var wsfedsaml2 = require('passport-azure-ad').WsfedStrategy;
var waad = require('node-waad');
var Promise = require('promise');
var ipn = require('paypal-ipn');

var app = express();
var server = http.createServer(app);
//var io = require('socket.io').listen(server);

var config = {
  // Enter the App ID URI of your application. To find this value in the Windows Azure Management Portal,
  // click Active Directory, click Integrated Apps, click your app, and click Configure.
  // The App ID URI is at the bottom of the page in the Single Sign-On section.
  realm: 'https://friscocycling.onmicrosoft.com/FriscoCyclingClub',

  // Enter the endpoint to which your app sends sign-on and sign-out requests when using WS-Federation protocol.
  // To find this value in the Windows Azure Management Portal, click Active Directory, click Integrated Apps,
  // and in the black menu bar at the bottom of the page, click View endpoints.
  // Then, copy the value of the WS-Federation Sign-On Endpoint.
  // Note: This field is ignored if you specify an identityMetadata url
  identityProviderUrl: 'https://login.windows.net/f9936b48-3f74-4fcb-8f7d-322bbcc2d990/wsfed',

  // Enter the logout url of your application. The user will be redirected to this endpoint after
  // the auth token has been revoked by the WSFed endpoint.
  logoutUrl: 'http://localhost:3000/',

  // Enter the URL of the federation metadata document for your app or the cert of the X.509 certificate found
  // in the X509Certificate tag of the RoleDescriptor with xsi:type="fed:SecurityTokenServiceType" in the federation metadata.
  // If you enter both fields, the metadata takes precedence
  identityMetadata: 'https://login.windows.net/f9936b48-3f74-4fcb-8f7d-322bbcc2d990/federationmetadata/2007-06/federationmetadata.xml'
};

var graphConfig = {
// Enter the domain for your Active directory subscription, such as contoso.onmicrosoft.com
  tenant: 'friscocycling.onMicrosoft.com',

  // Enter the Client ID GUID of your app.
  // In the Windows Azure Management Portal, click Active Directory, click your tenant,
  // click Integrated Apps, click your app, and click Configure.
  // The Client ID is on this app configuration page.
  clientid: 'dea17151-7fbd-4d64-89cc-faff48a361ad',

  //Enter the value of the key for the app. You can create the key on the Configure page for the app.
  // The value appears only when you first save the key. Enter the saved value.
  clientsecret: process.env.WAAD_CLIENTSECRET
};

// array to hold logged in users
var users = {};

// AAD Graph Client for AAD queries
var graphClient = null;

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
//  app.set('views',__dirname + '/views');
//  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(process.env.WAAD_CLIENTSECRET));
  app.use(express.session({ secret: process.env.WAAD_CLIENTSECRET }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/app'));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

var findByEmail = function (email, fn) {
  var user = users[email];
  if (user &&  user.email === email) {
    return fn(null, user);
  }
  return fn(null, null);
};


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    console.log('ensureAuthenticated');
    return next();
  }
  res.redirect('/login');
};

var ensureUserIsAdmin = function (req, res, next) {
  if (req.user.groups.some(function (element) {
    return element.displayName === 'Admin'; }))
  {
    console.log('ensureUserIsAdmin');
    return next();
  }
  res.redirect('/#/denied');
}

var getUserGroups = function (user) {
  console.log('getUserGroups');
  var promise = new Promise(function (resolve, reject) {
    var u = user;
    if (graphClient) {
      graphClient.getGroupsForUserByObjectIdOrUpn(u.email, function (err, groups) {
        console.log('returned from getGroupsForUserByObjectIdOrUpn ' + u.email);
        if (err) {
          console.error(err);
          reject(err);
        }
        if (groups) {
          //console.log(groups);
          users[u.email].groups = groups;
          resolve(groups);
        } else {
          console.log('no groups found for user');
          reject("no groups found for user")
        }
      });
    } else {
      reject("Failure to get graphClient");
    }
  })
  return promise;
}

var wsfedStrategy = new wsfedsaml2(config,
  function (profile, done) {
    if (!profile.email) {
      return done(new Error("No email found"), null);
    }

    // asynchronous verification, for effect...
    process.nextTick(function () {
      users[profile.email] = profile;
      getUserGroups(profile).then(function (result) {
        return done(null, profile);
      }, function (err) {
        console.log(err);
      });

//      findByEmail(profile.email, function (err, user) {
//        if (err) {
//          return done(err);
//        }
//        if (!user) {
//          // "Auto-registration"
//          users[profile.email] = profile;
//          getUserGroups(profile);
//          return done(null, profile);
//        }
//        return done(null, user);
//      });
    });
  }
);

passport.use(wsfedStrategy);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var doWaad = function () {
  if (graphClient === null) {
    waad.getGraphClient10(graphConfig.tenant, graphConfig.clientid, graphConfig.clientsecret, function (err, client) {
      if (err) {
        console.error('waad.getGraphClientWithClientCredentials2 error:' + err + '\n');
      } else {
        console.log('got waad client');
        graphClient = client;
      }
    });
  }
};

app.get('/', function(req, res){
  if (req.user) {
    console.log('logged on user:' + req.user.email);
  } else {
    res.sendfile('./app/Index.html');
  }
  res.sendfile('./app/Index.html');
});

app.get('/login',
  passport.authenticate('wsfed-saml2', { failureRedirect: '/', failureFlash: true }),
  function (req, res) {
    res.redirect('/');
  }
);

app.post('/login/callback',
  passport.authenticate('wsfed-saml2', { failureRedirect: '/', failureFlash: true }),
  function (req, res) {
//    res.redirect('/#/loggedIn');
    res.redirect('/account');
  }
);

app.get('/logout', function(req, res){

// clear the passport session cookies
  req.logout();

// We need to redirect the user to the WSFED logout endpoint so the
// auth token will be revoked
  wsfedStrategy.logout({}, function (err, url) {
    if (err) {
      res.redirect('/');
    } else {
      res.redirect(url);
    }
  });
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function (user, done) {
  console.log('serializeUser: ' + user.email);
  done(null, user.email);
});

passport.deserializeUser(function (id, done) {
  console.log('deserializeUser: ' + id);
  findByEmail(id, function (err, user) {
    done(err, user);
  });
});

app.get('/bower_components/*', function (req, res) {
  if (req.params['0']) {
    res.sendfile('./bower_components/' + req.params[0]);
  }
});

//
// Web APIs
//

app.get('/account', ensureAuthenticated, ensureUserIsAdmin, function (req, res) {
  res.json(req.user);
});

app.post('/paypalIPN', function (req, res) {

  ipn.verify(req.body, function callback(err, msg) {
    if (err) {
      console.error(msg);
    } else {
      //Do stuff with original params here

      if (req.body.payment_status == 'Completed') {
        //Payment has been confirmed as completed
        console.log('payment completed');
      }
    }
  });
});

//io.sockets.on('connection', function (socket) {
//  socket.emit('news', { hello: 'world' });
//  socket.on('my other event', function (data) {
//    console.log(data);
//  });
//});

doWaad();