/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { mongoUrl } from '../secrets';

/**
 * GET /ranking
 * User ranking.
 */
export const getLastMatches = (req: Request, res: Response) => {
  const amount = parseInt(req.params.amount, 10);
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('calculatedMatches');
    const cursor = matchesCollection.find().sort({ timestamp: -1 }).limit(amount);
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};
export const getAllMatches = (req: Request, res: Response) => {
  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('calculatedMatches');
    const cursor = matchesCollection.find().sort({ timestamp: -1 });
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};

export const getMatchesFromLastDays = (req: Request, res: Response) => {
  const amountOfDays = parseInt(req.params.amount, 10);
  const days:any = [];
  for (let i = 0; i < amountOfDays; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    let day = (date.getDate()).toString();
    day = day.length === 1 ? `0${day}` : day;
    const dateString = `${date.getFullYear()}-${month}-${day}`;
    days.push(dateString);
  }

  MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('calculatedMatches');
    const cursor = matchesCollection.find({ date: { $in: days } }).sort({ timestamp: -1 });
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};
