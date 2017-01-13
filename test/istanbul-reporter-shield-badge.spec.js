var expect = require('chai').expect;
var sinon = require('sinon')
var fs = require('fs')
var Collector = require('istanbul').Collector
var FileWriter = require('istanbul').FileWriter
var utils = require('istanbul').utils
var ShieldBadgeReporter = require('../istanbul-reporter-shield-badge')
// var findInFiles = require('../../find-in-files')
require('chai').should()

describe('ShieldBadgeReporter', function () {
  'use strict'
  let sandbox
  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })
  afterEach(() => {
    sandbox.restore()
  })

  it('should return default config (empty object passed in parameter)', function () {
    var reporter = new ShieldBadgeReporter({})
    expect(reporter.coverageType).to.equal('lines')
    expect(reporter.range).to.deep.equal([50,80])
    expect(reporter.subject).to.equal('coverage')
    expect(reporter.readmeFilename).to.equal(null)
    expect(reporter.readmeDir).to.equal(null)
    expect(reporter.opts.file).to.equal('coverage.shield.badge.md')
  })

  it('should return default config (no parameter)', function () {
    var reporter = new ShieldBadgeReporter()
    expect(reporter.coverageType).to.equal('lines')
    expect(reporter.range).to.deep.equal([50,80])
    expect(reporter.subject).to.equal('coverage')
    expect(reporter.readmeFilename).to.equal(null)
    expect(reporter.readmeDir).to.equal(null)
    expect(reporter.opts.file).to.equal('coverage.shield.badge.md')
  })

  it('should always return coverageType property in lowercase', function () {
    var reporter = new ShieldBadgeReporter({coverageType: 'Lines'})
    expect(reporter.coverageType).to.equal('lines')
  })

  it('should return readmeFilename = null if different than readme.md (case insensitive)', function () {
    var reporter = new ShieldBadgeReporter({readmeFilename: 'readme'})
    expect(reporter.readmeFilename).to.equal(null)
    reporter = new ShieldBadgeReporter({readmeFilename: 'readme.txt'})
    expect(reporter.readmeFilename).to.equal(null)
  })

  it('should return readmeFilename properly set if equals to readme.md (case insensitive)', function () {
    var reporter = new ShieldBadgeReporter({readmeFilename: 'readme.md'})
    expect(reporter.readmeFilename).to.equal('readme.md')
    reporter = new ShieldBadgeReporter({readmeFilename: 'README.md'})
    expect(reporter.readmeFilename).to.equal('README.md')
  })

  it('should return readmeDir properly set ', function () {
    var reporter = new ShieldBadgeReporter({readmeDir: '/test/test'})
    expect(reporter.readmeDir).to.equal('/test/test')
  })

  it('should return the sypnosis', function () {
    var reporter = new ShieldBadgeReporter({coverageType: 'Lines'})
    expect(reporter.synopsis()).to.equal('generates the url to get a shield.io badge representing the lines coverage percentage.')
  })

  it('should return default coverageType if other than (lines|statements|functions|branches)', function () {
    var reporter = new ShieldBadgeReporter({coverageType: 'Something Else'})
    expect(reporter.coverageType).to.equal('lines')
    reporter = new ShieldBadgeReporter({coverageType: null})
    expect(reporter.coverageType).to.equal('lines')
    reporter = new ShieldBadgeReporter({coverageType: true})
    expect(reporter.coverageType).to.equal('lines')
    reporter = new ShieldBadgeReporter({coverageType: undefined})
    expect(reporter.coverageType).to.equal('lines')
    reporter = new ShieldBadgeReporter({coverageType: {}})
    expect(reporter.coverageType).to.equal('lines')
    reporter = new ShieldBadgeReporter({coverageType: []})
    expect(reporter.coverageType).to.equal('lines')
  })

  it('should return a badge url properly encoded', function () {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'Test %-_/'})
    var badgeUrl = reporter.generateBadgeUrl({pct: 0, })
    expect(badgeUrl).to.equal('https://img.shields.io/badge/Test%20%25-_%2F-0%25-red.svg')
  })

  it('should return a red badge', function () {
    var reporter = new ShieldBadgeReporter({coverageType: ''})
    var badgeUrl = reporter.generateBadgeUrl({pct: 0, })
    expect(badgeUrl).to.equal('https://img.shields.io/badge/coverage-0%25-red.svg')
  })

  it('should return a yellow badge', function () {
    var reporter = new ShieldBadgeReporter({coverageType: ''})
    var badgeUrl = reporter.generateBadgeUrl({pct: 60, })
    expect(badgeUrl).to.equal('https://img.shields.io/badge/coverage-60%25-yellow.svg')
  })

  it('should return a bright green badge', function () {
    var reporter = new ShieldBadgeReporter({coverageType: ''})
    var badgeUrl = reporter.generateBadgeUrl({pct: 80, })
    expect(badgeUrl).to.equal('https://img.shields.io/badge/coverage-80%25-brightgreen.svg')
  })

  it('should return a yellow badge with custom range', function () {
    var reporter = new ShieldBadgeReporter({coverageType: '', range: [75, 90]})
    var badgeUrl = reporter.generateBadgeUrl({pct: 80, })
    expect(badgeUrl).to.equal('https://img.shields.io/badge/coverage-80%25-yellow.svg')
  })

  it('should return the proper badge markdown', function () {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90]})
    var badgeMarkdown = reporter.generateBadgeMarkdown(reporter.generateBadgeUrl({pct: 80}))
    var badgeUrl = 'https://img.shields.io/badge/test-80%25-yellow.svg'
    expect(badgeMarkdown).to.equal('![test-shield-badge-1](' + badgeUrl + ')')
  })

  it('should not replace the badge in the README.md if the config is not set', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90]})
    reporter.replaceInFile('', function (result) {
      expect(result.success).to.equal(false)
      expect(result.error).to.equal('The readmeFilename config property was not set (or not set properly)')
      done()
    })
  })

  it('should not replace the badge in the README.md if the config is not properly set (other than readme.md; case insensitive)', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.txt'})
    reporter.replaceInFile('', function (result) {
      expect(result.success).to.equal(false)
      expect(result.error).to.equal('The readmeFilename config property was not set (or not set properly)')
      done()
    })
  })

  it('should not replace the badge in the README.md if there is an error reading the file', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.md'})
    
    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields('error', null)
    
    reporter.replaceInFile('', function (result) {
      expect(result.success).to.equal(false)
      expect(result.error).to.equal('error')
      readFileStub.restore()
      done()
    })
  })
  
  it('should not replace the badge in the README.md if there is an error writing the file', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.md'})

    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields(null, '')
    
    var writeFileStub = sandbox.stub(fs, 'writeFile')
    writeFileStub.yields('error')

    reporter.replaceInFile('', function (result) {
      expect(result.success).to.equal(false)
      expect(result.error).to.equal('error')
      done()
    })
  })

  it('should update an existing badge in the README.md if the config is properly set', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.md'})
    var oldBadgeMarkdown = '![test-shield-badge-1](https://img.shields.io/badge/coverage-80%25-yellow.svg)'
    var newBadgeMarkdown = '![test-shield-badge-1](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)'
    
    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields(null, oldBadgeMarkdown)
    
    var writeFileStub = sandbox.stub(fs, 'writeFile')
    writeFileStub.yields(null)

    reporter.replaceInFile(newBadgeMarkdown, function (result) {
      expect(result.success).to.equal(true)
      expect(result.create).to.equal(false)
      expect(result.update).to.equal(true)
      expect(result.data).to.equal(newBadgeMarkdown)
      expect(result.error).to.equal('')
      done()
    })
  })

  it('should update an existing badge in the README.md if the config is properly set (subject is case sensitive!)', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'Test', range: [75, 90], readmeFilename: 'README.md'})
    var oldBadgeMarkdown = '![Test-shield-badge-1](https://img.shields.io/badge/coverage-80%25-yellow.svg)'
    var newBadgeMarkdown = '![Test-shield-badge-1](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)'
    
    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields(null, oldBadgeMarkdown)
    
    var writeFileStub = sandbox.stub(fs, 'writeFile')
    writeFileStub.yields(null)

    reporter.replaceInFile(newBadgeMarkdown, function (result) {
      expect(result.success).to.equal(true)
      expect(result.create).to.equal(false)
      expect(result.update).to.equal(true)
      expect(result.data).to.equal(newBadgeMarkdown)
      expect(result.error).to.equal('')
      done()
    })
  })

  it('should update an existing badge in the README.md if the config is properly set (subject can accept any character!)', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'Test!', range: [75, 90], readmeFilename: 'README.md'})
    var oldBadgeMarkdown = '![Test!-shield-badge-1](https://img.shields.io/badge/coverage-80%25-yellow.svg)'
    var newBadgeMarkdown = '![Test!-shield-badge-1](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)'
    
    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields(null, oldBadgeMarkdown)
    
    var writeFileStub = sandbox.stub(fs, 'writeFile')
    writeFileStub.yields(null)

    reporter.replaceInFile(newBadgeMarkdown, function (result) {
      expect(result.success).to.equal(true)
      expect(result.create).to.equal(false)
      expect(result.update).to.equal(true)
      expect(result.data).to.equal(newBadgeMarkdown)
      expect(result.error).to.equal('')
      done()
    })
  })

  it('should update an existing identical badge in the README.md if the config is properly set', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.md', readmeDir: '.'})
    var oldBadgeMarkdown = '![test-shield-badge-1](https://img.shields.io/badge/coverage-80%25-yellow.svg)'
    var newBadgeMarkdown = '![test-shield-badge-1](https://img.shields.io/badge/coverage-80%25-yellow.svg)'
    
    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields(null, oldBadgeMarkdown)
    
    var writeFileStub = sandbox.stub(fs, 'writeFile')
    writeFileStub.yields(null)

    reporter.replaceInFile(newBadgeMarkdown, function (result) {
      expect(result.success).to.equal(true)
      expect(result.create).to.equal(false)
      expect(result.update).to.equal(true)
      expect(result.data).to.equal(newBadgeMarkdown)
      expect(result.error).to.equal('')
      done()
    })
  })



  it('should update multiple existing badges in the README.md if the config is properly set', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.md'})
    var oldBadgeMarkdown = '![test-shield-badge-1](https://img.shields.io/badge/coverage-80%25-yellow.svg)\n\nblabla![test-shield-badge-1](https://img.shields.io/badge/coverage-80%25-yellow.svg)'
    var newBadgeMarkdown = '![test-shield-badge-1](https://img.shields.io/badge/coverage-88%25-yellow.svg)'
    
    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields(null, oldBadgeMarkdown)
    
    var writeFileStub = sandbox.stub(fs, 'writeFile')
    writeFileStub.yields(null)

    reporter.replaceInFile(newBadgeMarkdown, function (result) {
      expect(result.success).to.equal(true)
      expect(result.create).to.equal(false)
      expect(result.update).to.equal(true)
      expect(result.error).to.equal('')
      expect(result.data).to.equal('![test-shield-badge-1](https://img.shields.io/badge/coverage-88%25-yellow.svg)\n\nblabla![test-shield-badge-1](https://img.shields.io/badge/coverage-88%25-yellow.svg)')
      expect(result.error).to.equal('')
      done()
    })
  })

  it('should append a badge at the beginning of the README.md if the config is properly set', function(done) {
    var reporter = new ShieldBadgeReporter({coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.md'})
    var newBadgeMarkdown = '![test-shield-badge-1](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)'
    
    var readFileStub = sandbox.stub(fs, 'readFile')
    readFileStub.yields(null, '')
    
    var writeFileStub = sandbox.stub(fs, 'writeFile')
    writeFileStub.yields(null)

    reporter.replaceInFile(newBadgeMarkdown, function (result) {
      expect(result.success).to.equal(true)
      expect(result.create).to.equal(true)
      expect(result.update).to.equal(false)
      expect(result.error).to.equal('')
      done()
    })
  })

  it('should properly write the badge if the config is properly set', function() {
    var fileWriter = new FileWriter(true)
    sandbox.stub(fileWriter, 'on')
    sandbox.stub(fileWriter, 'done')
    var fileWriter_Write = sandbox.stub(fileWriter, 'writeFile')
    fileWriter_Write.yields({write: function () {}})

    var reporter = new ShieldBadgeReporter({writer: fileWriter, coverageType: '', subject: 'test', range: [75, 90], readmeFilename: 'README.md'})
    
    var collector = new Collector()
    var collectorStub = sandbox.stub(collector, 'files')
    collectorStub.returns([])

    var utilsStub = sandbox.stub(utils, 'mergeSummaryObjects')
    utilsStub.returns({lines: {pct: '90'}})

    var replaceInFileStub = sandbox.stub(reporter, 'replaceInFile')

    reporter.writeReport(collector, true)

    expect(replaceInFileStub).has.been.calledOnce

  })
  
})
