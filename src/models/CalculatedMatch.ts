import Player from './Player';

export default class CalculatedMatch {
  static diffCoefficient = 1600;

  static ratingChangeCoefficient = 100; // 100/20 = 5 pts per goal away from estimation

  date: string;

  time: string;

  timestamp: number;

  player11: Player;

  player12: Player;

  player21: Player;

  player22: Player;

  score1: number;

  score2: number;

  league: string;

  avg1elo: number;

  avg2elo: number;

  estimatedScoreForTeam1: number;

  estimatedScoreForTeam2: number;

  ratingChange: number;

  constructor(date: string, time: string, timestamp: number, player11: Player, player12: Player,
    player21: Player, player22: Player, score1: number, score2: number, league: string) {
    this.date = date;
    this.time = time;
    this.timestamp = timestamp;
    this.player11 = player11;
    this.player12 = player12;
    this.player21 = player21;
    this.player22 = player22;
    this.score1 = score1;
    this.score2 = score2;
    this.league = league;
    this.avg1elo = (player11.presentRating + player12.presentRating) / 2;
    this.avg2elo = (player21.presentRating + player22.presentRating) / 2;

    const difference = (this.avg1elo - this.avg2elo) / CalculatedMatch.diffCoefficient;
    const maxScore = Math.max(this.score1, this.score2);
    const scoreDifference = this.score1 - this.score2;

    const estimationForTeam1 = 1 / (1 + (10 ** -difference));
    const estimationForTeam2 = 1 / (1 + (10 ** difference));

    const scoreCoefficient = maxScore / Math.max(estimationForTeam1, estimationForTeam2);

    this.estimatedScoreForTeam1 = estimationForTeam1 * scoreCoefficient;
    this.estimatedScoreForTeam2 = estimationForTeam2 * scoreCoefficient;

    const estimatedScoreDifference = this.estimatedScoreForTeam1 - this.estimatedScoreForTeam2;
    this.ratingChange = (CalculatedMatch.ratingChangeCoefficient / 20)
      * (scoreDifference - estimatedScoreDifference);
  }

  async insertToDB(calculatedMatchCollection: any) {
    const didTeam1Won = this.score1 > this.score2 ? 1 : 0;
    const didTeam2Won = this.score1 < this.score2 ? 1 : 0;
    const pastData = await this.calculatePast(calculatedMatchCollection);
    await calculatedMatchCollection.insertOne({
      date: this.date,
      time: this.time,
      timestamp: this.timestamp,
      league: this.league,
      team1: {
        player1: {
          id: this.player11.id,
          name: this.player11.name,
          presentRating: this.player11.presentRating + this.ratingChange,
        },
        player2: {
          id: this.player12.id,
          name: this.player12.name,
          presentRating: this.player12.presentRating + this.ratingChange,
        },
        score: this.score1,
        isWon: didTeam1Won,
        ratingChange: this.ratingChange,
        estimatedScore: this.estimatedScoreForTeam1,
        pastSummedScoreAgainstThisTeam: pastData.team1score + this.score1,
        pastWinsAgainstThisTeam: pastData.team1wins + didTeam1Won,
      },
      team2: {
        player1: {
          id: this.player21.id,
          name: this.player21.name,
          presentRating: this.player21.presentRating - this.ratingChange,
        },
        player2: {
          id: this.player22.id,
          name: this.player22.name,
          presentRating: this.player22.presentRating - this.ratingChange,
        },
        score: this.score2,
        isWon: didTeam2Won,
        ratingChange: -this.ratingChange,
        estimatedScore: this.estimatedScoreForTeam2,
        pastSummedScoreAgainstThisTeam: pastData.team2score + this.score2,
        pastWinsAgainstThisTeam: pastData.team2wins + didTeam2Won,
      },
    });
  }

  async updatePlayers(playersDB: any) {
    this.player11.changeRating(playersDB, this.ratingChange);
    this.player12.changeRating(playersDB, this.ratingChange);
    this.player21.changeRating(playersDB, -this.ratingChange);
    this.player22.changeRating(playersDB, -this.ratingChange);

    [this.player11, this.player12, this.player21, this.player22].forEach((player: Player) => {
      player.updateTime(playersDB, this.timestamp);
    });

    if (this.score1 > this.score2) {
      playersDB.updateMany(
        {
          $or: [
            { name: this.player11.name },
            { name: this.player12.name },
          ],
        },
        { $inc: { wins: 1 } },
      );

      playersDB.updateMany(
        {
          $or: [
            { name: this.player21.name },
            { name: this.player22.name },
          ],
        },
        { $inc: { losses: 1 } },
      );
    }

    if (this.score1 < this.score2) {
      playersDB.updateMany(
        {
          $or: [
            { name: this.player11.name },
            { name: this.player12.name },
          ],
        },
        { $inc: { losses: 1 } },
      );

      playersDB.updateMany(
        {
          $or: [
            { name: this.player21.name },
            { name: this.player22.name },
          ],
        },
        { $inc: { wins: 1 } },
      );
    }

    playersDB.updateMany(
      {
        $or: [
          { name: this.player11.name },
          { name: this.player12.name },
        ],
      },
      { $inc: { goalsScored: this.score1, goalsLost: this.score2 } },
    );
    playersDB.updateMany(
      {
        $or: [
          { name: this.player21.name },
          { name: this.player22.name },
        ],
      },
      { $inc: { goalsScored: this.score2, goalsLost: this.score1 } },
    );
  }

  async calculatePast(matchesDB) {
    const data = matchesDB.aggregate([
      {
        $match:
        {
          'team1.player1.name': this.player11.name,
          'team1.player2.name': this.player12.name,
          'team2.player1.name': this.player21.name,
          'team2.player2.name': this.player22.name,
        },
      },
      {
        $group: {
          _id: null,
          team1score: { $sum: '$team1.score' },
          team1wins: { $sum: '$team1.isWon' },
          team2score: { $sum: '$team2.score' },
          team2wins: { $sum: '$team2.isWon' },
        },
      },
    ]);
    const temp1 = await data.toArray();
    // TODO: same but for switched sides

    const data2 = matchesDB.aggregate([
      {
        $match:
        {
          'team1.player1.name': this.player21.name,
          'team1.player2.name': this.player22.name,
          'team2.player1.name': this.player11.name,
          'team2.player2.name': this.player12.name,
        },
      },
      {
        $group: {
          _id: null,
          team1score: { $sum: '$team1.score' },
          team1wins: { $sum: '$team1.isWon' },
          team2score: { $sum: '$team2.score' },
          team2wins: { $sum: '$team2.isWon' },
        },
      },
    ]);
    const temp2 = await data2.toArray();

    let team1score = 0;
    let team1wins = 0;
    let team2score = 0;
    let team2wins = 0;

    if (temp1[0] !== undefined) {
      team1score += temp1[0].team1score;
      team1wins += temp1[0].team1wins;
      team2score += temp1[0].team2score;
      team2wins += temp1[0].team2wins;
    }
    if (temp2[0] !== undefined) {
      team1score += temp2[0].team2score;
      team1wins += temp2[0].team2wins;
      team2score += temp2[0].team1score;
      team2wins += temp2[0].team1wins;
    }

    return {
      team1score,
      team1wins,
      team2score,
      team2wins,
    };
  }
}


module.exports = CalculatedMatch;
