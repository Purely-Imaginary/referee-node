"use strict";
/* eslint-disable no-param-reassign */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha1_1 = __importDefault(require("sha1"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class User {
    constructor(id, name, playerId, lastLogin, groupId) {
        this.id = id;
        this.name = name;
        this.playerId = playerId;
        this.lastLogin = lastLogin;
        this.groupId = groupId;
    }
    static getUserById(userCollection, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const u = yield userCollection.findOne({ id });
            return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
        });
    }
    static getUserByJWT(userCollection, JWT) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = jsonwebtoken_1.default.verify(JWT, 'secret');
            const u = yield userCollection.findOne({ id: user.user.id });
            return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
        });
    }
    static getUserByLoginAndPassword(userCollection, name, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = sha1_1.default(`${password} saltySalt`);
            const u = yield userCollection.findOne({ name, password: hashedPassword });
            return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
        });
    }
    static getUserByGoogleId(userCollection, googleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const u = yield userCollection.findOne({ googleId });
            return new User(u.id, u.name, u.playerId, u.lastLogin, u.groupId);
        });
    }
    insertToDB(userCollection, saltedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            yield userCollection.insertOne({
                id: this.id,
                name: this.name,
                password: saltedPassword,
                playerId: this.playerId,
                lastLogin: this.lastLogin,
                groupId: this.groupId,
            });
        });
    }
    updateLastLogin(playerCollection) {
        return __awaiter(this, void 0, void 0, function* () {
            yield playerCollection.update({
                id: this.id,
            }, {
                $inc: {
                    lastLogin: Date.now(),
                },
            });
        });
    }
}
exports.default = User;
module.exports = User;
//# sourceMappingURL=User.js.map