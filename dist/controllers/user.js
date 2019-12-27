"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sha1_1 = __importDefault(require("sha1"));
const secrets_1 = require("../secrets");
const User_1 = __importDefault(require("../models/User"));
/**
 * GET /user/get/matches
 * Testing endpoint
 */
exports.getMatches = (req, res) => {
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesCollection = db.collection('calculatedMatches');
        const cursor = matchesCollection.find({ 'team1.player1.id': req.query.id });
        const result = yield cursor.toArray();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return 0;
    }));
};
/**
 * GET /user/insertSample
 * Testing endpoint
 */
exports.insertSampleUser = (req, res) => {
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
        const db = client.db('referee');
        const usersCollection = db.collection('users');
        const sampleUser = new User_1.default(1, 'sample', 1, Date.now(), 1);
        sampleUser.insertToDB(usersCollection, sha1_1.default('password saltySalt'));
        const dbUser = yield User_1.default.getUserByLoginAndPassword(usersCollection, 'sample', 'password');
        const jwtSign = jsonwebtoken_1.default.sign({ user: dbUser }, secrets_1.jwtToken, { expiresIn: '14d' });
        const jwtUser = yield User_1.default.getUserByJWT(usersCollection, jwtSign);
        res.end(JSON.stringify(jwtUser));
        return 0;
    }));
    return 'ok';
};
/**
 * GET /user/login/username/password
 * Testing endpoint sample///password
 */
exports.loginUser = (req, res) => {
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
        const db = client.db('referee');
        const usersCollection = db.collection('users');
        try {
            const dbUser = yield User_1.default.getUserByLoginAndPassword(usersCollection, req.params.username, req.params.password);
            const jwtSign = yield jsonwebtoken_1.default.sign({ user: dbUser }, secrets_1.jwtToken, { expiresIn: '14d' });
            res.end(jwtSign);
        }
        catch (Exception) {
            res.end('Not found.');
        }
    }));
};
//# sourceMappingURL=user.js.map