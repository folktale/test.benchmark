test.benchmark
==============

[![Build status](https://img.shields.io/travis/folktale/test.benchmark/master.svg?style=flat)](https://travis-ci.org/folktale/test.benchmark)
[![NPM version](https://img.shields.io/npm/v/test.benchmark.svg?style=flat)](https://npmjs.org/package/test.benchmark)
[![Dependencies status](https://img.shields.io/david/folktale/test.benchmark.svg?style=flat)](https://david-dm.org/folktale/test.benchmark)
![Licence](https://img.shields.io/npm/l/test.benchmark.svg?style=flat&label=licence)
![Experimental](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat)


A wrapper over Benchmark.js to make writing benchmarks easier


## Example

```js
var Benchmark = require('test.benchmark');
var Future = require('data.future');

// Synchronous
var suite = Benchmark.syncSuite('Testing characters', {
  'RegExp#test': function() {
    /o/.test('Hello World!')
  },
  'String#indexOf': function() {
    'Hello World'.indexOf('o') !== -1
  }
});

// Asynchronous
var asyncSuite = Benchmark.asyncSuite('Scheduling', {
  'nextTick': new Future(function(reject, resolve) {
    process.nextTick(resolve)
  }),
  'setImmediate': new Future(function(reject, resolve) {
    setImmediate(resolve)
  })
});

Benchmark.runWithDefaults([asyncSuite, suite]);

// Benchmarks for: Scheduling...
//
// o nextTick x 770 ops/sec ±0.70% (66 runs sampled)
// o setImmediate x 758 ops/sec ±1.18% (86 runs sampled)
// 
// Fastest: nextTick
// Slowest: setImmediate
// 
// ---
// 
// Benchmarks for: Testing characters...
// 
// o RegExp#test x 3,162,850 ops/sec ±3.20% (91 runs sampled)
// o String#indexOf x 5,175,777 ops/sec ±1.69% (86 runs sampled)
// 
// Fastest: String#indexOf
// Slowest: RegExp#test
// 
// ---
// All benchmarks finished.
```


## Installing

The easiest way is to grab it from NPM. If you're running in a Browser
environment, you can use [Browserify][]

    $ npm install test.benchmark


### Using with CommonJS

If you're not using NPM, [Download the latest release][release], and require
the `test.benchmark.umd.js` file:

```js
var Benchmark = require('test.benchmark')
```


### Using with AMD

[Download the latest release][release], and require the `test.benchmark.umd.js`
file:

```js
require(['test.benchmark'], function(Benchmark) {
  ( ... )
})
```


### Using without modules

[Download the latest release][release], and load the `test.benchmark.umd.js`
file. The properties are exposed in the global `Folktale.Test.Benchmark` object:

```html
<script src="/path/to/test.benchmark.umd.js"></script>
```


### Compiling from source

If you want to compile this library from the source, you'll need [Git][],
[Make][], [Node.js][], and run the following commands:

    $ git clone git://github.com/folktale/test.benchmark.git
    $ cd test.benchmark
    $ npm install
    $ make bundle
    
This will generate the `dist/test.benchmark.umd.js` file, which you can load in
any JavaScript environment.

    
## Documentation

You can [read the documentation online][docs] or build it yourself:

    $ git clone git://github.com/folktale/test.benchmark.git
    $ cd test.benchmark
    $ npm install
    $ make documentation

Then open the file `docs/index.html` in your browser.


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :)


## Licence

Copyright (c) 2014 Quildreen Motta.

Released under the [MIT licence](https://github.com/folktale/test.benchmark/blob/master/LICENCE).

<!-- links -->
[Fantasy Land]: https://github.com/fantasyland/fantasy-land
[Browserify]: http://browserify.org/
[Git]: http://git-scm.com/
[Make]: http://www.gnu.org/software/make/
[Node.js]: http://nodejs.org/
[es5-shim]: https://github.com/kriskowal/es5-shim
[docs]: http://folktale.github.io/test.benchmark
<!-- [release: https://github.com/folktale/test.benchmark/releases/download/v$VERSION/test.benchmark-$VERSION.tar.gz] -->
[release]: https://github.com/folktale/test.benchmark/releases/download/v0.2.1/test.benchmark-0.2.1.tar.gz
<!-- [/release] -->
