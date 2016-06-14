/*
 * LOADER SERVICE
 *
 * This service keeps track of whether all game components have been loaded.
 * Once all game components have been loaded, it calls any callbacks that
 * are dependent on the loaded game components.  Callbacks are added via
 * LoaderService.addLoaderFunction
 * 
 */
app.service('LoaderService', 
  function() {

    var self = this;

    self.assets = false;
    self.enemy = false;
    self.level = false;
    self.player = false;
    self.weapon = false;

    var loaderFunctions = [];

    // dependent components call this before they execute dependent blocks of code
    self.addLoaderFunction = function(callback) {
      if (loaded()) {
        callback();
      } else {
        loaderFunctions.push(callback);
      }
    };

    // loading services call this when they have loaded
    self.loadHandler = function() {
      if (loaded()) { // if all services have loaded, call all callbacks
        for (var i = 0; i < loaderFunctions.length; i++) {
          loaderFunctions[i]();
        }
      }
    };

    // check to see if all dependencies have loaded
    function loaded() {
      return self.assets && self.enemy && self.level && self.player;
    }
  });