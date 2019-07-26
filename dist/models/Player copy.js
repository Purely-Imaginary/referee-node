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
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.matches = [];
        this.progress = [];
        this.skirmishes = [];
        this.wins = 0;
        this.losses = 0;
        this.goalsScored = 0;
        this.goalsLost = 0;
        this.presentRating = 1000;
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
}
exports.default = Player;
module.exports = Player;
//# sourceMappingURL=Player copy.js.map