// entry point
const yaml      = require('node-yaml')
const gstreamer = require('gstreamer-superficial')
const log4js    = require('log4js')
const fetch     = require('node-fetch')
const Enum      = require('enum')
const jpg       = require('jpeg-turbo')
const express   = require('express')
const cors      = require('cors')

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
    this.appsrcPipelineScript = ''
    this.executePipelineScripts = []
    this.port = 7000
    this.appsrcPipeline = null
    this.executePipelines = []
    this.appsink = null
    this.lastdata = null
    this.status = status.IDLE.key
    this.app = express()

    this.CONFFILE = __dirname + "/../conf/config.yaml"
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

            this._createAppSrcPipelineScript(data)
            this.executePipelineScripts = data['pipeline-for-execute']
            this.port = data.port || 7000

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
        this.appsrcPipeline = new gstreamer.Pipeline(this.appsrcPipelineScript)
        this.appsink = this.appsrcPipeline.findChild('sink')

        if(this.executePipelineScripts instanceof Array) {
          this.executePipelineScripts.forEach( script => {
            const pipeline = new gstreamer.Pipeline(script)
            this.executePipelines.push(pipeline)
          })
        }

        resolv()
      } catch(err) {
        reject(err)
      }
    })
  }

  start_pipeline() {
    new Promise( (resolv, reject) => {
      try {
        if(!this.appsrcPipeline || !this.appsink) throw 'pipeline have not been generated'

        this.appsrcPipeline.play()
        this.appsink.pull(this._onPull.bind(this))

        this.executePipelines.forEach( pipeline => {
          pipeline.play()
        })

        this.status = status.STARTING.key

        logger.info('attempt to start streaming')

        resolv()
      } catch(err) {
        reject(err)
      }
    })
  }

  _createAppSrcPipelineScript(conf) {
    const scriptArray = conf['pipeline-for-appsrc']
    if(!scriptArray || !(scriptArray instanceof Array) ) {
      throw 'createPipelineScript - wrong format'
    }

    this.appsrcPipelineScript = scriptArray.map( arr => arr.join(" ! ")).join(" ")
    logger.debug(`_createAppSrcPipelineScript - ${this.appsrcPipelineScript}`)
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
    this.app.use(cors())

    this.app.get('/image/current', (req, res) => {
      if(!this.lastdata) {
        res.status(404).send("no data")
      } else {
        try {
          res.set('Content-Type', 'image/jpg').send(this.lastdata)
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
