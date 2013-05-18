
var request = require('request');
var VivaAPI = require('js-viva-api');
var async = require('async');
var _ = require('underscore');

var api = new VivaAPI({
  baseUrl: "http://api.vivareal.com/api/1.0",
  apiKey: "183d98b9-fc81-4ef1-b841-7432c610b36e",
  portal: "VR_CO"
});

var parameters = {
  latitude: 4.7566170242420895,
  longitude: -74.04136061668396,
  radius: 5132,
  business: "RENT",
  level: "LISTINGS"
};

var filters = {
  business: "RENT"
};

getAllResults(parameters, filters, function(err, results) {
  var points = _.map(results, function(result) {
    if (!result) {
      return [];
    }
    return [ result.latitude, result.longitude, result.propertyId ];
  });
  console.log(points);
});

function getListings(parameters, filters, callback) {
  var url = api.geoSearch(parameters, filters);
  request.get(url, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      callback(null, JSON.parse(body).listings);
    }
  });
}

function getNumberOfResults(parameters, filters, callback) {
  var url = api.geoSearch(parameters, filters);
  request.get(url, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      callback(null, JSON.parse(body).listingsCount);
    }
  });
}

function downloadResultsForPage(parameters, filters, n, callback) {
  filters = _.extend(filters, { page: n });
  getListings(parameters, filters, callback);
}

function getAllResults(parameters, filters, callback) {
  getNumberOfResults(parameters, filters, function(err, count) {
    var numPages = Math.ceil(count / 250);
    var range = _.range(1, numPages + 1);

    var downloadResults = _.partial(downloadResultsForPage, parameters, filters);
    async.map(range, downloadResults, function(err, results) {
      callback(null, _.flatten(results));
    });
  });
}
