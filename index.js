var fs = require('fs')
var pump = require('pump')

module.exports = function (dat, opts) {
  var magic = '🔰'
  var prefix = new Buffer(magic)
  dat.archive.content.on('upload', function (index, data) {
    if (data.slice(0, 4).toString() !== magic) return
    var meta = JSON.parse(data.slice(4))
    if (meta.type === 'file') {
      var read = fs.createReadStream(opts.root + '/' + meta.name)
      var write = fs.createWriteStream(dat.path + '/' + meta.name)
      pump(read, write, function (err) {
        if (err) throw err
        var read = fs.createReadStream(dat.path + '/' + meta.name)
        var write = dat.archive.createWriteStream('/' + meta.name)
        pump(read, write, function (err) {
          if (err) throw err
          console.log('wrote', meta.name)
        })
      })
    }
  })
}