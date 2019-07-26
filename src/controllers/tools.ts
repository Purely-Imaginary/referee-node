/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import https from 'https';
import Papa from 'papaparse';
import { spreadsheetURL2, mongoUrl } from '../secrets';
import Player from '../models/Player';
import CalculatedMatch from '../models/CalculatedMatch';

/**
 * GET /user/get/matches
 * Testing endpoint
 */


export const getDataFromSpreadsheet = () => new Promise(((resolve, _reject) => {
  let csvdata = '';
  https.get(spreadsheetURL2, (resp) => {
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      csvdata += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', async () => {
      const data: {} = Papa.parse(csvdata);

      const parsedData: any[] | {
        date: any; time: any; player1: any; player2: any;
        score1: any; score2: any; player3: any; player4: any; league: any; }[] = [];

      // eslint-disable-next-line no-restricted-syntax
      data.data.forEach(async (match: any[]) => {
        // eslint-disable-next-line no-continue
        if (match[0] === 'Date') return;
        // alphabetical order of matches for teams recognition
        if (match[2] > match[3]) [match[2], match[3]] = [match[3], match[2]];
        if (match[6] > match[7]) [match[6], match[7]] = [match[7], match[6]];
        const timestamp = new Date(`${match[0]} ${match[1]}`).getTime();
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
          timestamp,
        };

        await parsedData.push(parsedMatch);
      });
      resolve(parsedData);
    });
  });
}
));

export const insertDataToDBFromSpreadsheet = async (db) => {
  const value = await getDataFromSpreadsheet();
  try {
    await db.collection('rawMatches').drop();
    await db.createCollection('rawMatches');
  } catch {}
  const matchesCollection = db.collection('rawMatches');
  await matchesCollection.insertMany(value);
};

function containsPlayer(name: string, array: Player[]) {
  for (let i = 0; i < array.length; i += 1) {
    if (array[i].name === name) {
      return true;
    }
  }
  return false;
}

export const generatePlayersFromRawMatches = async (db) => {
  const matchesDB = db.collection('rawMatches').find().sort({ date: 1, time: 1 });
  const matchesData = await matchesDB.toArray();
  const playerList: Player[] = [];
  let id = 0;
  try {
    await db.dropCollection('players');
    await db.createCollection('players');
  } catch {}

  await matchesData.forEach(async (match) => {
    const players = [match.player1, match.player2, match.player3, match.player4];
    await players.forEach(async (playerName) => {
      if (!containsPlayer(playerName, playerList)) {
        const playerObject = new Player(id, playerName, 0, 0, 0, 0, 1000);
        await playerList.push(playerObject);
        id += 1;
      }
    });
  });

  await playerList.forEach(async (player: Player) => {
    await player.insertToDB(db.collection('players'));
  });
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const calculateMatches = async (req: Request, res: Response) => {
  const startTime = new Date();
  await MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const insertedMatches = await insertDataToDBFromSpreadsheet(db);
    await generatePlayersFromRawMatches(db);
    const matchesDB = db.collection('rawMatches').find().sort({ date: 1, time: 1 });
    const matchesData = await matchesDB.toArray();
    const playersDB = db.collection('players');
    const playersData = await playersDB.find().toArray();
    try {
      await db.dropCollection('calculatedMatch');
      await db.createCollection('calculatedMatch');
    } catch {}

    await asyncForEach(matchesData, (async (match) => {
      const cMatch = await new CalculatedMatch(
        match.date,
        match.time,
        match.timestamp,
        await Player.getPlayerByName(playersDB, match.player1),
        await Player.getPlayerByName(playersDB, match.player2),
        await Player.getPlayerByName(playersDB, match.player3),
        await Player.getPlayerByName(playersDB, match.player4),
        parseInt(match.score1, 10),
        parseInt(match.score2, 10),
        match.league,
      );
      await cMatch.insertToDB(db.collection('calculatedMatch'));
      await cMatch.updatePlayers(playersDB);
    }));
    const timeElapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    res.end(JSON.stringify({
      matchesProcessed: matchesData.length,
      insertedMatches,
      timeElapsed,
    }));
  });
};

export const testingController = async (req: Request, res: Response) => {
  const value = await calculateMatches();
  res.end(JSON.stringify(value));
  return value;
};
