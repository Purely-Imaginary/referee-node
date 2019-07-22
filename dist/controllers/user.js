"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
/**
 * GET /user/get/matches
 * Testing endpoint
 */
const getMatches = (_req, res) => {
    const url = 'mongodb://localhost/referee';
    const result = [];
    mongodb_1.MongoClient.connect(url, (_err, client) => {
        const db = client.db('referee');
        const matchesCollection = db.collection('matches');
        let cursor = matchesCollection.find({ league: 'OB2' });
        cursor = matchesCollection.find({ 'team1.player1.id': 0 });
        cursor.each((__err, doc) => {
            result.push(JSON.stringify(doc));
        });
    });
    res.render('matchList', { results: JSON.stringify(result) });
};
exports.default = getMatches;
//# sourceMappingURL=user.js.map