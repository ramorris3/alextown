var app = angular.module('GameApp', [])

.controller('GameController', function() {
  var game = new Phaser.Game(1000, 500, Phaser.CANVAS, '', {preload: preload, create: create, update: update});

  function preload() {
    game.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');
  }

  var floatingText;
  var floatSpeedX = 3;
  var floatSpeedY = 3;

  function create() {
    floatingText = game.add.bitmapText(game.world.centerX, game.world.centerY, 'carrier_command', 'HELLO, WORLD!', 40);
  }

  function update() {
    floatingText.x += floatSpeedX;
    floatingText.y += floatSpeedY;

    if (floatingText.x < 0) {
      floatSpeedX *= -1;
      floatingText.x = 0;
    } else if (floatingText.x > game.width - floatingText.width) {
      floatSpeedX *= -1;
      floatingText.x = game.width - floatingText.width;
    }

    if (floatingText.y < 0) {
      floatSpeedY *= -1;
      floatingText.y = 0;
    } else if (floatingText.y > game.height - floatingText.height) {
      floatSpeedY *= -1;
      floatingText.y = game.height - floatingText.height;
    }
  }
});