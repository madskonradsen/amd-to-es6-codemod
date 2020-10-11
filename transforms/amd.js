/**
 * Replace define([]) calls with es6 import/exports
 */

function createImportStatement(j, moduleName, variableName, propName, comments) {
  var declaration, variable, idIdentifier, nameIdentifier;

  // if no variable name, return `import 'jquery'`
  if (!variableName) {
    declaration = j.importDeclaration([], j.literal(moduleName));
    declaration.comments = comments
    return declaration;
  }

  // multiple variable names indicates a destructured import
  if (Array.isArray(variableName)) {
    var variableIds = variableName.map(function (v, i) {
      var prop = Array.isArray(propName) && propName[i] ? propName[i] : v
      return j.importSpecifier(j.identifier(v), j.identifier(prop));
    });

    declaration = j.importDeclaration(variableIds, j.literal(moduleName));
  } else {
    // else returns `import $ from 'jquery'`
    nameIdentifier = j.identifier(variableName); //import var name
    variable = j.importDefaultSpecifier(nameIdentifier);

    // if propName, use destructuring `import {pluck} from 'underscore'`
    if (propName && propName !== 'default') {
      idIdentifier = j.identifier(propName);
      variable = j.importSpecifier(idIdentifier, nameIdentifier); // if both are same, one is dropped...
    }

    declaration = j.importDeclaration([variable], j.literal(moduleName));
  }

  declaration.comments = comments

  return declaration;
}

module.exports = function (file, api) {
  var j = api.jscodeshift;
  var root = j(file.source);
  var leadingComment = root.find(j.Program).get('body', 0).node.leadingComments;

  /**
   * Convert an `return` to `export default`.
   * @param body - Function body AST (Array)
   */
  function returnToExport(body) {
    var exportStatement;
    var possibleReturn = body.filter(function (node) {
      return node.type === 'ReturnStatement'
    }).reduce(function (prev, cur) {
      return cur;
    }, null);

    if (possibleReturn && body.indexOf(possibleReturn) != -1) {
      exportStatement = j.exportDeclaration(true, possibleReturn.argument);
      body[body.indexOf(possibleReturn)] = exportStatement;
    }
    return body;
  }

  root
    .find(j.CallExpression, { callee: { name: 'define' } }) // find require() function calls
    .filter(function (p) { return p.parentPath.parentPath.name === 'body'; })
    .forEach(function (p) {

      var body;

      // define(function() { });
      if (p.value.arguments.length === 1) {

        // convert `return` statement to `export default`
        body = returnToExport(p.value.arguments[0].body.body);

        return j(p.parent).replaceWith(body);
      }

      // define(['a', 'b', 'c'], function(a, b, c) { });
      if (p.value.arguments.length === 2) {
        var props = p.value.arguments[0].elements;
        var comments = p.parent.value.comments || [];
        var importStatements = props.map(function (prop, i) {
          var moduleName = prop.value;
          var variableName = p.value.arguments[1].params[i] && p.value.arguments[1].params[i].name;
          return createImportStatement(j, moduleName, variableName);
        });

        // add the body after the import statements
        Array.prototype.push.apply(importStatements, p.value.arguments[1].body.body);

        // add any comments at the top
        importStatements[0].comments = comments;

        // done
        return j(p.parent).replaceWith(returnToExport(importStatements));
      }

    });

  // re-add comment to to the top
  root.get().node.comments = leadingComment;

  return root.toSource({ quote: 'single' });
};
