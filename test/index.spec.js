/* global describe, it */
import path from 'path'
import fs from 'fs'

// Tests suite
import chai from 'chai'
const expect = chai.expect

import ContentfauxSrc from '../src'
import ContentfauxDist from '../dist'

function test (obj, name) {
  describe(`${name}`, () => {
    describe('init', () => {

    })

    describe('_rootDir', () => {
      it('Should detect the root directory', () => {
        expect(obj._rootDir()).to.contain('/contentfaux')
      })
    })

    describe('stub and unstub', () => {
      it('Should allow unstubbing', () => {
        expect(obj._stubbed).to.be.false
        obj.stub()
        expect(obj._stubbed).to.be.true
        obj.unstub()
        expect(obj._stubbed).to.be.false
      })
    })

    describe('read and write', () => {
      it('Should be able to delete and create a folder and files', () => {
        const testPath = path.resolve(__dirname, './test')
        obj._prepareFolder(testPath)
        expect(fs.lstatSync(testPath).isDirectory())
        obj._writeFile(`${testPath}/test.md`, 'hi')
        expect(fs.existsSync(`${testPath}/test.md`)).to.be.true
        expect(fs.readFileSync(`${testPath}/test.md`).toString()).to.equal('hi')
        obj._prepareFolder(testPath)
        expect(fs.existsSync(`${testPath}/test`)).to.be.false
        obj._deleteFolderRecursive(testPath)
        expect(fs.existsSync(testPath)).to.be.false
      })
    })
  })
}

test(ContentfauxSrc, 'Source')
test(ContentfauxDist, 'Source')
