/*
 * Copyright 2023 Dan Klc. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import assert from 'assert';
import dotenv from 'dotenv';

import { handler } from '../src/index.js';

import { mockClient } from 'aws-sdk-client-mock';
import { SESClient } from '@aws-sdk/client-ses';

const mockSesClient = mockClient(SESClient);

dotenv.config();

process.env.HONEYPOT = 'test-honeypot';
process.env.REQUIRED_FIELDS = 'subject,message';
process.env.ALLOWED_FIELDS = 'name,subject,message';

/* eslint-env mocha */
describe('Index Tests', () => {
  beforeEach(() => mockSesClient.reset());

  it('will fail with 405 without method', async () => {
    const res = await handler({});
    assert.strictEqual(res.statusCode, 405);
  });

  it('will not fail with no parameters', async () => {
    const res = await handler({
      requestContext: { http: { method: 'POST' } },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('will reject missing parameters with 400', async () => {
    const res = await handler({
      queryStringParameters: {
        message: 'test message',
      },
      requestContext: { http: { method: 'POST' } },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('will do nothing on honeypot request', async () => {
    const res = await handler({
      queryStringParameters: {
        subject: 'test subject',
        message: 'test message',
        'test-honeypot': 'I am a bot!',
      },
      requestContext: { http: { method: 'POST' } },
    });
    assert.strictEqual(res.statusCode, 200);
  });

  it('can handle send failure', async () => {
    mockSesClient.rejects('BAD NEWS BEARS');
    const res = await handler({
      SES_CLIENT: mockSesClient,
      queryStringParameters: {
        subject: 'test subject',
        message: 'test message',
      },
      requestContext: { http: { method: 'POST' } },
    });
    assert.strictEqual(res.statusCode, 500);
  });

  it('can send email', async () => {
    const res = await handler({
      SES_CLIENT: mockSesClient,
      queryStringParameters: {
        subject: 'test subject',
        message: 'test message',
      },
      requestContext: { http: { method: 'POST' } },
    });
    assert.strictEqual(res.statusCode, 200);
  });
});
