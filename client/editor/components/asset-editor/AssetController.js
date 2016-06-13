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
      var errMsg = 'All fields are required.';
      if (!$scope.spriteData) {
        MessageService.setFlashMessage(errMsg, true);
        return false;
      }
      var data = $scope.spriteData;
      if (!data.height || !data.width || !data.name || !data.type || !$scope.previewSrc) {
        MessageService.setFlashMessage(errMsg, true);
        return false;
      }
      return true;
    }

    $scope.saveAsset = function() {
      if (validInput()) {
        AssetService.saveAsset($scope.spriteData, $scope.previewSrc);
      }
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