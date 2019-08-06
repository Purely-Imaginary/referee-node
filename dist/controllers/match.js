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
const secrets_1 = require("../secrets");
const CalculatedMatch_1 = __importDefault(require("../models/CalculatedMatch"));
/**
 * GET /user/get/matches
 * Testing endpoint
 */
exports.getMatchData = (req, res) => {
    const matchId = req.params.id;
    if (matchId === undefined)
        return 0;
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesCollection = db.collection('calculatedMatches');
        const matchObject = yield CalculatedMatch_1.default.getMatchById(matchesCollection, matchId);
        // await matchObject.getFullData(matchesCollection);
        res.end(JSON.stringify(matchObject));
        return 0;
    }));
    return 0;
};
//# sourceMappingURL=match.js.map