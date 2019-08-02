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
const Player_1 = __importDefault(require("../models/Player"));
const CalculatedMatch_1 = __importDefault(require("../models/CalculatedMatch"));
/**
 * GET /user/get/matches
 * Testing endpoint
 */
exports.getDataFromSpreadsheet = () => new Promise(((resolve) => {
    let csvdata = '';
    https_1.default.get(secrets_1.spreadsheetURL2, (resp) => {
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            csvdata += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => __awaiter(this, void 0, void 0, function* () {
            const data = papaparse_1.default.parse(csvdata);
            const parsedData = [];
            // eslint-disable-next-line no-restricted-syntax
            data.data.forEach((match) => __awaiter(this, void 0, void 0, function* () {
                // eslint-disable-next-line no-continue
                if (match[0] === 'Date')
                    return;
                // alphabetical order of matches for teams recognition
                if (match[2] > match[3])
                    [match[2], match[3]] = [match[3], match[2]];
                if (match[6] > match[7])
                    [match[6], match[7]] = [match[7], match[6]];
                const timestamp = new Date(`${match[0]} ${match[1]}`).getTime();
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
                    timestamp,
                };
                yield parsedData.push(parsedMatch);
            }));
            resolve(parsedData);
        }));
    });
}));
exports.insertDataToDBFromSpreadsheet = (db) => __awaiter(this, void 0, void 0, function* () {
    const value = yield exports.getDataFromSpreadsheet();
    yield db.collection('rawMatches').drop();
    yield db.createCollection('rawMatches');
    const matchesCollection = db.collection('rawMatches');
    yield matchesCollection.insertMany(value);
});
function containsPlayer(name, array) {
    for (let i = 0; i < array.length; i += 1) {
        if (array[i].name === name) {
            return true;
        }
    }
    return false;
}
exports.generatePlayersFromRawMatches = (db) => __awaiter(this, void 0, void 0, function* () {
    const matchesDB = db.collection('rawMatches').find().sort({ date: 1, time: 1 });
    const matchesData = yield matchesDB.toArray();
    const playerList = [];
    let id = 0;
    yield db.dropCollection('players');
    yield db.createCollection('players');
    yield matchesData.forEach((match) => __awaiter(this, void 0, void 0, function* () {
        const players = [match.player1, match.player2, match.player3, match.player4];
        yield players.forEach((playerName) => __awaiter(this, void 0, void 0, function* () {
            if (!containsPlayer(playerName, playerList)) {
                id += 1;
                const playerObject = new Player_1.default(id, playerName, 0, 0, 0, 0, 1000, 0, 0);
                yield playerList.push(playerObject);
            }
        }));
    }));
    yield playerList.forEach((player) => __awaiter(this, void 0, void 0, function* () {
        yield player.insertToDB(db.collection('players'));
    }));
});
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index += 1) {
            yield callback(array[index], index, array);
        }
    });
}
function updateLastDaysProgress(playersDB, matchesDB, days) {
    return __awaiter(this, void 0, void 0, function* () {
        const playersData = yield playersDB.find().toArray();
        playersData.forEach((player) => __awaiter(this, void 0, void 0, function* () {
            const playerObject = yield Player_1.default.getPlayerByName(playersDB, player.name);
            yield playerObject.updatePlayersProgressInTimespan(playersDB, matchesDB, days);
        }));
    });
}
function updateCurrentRank(playersDB) {
    return __awaiter(this, void 0, void 0, function* () {
        const playersData = yield playersDB.find().sort({ presentRating: -1 }).toArray();
        for (let index = 1; index <= playersData.length; index += 1) {
            const player = playersData[index - 1];
            playersDB.updateOne({
                name: player.name,
            }, {
                $set: {
                    currentRank: index,
                },
            });
        }
    });
}
exports.calculateMatches = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const startTime = new Date();
    yield mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
        const db = client.db('referee');
        const insertedMatches = yield exports.insertDataToDBFromSpreadsheet(db);
        yield exports.generatePlayersFromRawMatches(db);
        const matchesDB = db.collection('rawMatches').find().sort({ date: 1, time: 1 });
        const matchesData = yield matchesDB.toArray();
        const playersDB = db.collection('players');
        yield db.dropCollection('calculatedMatches');
        yield db.createCollection('calculatedMatches');
        const calculatedMatchesDB = db.collection('calculatedMatches');
        let lastParsedMatch = '';
        yield asyncForEach(matchesData, ((match) => __awaiter(this, void 0, void 0, function* () {
            const cMatch = yield new CalculatedMatch_1.default(match.date, match.time, match.timestamp, yield Player_1.default.getPlayerByName(playersDB, match.player1), yield Player_1.default.getPlayerByName(playersDB, match.player2), yield Player_1.default.getPlayerByName(playersDB, match.player3), yield Player_1.default.getPlayerByName(playersDB, match.player4), parseInt(match.score1, 10), parseInt(match.score2, 10), match.league);
            yield cMatch.insertToDB(db.collection('calculatedMatches'));
            yield cMatch.updatePlayers(playersDB);
            yield cMatch.calculatePast(calculatedMatchesDB);
            lastParsedMatch = `${match.date} ${match.time}`;
        })));
        yield updateLastDaysProgress(playersDB, calculatedMatchesDB, 7);
        yield updateCurrentRank(playersDB);
        const timeElapsed = (new Date().getTime() - startTime.getTime()) / 1000;
        res.end(JSON.stringify({
            matchesProcessed: matchesData.length,
            insertedMatches,
            timeElapsed,
            lastParsedMatch,
        }));
    }));
});
exports.testingController = (req, res) => __awaiter(this, void 0, void 0, function* () {
    yield mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesDB = db.collection('calculatedMatches');
        const playersDB = db.collection('players');
        yield updateLastDaysProgress(playersDB, matchesDB, 7);
        res.end(JSON.stringify('a'));
        return 0;
    }));
});
//# sourceMappingURL=tools.js.map