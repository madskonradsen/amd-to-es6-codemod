var jscodeshift = require('jscodeshift');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var amdTransform = require('../transforms/amd');

describe('AMD transform', function() {
  it('should convert define() { } -> ', function() {
    var src = fs.readFileSync(path.resolve(__dirname, './fixtures/amd.before.js')).toString();
    var expectedSrc = fs.readFileSync(path.resolve(__dirname, './fixtures/amd.after.js')).toString();
    var result = amdTransform({ source: src }, { jscodeshift: jscodeshift });
    assert.equal(result, expectedSrc);
  });
});
