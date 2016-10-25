// third-party
import https from 'https'
import path from 'path'
import fs from 'fs'
import Mitm from 'mitm'
import colors from 'colors/safe'
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
    const rootDir = process.cwd()

    let spaceid = ''
    let apikey = ''
    let directory = './contentfaux'
    try {
      const pkg = JSON.parse(fs.readFileSync(rootDir + '/package.json'))
      const config = pkg.config.contentfaux
      spaceid = config.spaceid
      apikey = config.apikey
      directory = config.directory
    } catch (err) {}

    this._config = {
      run: STUB,
      spaceid: process.env.CONTENTFAUX_SPACEID || spaceid,
      apikey: process.env.CONTENTFAUX_APIKEY || apikey,
      directory: process.env.CONTENTFAUX_DIR || directory,
      cli: require.main === module
    }

    // resolve the directory
    this._config.directory = path.resolve(rootDir, this._config.directory)

    process.argv.map(arg => {
      switch (arg) {
        case STUB:
          this._config.run = STUB
          break
        case UNSTUB:
          this._config.run = UNSTUB
          break
        case SETUP:
          this._config.run = SETUP
          break
        case PREVIEW:
          this._conifg.preview = true
          break
        default:
          break
      }
    })

    this.run()
  }

  /**
   * Runs the command.
   */
  run () {
    if (this._config.run === STUB) {
      this.stub()
    } else if (this._config.run === UNSTUB) {
      this.unstub()
    } else if (this._config.run === SETUP) {
      this.syncWithContentful()
    }
  }

  /**
   * Syncs the entries from contentful for local testing.
   */
  syncWithContentful () {
    this._log(`Setting up Contentfaux`, 'title')
    if (!this._config.spaceid || !this._config.apikey || !this._config.directory) {
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

      return Promise.all(promises).then(() => {
        this._prepareFolder(this._config.directory)

        for (let i in examples) {
          this._writeFile(`${this._config.directory}/${i}.json`, JSON.stringify(examples[i]))
        }

        return examples
      })
    }).catch(err => {
      this._log(err, 'error')
    })
  }

  /**
   * Prepares the folder to populate data.
   * @param {String} folder - The folder name to clean, and copy data to.
   */
  _prepareFolder (folder) {
    this._removeFolder(folder)
    fs.mkdir(folder)
    const staticDir = path.resolve(__dirname, 'staticMockData')
    fs.readdirSync(staticDir).forEach((file, index) => {
      const from = `${staticDir}/${file}`
      const to = `${folder}/${file}`
      fs.createReadStream(from).pipe(fs.createWriteStream(to))
    })
  }

  /**
   * Removes a folder and its contents recursively.
   * @param {String} folder - The folder to remove.
   */
  _removeFolder (folder) {
    if (fs.existsSync(folder)) {
      fs.readdirSync(folder).forEach((file, index) => {
        const curPath = `${folder}/${file}`
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          this.deleteFolderRecursive(curPath)
        } else { // delete file
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(folder)
    }
  }

  /**
   * Deletes a folder and all the contents synchronously.
   * @param {String} path - The path to delete (cannot start with a "/").
   */
  deleteFolderRecursive (path) {
    if (path === '/') {
      throw new Error('Path cannot start with a "/".')
    }
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file, index) => {
        var curPath = path + '/' + file
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          this.deleteFolderRecursive(curPath)
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
   * Begins the process of stubbing (intercepts ALL request)
   */
  stub (config = {}) {
    Object.assign(this._config, config)
    this._log('Stubbing Contentful...', 'title')
    this._stubbed = true
    this._config = config
    mitm.enable()
    return mitm.on('request', this.request)
  }

  request (req, res) {
    const parsed = this._parseRequest(req.url)
    let ret = this.getContentType(parsed.content_type)
    if (!parsed.limit) {
      parsed.limit = 5
    }

    for (let i = 1; i < parsed.limit; i++) {
      ret.items.push(ret.items[0])
    }

    res.end(JSON.stringify(ret))
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
   * Stops stubbing
   */
  unstub () {
    this._stubbed = false
    mitm.off('request', this.request)
    mitm.disable()
  }

  /**
   * Returns an stubbed content type.
   * @param {String} type - The content type.
   * @returns {Object} The json stubbed object.
   */
  getContentType (type) {
    if (this._stubbed) {
      return require(path.resolve(this._config.dir, `${type}.json`))
    }

    return {}
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

  _log (msg, type = 'bullet') {
    console.log(colors[type](msg))
  }
}

export default new Contentfaux()
