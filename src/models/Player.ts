/* eslint-disable no-param-reassign */
export default class Player {
  presentRating: number;

  ratingChange: number;

  id: number;

  name: string;

  matches: any[];

  progress: [{timestamp: number, rating: number}];

  skirmishes: [];

  lastPlayed: number;

  wins: number;

  losses: number;

  goalsScored: number;

  goalsLost: number;

  constructor(id: number, name: string, wins: number, losses: number,
    goalsScored: number, goalsLost: number, presentRating: number, ratingChange: number) {
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
  }

  static async getPlayerByName(playerCollection: any, name: string) {
    const p = await playerCollection.findOne({ name });

    return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored, p.goalsLost, p.presentRating, p.ratingChange);
  }

  static async getPlayerById(playerCollection: any, id: number) {
    const p = await playerCollection.findOne({ id });

    return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored, p.goalsLost, p.presentRating, p.ratingChange);
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
      if (this.progress.length === 0
        || (match.timestamp - this.progress[this.progress.length - 1].timestamp) > 43200000) {
        await this.progress.push({
          timestamp: match.timestamp,
          rating: Player.getRatingFromMatchForPlayer(match, this.id),
        });
      }
    });
  }

  async getSkirmishesFromMatches() {
    this.skirmishes.splice(0, this.skirmishes.length);
  }

  async getFullData(matchesCollection: any) {
    await this.getPlayersMatches(matchesCollection);
    await this.getProgressFromMatches();
    await this.getSkirmishesFromMatches();
  }
}

module.exports = Player;
