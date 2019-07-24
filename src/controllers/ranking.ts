/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';

/**
 * GET /ranking
 * User ranking.
 */
export const getRanking = (req: Request, res: Response) => {
  const url = 'mongodb://localhost/referee';

  MongoClient.connect(url, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('players');
    const cursor = matchesCollection.find();
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};
