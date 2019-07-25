/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';

/**
 * GET /ranking
 * User ranking.
 */
export const getLastMatches = (req: Request, res: Response) => {
  const url = 'mongodb://localhost/referee';
  const amount = parseInt(req.params.amount, 10);
  MongoClient.connect(url, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('matches');
    const cursor = matchesCollection.find().sort({ date: -1, time: -1 }).limit(amount);
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};
