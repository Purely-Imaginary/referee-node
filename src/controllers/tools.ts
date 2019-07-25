/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import https from 'https';
import Papa from 'papaparse';
import { spreadsheetURL2, mongoUrl } from '../secrets';

/**
 * GET /user/get/matches
 * Testing endpoint
 */
export const getDataFromSpreadsheet = () => new Promise(((resolve, reject) => {
  let data = '';
  https.get(spreadsheetURL2, (resp) => {
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', async () => {
      data = Papa.parse(data);

      const parsedData: any[] | { date: any; time: any; player1: any; player2: any; score1: any; score2: any; player3: any; player4: any; league: any; }[] = [];

      // eslint-disable-next-line no-restricted-syntax
      data.data.forEach(async (match: any[]) => {
        // eslint-disable-next-line no-continue
        if (match[0] === 'Date') return;

        const parsedMatch = {
          date: match[0],
          time: match[1],
          player1: match[2],
          player2: match[3],
          score1: match[4],
          score2: match[5],
          player3: match[6],
          player4: match[7],
          league: match[8],
        };

        await parsedData.push(parsedMatch);
      });
      resolve(parsedData);
    });
  });
}
));

export const insertDataToDBFromSpreadsheet = (req: Request, res: Response) => {
  getDataFromSpreadsheet().then((value) => {
    MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
      const db = client.db('referee');
      db.collection('rawMatches').drop();
      db.createCollection('rawMatches');
      const matchesCollection = db.collection('rawMatches');
      matchesCollection.insertMany(value, (__err, response) => {
        res.send(JSON.stringify(response.insertedCount));
        return 0;
      });
    });
  });
};
