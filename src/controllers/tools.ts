/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable import/prefer-default-export */
// eslint-disable-next-line no-unused-vars
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


export const getDataFromSpreadsheet = () => new Promise(((resolve) => {
  let csvdata = '';
  https.get(spreadsheetURL2, (resp) => {
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      csvdata += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', async () => {
      const data: Papa = Papa.parse(csvdata);

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
  await db.collection('rawMatches').drop();
  await db.createCollection('rawMatches');
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
  await db.dropCollection('players');
  await db.createCollection('players');

  await matchesData.forEach(async (match) => {
    const players = [match.player1, match.player2, match.player3, match.player4];
    await players.forEach(async (playerName) => {
      if (!containsPlayer(playerName, playerList)) {
        id += 1;
        const playerObject = new Player(id, playerName, 0, 0, 0, 0, 1000, 0, 0);
        await playerList.push(playerObject);
      }
    });
  });

  await playerList.forEach(async (player: Player) => {
    await player.insertToDB(db.collection('players'));
  });
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
}

async function updateLastDaysProgress(playersDB, matchesDB, days: number) {
  const playersData = await playersDB.find().toArray();
  playersData.forEach(async (player) => {
    const playerObject = await Player.getPlayerByName(playersDB, player.name);
    await playerObject.updatePlayersProgressInTimespan(
      playersDB, matchesDB, days,
    );
  });
}

async function updateCurrentRank(playersDB) {
  const playersData = await playersDB.find().sort({ presentRating: -1 }).toArray();
  for (let index = 1; index <= playersData.length; index += 1) {
    const player = playersData[index - 1];
    playersDB.updateOne({
      name: player.name,
    },
    {
      $set:
          {
            currentRank: index,
          },
    });
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

    await db.dropCollection('calculatedMatches');
    await db.createCollection('calculatedMatches');

    const calculatedMatchesDB = db.collection('calculatedMatches');
    let lastParsedMatch = '';
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
      await cMatch.insertToDB(db.collection('calculatedMatches'));
      await cMatch.updatePlayers(playersDB);
      await cMatch.calculatePast(calculatedMatchesDB);
      lastParsedMatch = `${match.date} ${match.time}`;
    }));
    await updateLastDaysProgress(playersDB, calculatedMatchesDB, 7);
    await updateCurrentRank(playersDB);
    const timeElapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    res.end(JSON.stringify({
      matchesProcessed: matchesData.length,
      insertedMatches,
      timeElapsed,
      lastParsedMatch,
    }));
  });
};

export const testingController = async (req: Request, res: Response) => {
  await MongoClient.connect(mongoUrl, async (_err: any, client: any) => {
    const db = client.db('referee');
    const matchesDB = db.collection('calculatedMatches');
    const playersDB = db.collection('players');
    await updateLastDaysProgress(playersDB, matchesDB, 7);
    res.end(JSON.stringify('a'));
    return 0;
  });
};
