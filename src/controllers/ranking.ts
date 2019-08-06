/* eslint-disable import/prefer-default-export */
// eslint-disable-next-line no-unused-vars
import { Response } from 'express';
import { MongoClient } from 'mongodb';
import { mongoUrl } from '../secrets';

/**
 * GET /ranking
 * User ranking.
 */
export const getRanking = (req: Request, res: Response) => {
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('players');
    const cursor = matchesCollection.find();
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
  return 0;
};
