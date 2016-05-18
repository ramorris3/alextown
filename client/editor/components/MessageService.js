app.service('MessageService',
  function() {

    var colors = {
      RED: '#E50000',
      GREEN: '#198C19'
    };

    var flashMessage = {
      visible: false,
      message: '',
      color: colors.GREEN
    };

    this.setFlashMessage = function(message, isBad) {
      flashMessage.message = message;
      flashMessage.color = isBad ? colors.RED : colors.GREEN;
      flashMessage.visible = true; // whenever flashmessage is updated, show it
    };

    this.getFlashMessage = function() {
      return flashMessage;
    };

    this.hideFlashMessage = function() {
      flashMessage.visible = false;
    };
  });