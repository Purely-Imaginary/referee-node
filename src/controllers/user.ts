import { Response } from 'express';
import { MongoClient } from 'mongodb';

/**
 * GET /user/get/matches
 * Testing endpoint
 */
const getMatches = (_req: Request, res: Response) => {
  const url = 'mongodb://localhost/referee';
  const result: any[] = [];
  MongoClient.connect(url, (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('matches');
    let cursor = matchesCollection.find({ league: 'OB2' });
    cursor = matchesCollection.find({ 'team1.player1.id': 0 });

    cursor.each((__err: any, doc: any) => {
      result.push(JSON.stringify(doc));
    });
  });
  res.render('matchList', { results: JSON.stringify(result) });
};

export { getMatches as default };
