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

var util = require('util')
var path = require('path')
var istanbul = require('istanbul')
var utils = require('istanbul').utils;

var Report = istanbul.Report
var FileWriter = istanbul.FileWriter

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
  this.coverageType = this.opts.coverageType || this.getDefaultConfig().coverageType
  this.range = this.opts.range || this.getDefaultConfig().range
  this.addToFile = this.opts.addToFile || null
  this.coverageType.toLowerCase()
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
      coverageType: 'lines' // Could be one of: statements, branches, functions, lines
    }
  },

  writeReport: function(collector, sync) {
    var outputFile = path.resolve(this.opts.dir, this.opts.file)
    if (typeof addToFile === 'string') {
      var addToFile = path.resolve(this.opts.dir, this.opts.addTofile)
    }
    var writer = this.opts.writer || new FileWriter(sync)
    var that = this
    var summaries = []
    var finalSummary
    var metrics
    var badgeUrl
    var badgeMd
    var colors = {
      low: 'red',
      medium: 'yellow',
      high: 'brightgreen'
    }
    var level

    writer.on('done', function() {
      that.emit('done')
    })

    collector.files().forEach(function (file) {
      summaries.push(utils.summarizeFileCoverage(collector.fileCoverageFor(file)))
    })
    finalSummary = utils.mergeSummaryObjects.apply(null, summaries)

    metrics = finalSummary[this.coverageType]
    level = metrics.pct >= this.range[1] ? 'high' : metrics.pct >= this.range[0] ? 'medium' : 'low'
    badgeUrl = 'https://img.shields.io/badge/' + this.subject + '-' + metrics.pct + '%25-' + colors[level] +'.svg'
    badgeMd = '[![' + badgeUrl + '](' + badgeUrl + ')](' + badgeUrl + ')'

    writer.writeFile(outputFile, function(contentWriter) {
      contentWriter.write(badgeUrl + '\n' + badgeMd)
    })

    writer.done()
  }
})

module.exports = ShieldBadgeReporter
