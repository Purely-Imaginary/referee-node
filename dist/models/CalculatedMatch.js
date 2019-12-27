"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = __importStar(require("mongodb"));
class CalculatedMatch {
    constructor(date, time, timestamp, player11, player12, player21, player22, score1, score2, league) {
        this.date = date;
        this.time = time;
        this.timestamp = timestamp;
        this.team1 = {
            player1: player11, player2: player12, score: score1, estimatedScore: 0,
            isWon: 0, pastSummedScoreAgainstThisTeam: 0, pastWinsAgainstThisTeam: 0, ratingChange: 0,
        };
        this.team2 = {
            player1: player21, player2: player22, score: score2, estimatedScore: 0,
            isWon: 0, pastSummedScoreAgainstThisTeam: 0, pastWinsAgainstThisTeam: 0, ratingChange: 0,
        };
        this.league = league;
        const avg1elo = (player11.presentRating + player12.presentRating) / 2;
        const avg2elo = (player21.presentRating + player22.presentRating) / 2;
        const difference = (avg1elo - avg2elo) / CalculatedMatch.diffCoefficient;
        const maxScore = Math.max(this.team1.score, this.team2.score);
        const scoreDifference = this.team1.score - this.team2.score;
        const estimationForTeam1 = 1 / (1 + (Math.pow(10, -difference)));
        const estimationForTeam2 = 1 / (1 + (Math.pow(10, difference)));
        const scoreCoefficient = maxScore / Math.max(estimationForTeam1, estimationForTeam2);
        this.team1.estimatedScore = estimationForTeam1 * scoreCoefficient;
        this.team2.estimatedScore = estimationForTeam2 * scoreCoefficient;
        const estimatedScoreDifference = this.team1.estimatedScore - this.team2.estimatedScore;
        this.team1.ratingChange = (CalculatedMatch.ratingChangeCoefficient / 20)
            * (scoreDifference - estimatedScoreDifference);
        this.team2.ratingChange = -this.team1.ratingChange;
        this.team1.isWon = this.team1.score > this.team2.score ? 1 : 0;
        this.team2.isWon = this.team1.score < this.team2.score ? 1 : 0;
    }
    insertToDB(calculatedMatchCollection) {
        return __awaiter(this, void 0, void 0, function* () {
            const pastData = yield this.calculatePast(calculatedMatchCollection);
            this.team1.pastSummedScoreAgainstThisTeam = pastData.team1score + this.team1.score;
            this.team1.pastWinsAgainstThisTeam = pastData.team1wins + this.team1.isWon;
            this.team2.pastSummedScoreAgainstThisTeam = pastData.team2score + this.team2.score;
            this.team2.pastWinsAgainstThisTeam = pastData.team2wins + this.team2.isWon;
            yield calculatedMatchCollection.insertOne(this);
        });
    }
    updatePlayers(playersDB) {
        return __awaiter(this, void 0, void 0, function* () {
            this.team1.player1.changeRating(playersDB, this.team1.ratingChange);
            this.team1.player2.changeRating(playersDB, this.team1.ratingChange);
            this.team2.player1.changeRating(playersDB, this.team2.ratingChange);
            this.team2.player2.changeRating(playersDB, this.team2.ratingChange);
            [this.team1.player1, this.team1.player2, this.team2.player1, this.team2.player2]
                .forEach((player) => {
                player.updateTime(playersDB, this.timestamp);
            });
            if (this.team1.score > this.team2.score) {
                playersDB.updateMany({
                    $or: [
                        { name: this.team1.player1.name },
                        { name: this.team1.player2.name },
                    ],
                }, { $inc: { wins: 1 } });
                playersDB.updateMany({
                    $or: [
                        { name: this.team2.player1.name },
                        { name: this.team2.player2.name },
                    ],
                }, { $inc: { losses: 1 } });
            }
            if (this.team1.score < this.team2.score) {
                playersDB.updateMany({
                    $or: [
                        { name: this.team1.player1.name },
                        { name: this.team1.player2.name },
                    ],
                }, { $inc: { losses: 1 } });
                playersDB.updateMany({
                    $or: [
                        { name: this.team2.player1.name },
                        { name: this.team2.player2.name },
                    ],
                }, { $inc: { wins: 1 } });
            }
            playersDB.updateMany({
                $or: [
                    { name: this.team1.player1.name },
                    { name: this.team1.player2.name },
                ],
            }, { $inc: { goalsScored: this.team1.score, goalsLost: this.team2.score } });
            playersDB.updateMany({
                $or: [
                    { name: this.team2.player1.name },
                    { name: this.team2.player2.name },
                ],
            }, { $inc: { goalsScored: this.team2.score, goalsLost: this.team1.score } });
        });
    }
    calculatePast(matchesDB) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = matchesDB.aggregate([
                {
                    $match: {
                        'team1.player1.name': this.team1.player1.name,
                        'team1.player2.name': this.team1.player2.name,
                        'team2.player1.name': this.team2.player1.name,
                        'team2.player2.name': this.team2.player2.name,
                    },
                },
                {
                    $group: {
                        _id: null,
                        team1score: { $sum: '$team1.score' },
                        team1wins: { $sum: '$team1.isWon' },
                        team2score: { $sum: '$team2.score' },
                        team2wins: { $sum: '$team2.isWon' },
                    },
                },
            ]);
            const temp1 = yield data.toArray();
            // TODO: same but for switched sides
            const data2 = matchesDB.aggregate([
                {
                    $match: {
                        'team1.player1.name': this.team2.player1.name,
                        'team1.player2.name': this.team2.player2.name,
                        'team2.player1.name': this.team1.player1.name,
                        'team2.player2.name': this.team1.player2.name,
                    },
                },
                {
                    $group: {
                        _id: null,
                        team1score: { $sum: '$team1.score' },
                        team1wins: { $sum: '$team1.isWon' },
                        team2score: { $sum: '$team2.score' },
                        team2wins: { $sum: '$team2.isWon' },
                    },
                },
            ]);
            const temp2 = yield data2.toArray();
            let team1score = 0;
            let team1wins = 0;
            let team2score = 0;
            let team2wins = 0;
            if (temp1[0] !== undefined) {
                team1score += temp1[0].team1score;
                team1wins += temp1[0].team1wins;
                team2score += temp1[0].team2score;
                team2wins += temp1[0].team2wins;
            }
            if (temp2[0] !== undefined) {
                team1score += temp2[0].team2score;
                team1wins += temp2[0].team2wins;
                team2score += temp2[0].team1score;
                team2wins += temp2[0].team1wins;
            }
            return {
                team1score,
                team1wins,
                team2score,
                team2wins,
            };
        });
    }
    static getMatchById(matchCollection, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const mongoObjectID = new mongo.ObjectID(id);
            const m = yield matchCollection.findOne({ _id: mongoObjectID });
            return m;
        });
    }
    getFullData(matchesCollection) {
        return __awaiter(this, void 0, void 0, function* () {
            // number of matches, list of them, progress in time, chart of goals and / or wins
            return this;
        });
    }
}
exports.default = CalculatedMatch;
CalculatedMatch.diffCoefficient = 1600;
CalculatedMatch.ratingChangeCoefficient = 100; // 100/20 = 5 pts per goal away from estimation
module.exports = CalculatedMatch;
//# sourceMappingURL=CalculatedMatch.js.map