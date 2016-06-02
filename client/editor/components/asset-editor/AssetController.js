app.controller('AssetController', 
  ['$scope', 'FileReader', 'MessageService',
  function($scope, FileReader, MessageService){
    // loads a preview of the spritesheet file before saving
    $scope.getFile = function() {
      FileReader.readAsDataUrl($scope.file, $scope)
        .then(function(result) {
          $scope.previewSrc = result;
        });
    };

    $scope.saveAsset = function() {
      MessageService.setFlashMessage('Image saved successfully!', false);
    };
  }
]);