// entry point
const yaml      = require('node-yaml')
const gstreamer = require('gstreamer-superficial')
const log4js    = require('log4js')
const fetch     = require('node-fetch')
const Enum      = require('enum')

const logger = log4js.getLogger('MediaStreamProcessor')
log4js.level = 'debug'

const status = new Enum([
    'IDLE',
    'SETUPPING',
    'SETUPPED',
    'STARTING',
    'STARTED'
    ])

class MediaStreamProcessor {
  constructor() {
    this.pipelineScript = ''
    this.analyzer = {protocol: 'http', host: 'localhost', port: 7000}
    this.endpoint = ''
    this.pipeline = null
    this.appsink = null
    this.lastdata = null
    this.interval = 1000
    this.status = status.IDLE.key

    this.CONFFILE = __dirname + "/../config.yaml"
  }

  start() {
    this.load_conf()
      .then(() => this.generate_pipeline())
      .then(() => this.start_pipeline())
      .then(() => this.start_posting())
      .catch(err => logger.warn(err))
  }

  load_conf() {
    this.status = status.SETUPPING.key

    return new Promise((resolv, reject) => {
      yaml.read(this.CONFFILE, {}, (err, data) => {
        if(err) {
          reject(err)
        } else {
          try {
            if(typeof(data) !== 'object') throw "load_conf - wrong format"

            this._createPipelineScript(data)
            this.analyzer = Object.assign({}, this.analyzer, data.analyzer)
            this.endpoint = `${this.analyzer.protocol}://${this.analyzer.host}:${this.analyzer.port}/`

            this.status = status.SETUPPED.key

            logger.info("completed to load configuration")
            logger.debug(`endpoint - ${this.endpoint}`)

            resolv()
          } catch(e) {
            reject(e)
          }
        }
      })
    })
  }

  generate_pipeline() {
    new Promise( (resolv, reject) => {
      try {
        this.pipeline = new gstreamer.Pipeline(this.pipelineScript)
        this.appsink = this.pipeline.findChild('sink')

        resolv()
      } catch(err) {
        reject(err)
      }
    })
  }

  start_pipeline() {
    new Promise( (resolv, reject) => {
      try {
        if(!this.pipeline || !this.appsink) throw 'pipeline have not been generated'

        this.pipeline.play()
        this.appsink.pull(this._onPull.bind(this))

        this.status = status.STARTING.key

        logger.info('attempt to start streaming')

        resolv()
      } catch(err) {
        reject(err)
      }
    })
  }

  start_posting() {
    setInterval( ev => {
      this._post_data()
    }, this.interval)
  }


  _createPipelineScript(conf) {
    if(!conf.pipeline || !(conf.pipeline instanceof Array) ) {
      throw 'createPipelineScript - wrong format'
    }

    this.pipelineScript = conf.pipeline.map( arr => arr.join(" ! ")).join(" ")
    logger.debug(`_createPipelineScript - ${this.pipelineScript}`)
  }


  _onPull(buf) {
    if(buf) {
      if(this.status === status.STARTING.key) {
        logger.info('streaming started')
        this.status = status.STARTED.key
      }
      this.lastdata = buf
      this.appsink.pull(this._onPull.bind(this))
    } else {
      logger.warn("onPull - buf is null, restart pull after 3 sec")
      setTimeout( () => this.appsink.pull(this._onPull.bind(this)), 3000)
    }
  }

  _post_data() {
    if(!this.lastdata) return;

    logger.debug(`attempt to post image data [${this.lastdata.length}]`)

    fetch(this.endpoint, { method: 'POST', body: this.lastdata })
      .then( res => logger.debug(`finished to post data - (${res.status})`))
      .catch(err => logger.warn(err.message) )

    this.lastdata = null
  }
}

module.exports = new MediaStreamProcessor()
