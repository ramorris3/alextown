app.service('SaveService', [
  '$http', function($http) {

    var self = this;

    var colors = {
      RED: '#E50000',
      GREEN: '#198C19'
    };

    var flashMessage = {
      visible: false,
      message: '',
      color: colors.GREEN
    };

    function setFlashMessage(message, color) {
      flashMessage.message = message;
      flashMessage.color = color;
      flashMessage.visible = true; // whenever flashmessage is updated, show it
    }

    self.getFlashMessage = function() {
      return flashMessage;
    };

    self.hideFlashMessage = function() {
      flashMessage.visible = false;
    };

    self.saveLevel = function(filename, level, data) {
      // request to server to save the level data
      $http.post('api/save/stage', { 'filename': filename, 'level': level, 'data': data })
        .success(function(data) {
          setFlashMessage('File was successfully saved as ~/stages/' + filename, colors.GREEN);
        })
        .error(function(data) {
          console.log(data);
          setFlashMessage('Well, shoot!  Something went wrong.', colors.RED);
        });
    };

  }
]);