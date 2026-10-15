import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authenticateSession } from '../api-lib/session.js';
import { issuePasswordCode, confirmPasswordCode, hashResetCode } from '../api-lib/passwordReset.js';
import { memoryUser } from './helpers/memoryUser.js';

process.env.JWT_SECRET = 'test-only-session-secret';
const account = () => ({
  _id: 'original-account', email: 'jane@example.com', sessionVersion: 0,
  resetCodeHash: hashResetCode('123456'), resetCodeExpires: new Date(Date.now() + 60000), resetCodeAttempts: 0,
});
const request = (userId = 'original-account', sessionVersion = 0) => ({ headers: {
  authorization: `Bearer ${jwt.sign({ userId, sessionVersion }, process.env.JWT_SECRET)}`,
} });

test('password recovery revokes existing sessions and consumes the code only once', async () => {
  const User = memoryUser(account());
  assert.equal((await authenticateSession(request(), User)).email, 'jane@example.com');
  const results = await Promise.all(Array.from({ length: 3 }, () =>
    confirmPasswordCode(User, 'jane@example.com', '123456', 'newpassword123')));
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await bcrypt.compare('newpassword123', User.value.passwordHash), true);
  assert.equal(User.value.sessionVersion, 1);
  assert.equal(await authenticateSession(request(), User), null);
  assert.equal((await authenticateSession(request('original-account', 1), User)).email, 'jane@example.com');
  assert.equal(await confirmPasswordCode(User, 'jane@example.com', '123456', 'anotherpassword'), false);
});

test('deleted accounts and re-registrations cannot reuse a signed session', async () => {
  const User = memoryUser(account());
  User.value = null;
  assert.equal(await authenticateSession(request(), User), null);
  User.value = { ...account(), _id: 'new-account' };
  assert.equal(await authenticateSession(request(), User), null);
  assert.equal(await authenticateSession({ headers: { authorization: 'Bearer invalid' } }, User), null);
  assert.equal(await authenticateSession({ headers: {} }, User), null);
});

test('parallel wrong guesses exhaust exactly five attempts', async () => {
  const User = memoryUser(account());
  const results = await Promise.all(Array.from({ length: 30 }, () =>
    confirmPasswordCode(User, 'jane@example.com', '000000', 'newpassword123')));
  assert.equal(results.some(Boolean), false);
  assert.equal(User.value.resetCodeAttempts, 5);
  assert.equal(await confirmPasswordCode(User, 'jane@example.com', '123456', 'newpassword123'), false);
  assert.equal(User.value.sessionVersion, 0);
});

test('the fifth valid guess succeeds, expired codes fail, and resends have a persistent cooldown', async () => {
  const User = memoryUser({ ...account(), resetCodeAttempts: 4 });
  assert.equal(await confirmPasswordCode(User, 'jane@example.com', '123456', 'newpassword123'), true);
  User.value = { ...account(), resetCodeExpires: new Date(Date.now() - 1000) };
  assert.equal(await confirmPasswordCode(User, 'jane@example.com', '123456', 'newpassword123'), false);
  const issued = await issuePasswordCode(User, 'jane@example.com');
  assert.match(issued.code, /^\d{6}$/);
  const expires = User.value.resetCodeExpires;
  assert.equal(await issuePasswordCode(User, 'jane@example.com'), null);
  assert.deepEqual(User.value.resetCodeExpires, expires);
  User.value.resetCodeRequestedAt = new Date(Date.now() - 61000);
  assert.ok(await issuePasswordCode(User, 'jane@example.com'));
});
