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
const https_1 = __importDefault(require("https"));
const papaparse_1 = __importDefault(require("papaparse"));
const secrets_1 = require("../secrets");
/**
 * GET /user/get/matches
 * Testing endpoint
 */
exports.getDataFromSpreadsheet = () => new Promise(((resolve, reject) => {
    let data = '';
    https_1.default.get(secrets_1.spreadsheetURL2, (resp) => {
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => __awaiter(this, void 0, void 0, function* () {
            data = papaparse_1.default.parse(data);
            const parsedData = [];
            // eslint-disable-next-line no-restricted-syntax
            data.data.forEach((match) => __awaiter(this, void 0, void 0, function* () {
                // eslint-disable-next-line no-continue
                if (match[0] === 'Date')
                    return;
                const parsedMatch = {
                    date: match[0],
                    time: match[1],
                    player1: match[2],
                    player2: match[3],
                    score1: match[4],
                    score2: match[5],
                    player3: match[6],
                    player4: match[7],
                    league: match[8],
                };
                yield parsedData.push(parsedMatch);
            }));
            resolve(parsedData);
        }));
    });
}));
exports.insertDataToDBFromSpreadsheet = (req, res) => {
    exports.getDataFromSpreadsheet().then((value) => {
        mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
            const db = client.db('referee');
            db.collection('rawMatches').drop();
            db.createCollection('rawMatches');
            const matchesCollection = db.collection('rawMatches');
            matchesCollection.insertMany(value, (__err, response) => {
                res.send(JSON.stringify(response.insertedCount));
                return 0;
            });
        }));
    });
};
//# sourceMappingURL=tools.js.map