# stream-all
Like Promise.all but for streams

# installation
`npm install stream-all`

# example

```javascript
  var streamAll = require('stream-all')
  var through = require('through2')

  var addStream = function (x) {
    return through.obj(function (y, _, cb) {
      this.push(x + y)
      cb()
    })
  })

  var add1 = addStream(1)
  var add2 = addStream(2)
  var add3 = addStream(3)

  var allStream = streamAll([add1, add2, add3])

  allStream.on('data', function (data) {
    console.log(data)
  })
  allStram.on('end', function () {
    console.log('finished')
  })

  add1.write(1)
  add2.write(2)
  add3.write(3)

  // logs: [2, 4, 6]

  // if you close a stream it will always pass null as the value at that
  // streams index in the stramed array

  add1.destroy()

  add2.write(2)
  add3.write(3)

  // logs: [null, 4, 6]

  add2.destroy()
  add3.destroy()

  // logs: "finished"
```

# api
`streamAll ([streams])`

`streamAll` takes an `array` of streams as its only parameter, and returns a
`readable stream` that when read returns an array of the next readable value
of all streams, where the value at index `i` is the next readable value from
stream `i` in the original array passed to `streamAll`.

If some stream in `[streams]` closes before any of the others `streamAll` will
always place a value of `null` at the stream's index in the returned array.

If some stream throws an error then `streamAll` will emit that error and will
not return any further values.

`streamAll` closes once all streams that stream through it closes.

# license
`MIT`
