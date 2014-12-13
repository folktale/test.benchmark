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

function pairs(x) {
  return Object.keys(x).map(λ(k) -> ({ key: k, value: x[k] }))
}

function asyncSuite(name, tests) {
  var Suite = new Benchmark.Suite(name);
  pairs(tests).forEach(function(pair) {
    Suite.add(pair.key, { defer: true, fn: function(deferred) {
      pair.value().fork(
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
    }});
  });
  return Suite;
}

function syncSuite(name, tests) {
  var Suite = new Benchmark.Suite(name);
  pairs(tests).forEach(function(pair) {
    Suite.add(pair.key, pair.value);
  });
  return Suite;
}

function fastest(suite) {
  return suite.filter('fastest').pluck('name')
}

function slowest(suite) {
  return suite.filter('slowest').pluck('name')
}

function runSuite(suite) {
  return new Future(function(reject, resolve) {
    var results  = [];
    var resolved = false;

    suite.on('cycle', function(event) {
      var test = event.target;
      if (test.error)  transitionTo(reject, test);
      else             results.push(test)
    });

    suite.on('abort', function(event) {
      transitionTo(reject, new Error('Benchmark aborted.'));
    });

    suite.on('complete', function() {
      transitionTo(resolve, {
        fastest: fastest(this).join(', '),
        slowest: slowest(this).join(', '),
        results: results
      })
    });

    suite.run({ async: true, defer: true })


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
