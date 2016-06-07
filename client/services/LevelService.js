// This service handles all "save" requests to the API
app.service('LevelService', [
  '$http', 'LoaderService', 'MessageService',
  function($http, LoaderService, MessageService) {

    var self = this;

    var currentLevel;
    self.getCurrentLevel = function() {
      return currentLevel;
    };

    init();

    self.saveLevel = function(filename, level, data) {
      // request to server to save the level data
      $http.post('../api/save/stage', { 'filename': filename, 'level': level, 'data': data })
        .success(function(data) {
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
          currentLevel = data.levelData.data;
          LoaderService.level = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    }
  }
]);