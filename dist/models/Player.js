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
}
exports.default = Player;
module.exports = Player;
//# sourceMappingURL=Player.js.map