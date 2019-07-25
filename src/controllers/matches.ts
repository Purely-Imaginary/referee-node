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
export const getAllMatches = (req: Request, res: Response) => {
  const url = 'mongodb://localhost/referee';
  MongoClient.connect(url, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('matches');
    const cursor = matchesCollection.find().sort({ date: -1, time: -1 });
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};

export const getMatchesFromLastDays = (req: Request, res: Response) => {
  const url = 'mongodb://localhost/referee';
  const amountOfDays = parseInt(req.params.amount, 10);
  const days:any = [];
  for (let i = 0; i < amountOfDays; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    const dateString = `${date.getFullYear()}-${month}-${date.getDate()}`;
    days.push(dateString);
  }

  MongoClient.connect(url, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesCollection = db.collection('matches');
    const cursor = matchesCollection.find({ date: { $in: days } }).sort({ date: -1, time: -1 });
    const result = await cursor.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
    return 0;
  });
};
