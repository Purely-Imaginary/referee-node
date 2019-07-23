/* eslint-disable import/prefer-default-export */
import { Response } from 'express';
import { MongoClient } from 'mongodb';

/**
 * GET /user/get/matches
 * Testing endpoint
 */
export const getMatches = async (_req: Request, res: Response) => {
  const url = 'mongodb://localhost/referee';

  MongoClient.connect(url, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('matches');
    let cursor = matchesCollection.find({ league: 'OB2' });
    cursor = matchesCollection.find({ 'team1.player1.id': 0 });
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};
