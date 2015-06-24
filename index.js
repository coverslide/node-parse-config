// node-parse-config (c) 2015 Richard Hoffman
// The majority of this file has been copied from the following repository:
// https://github.com/lorenwest/node-config
// The original copyright messages have been reproduced below:

// config.js (c) 2010-2015 Loren West and other contributors
// May be freely distributed under the MIT license.
// For further details and documentation:
// http://lorenwest.github.com/node-config

'use strict';

// Dependencies
var Yaml = null,    // External libraries are lazy-loaded
    VisionmediaYaml = null,  // only if these file types exist.
    Coffee = null,
    Iced = null,
    CSON = null,
    PPARSER = null,
    JSON5 = null,
    TOML = null,
    HJSON = null,
    util = {};

/**
 * Parse and return the specied string with the specified format.
 *
 * The format determines the parser to use.
 *
 * json = File is parsed using JSON.parse()
 * yaml (or yml) = Parsed with a YAML parser
 * toml = Parsed with a TOML parser
 * cson = Parsed with a CSON parser
 * hjson = Parsed with a HJSON parser
 * json5 = Parsed with a JSON5 parser
 * properties = Parsed with the 'properties' node package
 *
 * If the file doesn't exist, a null will be returned.  If the file can't be
 * parsed, an exception will be thrown.
 *
 * This method performs synchronous file operations, and should not be called
 * after synchronous module loading.
 *
 * @protected
 * @method parseString
 * @param content {string} The full content
 * @param format {string} The format to be parsed
 * @return {configObject} The configuration object parsed from the string
 */
util.parseString = function (content, format) {
  // Initialize
  var configObject = null;

  // Parse the file based on extension
  if (format === 'yaml' || format === 'yml') {
    if (!Yaml && !VisionmediaYaml) {
      // Lazy loading
      try {
        // Try to load the better js-yaml module
        Yaml = require('js-yaml');
      }
      catch (e) {
        try {
          // If it doesn't exist, load the fallback visionmedia yaml module.
          VisionmediaYaml = require('yaml');
        }
        catch (e) { }
      }
    }

    if (Yaml) {
      configObject = Yaml.load(content);
    }
    else if (VisionmediaYaml) {
      // The yaml library doesn't like strings that have newlines but don't
      // end in a newline: https://github.com/visionmedia/js-yaml/issues/issue/13
      content += '\n';
      configObject = VisionmediaYaml.eval(util.stripYamlComments(content));
    }
    else {
      console.error("No YAML parser loaded.  Suggest adding js-yaml dependency to your package.json file.")
    }
  }
  else if (format == 'json') {
    // Allow comments in JSON files
    configObject = JSON.parse(util.stripComments(content));
  }
  else if (format == 'json5') {

    if (!JSON5) {
      JSON5 = require('json5');
    }

    configObject = JSON5.parse(content);

  } else if (format == 'hjson') {

    if (!HJSON) {
      HJSON = require('hjson');
    }

    configObject = HJSON.parse(content);

  } else if (format == 'toml') {

    if(!TOML) {
      TOML = require('toml');
    }

    configObject = TOML.parse(content);
  }
  else if (format == 'cson') {
    if (!CSON) {
      CSON = require('cson');
    }
    // Allow comments in CSON files
    if (typeof CSON.parseSync === 'function') {
      configObject = CSON.parseSync(util.stripComments(content));
    } else {
      configObject = CSON.parse(util.stripComments(content));
    }
  }
  else if (format == 'properties') {
    if (!PPARSER) {
      PPARSER = require('properties');
    }
    configObject = PPARSER.parse(content, { namespaces: true, variables: true, sections: true });
  }

  return configObject;
};

/**
 * Strip YAML comments from the string
 *
 * The 2.0 yaml parser doesn't allow comment-only or blank lines.  Strip them.
 *
 * @protected
 * @method stripYamlComments
 * @param fileString {string} The string to strip comments from
 * @return {string} The string with comments stripped.
 */
util.stripYamlComments = function(fileStr) {
  // First replace removes comment-only lines
  // Second replace removes blank lines
  return fileStr.replace(/^\s*#.*/mg,'').replace(/^\s*[\n|\r]+/mg,'');
}

/**
 * Strip all Javascript type comments from the string.
 *
 * The string is usually a file loaded from the O/S, containing
 * newlines and javascript type comments.
 *
 * Thanks to James Padolsey, and all who conributed to this implementation.
 * http://james.padolsey.com/javascript/javascript-comment-removal-revisted/
 *
 * @protected
 * @method stripComments
 * @param fileString {string} The string to strip comments from
 * @return {string} The string with comments stripped.
 */
util.stripComments = function(fileStr) {

  var uid = '_' + +new Date(),
      primitives = [],
      primIndex = 0;

  return (
    fileStr

    /* Remove strings */
    .replace(/(['"])(\\\1|.)+?\1/g, function(match){
      primitives[primIndex] = match;
      return (uid + '') + primIndex++;
    })

    /* Remove Regexes */
    .replace(/([^\/])(\/(?!\*|\/)(\\\/|.)+?\/[gim]{0,3})/g, function(match, $1, $2){
      primitives[primIndex] = $2;
      return $1 + (uid + '') + primIndex++;
    })

    /*
    - Remove single-line comments that contain would-be multi-line delimiters
        E.g. // Comment /* <--
    - Remove multi-line comments that contain would be single-line delimiters
        E.g. /* // <--
   */
    .replace(/\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//g, '')

    /*
    Remove single and multi-line comments,
    no consideration of inner-contents
   */
    .replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')

    /*
    Remove multi-line comments that have a replaced ending (string/regex)
    Greedy, so no inner strings/regexes will stop it.
   */
    .replace(RegExp('\\/\\*[\\s\\S]+' + uid + '\\d+', 'g'), '')

    /* Bring back strings & regexes */
    .replace(RegExp(uid + '(\\d+)', 'g'), function(match, n){
      return primitives[n];
    })
  );

};

module.eports = util.parseString;
