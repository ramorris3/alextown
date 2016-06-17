app.controller('MessageController', [
  '$scope', 'MessageService', 
  function($scope, MessageService){
    $scope.getFlashMessage = MessageService.getFlashMessage;
    $scope.hideFlashMessage = MessageService.hideFlashMessage;
  }
]);

app.directive('tiMessage', function() {
  return {
    restrict: 'E', 
    templateUrl: 'components/flash-message/message.html',
    controller: 'MessageController'
  };
});