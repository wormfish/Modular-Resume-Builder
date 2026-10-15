import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../server/models/User.js';
import authRouter from '../server/routes/auth.js';
import { requireAuth } from '../server/lib/auth.js';
import { hashResetCode } from '../api-lib/passwordReset.js';
import { memoryUser } from './helpers/memoryUser.js';

process.env.JWT_SECRET = 'test-only-backend-secret';
process.env.MONGODB_URI = 'mongodb://unused-fixture/test';
global.mongoose = { conn: {}, promise: null };
const { default: apiAuth } = await import('../api/auth/[action].js');
const { requireAuth: apiRequireAuth } = await import('../api-lib/auth.js');

test('Express and Vercel reject the old session immediately after password recovery', async (t) => {
  for (const backend of ['express', 'vercel']) {
    await t.test(backend, async (t) => {
      const account = memoryUser({ _id: 'fixture-id', email: 'jane@example.com', sessionVersion: 0,
        resetCodeHash: hashResetCode('123456'), resetCodeExpires: new Date(Date.now() + 60000), resetCodeAttempts: 0 });
      t.mock.method(User, 'findById', account.findById.bind(account));
      t.mock.method(User, 'findOneAndUpdate', account.findOneAndUpdate.bind(account));
      const token = jwt.sign({ userId: 'fixture-id', email: account.value.email, sessionVersion: 0 }, process.env.JWT_SECRET);
      const headers = { authorization: `Bearer ${token}` };
      const body = { email: account.value.email, code: '123456', newPassword: 'newpassword123' };
      if (backend === 'express') {
        const app = express();
        app.use(express.json());
        app.use('/auth', authRouter);
        app.get('/protected', requireAuth, (_req, res) => res.json({ ok: true }));
        const server = app.listen(0, '127.0.0.1');
        await new Promise((resolve) => server.once('listening', resolve));
        t.after(() => new Promise((resolve) => server.close(resolve)));
        const base = `http://127.0.0.1:${server.address().port}`;
        assert.equal((await fetch(`${base}/protected`, { headers })).status, 200);
        assert.equal((await fetch(`${base}/auth/reset-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })).status, 200);
        assert.equal((await fetch(`${base}/protected`, { headers })).status, 401);
      } else {
        const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; } });
        assert.ok(await apiRequireAuth({ headers }, response()));
        const resetResponse = response();
        await apiAuth({ method: 'POST', query: { action: 'reset-password' }, body }, resetResponse);
        assert.equal(resetResponse.statusCode, 200);
        const protectedResponse = response();
        assert.equal(await apiRequireAuth({ headers }, protectedResponse), null);
        assert.equal(protectedResponse.statusCode, 401);
      }
    });
  }
});
