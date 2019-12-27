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
 * GET /ranking
 * User ranking.
 */
exports.getLastMatches = (req, res) => {
    const amount = parseInt(req.params.amount, 10);
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(void 0, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesCollection = db.collection('calculatedMatches');
        const cursor = matchesCollection.find().sort({ timestamp: -1 }).limit(amount);
        const result = yield cursor.toArray();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return 0;
    }));
};
exports.getAllMatches = (req, res) => {
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(void 0, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesCollection = db.collection('calculatedMatches');
        const cursor = matchesCollection.find().sort({ timestamp: -1 });
        const result = yield cursor.toArray();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return 0;
    }));
};
exports.getMatchesFromLastDays = (req, res) => {
    const amountOfDays = parseInt(req.params.amount, 10);
    const days = [];
    for (let i = 0; i < amountOfDays; i += 1) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        let month = (date.getMonth() + 1).toString();
        month = month.length === 1 ? `0${month}` : month;
        let day = (date.getDate()).toString();
        day = day.length === 1 ? `0${day}` : day;
        const dateString = `${date.getFullYear()}-${month}-${day}`;
        days.push(dateString);
    }
    mongodb_1.MongoClient.connect(secrets_1.mongoUrl, (_err, client) => __awaiter(void 0, void 0, void 0, function* () {
        const db = client.db('referee');
        const matchesCollection = db.collection('calculatedMatches');
        const cursor = matchesCollection.find({ date: { $in: days } }).sort({ timestamp: -1 });
        const result = yield cursor.toArray();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return 0;
    }));
};
//# sourceMappingURL=matches.js.map