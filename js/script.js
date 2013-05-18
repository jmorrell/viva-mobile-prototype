
// Set up api wrapper
var api = new VivaApi({
  baseUrl: "http://api.vivareal.com/api/1.0",
  apiKey: "183d98b9-fc81-4ef1-b841-7432c610b36e",
  portal: "VR_BR"
});

var loc = [-23.5609,-46.6334];


var App = new Marionette.Application();

App.addRegions({
    "mainRegion": ".content" 
});

App.module("Main Menu", function(Mod, App, Backbone, Marionette, $, _) {
  var MainView = Marionette.ItemView.extend({
    className: "homepage bg_sp",
    template: "#homepage" 
  });
  
  var Controller = Marionette.Controller.extend({
    initialize: function(options){
      this.region = options.region;
    },
    
    show: function(){
      var view = new MainView({});
      this.region.show(view);
    }
  });
    
  Mod.addInitializer(function(){
    Mod.controller = new Controller({
      region: App.mainRegion
    });

    Mod.controller.show();
  });
});

/*
App.module("Map View", function(Mod, App, Backbone, Marionette, $, _) {
  var MainView = Marionette.ItemView.extend({
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
  
  var Controller = Marionette.Controller.extend({
    initialize: function(options){
      this.region = options.region;
    },
    
    show: function(){
      var view = new MainView({});
      this.region.show(view);
    }
  });
    
  Mod.addInitializer(function(){
    Mod.controller = new Controller({
      region: App.mainRegion
    });

    Mod.controller.show();
  });
});

App.module("Detail View", function(Mod, App, Backbone, Marionette, $, _) {
  var MainView = Marionette.ItemView.extend({
    template: "#detail-view"
  });
  
  var Controller = Marionette.Controller.extend({
    initialize: function(options){
      this.region = options.region;
    },
    
    show: function(){
      var view = new MainView({});
      this.region.show(view);
    }
  });
    
  Mod.addInitializer(function(){
    Mod.controller = new Controller({
      region: App.mainRegion
    });

    Mod.controller.show();
  });
});
*/


App.start();




/*
// Set up map
var map = L.map('map').setView(loc, 15);

// Set up tiles
L.tileLayer('http://{s}.tile.cloudmade.com/c4157c3f815445f4a5d9e3c55eafadc0/997/256/{z}/{x}/{y}.png', {
    minZoom: 8,
    maxZoom: 18
}).addTo(map);
*/

