// This service handles all "save" requests to the API
app.service('SaveService', [
  '$http', 'MessageService',
  function($http, MessageService) {

    this.saveLevel = function(filename, level, data) {
      // request to server to save the level data
      $http.post('api/save/stage', { 'filename': filename, 'level': level, 'data': data })
        .success(function(data) {
          MessageService.setFlashMessage(data.message, false);
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    this.saveEnemy = function(enemyData, callback) {
      // save the image...
      $http.post('api/save/img', enemyData)
        .success(function(data) {
          MessageService.setFlashMessage(data.message, false);
          callback(data);
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

  }
]);