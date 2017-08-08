// entry point
const yaml      = require('node-yaml')
const gstreamer = require('gstreamer-superficial')
const log4js    = require('log4js')
const fetch     = require('node-fetch')
const Enum      = require('enum')
const jpg       = require('jpeg-turbo')
const express   = require('express')

log4js.level = 'debug'
const logger = log4js.getLogger('MediaStreamProcessor')

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
    this.port = 7000
    this.pipeline = null
    this.appsink = null
    this.lastdata = null
    this.status = status.IDLE.key
    this.app = express()

    this.CONFFILE = __dirname + "/../config.yaml"
  }

  start() {
    return new Promise((resolv, reject) => {
      this.load_conf()
        .then(() => this.generate_pipeline())
        .then(() => this.start_pipeline())
        .then(() => {
          this._setRoute()
          return this._startRESTServer()
        })
        .then(() => {
          logger.info(`start server on port ${this.port}`)
          resolv()
        })
        .catch(err => reject(err))
    })
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
            this.port = data.port || 7000
            this.width = data.width || 640
            this.height = data.height || 480

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

  _setRoute() {
    this.app.get('/image/current', (req, res) => {
      if(!this.lastdata) {
        res.status(404).send("no data")
      } else {
        try {
          const jpgData = jpg.compressSync(this.lastdata, {
            format: jpg.FORMAT_RGB,
            width: this.width,
            height: this.height
          })

          res.set('Content-Type', 'image/jpg').send(jpgData)
        } catch(err) {
          res.status(500).send(err.message)
        }
      }
    })
  }

  _startRESTServer() {
    return new Promise((resolv, reject) => {
      try {
        this.app.listen(this.port, () => {
          resolv()
        })
      } catch(err) {
        reject(err)
      }
    })
  }
}

module.exports = new MediaStreamProcessor()
