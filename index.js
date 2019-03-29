const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

const serviceUrl = 'https://api.zenhub.io/p1/repositories/';

// For further dev
const serviceUrlEnterprise = 'https://<zenhub_enterprise_host>/'

class ZenHub extends q.DesktopApp {
  constructor() {
    super();
    // run every 20 sec
    this.pollingInterval = 20 * 1000;
    // For checking plural or singular
    this.issue ="";
  }

  async applyConfig() {
    this.serviceHeaders = {
      "Content-Type": "application/json",
      "X-Authentication-Token": this.authorization.apiKey,
    }

    // Array to keep in mind the pipelines name.
    this.categories = {};

    return request.get({
      url: serviceUrl + this.config.reposId + '/board',
      headers: this.serviceHeaders,
      json: true
    }).then((body) => {

      // Get initial number of issues on each pipelines in array shape
      for (let pipeline of body.pipelines) {
        this.categories[pipeline.name] = Object.keys(pipeline.issues).length;
      }

      return null;

    })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
        return q.Signal.error([
          'The ZenHub service returned an error. Please check your API key and account.',
          `Detail: ${error.message}`]);
      });
  }

  async run() {
    return request.get({
      url: serviceUrl + this.config.reposId + '/board',
      headers: this.serviceHeaders,
      json: true
    }).then((body) => {
      let triggered = false;
      let message = [];
      let signal = null;
      this.issue = "issue";

      for (let pipeline of body.pipelines) {
        // Test if an issue has been added
        if (this.categories[pipeline.name] < Object.keys(pipeline.issues).length) {
          // Need to send a signal
          triggered = true;
          // Check if there are several issues
          if( (this.categories[pipeline.name]+1) < Object.keys(pipeline.issues).length) {
            this.issue = "issues";
          }
          // Update signal's message
          message.push(`New ${this.issue} added on ${pipeline.name}`);
        }
        // Update the number of issues into the pipeline
        this.categories[pipeline.name] = Object.keys(pipeline.issues).length;
      }

      if (triggered) {
        signal = new q.Signal({
          points: [[new q.Point(this.config.color, this.config.effect)]],
          name: "ZenHub",
          message: message.join("<br>"),
          link: {
            url: 'https://app.zenhub.com/',
            label: 'Show in ZenHub',
          }
        });
      }

      return signal;

    })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
        return q.Signal.error([
          'The ZenHub service returned an error. Please check your API key and account.',
          `Detail: ${error.message}`]);
      });
  }

}


const zenhub = new ZenHub();

module.exports = {
  ZenHub: ZenHub
}