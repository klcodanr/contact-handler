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

const STATUS_MAP = {
  400: 'Bad Request',
  405: 'Unsupported method',
  500: 'Internal Server Error',
};

export class ProblemError extends Error {
  /**
   * Sends the provided error to the response
   * @param {*} err any error-ish object
   * @returns {Object} a Problem response to return from Lambda
   */
  static toResponse(err) {
    return {
      statusCode: err.status || 500,
      body: JSON.stringify({
        status: err.status,
        title: err.title || STATUS_MAP[err.status] || STATUS_MAP[500],
        detail: err.detail || err.message,
      }),
      headers: {
        'Content-Type': 'application+problem/json',
      },
    };
  }

  /**
   * Construct a new ProblemError
   * @param {number} status
   * @param {any} [detail]
   * @param {string} [title]
   */
  constructor(status, detail, title) {
    super(`ERROR ${status}: ${title}`);
    this.status = status;
    this.detail = detail;
    this.title = title;
  }
}
