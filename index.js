const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

const serviceUrl = 'https://api.zenhub.io/';

// For further dev
const serviceUrlEnterprise = 'https://<zenhub_enterprise_host>/'

class ZenHub extends q.DesktopApp {
  constructor() {
    super();
    // run every 1 min
    this.pollingInterval = 1*60*1000;
  }

  async applyConfig() {
    this.serviceHeaders = {
      "Content-Type": "application/json",
      "X-Authentication-Token": this.authorization.apiKey,
    }
  }

  async run() {
    return request.get({
        url: serviceUrl,
        headers: this.serviceHeaders,
        json: true
      }).then((body) => {
        let color = '#00FF00';
        let triggered = false;
        let alerts = [`ALARM `];
        let effects = "SET_COLOR";

        for (let monitor of body) {
          // extract the important values from the response
          let status = monitor.status;
          let monitorId = monitor.id;

          logger.info(`For monitor ${monitorId}, got status: ${status}`);

          if (status === -1) {
            triggered = true;
            color = '#FF0000';
            effects="BLINK";
            alerts.push(monitor.url + " is down!");
            logger.info("Sending alert on " + monitor.url + " is down");
          } 
          
        }
         
        if (triggered) {
          let signal = new q.Signal({ 
            points:[[new q.Point(color,effects)]],
            name: "ZenHub",
            message: alerts.join('<br>'),
            link: {
              url: 'https://www.zenhub.com/checkpoints',
              label: 'Show in ZenHub',
            }
          });
          return signal;
        } else {
          let signal = new q.Signal({ 
            points:[[new q.Point(color)]],
            name: "ZenHub",
            message: `Everything is OK.`,
            link: {
              url: 'https://www.zenhub.com',
              label: 'Show in ZenHub',
            }
          });
          return signal;
        }

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