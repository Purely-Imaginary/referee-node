/* eslint-disable no-param-reassign */
export default class Player {
  presentRating: number;

  ratingChange: number;

  currentRank: number;

  id: number;

  name: string;

  matches: any[];

  progress: [{timestamp: number, rating: number}];

  skirmishes: {friends: {}, enemies: {}};

  lastPlayed: number;

  wins: number;

  losses: number;

  goalsScored: number;

  goalsLost: number;

  constructor(id: number, name: string, wins: number, losses: number,
    goalsScored: number, goalsLost: number, presentRating: number, ratingChange: number, currentRank: number) {
    this.id = id;
    this.name = name;
    this.matches = [];
    this.progress = [];
    this.skirmishes = [];
    this.lastPlayed = 0;
    this.wins = wins;
    this.losses = losses;
    this.goalsScored = goalsScored;
    this.goalsLost = goalsLost;
    this.presentRating = presentRating;
    this.ratingChange = ratingChange;
    this.currentRank = currentRank;
  }

  static async getPlayerByName(playerCollection: any, name: string) {
    const p = await playerCollection.findOne({ name });

    return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored,
      p.goalsLost, p.presentRating, p.ratingChange,
      p.currentRank);
  }

  static async getPlayerById(playerCollection: any, id: number) {
    const p = await playerCollection.findOne({ id });

    return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored,
      p.goalsLost, p.presentRating, p.ratingChange,
      p.currentRank);
  }

  async insertToDB(playerCollection: any) {
    await playerCollection.insertOne({
      id: this.id,
      name: this.name,
      wins: this.wins,
      losses: this.losses,
      goalsScored: this.goalsScored,
      goalsLost: this.goalsLost,
      presentRating: this.presentRating,
    });
  }

  async changeRating(playerCollection: any, changeValue: number) {
    await playerCollection.update(
      {
        name: this.name,
      },
      {
        $inc:
            {
              presentRating: changeValue,
            },
      },
    );
  }

  async updateTime(playerCollection: any, matchTime: number) {
    await playerCollection.update(
      {
        name: this.name,
      },
      {
        $set:
            {
              lastPlayed: matchTime,
            },
      },
    );
  }

  async getPlayersMatches(matchesCollection: any) {
    const dataTeam1 = await matchesCollection.find(
      {
        $or:
            [
              { 'team1.player1.id': this.id },
              { 'team1.player2.id': this.id },
            ],
      },
    );
    const matches: any[] = [];
    await dataTeam1.forEach((match) => {
      if (match.team1.player1.id !== this.id) {
        [match.team1.player1, match.team1.player2] = [match.team1.player2, match.team1.player1];
      }
      matches.push(match);
    });
    const dataTeam2 = await matchesCollection.find(
      {
        $or:
            [
              { 'team2.player1.id': this.id },
              { 'team2.player2.id': this.id },
            ],
      },
    );

    await dataTeam2.forEach((match: any) => {
      [match.team1, match.team2] = [match.team2, match.team1];
      if (match.team1.player1.id !== this.id) {
        [match.team1.player1, match.team1.player2] = [match.team1.player2, match.team1.player1];
      }
      matches.push(match);
    });

    this.matches = matches.sort((a:any, b:any) => ((a.timestamp > b.timestamp) ? 1 : -1));
    return this;
  }

  static getRatingChangeFromMatchForPlayer(match: any, playerId: number) {
    return (match.team1.player1.id === playerId || match.team1.player2.id === playerId)
      ? match.team1.ratingChange : match.team2.ratingChange;
  }

  static getRatingFromMatchForPlayer(match: any, playerId: number) {
    return [
      match.team1.player1,
      match.team1.player2,
      match.team2.player1,
      match.team2.player2,
    ].filter(player => player.id === playerId)[0].presentRating;
  }

  async updatePlayersProgressInTimespan(
    playerCollection: any, matchesCollection: any, days: number,
  ) {
    const edgeDate = new Date(new Date().setDate(new Date().getDate() - days)).getTime();
    const data = await matchesCollection.find(
      {
        $or:
            [
              { 'team1.player1.id': this.id },
              { 'team1.player2.id': this.id },
              { 'team2.player1.id': this.id },
              { 'team2.player2.id': this.id },
            ],
        timestamp: {
          $lt: edgeDate,
        },
      },
    ).sort({ timestamp: -1 }).limit(1).toArray();
    let pastRating = 1000;
    if (data[0] !== undefined) {
      const DBMatch = data[0];
      const pastPlayerData = [
        DBMatch.team1.player1,
        DBMatch.team1.player2,
        DBMatch.team2.player1,
        DBMatch.team2.player2,
      ].filter(player => player.id === this.id)[0];
      pastRating = pastPlayerData.presentRating;
    }
    const eloChange = this.presentRating - pastRating;

    await playerCollection.updateOne({
      name: this.name,
    },
    {
      $set:
          {
            ratingChange: eloChange,
          },
    });
    return eloChange;
  }

  async getProgressFromMatches() {
    this.progress.splice(0, this.progress.length); // clear the table
    this.matches.forEach(async (match) => {
      await this.progress.push({
        timestamp: match.timestamp,
        rating: Player.getRatingFromMatchForPlayer(match, this.id),
      });
    });
  }

  async getSkirmishesFromMatches() {
    this.skirmishes = { friends: {}, enemies: {} };
    this.matches.forEach(async (match) => {
      const friendIdentifier = `${match.team1.player2.name},${match.team1.player2.id}`;
      const enemyIdentifier = `${match.team2.player1.name},${match.team2.player2.name}`;
      if (this.skirmishes.friends[friendIdentifier] === undefined) {
        this.skirmishes.friends[friendIdentifier] = 1;
      } else {
        this.skirmishes.friends[friendIdentifier] = this.skirmishes.friends[friendIdentifier] + 1;
      }
      if (this.skirmishes.enemies[enemyIdentifier] === undefined) {
        this.skirmishes.enemies[enemyIdentifier] = 1;
      } else {
        this.skirmishes.enemies[enemyIdentifier] = this.skirmishes.enemies[enemyIdentifier] + 1;
      }
    });
    this.skirmishes.friends = Object.keys(this.skirmishes.friends)
      .map(key => [key.split(',')[0], key.split(',')[1], this.skirmishes.friends[key]])
      .sort((a:any, b:any) => ((a[2] < b[2]) ? 1 : -1));

    this.skirmishes.enemies = Object.keys(this.skirmishes.enemies)
      .map(key => [key.split(',')[0], key.split(',')[1], this.skirmishes.enemies[key]])
      .sort((a:any, b:any) => ((a[2] < b[2]) ? 1 : -1));
  }

  async getFullData(matchesCollection: any) {
    await this.getPlayersMatches(matchesCollection);
    await this.getProgressFromMatches();
    await this.getSkirmishesFromMatches();
  }
}

module.exports = Player;
