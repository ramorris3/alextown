// This service handles all "save" requests to the API
app.service('SaveService', [
  '$http', 'MessageService',
  function($http, MessageService) {

    this.saveLevel = function(filename, level, data) {
      // request to server to save the level data
      $http.post('api/save/stage', { 'filename': filename, 'level': level, 'data': data })
        .success(function(data) {
          MessageService.setFlashMessage('File was successfully saved as ~/stages/' + filename, false);
        })
        .error(function(data) {
          console.log(data);
          MessageService.setFlashMessage('Well, shoot!  Something went wrong.', true);
        });
    };

    var guid = function() {
      var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      };
      return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    };

  }
]);