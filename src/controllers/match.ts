/* eslint-disable import/prefer-default-export */
// eslint-disable-next-line no-unused-vars
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { mongoUrl } from '../secrets';
import CalculatedMatch from '../models/CalculatedMatch';

/**
 * GET /user/get/matches
 * Testing endpoint
 */
export const getMatchData = (req: Request, res: Response) => {
  const matchId:string = req.params.id;
  if (matchId === undefined) return 0;
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('calculatedMatches');
    const matchObject = await CalculatedMatch.getMatchById(matchesCollection, matchId);
    // await matchObject.getFullData(matchesCollection);
    res.end(JSON.stringify(matchObject));
    return 0;
  });
  return 0;
};
