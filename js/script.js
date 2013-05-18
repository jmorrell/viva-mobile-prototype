
// Set up api wrapper
var api = new VivaApi({
  baseUrl: "http://api.vivareal.com/api/1.0",
  apiKey: "183d98b9-fc81-4ef1-b841-7432c610b36e",
  portal: "VR_BR"
});

var loc = [-23.5609,-46.6334];



var MainView = Marionette.ItemView.extend({
  className: "homepage bg_sp",
  template: "#homepage" 
});


var MapView = Marionette.ItemView.extend({
  template: "#map-view",

  onShow: function() {
   var map = L.map(this.$('.map')[0]).setView(loc, 15);

    // Set up tiles
    L.tileLayer('http://{s}.tile.cloudmade.com/c4157c3f815445f4a5d9e3c55eafadc0/997/256/{z}/{x}/{y}.png', {
        minZoom: 8,
        maxZoom: 18
    }).addTo(map); 
  }
});

var DetailView = Marionette.ItemView.extend({
  template: "#detail-view"
});

var Controller = Marionette.Controller.extend({
  initialize: function(options){
    this.region = options.region;
  },

  showMain: function() {
    var view = new MainView();
    this.region.show(view);
  },

  showMap: function() {
    console.log(arguments);
    var view = new MapView();
    this.region.show(view);
  },

  showDetail: function() {
    var view = new DetailView();
    this.region.show(view);
  }
});

var Router = Marionette.AppRouter.extend({
  appRoutes: {
    '': 'showMain',
    'map*path': 'showMap'
  }
});

var App = new Marionette.Application();

App.addRegions({
  mainRegion: {
    selector: ".content",
    regionType: PanningRegion
  }
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


