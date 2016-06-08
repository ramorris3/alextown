// This service handles all "save" requests to the API
app.service('LevelService', [
  '$http', 'LoaderService', 'MessageService',
  function($http, LoaderService, MessageService) {

    var self = this;

    var allLevels;
    self.getAllLevels = function() {
      return allLevels;
    };

    self.getLevel = function(num) {
      return allLevels[num];
    };

    init();

    self.saveLevel = function(levelData) {
      // request to server to save the level data
      $http.post('../api/save/stage', levelData)
        .success(function(data) {
          allLevels = data.allLevelData;
          MessageService.setFlashMessage(data.message, false);
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    function init() {
      $http.get('../api/stages')
        .success(function(data) {
          // set currentLevel
          allLevels = data.allLevelData;
          LoaderService.level = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    }
  }
]);