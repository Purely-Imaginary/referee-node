"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression")); // compresses requests
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const lusca_1 = __importDefault(require("lusca"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const express_flash_1 = __importDefault(require("express-flash"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport"));
const bluebird_1 = __importDefault(require("bluebird"));
const cors_1 = __importDefault(require("cors"));
const secrets_1 = require("./util/secrets");
// Controllers (route handlers)
const userController = __importStar(require("./controllers/user"));
const rankingController = __importStar(require("./controllers/ranking"));
const matchesController = __importStar(require("./controllers/matches"));
const toolsController = __importStar(require("./controllers/tools"));
const playerController = __importStar(require("./controllers/player"));
const matchController = __importStar(require("./controllers/match"));
const MongoStore = connect_mongo_1.default(express_session_1.default);
// Create Express server
const app = express_1.default();
// Connect to MongoDB
const mongoUrl = secrets_1.MONGODB_URI;
mongoose_1.default.Promise = bluebird_1.default;
mongoose_1.default.connect(mongoUrl, { useNewUrlParser: true }).then(() => { }).catch((err) => {
    // eslint-disable-next-line no-console
    console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    // process.exit();
});
// app.user(bodyParser.json());
// after the code that uses bodyParser and other cool stuff
const originsWhitelist = [
    'http://localhost:4200',
    'localhost:4200',
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
app.use(cors_1.default(corsOptions));
// Express configuration
app.set('port', process.env.PORT || 3000);
app.set('views', path_1.default.join(__dirname, '../views'));
app.set('view engine', 'pug');
app.use(compression_1.default());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_session_1.default({
    resave: true,
    saveUninitialized: true,
    secret: secrets_1.SESSION_SECRET,
    store: new MongoStore({
        url: mongoUrl,
        autoReconnect: true,
    }),
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(express_flash_1.default());
app.use(lusca_1.default.xframe('SAMEORIGIN'));
app.use(lusca_1.default.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport_1.default.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport_1.default.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
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
app.get('/calculateMatches', toolsController.calculateMatches);
app.get('/player/:id', playerController.getPlayerData);
app.get('/match/:id', matchController.getMatchData);
app.get('/user/insertSample', userController.insertSampleUser);
app.get('/user/login/:username/:password', userController.loginUser);
exports.default = app;
//# sourceMappingURL=app.js.map