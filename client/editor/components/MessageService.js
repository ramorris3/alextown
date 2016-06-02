app.service('MessageService',
  ['$rootScope', 
  function($rootScope) {

    var self = this;

    var colors = {
      RED: '#E8130C',
      GREEN: '#00B20B'
    };

    var flashMessage = {
      visible: false,
      message: '',
      color: colors.GREEN
    };

    self.setFlashMessage = function(message, isBad) {
      flashMessage.message = message;
      flashMessage.color = colors.GREEN;
      if (isBad) {
        flashMessage.color = colors.RED;
        if (!message) {
          flashMessage.message = 'An unknown error occured.';
        }
      }
      flashMessage.visible = true;
      // hide after 3s
      setTimeout(
        function(){ 
          $rootScope.$apply(function() {
            self.hideFlashMessage(); 
          });
        }, 5000);
    };

    self.getFlashMessage = function() {
      return flashMessage;
    };

    self.hideFlashMessage = function() {
      flashMessage.visible = false;
    };
  }
]);