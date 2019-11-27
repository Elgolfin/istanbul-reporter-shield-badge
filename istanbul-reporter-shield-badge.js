/*
MIT License

Copyright (c) 2017 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

var path = require('path')
var fs = require('fs')
var util = require('util')
var istanbul = require('istanbul')
var utils = require('istanbul').utils
var _includes = require('lodash.includes')
// var find = require("../find-in-files").find
var Report = istanbul.Report
var FileWriter = istanbul.FileWriter
var acceptedTypes = ['lines', 'statements', 'functions', 'branches']
var colors = {
  low: 'red',
  medium: 'yellow',
  high: 'brightgreen'
}

/*
https://img.shields.io/badge/<SUBJECT>-<STATUS>-<COLOR>.svg
Dashes -- 	    → 	- Dash
Underscores __ 	→ 	_ Underscore
_ or Space   	  → 	  Space

colors: brightgreen green yellowgreen yellow orange red lightgrey blue ff69b4 (pink)

*/

function ShieldBadgeReporter (opts) {
  this.opts = opts || {}
  this.opts.dir = this.opts.dir || process.cwd()
  this.opts.file = this.opts.file || this.getDefaultConfig().file
  this.opts.writer = this.opts.writer || null
  this.subject = this.opts.subject || this.getDefaultConfig().subject
  if (typeof this.opts.coverageType === 'string' && _includes(acceptedTypes, this.opts.coverageType.toLowerCase())) {
    this.coverageType = this.opts.coverageType.toLowerCase()
  } else {
    this.coverageType = this.getDefaultConfig().coverageType
  }
  if (typeof this.opts.readmeFilename === 'string' && /readme\.md/i.test(this.opts.readmeFilename)) {
    this.readmeFilename = this.opts.readmeFilename
  } else {
    this.readmeFilename = null
  }
  this.readmeDir = this.opts.readmeDir || this.getDefaultConfig().readmeDir
  this.range = this.opts.range || this.getDefaultConfig().range
}

ShieldBadgeReporter.TYPE = 'shield-badge'
util.inherits(ShieldBadgeReporter, Report)

Report.mix(ShieldBadgeReporter, {
  synopsis: function() {
    return 'generates the url to get a shield.io badge representing the lines coverage percentage.'
  },

  getDefaultConfig: function() {
    return {
      file: 'coverage.shield.badge.md',
      subject: 'coverage',
      range: [50, 80],
      readmeFilename: null,
      readmeDir: null,
      coverageType: 'lines' // Could be one of: statements, branches, functions, lines
    }
  },

  generateBadgeUrl: function (metrics) {
    var level = metrics.pct >= this.range[1] ? 'high' : metrics.pct >= this.range[0] ? 'medium' : 'low'
    return 'https://img.shields.io/badge/' + encodeURIComponent(this.subject) + '-' + metrics.pct + '%25-' + colors[level] +'.svg'
  },

  generateBadgeMarkdown: function (badgeUrl) {
    return '![' + this.subject + '-shield-badge-1](' + badgeUrl + ')'
  },

  /*
  Useless at this moment, prototype to modify several files at once
  */
  /*
  replaceInFile_Prototype: function (cb) {
    // 1. find
    // 2. if found = replace
    // 3. if not found = append at the top
    // regex: '!\[[ a-z0-9]+-shield-badge-[0-9]+\]\[[^\]]\]',
    var foundFiles = 0
    var error = ''
    var readmeFilename = this.readmeFilename
    if (readmeFilename !== null) {
      find('test123', '.', '\\.md$')
      .then(function (results) {
        if (results.hasOwnProperty(readmeFilename)) {
          foundFiles++
        }
      })
      .fail(function (err) {
        error = err
        foundFiles = -1
      })
      .fin(function () {
        cb({error: error, foundFiles: foundFiles})
      })
      .done()
    } else {
      cb({error: 'The readmeFilename config property was not set', foundFiles: -1})
    }
  },
  */

  replaceInFile: function (badgeMarkdown, cb) {
    var result = {
      error: '',
      success: false,
      create: false,
      update: false
    }
    var readmeFilename = this.readmeFilename
    if (readmeFilename === null) {
      result.error = 'The readmeFilename config property was not set (or not set properly)'
      cb(result)
      return
    }

    var readmeFile = path.resolve(__dirname, this.readmeFilename)
    if (this.readmeDir !== null) {
      var readmeFile = path.resolve(__dirname, this.readmeDir, this.readmeFilename)
    }
    fs.readFile(readmeFile, 'utf8', function (err, data) {
      if (err) {
        result.error = err
        cb(result)
      } else {
        var re = /!\[[^\]]+-shield-badge-[0-9]\]\(https:\/\/.+\.svg\)/gi  // Not greedy but restrictive
        var resultData = data.replace(re, badgeMarkdown);

        // The badge markdown was not present, append the badge markdown at the beginning of the file
        if (!re.test(data)) {
          result.create = true
          result.update = false
          resultData = badgeMarkdown + '\n\n' + resultData
        } else {
          result.update = true
          result.create = false
        }
        result.data = resultData

        fs.writeFile(readmeFile, resultData, 'utf8', function (err) {
          if (err) {
            result.error = err
            cb(result)
          } else {
            result.success = true
            cb(result)
          }
        })
      }
    })
  },

  writeReport: function (collector, sync) {
    var outputFile = path.resolve(this.opts.dir, this.opts.file)
    /* istanbul ignore next */
    var writer = this.opts.writer || new FileWriter(sync)
    var that = this
    var summaries = []
    var finalSummary
    var metrics
    var badgeUrl
    var badgeMarkdown

    writer.on('done', 
    /* istanbul ignore next */
    function () {
      that.emit('done')
    })

    collector.files().forEach(
    /* istanbul ignore next */
    function (file) {
      summaries.push(utils.summarizeFileCoverage(collector.fileCoverageFor(file)))
    })
    finalSummary = utils.mergeSummaryObjects.apply(null, summaries)

    metrics = finalSummary[this.coverageType]
    badgeUrl = this.generateBadgeUrl(metrics)
    badgeMarkdown = this.generateBadgeMarkdown(badgeUrl)

    writer.writeFile(outputFile, function(contentWriter) {
      contentWriter.write(badgeUrl + '\n' + badgeMarkdown)
      that.replaceInFile(badgeMarkdown, 
      /* istanbul ignore next */
      function (result) {
        if (result.success) {
          var txt = result.create ? 'added' : 'updated'
          console.log('The shield badge has been ' + txt + ' in your ' + that.readmeFilename + ' file')
        } else {
          console.log('Error while adding/updating the shield badge in your ' + that.readmeFilename + ' file: ' + result.error)
        }
        that.emit('complete');
      })
    })

    writer.done()
  }
})

module.exports = ShieldBadgeReporter
