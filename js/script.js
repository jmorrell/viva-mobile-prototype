
// Force portrait view
if (screen && screen.mozLockOrientation) {
  screen.mozLockOrientation("portrait");
}


// Set up api wrapper
var api = new VivaApi({
  baseUrl: "http://api.vivareal.com/api/1.0",
  apiKey: "183d98b9-fc81-4ef1-b841-7432c610b36e",
  portal: "VR_BR"
});

var loc = [-23.5609,-46.6334];
// var loc = [4.5981, -74.0758];

var locationMapping = {
  '/sp/sao-paulo': [-23.55, -46.633333],
  '/rj/rio-de-janeiro': [-22.908333, -43.196389],
  '/bahia/salvador': [-12.970382, -38.512382],
  '/df/brasilia': [-15.780148, -47.929170],
  '/ceara/fortaleza': [-3.718394, -38.543395],
  '/minas-gerais/belo-horizonte': [-19.919068, -43.938575],
  '/parana/curitiba': [-25.428356, -49.273252],
  '/pernambuco/recife': [-8.054277, -34.881256],
  '/rio-grande-do-sul/porto-alegre': [-30.027704, -51.228735],
  '/sp/campinas': [-22.907105, -47.063239],
  '/para/belem': [-1.455021, -48.502368],
  '/santa-catarina/florianopolis': [-27.596904, -48.549454]
};

var MainView = Marionette.ItemView.extend({
  className: "homepage bg_rio",
  template: "#homepage" 
});


function zoomToLevel(zoomLevel) {
  return "LISTINGS";
}

var MapView = Marionette.ItemView.extend({
  template: "#map-view",

  onShow: function() {
   var map = L.map(this.$('.map')[0]).setView(this.options.loc, 12);
   var markers = {};

    // Set up tiles
    L.tileLayer('http://{s}.tile.cloudmade.com/c4157c3f815445f4a5d9e3c55eafadc0/997/256/{z}/{x}/{y}.png', {
        minZoom: 8,
        maxZoom: 18
    }).addTo(map); 

    var levelParameter = "LISTINGS";
    var markersGroup = new L.MarkerClusterGroup();
    markersGroup.addTo(map);


    map.on('zoomend', function(ev) {
      // var zoom = zoomToLevel(map.getZoom());
      // if (zoom !== levelParameter) {
      //   markersGroup.clearLayers();    
      //   markers = {};
      //   levelParameter = zoom;
      // }
    });

    map.on('moveend', function(ev) {
      var bounds = map.getBounds();
      var center = bounds.getCenter();
      var radius = center.distanceTo(bounds.getNorthWest());

      var parameters = {
        latitude: center.lat,
        longitude: center.lng,
        radius: Math.ceil(radius),
        level: levelParameter
      };

      api.geoSearch(parameters, function(err, data) {
        if (err) {
          throw err;
        }

        if (data.locations && data.locations.length) {
          _.each(data.locations, function(neighborhood) {
            if (!markers[neighborhood.locationId]) {
              var loc = [neighborhood.latitude, neighborhood.longitude];
              var marker = L.marker(loc).addTo(markersGroup);
              marker.bindPopup("<b>" + neighborhood.name + "</b><br>results: " + neighborhood.listingsCount);
              markers[neighborhood.locationId] = marker;
            }
          });
        } else {
          _.each(data.listings, function(listing) {
            if (listing.latitude && listing.longitude) {
              if (!markers[listing.propertyId]) {
                var loc = [ listing.latitude, listing.longitude ];
                var marker = L.marker(loc).addTo(markersGroup);
                marker.bindPopup('<a href="#property/' + listing.propertyId + '">See Detail</a>');
                markers[listing.propertyId] = marker;
              }
            }
          });
        }

      });
    });

  }
});

var ApplicationView = Marionette.Layout.extend({
  template: "#app-view",
  regions: {
    header: "header",
    main: ".main"
  }
});



var DetailView = Marionette.ItemView.extend({
  template: "#detail-view",

  serializeData: function() {
    var out = this.model.toJSON();
    out.backUrl = "#map" + this.options.lastLocationId;
    return out;
  }
});

var Controller = Marionette.Controller.extend({
  initialize: function(options){
    this.region = options.region;
  },

  showMain: function() {
    var view = new MainView();
    this.region.show(view);
  },

  showMap: function(locationId) {
    var view;
    if (locationId && locationMapping[locationId]) {
      view = new MapView({
        loc: locationMapping[locationId]
      });
    } else {
      view = new MapView({
        loc: [-23.55, -46.633333]
      });
    }
    this.region.show(view);
    this.lastLocationId = locationId;
  },

  showDetail: function(propertyId) {
    var self = this;
    api.property(propertyId, function(err, data) {
      var view = new DetailView({
        model: new Backbone.Model(data),
        lastLocationId: self.lastLocationId
      });
      self.region.show(view);
    });
  }
});

var Router = Marionette.AppRouter.extend({
  appRoutes: {
    '': 'showMain',
    'map*path': 'showMap',
    'property/:propertyId': 'showDetail'
  }
});

var App = new Marionette.Application();

App.addRegions({
  mainRegion: ".content"
});

App.addInitializer(function() {
  var controller = new Controller({
    region: App.mainRegion
  });

  var router = new Router({
    controller: controller
  });
});

App.on("initialize:after", function(options){
  if (Backbone.history){
    Backbone.history.start();
  }
});

App.start();


