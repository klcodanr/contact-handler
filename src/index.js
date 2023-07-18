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

/* eslint-disable no-console */
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { stringify } from 'yaml';
import { ProblemError } from './problem.js';

function generatePayload(event, data) {
  const sourceIp = event.requestContext?.http?.sourceIp;
  const userAgent = event.requestContext?.http?.userAgent;
  const submitted = new Date(
    event.requestContext?.timeEpoch || 0,
  ).toISOString();
  return {
    ...Object.fromEntries(
      process.env.ALLOWED_FIELDS.split(',').map((f) => [f, data[f]]),
    ),
    sourceIp,
    userAgent,
    submitted,
  };
}

async function sendEmail(event) {
  const data = event.queryStringParameters || {};
  console.debug('Extracted data from event', { event, data });
  const requiredFields = process.env.REQUIRED_FIELDS.split(',');
  const missing = requiredFields.filter((f) => !data[f]);
  if (missing.length > 0) {
    throw new ProblemError(400, `Missing fields: [${missing.join(',')}]`);
  }
  const honeypot = process.env.HONEYPOT;
  if (!data[honeypot]) {
    const payload = generatePayload(event, data);
    console.debug('Sending message', payload);

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [process.env.MAIL_TO],
      },
      Message: {
        Body: {
          Text: { Data: stringify(payload) },
        },

        Subject: { Data: process.env.MAIL_SUBJECT },
      },
      Source: process.env.MAIL_FROM,
    });

    const ses = event.SES_CLIENT || new SESClient();
    const response = await ses.send(command);
    console.info('Message sent', { response, payload });
  } else {
    console.warn('Event caught in honeypot', event);
  }
}

export async function handler(event) {
  try {
    const method = event.requestContext?.http?.method;
    if (method !== 'POST') {
      throw new ProblemError(405, `The method [${method}] is not supported`);
    }
    await sendEmail(event);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    console.error('Failed to send due to error', err);
    return ProblemError.toResponse(err);
  }
}
