var validate = require('..')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , uglify = require('uglify-js')
  , each = require('lodash.foreach')
  , libDir = path.join(__dirname, 'fixtures', 'integration')
  , tests = {}
  , fixtures;

fixtures = fs.readdirSync(libDir);

each(fixtures, function (fixture) {
  if(fixture.charAt(0) == '.')
    return;

  tests['Uglified ' + fixture + ' should not throw'] = function () {
    var raw = fs.readFileSync(path.join(libDir, fixture)).toString()
      , result = uglify.minify(raw, {
          outSourceMap: fixture + '.min.map'
        , fromString: true
        });

    assert.doesNotThrow(function () {
      validate(result.code, result.map, {'?': raw});
    }, 'Valid ' + fixture + ' sourcemap should not throw');
  };

  tests['Uglified ' + fixture + ' should throw when missing sources'] = function () {
    var raw = fs.readFileSync(path.join(libDir, fixture)).toString()
      , result = uglify.minify(raw, {
          outSourceMap: fixture + '.min.map'
        , fromString: true
        });

    assert.throws(function () {
      validate(result.code, result.map);
    }, 'Valid ' + fixture + ' sourcemap should throw');
  };

  tests['Uglified (Inline source)' + fixture + ' should not throw'] = function () {
    var raw = fs.readFileSync(path.join(libDir, fixture)).toString()
      , result = uglify.minify(path.join(libDir, fixture), {
          outSourceMap: fixture + '.min.map'
        , fromString: false
        , sourceMapIncludeSources: true
        });

    assert.doesNotThrow(function () {
      validate(result.code, JSON.parse(result.map));
    }, 'Valid ' + fixture + ' sourcemap should not throw');
  };
});

module.exports = tests;
