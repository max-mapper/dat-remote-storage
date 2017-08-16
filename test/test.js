var fs = require('fs')
var path = require('path')
var Dat = require('dat-node')
var Remote = require('../')
var ndjson = require('ndjson')
var rimraf = require('rimraf')
var mirror = require('mirror-folder')
var homedir = require('os-homedir')()
var test = require('tape')

var testDat
var srcPath = __dirname + '/source'
var destPath = __dirname + '/dest'
var extPath = __dirname + '/external'

test('create + import metadata', function (t) {
  rimraf.sync(srcPath)
  Dat(srcPath, function (err, dat) {
    t.ifErr(err, 'should not error')
    var progress = mirror(extPath, './fake', { dryRun: true }, function (err) {
      t.ifErr(err, 'should not error')
      dat.importFiles(function (err) {
        t.ifErr(err, 'should not error')
        testDat = dat
        t.end()
      })
    })

    progress.on('put', function (src, dest) {
      if (!src.stat.isFile()) return
      var filename = path.relative(extPath, src.name)
      var meta = {type: 'file', name: filename}
      fs.writeFileSync(srcPath + '/' + filename, Buffer.concat([new Buffer('🔰'), new Buffer(JSON.stringify(meta))]))
    })
  })
})

test('replicate', function (t) {
  rimraf.sync(destPath)
  Dat(destPath, {key: testDat.archive.metadata.key}, function (err, dat) {
    t.ifErr(err, 'should not error')
    var remote = Remote(testDat, {root: extPath})
    var src = testDat.archive.replicate({live: true})
    var dest = dat.archive.replicate({live: true})
    src.pipe(dest).pipe(src)
    var archive = dat.archive
    dest.on('end', function () {
      t.end()
    })
    archive.on('content', function () {
      t.pass('gets content')
      archive.content.on('sync', function () {
        console.log('sync')
      })
    })
  })
})
