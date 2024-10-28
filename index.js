const { run } = require('./server');
const logger = require('./utils/logger');

run(app => {
  return new Promise(resolve => {
    app.listen(5000, () => {
      // eslint-disable-next-line
      logger.info(`Server ready at port http://localhost:5000 and timezone ${process.env.TZ}`);
      resolve();
    });
  });
});
