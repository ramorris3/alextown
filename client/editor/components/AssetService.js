app.service('AssetService',
  ['$http', 'MessageService',
  function($http, MessageService) {
    var self = this;
    var allAssets = {};
    self.getAllAssets = function() {
      return allAssets;
    };

    init();

    self.getBullets = function() {
      return allAssets.Bullets;
    };

    self.getEnemies = function() {
      return allAssets.Enemies;
    };

    self.saveAsset = function(spriteData, imgSrc) {
      // check for dupes
      if (allAssets.hasOwnProperty(spriteData.name)) {
        MessageService.setFlashMessage('There is already an img asset named "' + spriteData.name + '."  Asset was not saved (must have a unique name).');
        return;
      }

      // save img and get key (filename)
      $http.post('api/save/img', {img: imgSrc})
        .success(function(data) {
          // update spriteData with img reference
          spriteData.key = data.key;
          spriteData.src = data.src;
          
          $http.post('api/save/asset', spriteData)
            .success(function(data) {
              MessageService.setFlashMessage(data.message);
              allAssets = data.allAssetData;
            })
            .error(function(data) {
              MessageService.setFlashMessage(data.message, true);
            });
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    self.preloadAllAssets = function(game) {
      for (var category in allAssets) {
        if (allAssets.hasOwnProperty(category)) {
          var assets = allAssets[category];
          for (var asset in assets) {
            if (assets.hasOwnProperty(asset)) {
              var obj = assets[asset];
              // load to the game
              game.load.spritesheet(obj.key, obj.src, obj.width, obj.height);
            }
          }
        }
      }
    };

    function init() {
      $http.get('api/assets')
        .success(function(data) {
          allAssets = data.allAssetData;
        })
        .error(function(data) {
          console.log('ERROR' + JSON.stringify(data));
        });
    }
  }
]);