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
/* eslint-disable no-param-reassign */
class Player {
    constructor(id, name, wins, losses, goalsScored, goalsLost, presentRating, ratingChange, currentRank) {
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
        this.ratingChange = ratingChange;
        this.currentRank = currentRank;
    }
    static getPlayerByName(playerCollection, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = yield playerCollection.findOne({ name });
            return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored, p.goalsLost, p.presentRating, p.ratingChange, p.currentRank);
        });
    }
    static getPlayerById(playerCollection, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = yield playerCollection.findOne({ id });
            return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored, p.goalsLost, p.presentRating, p.ratingChange, p.currentRank);
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
    static getRatingFromMatchForPlayer(match, playerId) {
        return [
            match.team1.player1,
            match.team1.player2,
            match.team2.player1,
            match.team2.player2,
        ].filter(player => player.id === playerId)[0].presentRating;
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
            let pastRating = 1000;
            if (data[0] !== undefined) {
                const DBMatch = data[0];
                const pastPlayerData = [
                    DBMatch.team1.player1,
                    DBMatch.team1.player2,
                    DBMatch.team2.player1,
                    DBMatch.team2.player2,
                ].filter(player => player.id === this.id)[0];
                pastRating = pastPlayerData.presentRating;
            }
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
    getProgressFromMatches() {
        return __awaiter(this, void 0, void 0, function* () {
            this.progress.splice(0, this.progress.length); // clear the table
            this.matches.forEach((match) => __awaiter(this, void 0, void 0, function* () {
                yield this.progress.push({
                    timestamp: match.timestamp,
                    rating: Player.getRatingFromMatchForPlayer(match, this.id),
                });
            }));
        });
    }
    getSkirmishesFromMatches() {
        return __awaiter(this, void 0, void 0, function* () {
            this.skirmishes = { friends: {}, enemies: {} };
            this.matches.forEach((match) => __awaiter(this, void 0, void 0, function* () {
                const friendIdentifier = `${match.team1.player2.name},${match.team1.player2.id}`;
                const enemyIdentifier = `${match.team2.player1.name},${match.team2.player2.name}`;
                if (this.skirmishes.friends[friendIdentifier] === undefined) {
                    this.skirmishes.friends[friendIdentifier] = 1;
                }
                else {
                    this.skirmishes.friends[friendIdentifier] = this.skirmishes.friends[friendIdentifier] + 1;
                }
                if (this.skirmishes.enemies[enemyIdentifier] === undefined) {
                    this.skirmishes.enemies[enemyIdentifier] = 1;
                }
                else {
                    this.skirmishes.enemies[enemyIdentifier] = this.skirmishes.enemies[enemyIdentifier] + 1;
                }
            }));
            this.skirmishes.friends = Object.keys(this.skirmishes.friends)
                .map(key => [key.split(',')[0], key.split(',')[1], this.skirmishes.friends[key]])
                .sort((a, b) => ((a[2] < b[2]) ? 1 : -1));
            this.skirmishes.enemies = Object.keys(this.skirmishes.enemies)
                .map(key => [key.split(',')[0], key.split(',')[1], this.skirmishes.enemies[key]])
                .sort((a, b) => ((a[2] < b[2]) ? 1 : -1));
        });
    }
    getFullData(matchesCollection) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getPlayersMatches(matchesCollection);
            yield this.getProgressFromMatches();
            yield this.getSkirmishesFromMatches();
        });
    }
}
exports.default = Player;
module.exports = Player;
//# sourceMappingURL=Player.js.map