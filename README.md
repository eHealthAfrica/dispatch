# Dispatch

> LoMIS Offline SMS Sync Framework

Accepts only POST requests to forward to LoMIS database, collates SMS into documents and
pushes to CouchDB server.

## Usage

0. Install [Node.js][], and [Git][]
1. `npm install -g grunt-cli`
1. `git clone https://github.com/eHealthAfrica/dispatch.git`
2. `cd dispatch && npm install`
3. Create `config/[env]/app.json` and add the JSON below inside app.json
4.  ```JSON
      {
        "sms": {
          "SMS_URI": "OUTGOING SMS URL",
          "PHONE_ID": "TELERIVET PHONE ID",
          "API_KEY": "TELERIVET API KEY"
        },
        "email": {
          "service": "Gmail",
          "auth": {
            "user": "email address",
            "pass": "email password"
          }
        },
        "BASE_URI": "CouchDB Server Base URL"
      }
    ```
5. Run `NODE_ENV=[ development | production | test ] node index.js`

### Unit

1. `grunt test`

## Authors

* © 2015 Justin Lorenzo <justin.lorenzo@ehealthnigeria.org>
* © 2015 Jideobi Ofomah <jideobi.ofomah@ehealthnigeria.org>

… and [contributors][].

[contributors]: https://github.com/eHealthAfrica/dispatch/graphs/contributors

## License

Code licensed under Apache 2