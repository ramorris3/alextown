app.controller('AssetController', 
  ['$scope', 'AssetService', 'FileReader', 'MessageService',
  function($scope, AssetService, FileReader, MessageService){

    $scope.spriteData = {};
      // src
      // height
      // width
      // key
      // name
      // type

    $scope.assetTypes = [
      'Enemies',
      'Bullets',
      'Backgrounds'
    ];

    // load existing assets 
    $scope.getAllAssets = AssetService.getAllAssets;

    // loads a preview of the spritesheet file before saving
    $scope.getFile = function() {
      FileReader.readAsDataUrl($scope.file, $scope)
        .then(function(result) {
          $scope.previewSrc = result;
        });
    };

    function validInput() {
      var valid = true;
      var message = '';
      if (!$scope.spriteData.height || !$scope.spriteData.width) {
        message = 'You must specify frame width and height.';
        valid = false;
      } else if (!$scope.spriteData.name) {
        message = 'You must specify a name for the image.';
        valid = false;
      } else if (!$scope.spriteData.type) {
        message = 'You must choose an asset type.';
        valid = false;
      } else if (!$scope.previewSrc) {
        message = 'You must upload an asset.';
        valid = false;
      }
      if (!valid) {
        MessageService.setFlashMessage(message, true);
      }
      return valid;
    }

    $scope.saveAsset = function() {
      // if (validInput()) {
        AssetService.saveAsset($scope.spriteData, $scope.previewSrc);
      // }
    };
  }
])

.directive('ngFileSelect', function() {
  return {
    link: function($scope, el) {
      el.bind('change', function(e){
        $scope.file = (e.srcElement || e.target).files[0];
        $scope.getFile();
      });
    }
  };
});