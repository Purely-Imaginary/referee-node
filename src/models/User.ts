/* eslint-disable no-param-reassign */

import sha1 from 'sha1';
import jwt from 'jsonwebtoken';

export default class User {
  id: number;

  googleUserId: string;

  name: string;

  playerId: number;

  lastLogin: number;

  groupId: number;

  constructor(id: number, name: string, playerId: number,
    lastLogin: number, groupId: number) {
    this.id = id;
    this.name = name;
    this.playerId = playerId;
    this.lastLogin = lastLogin;
    this.groupId = groupId;
  }

  static async getUserById(userCollection: any, id: number) {
    const u = await userCollection.findOne({ id });

    return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
  }

  static async getUserByJWT(userCollection: any, JWT: string) {
    const user = jwt.verify(JWT, 'secret');
    const u = await userCollection.findOne({ id: user.user.id });

    return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
  }

  static async getUserByLoginAndPassword(userCollection: any, name: string, password: string) {
    const hashedPassword = sha1(`${password} saltySalt`);
    const u = await userCollection.findOne({ name, password: hashedPassword });

    return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
  }

  static async getUserByGoogleId(userCollection: any, googleId: number) {
    const u = await userCollection.findOne({ googleId });

    return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
  }

  async insertToDB(userCollection: any, saltedPassword: string) {
    await userCollection.insertOne({
      id: this.id,
      name: this.name,
      password: saltedPassword,
      playerId: this.playerId,
      lastLogin: this.lastLogin,
      groupId: this.groupId,
    });
  }

  async updateLastLogin(playerCollection: any) {
    await playerCollection.update(
      {
        id: this.id,
      },
      {
        $inc:
            {
              lastLogin: Date.now(),
            },
      },
    );
  }
}

module.exports = User;
