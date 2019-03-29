const assert = require('assert');
const {
  ZenHub
} = require('../index');

describe('ZenHub', function () {

  describe('#run()', function () {
    it('runs normally', async function () {
      return buildApp().then(app => {
        return app.run().then((signal) => {
          console.log(JSON.stringify(signal));
          assert.ok(signal);
          assert.ok(signal.link.url);
          assert.ok(signal.link.label);
        }).catch(error => {
          assert.fail(error);
        });
      });
    });
    it('returns an error when the API fails', async function () {
      return buildApp({
        authorization: {
          apiKey: '<your-api-key>',
        }
      }).then(async app => {
        return app.run().then((signal) => {
          assert.ok(signal);
          assert.equal('ERROR', signal.action);
        }).catch(error => {
          assert.fail(error);
        });
      });
    });
  });
});


const defaultConfig = Object.freeze({
  authorization: {
    apiKey: '<your-api-key>'
  }
});

async function buildApp(config) {
  let app = new ZenHub();

  // set up the test with a test account's API Key
  return app.processConfig(config || defaultConfig).then(() => {
    return app;
  });
}