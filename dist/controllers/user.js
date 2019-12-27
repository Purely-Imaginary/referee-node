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
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const secrets_1 = require("../secrets");
/**
 * GET /user/get/matches
 * Testing endpoint
 */
exports.getMatches = (req, res) => {
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(void 0, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesCollection = db.collection('calculatedMatches');
        const cursor = matchesCollection.find({ 'team1.player1.id': req.query.id });
        const result = yield cursor.toArray();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return 0;
    }));
};
//# sourceMappingURL=user.js.map