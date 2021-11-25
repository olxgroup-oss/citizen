const http = require('http');
const debug = require('debug')('citizen:server');

const logger = require('./logger');
const app = require('../app');

// eslint-disable-next-line no-unused-vars
const shutdown = (server) => (_reason, _promise) => {
  logger.info('Received termination signal');
  logger.info('Shutting down server');
  // nr.recordCustomEvent('ServerShutdown', { signals });

  server.close(() => {
    logger.info('TERMINATING THE APPLICATION');
    process.exit(0);
  });
};

process.on('unhandledRejection', (_reason, promise) => {
  logger.error(
    { title: 'Unhandled Rejection at:', promise },
  );
  // nr.noticeError(reason);
  // not entirely sure if that's needed or not.
  // I'm hoping this releases the promise for garbage collection.
  promise.catch(() => {});
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  // nr.noticeError(err);
});

const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

const run = () => {
  const port = normalizePort(process.env.PORT || '3000');
  app.set('port', port);

  const server = http.createServer(app);
  process.on('SIGTERM', shutdown(server));
  process.on('SIGINT', shutdown(server));
  server.listen(port);
  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`); // eslint-disable-line no-console
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`); // eslint-disable-line no-console
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
  });
};

module.exports = run;
