var validate
  , validateMapping
  , toAscii
  , assert = require('assert')
  , SMConsumer = require('source-map').SourceMapConsumer
  , each = require('lodash.foreach')
  , template = require('lodash.template')
  , jsesc = require('jsesc');

// Lifted from UglifyJS
toAscii = function (str, identifier) {
    return str.replace(/[\u0080-\uffff]/g, function(ch) {
        var code = ch.charCodeAt(0).toString(16);
        if (code.length <= 2 && !identifier) {
            while (code.length < 2) code = "0" + code;
            return "\\x" + code;
        } else {
            while (code.length < 4) code = "0" + code;
            return "\\u" + code;
        }
    }).replace(/\x0B/g, "\\x0B");
};

// Performs simple validation of a mapping
validateMapping = function (mapping) {
  assert.ok(mapping.generatedColumn!=null, 'missing generated column');
  assert.ok(mapping.generatedLine!=null, 'missing generated line');
  assert.ok(mapping.generatedColumn >= 0, 'generated column must be greater or equal to zero');
  assert.ok(mapping.generatedLine >= 0, 'generated line must be greater or equal to zero');

  assert.ok(mapping.originalColumn!=null, 'missing original column');
  assert.ok(mapping.originalLine!=null, 'missing original line');
  assert.ok(mapping.originalColumn >= 0, 'original column must be greater or equal to zero');
  assert.ok(mapping.originalLine >= 0, 'original line must be greater or equal to zero');

  assert.notEqual(mapping.source, null, 'source is missing');
};

// Validates an entire sourcemap
validate = function (srcs, min, map, opts) {
  var consumer
    , mappingCount = 0
    , splitSrcs = {};

  try {
    consumer = new SMConsumer(map)
  }
  catch (e) {
    throw new Error('The map is not valid JSON');
  }

  each(consumer.sources, function (src) {
    var content = consumer.sourceContentFor(src);
    if(content)
      srcs[src] = content;
  })

  opts = opts || {};

  each(srcs, function (src, file) {
    return splitSrcs[file] = src.split('\n'); // Split sources by line
  });

  consumer.eachMapping(function (mapping) {
    mappingCount++;

    validateMapping(mapping);

    // These validations can't be performed with just the mapping
    var originalLine
      , errMsg
      , mapRef = template('<%=generatedLine%>:<%=generatedColumn%>'
          + String.fromCharCode(parseInt(2192,16)) // Fancy arrow!
          + '<%=originalLine%>:<%=originalColumn%> "<%=name%>" in <%=source%>')(mapping)
      , expected
      , actuals = []
      , success = false;

    if(mapping.name) {
      if(!splitSrcs[mapping.source])
        throw new Error(mapping.source + ' not found in ' + Object.keys(splitSrcs).join(', '));

      originalLine = splitSrcs[mapping.source][mapping.originalLine - 1];

      expected = [
        mapping.name
      , '\'' + jsesc(mapping.name) + '\''
      , '\'' + toAscii(mapping.name) + '\''
      , '"' + jsesc(mapping.name, {quotes: 'double'}) + '"'
      , '"' + toAscii(mapping.name) + '"'
      ];

      // An exact match
      for(var i=0, ii=expected.length; i<ii; i++) {
        // It's possible to go out of bounds on some stupid cases
        try {
          var actual = originalLine.split('').splice(mapping.originalColumn, expected[i].length).join('');
        }
        catch (e) {
          return;
        }

        actuals.push(actual);

        if(expected[i] === actual) {
          success = true;
          break;
        }
      };

      if(!success) {
        errMsg = template(''
          + 'Warning: mismatched names\n'
          + 'Expected: <%=expected%>\n'
          + 'Got: <%=actual%>\n'
          + 'Original Line: <%=original%>\n'
          + 'Mapping: <%=mapRef%>'
          , {
            expected: expected.join(' || ')
          , actual: actuals.join(' || ')
          , original: originalLine
          , mapRef: mapRef
          });

          throw new Error(errMsg);
      }
    }
  });

  assert.ok(JSON.parse(map).sources && JSON.parse(map).sources.length, 'There were no sources in the file');
  assert.ok(mappingCount > 0, 'There were no mappings in the file');
};

module.exports = validate;
