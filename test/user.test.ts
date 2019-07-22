import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app';

describe('GET /login', () => {
  it('should return 200 OK', () => request(app).get('/login')
    .expect(200));
});

describe('GET /signup', () => {
  it('should return 200 OK', () => request(app).get('/signup')
    .expect(200));
});


describe('POST /login', () => {
  it('should return some defined error message with valid parameters', done => request(app).post('/login')
    .field('email', 'john@me.com')
    .field('password', 'Hunter2')
    .expect(302)
    .end((err, res) => {
      expect(res.error).not.to.be.undefined;
      done();
    }));
});
