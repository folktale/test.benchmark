// Copyright (c) 2014 Quildreen Motta
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * A wrapper over Benchmark.js to make writing benchmarks easier
 *
 * @module lib/index
 */

var Benchmark = require('benchmark');
var Future = require('data.future');
var extend = require('xtend');

function repeat(n, c) {
  return Array(n + 1).join(c)
}

function Progress(options) {
  this._size = options.size;
  this._width = options.width || options.size;
  this._format = options.format || '[:bar] :current/:total';
  this._prefix = options.prefix || '';
  this._completed = 0;
  this._cycle = 0;
  this._cycle_chars = '|/-\\';
  this._stream = options.stream || process.stderr;
}
Progress::tick = function() {
  this._cycle = (this._cycle + 1) % this._cycle_chars.length;
}
Progress::setCompletion = function(amount) {
  this._completed = Math.min(this._size, amount);
}
Progress::setPrefix = function(newPrefix) {
  this._prefix = newPrefix;
}
Progress::render = function() {
  var ratio = this._completed / this._size;
  var size = Math.floor(ratio * this._width);
  var fill = this._width - size - 1;
  var cycle = this._completed < this._size? this._cycle_chars[this._cycle] : '';

  var image = this._format.replace(/:current/g, this._completed)
                          .replace(/:total/g, this._size)
                          .replace(/:bar/g,  repeat(size, '=') + cycle + repeat(fill, ' '));

  this._stream.write('\r');
  this.clear();
  this._stream.write(this._prefix + image);
}
Progress::clear = function() {
  this._stream.clearLine();
  this._stream.cursorTo(0);
}



function pairs(x) {
  return Object.keys(x).map(λ(k) -> ({ key: k, value: x[k] }))
}

function asyncSuite(name, tests) {
  var Suite = new Benchmark.Suite(name);
  pairs(tests).forEach(function(pair) {
    Suite.add(pair.key, {
      defer: true,
      initCount: 50,
      minSamples: 50,
      onCycle: function() {
        Suite.emit('tick')
      },
      fn: function(deferred) {
        pair.value.fork(
          function(error) {
            console.error('Error running benchmark:', pair.key);
            if (error) console.error(error.stack);
            deferred.benchmark.abort()
            Suite.abort();
          },
          function() {
            deferred.resolve()
          }
        )
      }
    });
  });
  return Suite;
}

function syncSuite(name, tests) {
  var Suite = new Benchmark.Suite(name);
  pairs(tests).forEach(function(pair) {
    Suite.add(pair.key, {
      initCount: 50,
      minSamples: 50,
      onCycle: function() {
        Suite.emit('tick')
      },
      fn: pair.value
    });
  });
  return Suite;
}

function fastest(suite) {
  return suite.filter('fastest').pluck('name')
}

function slowest(suite) {
  return suite.filter('slowest').pluck('name')
}

function runSuite(suite, options) {
  return new Future(function(reject, resolve) {
    var resolved = false;
    var results = [];
    var status = new Progress({
      size: suite.length,
      prefix: ''
    });

    suite.on('cycle', function(event) {
      var test = event.target;
            
      if (test.error)  transitionTo(reject, test);
      else             results.push(test);
    });

    suite.on('tick', function() {
      var current = results.length;
      var test = suite[current]

      status.setPrefix(test.name + ': ');
      status.setCompletion(current);
      status.tick();
      status.render();
    });

    suite.on('abort', function() {
      status.clear();
      transitionTo(reject, new Error('Benchmark aborted.'));
    });

    suite.on('start', function() {
      suite.emit('tick');
    });

    suite.on('complete', function() {
      status.clear();
      transitionTo(resolve, {
        fastest: fastest(this).join(', '),
        slowest: slowest(this).join(', '),
        results: results
      })
    });

    suite.run(extend({ async: true, defer: true }, options || {}))


    function transitionTo(state, value) {
      if (!resolved) {
        resolved = true;
        state(value)
      }
    }
  })
}

function log(data) {
  return new Future(function(_, resolve) {
    console.log(data);
    resolve();
  })
}

function renderResults(x) {
  return x.results.map(λ['o ' + #]).join('\n')
       + '\n\n'
       + 'Fastest: ' + x.fastest + '\n'
       + 'Slowest: ' + x.slowest
}

function runFuture(x) {
  x.fork(function(error) {
    throw error.error
  }, function() {
    /* ignore */
  })
}

function run(suites) {
  if (suites.length > 0) {
    var suite = suites[0];
    var rest = suites.slice(1);
    return $do {
      log('\nBenchmarks for: ' + suite.name + '...\n');
      results <- runSuite(suite);
      log(renderResults(results));
      log('\n---');
      run(rest)
    }.orElse(function(error) {
      return $do {
        log(error);
        log('\n---');
        run(rest)
      }
    })
  } else {
    console.log('All benchmarks finished.');
    return Future.of();
  }
}

function runWithDefaults(suites) {
  return runFuture(run(suites))
}
module.exports = {
  syncSuite: syncSuite,
  asyncSuite: asyncSuite,
  runWithDefaults: runWithDefaults
}
