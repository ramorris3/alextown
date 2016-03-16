var Slices = function(game) {	
	// init 100 slice sprites
	this.slices = game.add.group();
	this.animationKeys = ['slice1', 'slice2', 'slice3']; // for slice() later
	for (var i = 0; i < 100; i++)
	{
		var slice = new Sprite(game, 0, 0, 'slices');
		slice.animations.add('0', [0,1,2,3,4,5,6,7,8], 15, false);
		slice.animations.add('1', [9,10,11,12,13,14,15], 15, false);
		slice.animations.add('2', [16,17,18,19,20,21,22,23], 15, false);
		slice.kill();
		this.slices.add(slice);
	}
}

Slices.prototype = Object.create();
Slices.prototype.constructor = Slices;

Slices.prototype.slice = function(x, y) {
	// get a slice sprite, and choose a random slice animation to play
	var slice = this.slices.getFirstDead();
	var animation = this.animationKeys[Math.floor(Math.random() * 2)];

	// revive and play animation (will die when enimation ends)
	slice.reset(x, y);
	slice.revive();

	// fade as animation plays
	slice.prototype.update = function() {
		this.alpha -= .02;
	};
};