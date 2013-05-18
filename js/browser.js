(function(e){if("function"==typeof bootstrap)bootstrap("vivaapi",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeVivaApi=e}else"undefined"!=typeof window?window.VivaApi=e():global.VivaApi=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){

var querystring = require('querystring');
// var request = require('browser-request');
// var request = function() {};

// Constant Values

var PORTALS = [
  'VR_BR', 'VR_MX', 'VR_CO', 'VR_NET', 'VR_US'
];

var PROPERTY_TYPES = {

};

var BUSINESS_TYPES = {
  'SALE': 'VENTA',
  'RENT': 'RENTA'
};

var ORDER_TYPES = {
  "PRICE_ASCENDING": "precio_venta_base",
  "PRICE_DESCENDING": "precio_venta_base desc",
  "BATHROOMS": "banos",
  "BEDROOMS": "habitaciones"
};

var CURRENCY_DEFAULTS = {
  'VR_BR': 'BRL',
  'VR_CO': 'COP',
  'VR_MX': 'MXN',
  'VR_US': 'USD',
  'VR_NET': 'USD'
};

var LEVEL_CONVERSIONS = {
  "COUNTRY": 1,
  "STATE": 2,
  "CITY": 4,
  "ZONE": 5,
  "NEIGHBORHOOD": 6,
  "LISTINGS": null
};

// Utilities brought in from underscore

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function each(obj, iterator, context) {
  if (!obj) return;
  if (obj.length === +obj.length) {
    for (var i = 0, l = obj.length; i < l; i++) {
      if (iterator.call(context, obj[i], i, obj) === {}) return;
    }
  } else {
    for (var key in obj) {
      if (has(obj, key)) {
        if (iterator.call(context, obj[key], key, obj) === {}) return;
      }
    }
  }
}

function extend(obj) {
  each(Array.prototype.slice.call(arguments, 1), function(source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
}

function getQueryString(parameters) {
  // the querystring module in the browser is failing to add non-string parameters :(
  // so let's convert them all first.
  var stringParams = {};

  each(parameters, function(val, key) {
    stringParams[key] = val.toString();
  });

  return querystring.stringify(stringParams);
}

function fetchJSON(targetUrl, callback) {
  if ($ && $.ajax) {
    $.get(targetUrl, function(data) {
      if (typeof data === "string") {
        callback(null, JSON.parse(data));
      } else {
        callback(null, data);
      }
    })
    .fail(callback);
  }
}

function getQueryParametersFromCore(core) {
  return {
    apiKey: core.apiKey,
    portal: core.portal
  };
}

function processRangeFilter(parameters, startKey, stopKey) {
  var out = {};
  if (parameters && parameters.length && parameters.length === 2) {
    if (parameters[0]) {
      out[startKey] = parameters[0];
    }
    if (parameters[1]) {
      out[stopKey] = parameters[1] || null;
    }
  }
  return out;
}

// Convert the filter object into the parameters needed by the API
function processFilters(filters) {
  var out = {};

  // Add the parsed range filters
  extend(out, processRangeFilter(filters.area,      'areaFrom', 'areaUpTo'));
  extend(out, processRangeFilter(filters.bedrooms,  'roomsFrom', 'roomsUpTo'));
  extend(out, processRangeFilter(filters.bathrooms, 'bathroomsFrom', 'bathroomsUpTo'));
  extend(out, processRangeFilter(filters.price,     'initialBasePrice', 'finalBasePrice'));
  extend(out, processRangeFilter(filters.parking,   'garagesFrom', 'garagesUpTo'));

  // Add the parameters that need to be parsed from strings
  if (ORDER_TYPES[filters.order]) {
    out.order = ORDER_TYPES[filters.order];
  }

  if (PROPERTY_TYPES[filters.type]) {
    out.listingType = PROPERTY_TYPES[filters.type];
  }

  if (filters.numResults) {
    out.maxResults = filters.numResults;
  }

  if (has(filters, 'hasPhoto')) {
    out.hasImage = filters.hasPhoto;
  }

  // Parameters with defaults
  out.page = filters.page || 1;

  return out;
}

function parseLocations(locations) {

  function getZone(lokation) {
    return lokation.split('/').slice(0,4).join('/');
  }

  function areSameZone(locations) {
    var result = true;
    var firstZone = getZone(locations[0]);
    each(locations, function(lokation) {
      result = result && getZone(lokation) === firstZone;
    });
    return result;
  }

  function getNeighborhoods(locations) {
    var results = [];
    each(locations, function(lokation) {
      results.push(lokation.split('/').slice(4));
    });
    return results.join(',');
  }

  if (Object.prototype.toString.call(locations) === "[object String]") {
    return { url: locations };
  } else {
    if (areSameZone(locations)) {
      return {
        url: getZone(locations[0]),
        parameters: {
          neighborhood: getNeighborhoods(locations)
        }
      };
    } else {
      throw "Listings Error: All locations must be from the same zone.";
    }
  }
}

function processListingsParameters(parameters) {
  if (BUSINESS_TYPES[parameters.business]) {
    return {
      business: BUSINESS_TYPES[parameters.business]
    };
  }
  return {};
}

function listings(core, parameters, filters) {
  // Parse the locations values into a url fragment
  var locations = parseLocations(parameters.locations);

  var queryParameters = extend(

    // Get the parameters that need to go in the query string from the core parameters
    getQueryParametersFromCore(core), 

    // Add any addiitonal parameters needed for location
    locations.parameters || {},

    // Get the parameters that need to go in the query string from the listings parameters
    processListingsParameters(parameters),

    // Parse the extra filters into their query string representation
    processFilters(filters)
  );

  return core.baseUrl + '/locations' + locations.url + '/listings' + '?' + getQueryString(queryParameters);
}

function processGeoSearchParameters(parameters) {
  return {
    lat: parameters.latitude,
    'long': parameters.longitude,
    r: parameters.radius
  };
}

function geoSearch(core, parameters, filters) {
  var level = LEVEL_CONVERSIONS[parameters.level];
  var pathName = '/listings';

  // If we have a level parameter we need a different path
  if (level) {
    pathName = '/listings/clusters/' + level + '/locations';
  }

  var queryParameters = extend(
      
    // Provide a default value for maxResults since it's required by the geoListings API
    { maxResults: 250 },

    // Get the parameters that need to go in the query string from the core parameters
    getQueryParametersFromCore(core), 

    // Get the parameters that need to go in the query string from the listings parameters
    processGeoSearchParameters(parameters),

    // Parse the extra filters into their query string representation
    processFilters(filters)
  );

  // parse the given values into a url
  return core.baseUrl + pathName + '?' + getQueryString(queryParameters);
}

function autocomplete(core, phrase) {

  var queryParameters = extend(
      
    // Get the parameters that need to go in the query string from the core parameters
    getQueryParametersFromCore(core), 

    { input: encodeURI(phrase.replace(/^\s+|\s+$/g, '').replace(/\s/g, '+')) }
  );

  // parse the given values into a url
  return core.baseUrl + '/locations/autocomplete' + '?' + getQueryString(queryParameters);
}

function getProperty(core, propertyID) {
  var pathName = '/listings/' + propertyID;

  // Get the parameters that need to go in the query string from the core parameters
  var queryParameters = getQueryParametersFromCore(core);

  return core.baseUrl + pathName + '?' + getQueryString(queryParameters);
}

var VivaApi = function(options) {
  
  // test for required options
  var required = [ 'baseUrl', 'apiKey', 'portal' ];
  for (var i = 0; i < required.length; i++) {
    if (!options[required[i]] || typeof options[required[i]] !== "string") {
      throw "Error initializing API: No " + required[i];
    }
  }
  
  // test to make sure the portal is valid
  if (!~PORTALS.indexOf(options.portal)) {
    throw "Error initializing API: Invalid portal";
  }

  // test for a token stringy-ness
  if (options.token && typeof options.token !== "string") {
    throw "Error initializing API: token is not a string";
  }

  // initialize values
  this.core = {
    baseUrl: options.baseUrl,
    apiKey: options.apiKey,
    portal: options.portal
  };

  if (options.token) {
    this.core.token = options.token;
  }

};

VivaApi.prototype.listings = function(parameters, filters, callback) {
  if (!filters) {
    filters = {};
  }

  if (typeof filters === 'function') {
    callback = filters;
    filters = {};
  }

  var hasCallback = callback && typeof callback === 'function';
  var url; 

  // Test to make sure parameters is defined and has a locations field
  if (!parameters || !parameters.locations || !BUSINESS_TYPES[parameters.business]) {
    throw "Listings Error: A location and a valid business parameter is required";
  }

  try {
    url = listings(this.core, parameters, filters);
  } catch (error) {
    if (hasCallback) {
      callback(error);
    } else {
      throw error;
    }
  }

  if (hasCallback) {
    // fetch url and pass on values
    fetchJSON(url, callback);
  } else {
    return url;
  }
};

VivaApi.prototype.geoSearch = function(parameters, filters, callback) {
  if (!filters) {
    filters = {};
  }

  if (typeof filters === 'function') {
    callback = filters;
    filters = {};
  }

  var hasCallback = callback && typeof callback === 'function';
  var url; 

  // Test to make sure parameters is defined and has a locations field
  if (!parameters || !parameters.radius || !parameters.latitude || !parameters.longitude || !parameters.level) {
    throw "GeoSearch Error: Latitude, Longitude, Radius, and Level required.";
  }

  if (!has(LEVEL_CONVERSIONS, parameters.level)) {
    throw 'GeoListings Error: Level must be one of: "COUNTRY", "STATE", "CITY", "ZONE", "NEIGHBORHOOD", "LISTINGS".';
  }

  try {
    url = geoSearch(this.core, parameters, filters);
  } catch (error) {
    if (hasCallback) {
      callback(error);
    } else {
      throw error;
    }
  }

  if (hasCallback) {
    // fetch url and pass on values
    fetchJSON(url, callback);
  } else {
    return url;
  }
};

VivaApi.prototype.autocomplete = function(phrase, callback) {
  var hasCallback = callback && typeof callback === 'function';
  var url; 

  // Test to make sure parameters is defined and has a locations field
  if (!phrase) {
    throw "Autocomplete Error: Must pass text to complete.";
  }

  try {
    url = autocomplete(this.core, phrase);
  } catch (error) {
    if (hasCallback) {
      callback(error);
    } else {
      throw error;
    }
  }

  if (hasCallback) {
    // fetch url and pass on values
    fetchJSON(url, callback);
  } else {
    return url;
  }
};

VivaApi.prototype.property = function(propertyID, callback) {
  var hasCallback = callback && typeof callback === 'function';
  var url; 

  // Test to make sure parameters is defined and has a locations field
  if (!propertyID) {
    throw "Autocomplete Error: Must pass text to complete.";
  }

  try {
    url = getProperty(this.core, propertyID);
  } catch (error) {
    if (hasCallback) {
      callback(error);
    } else {
      throw error;
    }
  }

  if (hasCallback) {
    // fetch url and pass on values
    fetchJSON(url, callback);
  } else {
    return url;
  }
};

/*
VivaApi.prototype.contact = function(propertyID, callback) {};

VivaApi.prototype.sendLead = function(leadData, callback) {};
*/



module.exports = VivaApi;

},{"querystring":2}],2:[function(require,module,exports){
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    };

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}


/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.3.1';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};

  function promote(parent, key) {
    if (parent[key].length == 0) return parent[key] = {};
    var t = {};
    for (var i in parent[key]) t[i] = parent[key][i];
    parent[key] = t;
    return t;
  }

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{ 
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , parent = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else {
            obj = parent[key] = parent[key] || [];
            if (']' == part) {
              if (isArray(obj)) {
                if ('' != val) obj.push(val);
              } else if ('object' == typeof obj) {
                obj[objectKeys(obj).length] = val;
              } else {
                obj = parent[key] = [parent[key], val];
              }
            // prop
            } else if (~part.indexOf(']')) {
              part = part.substr(0, part.length - 1);
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            // key
            } else {
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            }
          }
        }

        parse(parts, parent, 'base');
      // optimize
      } else {
        if (notint.test(key) && isArray(parent.base)) {
          var t = {};
          for(var k in parent.base) t[k] = parent.base[k];
          parent.base = t;
        }
        set(parent.base, key, val);
      }

      return ret;
    }, {base: {}}).base;
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

},{}]},{},[1])(1)
});
;
