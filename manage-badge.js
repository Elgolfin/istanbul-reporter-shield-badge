/* **************
The only prupose of this script is used by the npm test script to simulate the writing of the badge within the README.md file
************** */ 

var fs = require('fs')
var path = require('path')
var istanbul = require('istanbul')
var collector = new istanbul.Collector()
var reporter = new istanbul.Reporter()
var Report = istanbul.Report
var sync = true
var shieldBadgeReporter = require('./istanbul-reporter-shield-badge')
var instrumenter = new istanbul.Instrumenter({
  noCompact: true
});

istanbul.Report.register(shieldBadgeReporter)
var report = Report.create('shield-badge', {
  readmeFilename: 'README.md',
  readmeDir: path.resolve(__dirname, '.'),
  subject: 'Local Coverage'
})

var files = ['istanbul-reporter-shield-badge.js', 'test/istanbul-reporter-shield-badge.spec.js']

try {
  files.forEach(function (file) {
    var instrumented = instrumenter.instrumentSync(fs.readFileSync(file, 'utf-8'), file)
    // console.log(instrumented)
    // collector.add(instrumented) // Generates an error for some reason, no more time to investigate this
  })
  report.on('done', function () { 
    // console.log('The badge has been added to the README.md file')
  })
  report.writeReport(collector);
} catch (err) {
  console.log(err.message)
}
