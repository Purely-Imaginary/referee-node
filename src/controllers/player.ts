/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { mongoUrl } from '../secrets';
import Player from '../models/Player';

/**
 * GET /user/get/matches
 * Testing endpoint
 */
export const getPlayerData = (req: Request, res: Response) => {
  const playerId:number = parseInt(req.params.id, 10);
  if (playerId === undefined) return 0;
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('calculatedMatches');
    const playersCollection = db.collection('players');
    const playerObject = await Player.getPlayerById(playersCollection, playerId);
    await playerObject.getFullData(matchesCollection);
    res.end(JSON.stringify(playerObject));
    return 0;
  });
};
