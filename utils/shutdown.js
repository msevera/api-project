const logger = require('./logger');

const colorText = text => {
  const colorCodes = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
  };
  return `${colorCodes.cyan}${text}${colorCodes.reset}`;
};

const resourcesToRelease = new Map();
let processExitErrorLogged = false;

const processExit = async error => {
  let releaseResults = [...resourcesToRelease.values()];
  let allReleased = releaseResults.every(item => item);
  while (!allReleased) {
    await new Promise(resolvePromise => {
      setTimeout(() => resolvePromise(), 1000);
    });
    releaseResults = [...resourcesToRelease.values()];
    allReleased = releaseResults.every(item => item);
  }

  if (error && !processExitErrorLogged) {
    processExitErrorLogged = true;
    if (typeof error === 'string') {
      logger.info(`Exiting process because of ${error}`);
    } else {
      logger.error('uncaughtException', error);
    }
  }

  process.exit(0);
};

const registerProcessExit = () => {
  process.on('SIGINT', processExit); // Catch Ctrl+C
  process.on('SIGTERM', processExit); // Catch kill
  process.on('uncaughtException', processExit);
};

const unregisterProcessExit = () => {
  process.off('SIGINT', processExit); // Catch Ctrl+C
  process.off('SIGTERM', processExit); // Catch kill
  process.off('uncaughtException', processExit);
};

module.exports = (id, fn) => {
  resourcesToRelease.set(id, false);
  let resourcesReleased = false;
  logger.info(colorText(`${id} Subscribing for shutdown`));
  const releaseResources = async () => {
    if (!resourcesReleased) {
      resourcesReleased = true;
      logger.info(colorText(`Releasing resources for ${id} ...`));
      await fn();
      resourcesToRelease.set(id, true);
      logger.info(colorText(`Resources for ${id} are released`));
    }
  };

  unregisterProcessExit();
  // Register for termination signals
  process.on('SIGINT', releaseResources); // Catch Ctrl+C
  process.on('SIGTERM', releaseResources); // Catch kill
  process.on('uncaughtException', releaseResources);
  registerProcessExit();

  return () => {
    resourcesToRelease.delete(id);
    console.log(colorText(`${id} Unsubscribing from shutdown`));
    process.off('SIGINT', releaseResources); // Catch Ctrl+C
    process.off('SIGTERM', releaseResources); // Catch kill
    process.off('uncaughtException', releaseResources);
  };
};
