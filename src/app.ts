import express from 'express';
import compression from 'compression'; // compresses requests
import session from 'express-session';
import bodyParser from 'body-parser';
import lusca from 'lusca';
import dotenv from 'dotenv';
import mongo from 'connect-mongo';
import flash from 'express-flash';
import path from 'path';
import mongoose from 'mongoose';
import passport from 'passport';
import bluebird from 'bluebird';
import cors from 'cors';

import { MONGODB_URI, SESSION_SECRET } from './util/secrets';

// Controllers (route handlers)
import * as homeController from './controllers/home';
import * as userController from './controllers/user';
import * as apiController from './controllers/api';
import * as rankingController from './controllers/ranking';
import * as matchesController from './controllers/matches';
import * as toolsController from './controllers/tools';


// API keys and Passport configuration
import * as passportConfig from './config/passport';

const MongoStore = mongo(session);

// Create Express server

const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose.connect(mongoUrl, { useNewUrlParser: true }).then(
  () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch((err) => {
  console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
  // process.exit();
});


// app.user(bodyParser.json());
// after the code that uses bodyParser and other cool stuff
const originsWhitelist = [
  'http://localhost:4200', // this is my front-end url for development
  'localhost:4200', // this is my front-end url for development
  'http://www.myproductionurl.com',
];
const corsOptions = {
  origin(origin, callback) {
    const isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
    callback(null, isWhitelisted);
  },
  credentials: true,
};
// here is the magic
app.use(cors(corsOptions));

// Express configuration
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: SESSION_SECRET,
  store: new MongoStore({
    url: mongoUrl,
    autoReconnect: true,
  }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user
    && req.path !== '/login'
    && req.path !== '/signup'
    && !req.path.match(/^\/auth/)
    && !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user
    && req.path == '/account') {
    req.session.returnTo = req.path;
  }
  next();
});

app.use(
  express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }),
);

/**
 * Primary app routes.
 */
app.get('/', homeController.index);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * My routes
 */
app.get('/user/:id/getMatches', userController.getMatches);
app.get('/lastMatches/:amount', matchesController.getLastMatches);
app.get('/getMatchesFromLastDays/:amount', matchesController.getMatchesFromLastDays);
app.get('/ranking', rankingController.getRanking);
app.get('/allMatches', matchesController.getAllMatches);
app.get('/insertDataToDBFromSpreadsheet', toolsController.insertDataToDBFromSpreadsheet);
app.get('/testingController', toolsController.testingController);


export default app;
