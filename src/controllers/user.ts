/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';

/**
 * GET /user/get/matches
 * Testing endpoint
 */
export const getMatches = async (req: Request, res: Response) => {
  const url = 'mongodb://localhost/referee';

  MongoClient.connect(url, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('matches');
    const cursor = matchesCollection.find({ 'team1.player1.id': res.query.id });
    const result = await cursor.toArray();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};
