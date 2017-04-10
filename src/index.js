var Readable = require('readable-stream')
var inherits = require('inherits')

inherits(StreamAll, Readable)

function StreamAll (streams, opts) {
  if (!(this instanceof StreamAll)) return new StreamAll(streams, opts)
  Readable.call(this, { objectMode: true })

  var readMask = 0
  var offset = 0
  var handlers = []
  var length = streams.length
  var mask = Math.pow(2, length) - 1
  var buffers = streams.map(function () { return [] })

  var self = this

  // attach handlers
  streams.forEach(function (stream, i) {
    function handleCleanup () {
      offset = offset ^ (1 << i)
      if ((offset & mask) === mask) {
        return process.nextTick(function () {
          self.emit('end')
          self.emit('close')
          handlers = null
          buffers = null
          self = null
        })
      }
      // if nothing in buffer, deallocate buffer
      if (buffers[i].length === 0) {
        buffers[i] = null
      } else {
        // push a handler to deallocate buffer
        handlers.push(function () {
          if (buffers[i].length === 0) {
            buffers[i] = null
            return true
          }
          return false
        })
      }
      if (readMask > 0 && (((readMask ^ offset) & mask) === mask)) read()
    }

    stream.on('close', handleCleanup)
    stream.on('end', handleCleanup)
    stream.on('data', function (data) {
      // indicate stream has something to read
      // won't have any effect if stream already
      // has data that needs reading
      readMask = readMask | (1 << i)
      buffers[i].unshift(data)
      process.nextTick(cleanup)
      if (readMask > 0 && (((readMask ^ offset) & mask) === mask)) read()
    })

    stream.on('error', function (err) {
      offset = mask
      process.nextTick(function () { self.emit('error', err) })
    })
  })

  function cleanup () {
    handlers.forEach(function () {
      var handler = handlers.pop()
      if (!handler()) handlers.unshift(handler)
    })
  }

  function read () {
    var next = buffers.map(function (buffer, i) {
      if (buffer === null) return null
      // if we are popping the last element in buffer
      // augment readMask to indicate that buffer has
      // nothing to read
      if (buffer.length === 1) readMask = readMask ^ (1 << i)
      return buffer.pop()
    })
    self.push(next)
  }

  this._read = function () {
    if (readMask > 0 && (((readMask ^ offset) & mask) === mask)) {
      read()
    }
  }
}

module.exports = StreamAll
