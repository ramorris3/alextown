app.service('EnemyService', function() {

  var enemy = {
    pic: null
  };

  self.saveEnemy = function(data) {
    enemy.pic = data.pic;
    console.log('enemy pic: ');
    console.log(enemy.pic);
  };

});