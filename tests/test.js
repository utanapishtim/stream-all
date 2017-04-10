var streamAll = require('./')
var through = require('through2')
var assert = require('assert')

var plus = (x) => through.obj(function (num, _, cb) {
  this.push(num + x)
  cb()
})

function aequals (a1, a2) {
  return a1.reduce(function (x, next, i) {
    return x && (next === a2[i])
  }, true)
}

var p1 = plus(1)
var p2 = plus(2)
var p3 = plus(3)

var streams = [p1, p2, p3]

var sa = streamAll(streams)

sa.pipe(through.obj(function (array, _, cb) {
  console.log(array)
  cb()
}))

var results = []
sa.on('end', function () {
  console.log('no more')
  results.forEach(function (result, i) {
    if (i === 0) {
      assert(aequals([2, 4, 6], result))
    } else if (i === 1) {
      assert(aequals([2, 3, 4], result))
    } else if (i === 2) {
      assert(aequals([3, 4, 5], result))
    } else if (i === 3) {
      assert(aequals([4, 5, 6], result))
    } else if (i === 4) {
      assert(aequals([null, 6, 7], result))
    } else if (i === 5) {
      assert(aequals([null, 7, null], result))
    } else if (i === 6) {
      assert(aequals([null, 8, null], result))
    }
  })
  console.log('all pass')
})
sa.on('data', function (data) {
  results.push(data)
})

setTimeout(function () {
  p1.write(1)
  p2.write(2)
  p3.write(3)
  console.log('p1, p2, p3 wrote once')
}, 1000)

setTimeout(function () {
  p1.write(1)
  p1.write(2)
  p1.write(3)
  console.log('p1 wrote three times')
}, 2000)

setTimeout(function () {
  p2.write(1)
  p2.write(2)
  p2.write(3)
  console.log('p2 wrote three times')
}, 3000)

setTimeout(function () {
  p3.write(1)
  p3.write(2)
  p3.write(3)
  console.log('p3 wrote three times')
}, 4000)

setTimeout(function () {
  p1.destroy()
  p2.write(4)
  p3.write(4)
  console.log('p1 closed, p2, p3 wrote once')
}, 5000)

setTimeout(function () {
  p3.destroy()
  p2.write(5)
  p2.write(6)
  console.log('p3 closed, p2 wrote twice')
}, 6000)

setTimeout(function () {
  p2.destroy()
  console.log('p2 closed')
}, 7000)
