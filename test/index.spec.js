/* global describe, it */

// Tests suite
import chai from 'chai'
const expect = chai.expect

import ContentfauxSrc from '../src'
import ContentfauxDist from '../dist'

describe('Test', () => {
  it('Should run', () => {
    expect(true).to.be.true
  })

  it('Should exist', () => {
    expect(ContentfauxSrc).to.exist
  })

  it('Should have built', () => {
    expect(ContentfauxDist).to.exist
  })
})
