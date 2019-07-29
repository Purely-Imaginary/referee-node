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
class Player {
    constructor(id, name, wins, losses, goalsScored, goalsLost, presentRating) {
        this.id = id;
        this.name = name;
        this.matches = [];
        this.progress = [];
        this.skirmishes = [];
        this.lastPlayed = 0;
        this.wins = wins;
        this.losses = losses;
        this.goalsScored = goalsScored;
        this.goalsLost = goalsLost;
        this.presentRating = presentRating;
    }
    static getPlayerByName(playerCollection, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = yield playerCollection.findOne({ name });
            return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored, p.goalsLost, p.presentRating);
        });
    }
    insertToDB(playerCollection) {
        return __awaiter(this, void 0, void 0, function* () {
            yield playerCollection.insertOne({
                id: this.id,
                name: this.name,
                wins: this.wins,
                losses: this.losses,
                goalsScored: this.goalsScored,
                goalsLost: this.goalsLost,
                presentRating: this.presentRating,
            });
        });
    }
    changeRating(playerCollection, changeValue) {
        return __awaiter(this, void 0, void 0, function* () {
            yield playerCollection.update({
                name: this.name,
            }, {
                $inc: {
                    presentRating: changeValue,
                },
            });
        });
    }
    updateTime(playerCollection, matchTime) {
        return __awaiter(this, void 0, void 0, function* () {
            yield playerCollection.update({
                name: this.name,
            }, {
                $set: {
                    lastPlayed: matchTime,
                },
            });
        });
    }
    getPlayersMatches(matchesCollection) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataTeam1 = yield matchesCollection.find({
                $or: [
                    { 'team1.player1.id': this.id },
                    { 'team1.player2.id': this.id },
                ],
            });
            const matches = [];
            yield dataTeam1.forEach((match) => {
                if (match.team1.player1.id !== this.id) {
                    [match.team1.player1, match.team1.player2] = [match.team1.player2, match.team1.player1];
                }
                matches.push(match);
            });
            const dataTeam2 = yield matchesCollection.find({
                $or: [
                    { 'team2.player1.id': this.id },
                    { 'team2.player2.id': this.id },
                ],
            });
            yield dataTeam2.forEach((match) => {
                [match.team1, match.team2] = [match.team2, match.team1];
                if (match.team1.player1.id !== this.id) {
                    [match.team1.player1, match.team1.player2] = [match.team1.player2, match.team1.player1];
                }
                matches.push(match);
            });
            this.matches = matches.sort((a, b) => ((a.timestamp > b.timestamp) ? 1 : -1));
            return this;
        });
    }
    static getRatingChangeFromMatchForPlayer(match, playerId) {
        return (match.team1.player1.id === playerId || match.team1.player2.id === playerId)
            ? match.team1.ratingChange : match.team2.ratingChange;
    }
    updatePlayersProgressInTimespan(playerCollection, matchesCollection, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const edgeDate = new Date(new Date().setDate(new Date().getDate() - days)).getTime();
            const data = yield matchesCollection.find({
                $or: [
                    { 'team1.player1.id': this.id },
                    { 'team1.player2.id': this.id },
                    { 'team2.player1.id': this.id },
                    { 'team2.player2.id': this.id },
                ],
                timestamp: {
                    $lt: edgeDate,
                },
            }).sort({ timestamp: -1 }).limit(1).toArray();
            const DBMatch = data[0];
            const pastPlayerData = [
                DBMatch.team1.player1,
                DBMatch.team1.player2,
                DBMatch.team2.player1,
                DBMatch.team2.player2,
            ].filter(player => player.id === this.id)[0];
            const pastRating = pastPlayerData.presentRating
                + Player.getRatingChangeFromMatchForPlayer(DBMatch, this.id);
            const eloChange = this.presentRating - pastRating;
            yield playerCollection.updateOne({
                name: this.name,
            }, {
                $set: {
                    ratingChange: eloChange,
                },
            });
            return eloChange;
        });
    }
}
exports.default = Player;
module.exports = Player;
//# sourceMappingURL=Player.js.map