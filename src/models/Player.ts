export default class Player {
  presentRating: number;

  id: number;

  name: string;

  matches: [];

  progress: [];

  skirmishes: [];

  wins: number;

  losses: number;

  goalsScored: number;

  goalsLost: number;

  constructor(id: number, name: string, wins: number, losses: number,
    goalsScored: number, goalsLost: number, presentRating: number) {
    this.id = id;
    this.name = name;
    this.matches = [];
    this.progress = [];
    this.skirmishes = [];
    this.wins = wins;
    this.losses = losses;
    this.goalsScored = goalsScored;
    this.goalsLost = goalsLost;
    this.presentRating = presentRating;
  }

  static async getPlayerByName(playerCollection: any, name: string) {
    const p = await playerCollection.findOne({ name });

    return new Player(p.id, p.name, p.wins, p.losses, p.goalsScored, p.goalsLost, p.presentRating);
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
}

module.exports = Player;
