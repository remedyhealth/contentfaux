// third-party
import https from 'https'
import path from 'path'
import fs from 'fs'
import Mitm from 'mitm'
import colors from 'colors/safe'
import appRoot from 'app-root-path'
const mitm = Mitm()
mitm.disable()

const STUB = 'stub'
const UNSTUB = 'unstub'
const SETUP = 'setup'
const PREVIEW = '--preview'

colors.setTheme({
  title: ['yellow', 'underline'],
  bullet: ['gray'],
  error: ['red', 'bold']
})

class Contentfaux {

  /**
   * Runs as a CLI.
   * @example contentfaux stub (default)
   * @example contentfaux setup
   * @example contentfaux unstub
   */
  constructor () {
    this.request = this.request.bind(this)
    const rootDir = this._rootDir()

    let spaceid = ''
    let apikey = ''
    let dir = './contentfaux'
    try {
      const pkg = JSON.parse(fs.readFileSync(rootDir + '/package.json'))
      const config = pkg.config.contentfaux
      spaceid = config.spaceid
      apikey = config.apikey
      dir = config.dir || dir
    } catch (err) {}

    this._config = {
      spaceid: process.env.CONTENTFAUX_SPACEID || spaceid,
      apikey: process.env.CONTENTFAUX_APIKEY || apikey,
      dir: process.env.CONTENTFAUX_DIR || dir,
      autorun: !process.env.CONTENTFAUX_AUTORUN,
      cli: require.main === module
    }

    let cmd = STUB
    process.argv.map(arg => {
      switch (arg) {
        case STUB:
          cmd = STUB
          break
        case UNSTUB:
          cmd = UNSTUB
          break
        case SETUP:
          cmd = SETUP
          break
        case PREVIEW:
          this._config.preview = true
          break
        default:
          break
      }
    })

    this.unstub()

    // if it is to autorun
    if (this._config.autorun) {
      if (cmd === STUB) {
        this.stub()
      } else if (cmd === UNSTUB) {
        // already ran as part of init
        // this.unstub()
      } else if (cmd === SETUP) {
        this.sync()
      }
    }
  }

  /**
   * Syncs the entries from contentful for local testing.
   * @returns {Promise} A promise object that resolves after contentful mocks are created.
   */
  sync () {
    this._log(`Setting up Contentfaux`, 'title')
    if (!this._config.spaceid || !this._config.apikey || !this._config.dir) {
      return Promise.reject(new Error('spaceid, apikey and directory are all required.'))
    }

    this.unstub()
    const sub = (this._config.preview) ? 'preview' : 'cdn'
    const prefix = `https://${sub}.contentful.com/spaces/${this._config.spaceid}`
    const suffix = `?access_token=${this._config.apikey}`

    let examples = {}

    this._log(`- Detecting content types -`)
    return this._getTypes(`${prefix}/content_types${suffix}`).then(types => {
      let promises = []
      types.map(type => {
        promises.push(this._get(`${prefix}/entries${suffix}&include=10&content_type=${type}&limit=1`).then(entries => {
          if (entries.total) {
            this._log(`Found "${type}"...`)
            examples[type] = entries
          }
        }))
      })

      const dir = path.resolve(this._rootDir(), this._config.dir)

      return Promise.all(promises).then(() => {
        this._prepareFolder(dir)

        for (let i in examples) {
          this._writeFile(`${dir}/${i}.json`, JSON.stringify(examples[i]))
        }

        return examples
      })
    }).catch(err => {
      this._log(err, 'error')
    })
  }

  /**
   * Begins the process of stubbing (intercepts ALL request)
   * @returns {Event} The event callback.
   */
  stub () {
    this._log('Stubbing Contentful...', 'title')
    this._stubbed = true
    this._data = {}
    const dir = path.resolve(this._rootDir(), this._config.dir)
    try {
      const files = fs.readdirSync(dir)
      for (let file of files) {
        this._data[file.substr(0, file.length - 5)] = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8'))
      }
    } catch (err) {}
    mitm.enable()
    return mitm.on('request', this.request)
  }

  /**
   * Stops stubbing
   */
  unstub () {
    this._log('Unstubbing Contentful...', 'title')
    this._stubbed = false
    this._data = {}
    mitm.off('request', this.request)
    mitm.disable()
  }

  /**
   * The request interceptor.
   * @param {http.Request} req - The request object.
   * @param {http.Response} res - The response object.
   */
  request (req, res) {
    const parsed = this._parseRequest(req.url)
    let ret = this._getContentType(parsed.content_type)
    if (!parsed.limit) {
      parsed.limit = 5
    }

    for (let i = 1; i < parsed.limit; i++) {
      ret.items.push(ret.items[0])
    }

    res.end(JSON.stringify(ret))
  }

  /**
   * Returns where the request came from.
   * @returns {String}
   */
  _rootDir () {
    return appRoot.path
  }

  /**
   * Returns an stubbed content type.
   * @param {String} type - The content type.
   * @returns {Object} The json stubbed object.
   */
  _getContentType (type) {
    if (this._stubbed && this._data[type]) {
      return this._data[type]
    }

    return {items: []}
  }

  /**
   * Prepares the folder to populate data.
   * @param {String} folder - The folder name to clean, and copy data to.
   */
  _prepareFolder (folder) {
    this._deleteFolderRecursive(folder)
    fs.mkdir(folder)
    const staticDir = path.resolve(__dirname, 'staticMockData')
    fs.readdirSync(staticDir).forEach((file, index) => {
      const from = `${staticDir}/${file}`
      const to = `${folder}/${file}`
      fs.createReadStream(from).pipe(fs.createWriteStream(to))
    })
  }

  /**
   * Deletes a folder and all the contents synchronously.
   * @param {String} path - The path to delete (cannot start with a "/").
   */
  _deleteFolderRecursive (path) {
    if (path === '/') {
      throw new Error('Path cannot start with a "/".')
    }
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file, index) => {
        var curPath = path + '/' + file
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          this._deleteFolderRecursive(curPath)
        } else { // delete file
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(path)
    }
  }

  /**
   * Writes the file to a directory.
   * @param {String} filename - The file to write to (including the path).
   * @param {String} contents - The contents of the file.
   */
  _writeFile (filename, contents) {
    fs.writeFileSync(filename, contents)
  }

  /**
   * Grabs all the query params from the url.
   * @param {String} url - The url to interfere.
   * @returns {Object} Key-value pairs of the url query name and value.
   */
  _parseRequest (url) {
    let parsed = {}
    let params = url.split('?').reverse()[0].split('&')
    params.map(param => {
      param = param.split('=')
      parsed[param[0]] = param[1]
    })
    return parsed
  }

  /**
   * Returns the content types from the address specified.
   * @param {String} addr - The address of the request.
   * @returns {Promise} The promise instance, returns String[].
   */
  _getTypes (addr) {
    return this._get(addr).then(types => {
      let ret = []
      types.items.map(type => {
        ret.push(type.sys.id)
      })
      return ret
    })
  }

  /**
   * Gets the contents of the address.
   * @param {String} addr - The address to request.
   * @returns {Promise} The promise instance, resolves as JSON.
   */
  _get (addr) {
    return new Promise((resolve, reject) => {
      https.get(addr, res => {
        let body = ''
        res.on('data', chunk => {
          body += chunk
        }).on('end', () => {
          try {
            const parsed = JSON.parse(body)
            resolve(parsed)
          } catch (e) {
            reject(e)
          }
        }).on('error', e => {
          reject(e)
        })
      })
    })
  }

  /**
   * Makes a log request.
   * @param {String} msg - The message.
   * @param {String} [type=bullet] - The message type.
   */
  _log (msg, type = 'bullet') {
    console.log(colors[type](msg))
  }
}

export default new Contentfaux()
