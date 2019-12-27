/* eslint-disable import/prefer-default-export */
// eslint-disable-next-line no-unused-vars
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import sha1 from 'sha1';
import { mongoUrl, jwtToken } from '../secrets';
import User from '../models/User';

/**
 * GET /user/get/matches
 * Testing endpoint
 */
export const getMatches = (req: Request, res: Response) => {
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('calculatedMatches');
    const cursor = matchesCollection.find({ 'team1.player1.id': req.query.id });
    const result = await cursor.toArray();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};

/**
 * GET /user/insertSample
 * Testing endpoint
 */
export const insertSampleUser = (req: Request, res: Response) => {
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const usersCollection = db.collection('users');
    const sampleUser = new User(1, 'sample', 1, Date.now(), 1);
    sampleUser.insertToDB(usersCollection, sha1('password saltySalt'));

    const dbUser = await User.getUserByLoginAndPassword(usersCollection, 'sample', 'password');
    const jwtSign = jwt.sign({ user: dbUser }, jwtToken, { expiresIn: '14d' });

    const jwtUser = await User.getUserByJWT(usersCollection, jwtSign);
    res.end(JSON.stringify(jwtUser));
    return 0;
  });
  return 'ok';
};

/**
 * GET /user/login/username/password
 * Testing endpoint sample///password
 */
export const loginUser = (req: Request, res: Response) => {
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const usersCollection = db.collection('users');
    try {
      const dbUser = await User.getUserByLoginAndPassword(
        usersCollection, req.params.username, req.params.password,
      );
      const jwtSign = await jwt.sign({ user: dbUser }, jwtToken, { expiresIn: '14d' });
      res.end(jwtSign);
    } catch (Exception) {
      res.end('Not found.');
    }
  });
};
