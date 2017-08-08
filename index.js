// entry point
const log4js = require('log4js')
const MediaStreamProcessor = require('./libs/MediaStreamProcessor')

log4js.level = 'debug'
const logger = log4js.getLogger('')

MediaStreamProcessor.start()
  .then(() => logger.info('start'))
