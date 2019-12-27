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
const mongodb_1 = require("mongodb");
const secrets_1 = require("../secrets");
/**
 * GET /ranking
 * User ranking.
 */
exports.getRanking = (req, res) => {
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(this, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesCollection = db.collection('players');
        const cursor = matchesCollection.find();
        const result = yield cursor.toArray();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
    }));
};
//# sourceMappingURL=ranking.js.map