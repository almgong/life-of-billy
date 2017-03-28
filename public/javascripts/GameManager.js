/**
 * A module for controlling the HTML5 & JS game.
 * Internally, this module makes use to Phaser.js.
 *
 * For sprite sheets, load your sprite into https://www.leshylabs.com/apps/sstool/,
 * and generate a JSON-TP-HASH.
**/
var GameManager = (function(containerId, containerWidth, containerHeight) {

	// anything we'd like to keep track of
	var player;
	var cursors;	// detects key input
	var platforms;	// group of objects that can be stood on
	var npcs;		// group of non-playable characters

	// initialize the game object
	var game = new Phaser.Game(containerWidth, containerHeight, Phaser.AUTO, containerId, {
		preload: preload,
		create: create,
		update: update,
		render: render
	});

	/* The core functions, modify as needed for your game.  */

	// preload any assets as needed, ideally we should preload
	// only those things that will be used soon
	function preload() {

		// in the future, perhaps we can take an an object to preload here
		// TODO clean up this section and FS structure
		game.load.image('tavern-bg', 'assets/Tavern800x600.png');
		game.load.spritesheet('character', 'assets/gfx/character.png', 16, 32);	// spritesheets are fully packed and the same size

		// individual images
		game.load.image('sky-bg', 'assets/images/bg/sky1.png');

		// JSON spritesheet hashes
		game.load.atlasJSONHash('sprites-hyptosis-jfyou', 'assets/hyptosis/hyptosis_sprites-and-tiles-for-you.png',
			'assets/json/hyptosis/hyptosis_sprites-and-tiles-for-you.json');
		game.load.atlasJSONHash('sprites-hyptosis-b1', 'assets/hyptosis/hyptosis_tile-art-batch-1.png', 
			'assets/json/hyptosis/sprites__hyptosis-tile-art-batch-1.json');
	}

	// adds initial elements to the screen, creates the initial scene
	// elements have z-index depending on the order they are create()'d
	function create() {
		/// physics: total there are Arcade Physics, Ninja Physics and P2.JS Full-Body
		game.physics.startSystem(Phaser.Physics.ARCADE);

		// add background
		game.add.sprite(0, 0, 'sky-bg').scale.setTo(.42, .5);

		// add + init player
		//TODO refactor to a function called createPlayer();
		//player = game.add.sprite(game.world.width - 90, game.world.height - 250, 'character');
		player = game.add.sprite(10, game.world.height-200, 'sprites-hyptosis-jfyou', 'sprite78');
		game.physics.arcade.enable(player);
		
		//player.body.bounce.y = 0.3;
		player.body.gravity.y = 300;	// how fast character falls, affected by gravity
		player.body.collideWorldBounds = true;

		// create npcs
		npcs = game.add.group();
		npcs.enableBody = true;
		createGenericGroupItem(npcs, game.world.width-60, game.world.height-240, 
			'sprites-hyptosis-jfyou', false, [.5, .5], 'sprite38');
		createGenericGroupItem(npcs, game.world.width-100, game.world.height-245, 
			'sprites-hyptosis-jfyou', false, [1, 1], 'sprite76');
		createGenericGroupItem(npcs, game.world.width-200, game.world.height-300, 
			'sprites-hyptosis-jfyou', false, [1, 1], 'sprite106');

		// register player animations with their frames (see sprite files)
		// true means to loop the animation as the character is moving
		//player.animations.add('left', [51, 52, 53, 54], true);	
		//player.animations.add('right', [17,18,19,20], true);

		// init cursors for key input
		cursors = game.input.keyboard.createCursorKeys();

		// GROUP: platforms, things that you can stand on
		platforms = game.add.group();
		platforms.enableBody = true;	// applies physics group-wise

		//var ground = platforms.create(0, game.world.height-64, 'platform-temp');
		var ground = platforms.create(0, game.world.height-64, 'sprites-hyptosis-b1', 'sprite156');
		ground.scale.setTo(50, 1);		// scale to fit width
		ground.body.immovable = true; 	// without this, player could push this around (good for scenario if something is running from you)

		// TODO add more to platforms, using our helper
		createGenericGroupItem(platforms, 0, game.world.height-100, 'sprites-hyptosis-b1', true, [4, .5], 'sprite390');
		createGenericGroupItem(platforms, 200, game.world.height-125, 'sprites-hyptosis-b1', true, [4, .5], 'sprite390');
		createGenericGroupItem(platforms, 375, game.world.height-150, 'sprites-hyptosis-b1', true, [1, .5], 'sprite390');
		createGenericGroupItem(platforms, 450, game.world.height-175, 'sprites-hyptosis-b1', true, [1, .5], 'sprite390');
		createGenericGroupItem(platforms, 500, game.world.height-200, 'sprites-hyptosis-b1', true, [10, .5], 'sprite390');
	}

	// gets called every frame
	function update() {

		//game.physics.arcade.collide(player, npcs);		// without this line, collisions will not be detected
		game.physics.arcade.overlap(player, npcs, function(player, npc) { npc.kill(); }, null, this);	// consume

		// player should not be moving on update
		player.body.velocity.x = 0;

		// listen for movement keys
		if (cursors.left.isDown) {
			player.body.velocity.x = -100;
			player.animations.play('left');
		} else if (cursors.right.isDown) {
			player.body.velocity.x = 100;
			player.animations.play('right');
		} else {
			// means nothing is pressed, so stop movement and reset frame
			player.animations.stop();
			player.frame = 'sprite78';		// uncomment this when you have a final character
		}

		// need to make a platform or something
		var hitPlatform = game.physics.arcade.collide(player, platforms);
		if (cursors.up.isDown && player.body.touching.down && hitPlatform) {
			player.body.velocity.y = -150;
		}
	}

	// this function renders after the create(), for finishing touches
	function render() {
		game.debug.spriteInfo(player, 20, 40);
	}

	// helpers

	/**
	 * Creates and adds a generic group item.
	 *
	 * @param group: a variable name pointing to a group created by game.add.group()
	 * @param x: x pos
	 * @param y: y pos
	 * @param assetKey: key of the asset that has been loaded
	 * @param immovable: boolean, whether the object is immovable
	 * @param scaleToVec: an vector with values to scale the asset, or null
	 * @param jsonFrameKey: [OPTIONAL] if the asset was loaded with a JSON hashmap, then specify the key
	 *
	 * This function expext the group to defined, to which the
	 * new item will be added to.
	**/
	function createGenericGroupItem(group, x, y, assetKey, immovable, scaleToVec, jsonFrameKey) {
		if (group) {

			var groupItem;
			if (jsonFrameKey) {
				groupItem = group.create(x, y, assetKey, jsonFrameKey);
			} else {
				groupItem = group.create(x, y, assetKey);
			}

			groupItem.body.immovable = immovable;
			
			if (scaleToVec && scaleToVec.length && scaleToVec.length == 2) {
				groupItem.scale.setTo(scaleToVec[0], scaleToVec[1]);
			}
		}
	}

	function updateBackground(assetName) {

	}

	/* Exported functions for exported API */

	return {
		game:game	// we return the actual Phaser.js game object for debugging
	}
});