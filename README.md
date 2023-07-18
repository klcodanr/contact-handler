[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Lambda Contact Handler

A simple Lambda function to handle contact form requests, sending an Email via SES.

## Configuration

This Function requires the following environment variables:

 - ALLOWED_FIELDS - comma-separated list of allowed fields to be sent in the email
 - REQUIRED_FIELDS - comma-separates list of required fields
 - HONEYPOT - a field which if supplied with a truthy value will result in the form submission being accepted but no email sent
 - MAIL_TO - the email recipent
 - MAIL_FROM - the email sender
 - MAIL_SUBJECT - the subject of the email to be sent

