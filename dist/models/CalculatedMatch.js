"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class CalculatedMatch {
    constructor(date, time, timestamp, player11, player12, player21, player22, score1, score2, league) {
        this.date = date;
        this.time = time;
        this.timestamp = timestamp;
        this.player11 = player11;
        this.player12 = player12;
        this.player21 = player21;
        this.player22 = player22;
        this.score1 = score1;
        this.score2 = score2;
        this.league = league;
        this.avg1elo = (player11.presentRating + player12.presentRating) / 2;
        this.avg2elo = (player21.presentRating + player22.presentRating) / 2;
        const difference = (this.avg1elo - this.avg2elo) / CalculatedMatch.diffCoefficient;
        const maxScore = Math.max(this.score1, this.score2);
        const scoreDifference = this.score1 - this.score2;
        const estimationForTeam1 = 1 / (1 + (Math.pow(10, -difference)));
        const estimationForTeam2 = 1 / (1 + (Math.pow(10, difference)));
        const scoreCoefficient = maxScore / Math.max(estimationForTeam1, estimationForTeam2);
        this.estimatedScoreForTeam1 = estimationForTeam1 * scoreCoefficient;
        this.estimatedScoreForTeam2 = estimationForTeam2 * scoreCoefficient;
        const estimatedScoreDifference = this.estimatedScoreForTeam1 - this.estimatedScoreForTeam2;
        this.ratingChange = (CalculatedMatch.ratingChangeCoefficient / 20)
            * (scoreDifference - estimatedScoreDifference);
    }
    insertToDB(calculatedMatchCollection) {
        return __awaiter(this, void 0, void 0, function* () {
            const didTeam1Won = this.score1 > this.score2 ? 1 : 0;
            const didTeam2Won = this.score1 < this.score2 ? 1 : 0;
            yield calculatedMatchCollection.insertOne({
                date: this.date,
                time: this.time,
                timestamp: this.timestamp,
                league: this.league,
                team1: {
                    player1: {
                        id: this.player11.id,
                        name: this.player11.name,
                        presentRating: this.player11.presentRating + this.ratingChange,
                    },
                    player2: {
                        id: this.player12.id,
                        name: this.player12.name,
                        presentRating: this.player12.presentRating + this.ratingChange,
                    },
                    score: this.score1,
                    isWon: didTeam1Won,
                    ratingChange: this.ratingChange,
                    estimatedScore: this.estimatedScoreForTeam1,
                },
                team2: {
                    player1: {
                        id: this.player21.id,
                        name: this.player21.name,
                        presentRating: this.player21.presentRating - this.ratingChange,
                    },
                    player2: {
                        id: this.player22.id,
                        name: this.player22.name,
                        presentRating: this.player22.presentRating - this.ratingChange,
                    },
                    score: this.score2,
                    isWon: didTeam2Won,
                    ratingChange: -this.ratingChange,
                    estimatedScore: this.estimatedScoreForTeam2,
                },
            });
        });
    }
    updatePlayers(playersDB) {
        return __awaiter(this, void 0, void 0, function* () {
            this.player11.changeRating(playersDB, this.ratingChange);
            this.player12.changeRating(playersDB, this.ratingChange);
            this.player21.changeRating(playersDB, -this.ratingChange);
            this.player22.changeRating(playersDB, -this.ratingChange);
            [this.player11, this.player12, this.player21, this.player22].forEach((player) => {
                player.updateTime(playersDB, this.timestamp);
            });
            if (this.score1 > this.score2) {
                playersDB.updateMany({
                    $or: [
                        { name: this.player11.name },
                        { name: this.player12.name },
                    ],
                }, { $inc: { wins: 1 } });
                playersDB.updateMany({
                    $or: [
                        { name: this.player21.name },
                        { name: this.player22.name },
                    ],
                }, { $inc: { losses: 1 } });
            }
            if (this.score1 < this.score2) {
                playersDB.updateMany({
                    $or: [
                        { name: this.player11.name },
                        { name: this.player12.name },
                    ],
                }, { $inc: { losses: 1 } });
                playersDB.updateMany({
                    $or: [
                        { name: this.player21.name },
                        { name: this.player22.name },
                    ],
                }, { $inc: { wins: 1 } });
            }
            playersDB.updateMany({
                $or: [
                    { name: this.player11.name },
                    { name: this.player12.name },
                ],
            }, { $inc: { goalsScored: this.score1, goalsLost: this.score2 } });
            playersDB.updateMany({
                $or: [
                    { name: this.player21.name },
                    { name: this.player22.name },
                ],
            }, { $inc: { goalsScored: this.score2, goalsLost: this.score1 } });
        });
    }
    calculatePast(matchesDB) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = matchesDB.aggregate([
                {
                    $match: {
                        'team1.player1.name': this.player11.name,
                        'team1.player2.name': this.player12.name,
                        'team2.player1.name': this.player21.name,
                        'team2.player2.name': this.player22.name,
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
            // TODO: same but for switched sides
            const i = 0;
        });
    }
}
CalculatedMatch.diffCoefficient = 1600;
CalculatedMatch.ratingChangeCoefficient = 100; // 100/20 = 5 pts per goal away from estimation
exports.default = CalculatedMatch;
module.exports = CalculatedMatch;
//# sourceMappingURL=CalculatedMatch.js.map