import {State, StateMachine} from "./statemachine.js";
import Javelin from "./projectiles/javelin.js";

export default class Player {

  constructor ({
     scene: scene,
     x:x,
     y:y
    })
  {

    //physics body and animation
    this.player = scene.physics.add
       .sprite(x, y, "player", 0)
       .setOrigin(0.5,0.5);
    this.player.canJump = true;

    //set up StateMachine
    scene.statemachine = new StateMachine( 'idle',
      {
        idle: new IdleState(),
        run: new RunState(),
        jump: new JumpState(),
        stab: new StabState(),
        pick: new PickState(),
        fly: new FlyState(),
        aim: new AimState()
      },
      [scene, this.player]
    );

    this.setPlayerKeys(scene);
    this.setPlayerAnimations(scene);






     this.playerCamera = scene.cameras.main
     .startFollow(this.player)
     .setLerp(0.05)
     .setDeadzone(100,100)
     //.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
     .zoom = 1;



  }

  update(time, delta, scene)
  {
    const {statemachine, speedFollow} = this;

    scene.statemachine.step();

    this.speedFollow(this.contLerp, scene);

    scene.checkPlayerStats.setText([
      " player _state:    " + scene.statemachine.state

    ] );
  }

  //makes the camera try to catch up with the player

  speedFollow(conLerp, scene)
  {

    this.distanceFmCam = Phaser.Math.Distance.Between(scene.cameras.main.midPoint.x, scene.cameras.main.midPoint.y, this.player.x, this.player.y);



    if(this.distanceFmCam < 150 && conLerp <= 0.05)
    {
      conLerp -= 0.000000000001;
      scene.cameras.main.setLerp(conLerp);
    }else if( this.distanceFmCam > 150 && conLerp < 0.3){
      //set to 0.05 for glorious motion sickness
      conLerp += 0.06;
      scene.cameras.main.setLerp(conLerp);
    }else if (this.distanceFmCam > 400 && conLerp < 0.75){
      conLerp += -0.002;
      scene.cameras.main.setLerp(conLerp);
      this.playerCamera.shake(3000);
    }

  }

  setPlayerKeys(scene) {


        // Track the arrow keys & WASD
        const { LEFT, RIGHT, UP, DOWN, SPACE, W, A, D, S, Z, X, C} = Phaser.Input.Keyboard.KeyCodes;
        scene.keys = scene.input.keyboard.addKeys({
          left: LEFT,
          right: RIGHT,
          up: UP,
          down: DOWN,
          space: SPACE,
          w: W,
          a: A,
          d: D,
          s: S,
          z: Z,
          x: X,
          c: C
        });


  }

setPlayerAnimations(scene){

  scene.anims.create({
    key: 'stab',
    frames: "hit",
    frameRate: 1
  });
}


}



class IdleState extends State {
    enter(scene, player) {
      player.setVelocity(0);
      player.setTexture("player");
    }

    execute(scene, player) {
      const {left, right, space, x, c} = scene.keys;

      //stab if x is pressed
      scene.input.keyboard.once("keydown-X", ()=> {this.stab(scene)}, this );

      //scene.input.keyboard.once("keydown-C", ()=> {this.pick(scene)}, this );

      if(scene.input.activePointer.leftButtonDown() ){
          scene.statemachine.transition('aim');
          return;
      }
/*
      scene.input.on('pointerdown', function (pointer) {

              if (pointer.rightButtonDown())
              {
                  scene.statemachine.transition('aim');
              }
      });
*/
      //stab if pressing x
      if (c.isDown){
        scene.statemachine.transition('pick');
        return;
      }


      // Transition to jump if pressing space
      if (space.isDown && player.canJump === true) {
        player.canJump = false;
        scene.statemachine.transition('jump');
        return;
      }

      // Transition to move if pressing a movement key
      if (left.isDown || right.isDown) {
        scene.statemachine.transition('run');
        return;
      }
    }

    stab(scene) {
      scene.statemachine.transition('stab');
    }

    pick(scene){
      scene.statemachine.transition('pick');
    }
}


export class RunState extends State {
  enter(scene, player) {


  }

  execute(scene, player) {
    const {left, right, space, x, c} = scene.keys;



    scene.input.keyboard.once("keydown-X", ()=> {this.stab(scene)}, this );
    scene.input.keyboard.once("keydown-C", ()=> {this.pick(scene)}, this );

    if(scene.input.activePointer.leftButtonDown() ){
        scene.statemachine.transition('aim');
        return;
    }

    if (x.isDown) {
      scene.statemachine.transition('stab');
      return;
    }

    if (c.isDown) {
      scene.statemachine.transition('pick');
      return;
    }

    if(scene.input.activePointer.rightButtonDown() ){
        scene.statemachine.transition('aim');
        return;
    }

    //jump if pressing space
    if (space.isDown && player.canJump === true && player.body.blocked.down){
      player.canJump = false;
      scene.statemachine.transition('jump');
      return;
    }

    if (!(left.isDown || right.isDown)) {
      scene.statemachine.transition('idle');
    }

    if (left.isDown){
      player.setVelocityX(-200);
      player.flipX = true;
    }else if (right.isDown){
      player.setVelocityX(200);
      player.flipX = false;
    }

  }

  stab(scene) {
    scene.statemachine.transition('stab');
  }

  pick(scene){
    scene.statemachine.transition('pick');
  }
}


class StabState extends State {
  enter(scene, player){

    scene.edge.swing(player.x, player.y, player.flipX, scene);
    player.setTexture("player_att");
    scene.time.delayedCall( 100, ()=> {scene.statemachine.transition("idle")} );


  }

  execute(scene, player){

  }

}

class AimState extends State {
  enter(scene, player){
    player.setTexture("player_hold");
    player.setVelocity(0);
  }

  execute(scene, player){
    const {} = scene.keys;

    //right button released, throw jav
    if(scene.input.activePointer.leftButtonReleased() ){
      //if there's a jav in the javBag, then fire its throw function
      let jav = new Javelin({
        scene: scene
      });

      jav.fire({
        x: player.x,
        y: player.y,
        targetX: scene.input.activePointer.worldX,
        targetY: scene.input.activePointer.worldY
      });

      scene.statemachine.transition('idle');
    }


  }
}

class PickState extends State {
  enter(scene, player){
    player.setVelocityX(0);
    scene.pick.swing(player.x, player.y, player.flipX, scene);
    player.setTexture("player_att");
    scene.time.delayedCall( 300, ()=> {scene.statemachine.transition("idle")} );

  }

  execute(scene, player){

  }

}

class FlyState extends State {
  enter(scene, player){
    player.body.setAllowGravity(false);
  }

  execute(scene, player){
        const {left, right, up, down, space} = scene.keys;
        const speed = 800;

            if (left.isDown){
              player.setVelocityX(-speed);
              player.flipX = true;
            }else if (right.isDown){
              player.setVelocityX(speed);
              player.flipX = false;
          }else{
            player.setVelocityX(0);
          }

          if (up.isDown){
            player.setVelocityY(-speed);
          }else if (down.isDown){
            player.setVelocityY(speed);
          }else{
            player.setVelocityY(0);
          }

          if (space.isDown && down.isDown){
            player.body.setAllowGravity(true);
            scene.statemachine.transition("idle");
          }
  }
}


export class JumpState extends State {

    enter(scene, player) {
      player.anims.stop();
     player.setVelocityY(-400);
     player.canJump = false;
    }

    execute(scene, player) {
      const {left, right, space, up} = scene.keys;


          player.rotation++;

      if (left.isDown){
        player.setVelocityX(-200);
      }else if (right.isDown){
        player.setVelocityX(200);
    }else if (right.isUp && left.isUp){
      player.setVelocityX(0);
    }

    if (space.isDown && up.isDown){
      player.rotation = 0;
      scene.statemachine.transition('fly');
    }

    if  (player.canJump === true && player.body.blocked.down === true){
      if (player.velocityX === 0) {
      player.rotation = 0;
      scene.statemachine.transition('idle');
    }
    player.rotation = 0;
    scene.statemachine.transition('run');

   }
 }
}
/*
 function spawnPlayer({
   scene: scene,
   x:x,
   y:y
  })
 {







  let player = scene.physics.add
      .sprite(x, y, "player", 0)
      .setDrag(20,0)
      .setDepth(9)
      //.setDisplaySize(128,128)
      //.setOffset(20,-400)
      .setSize(64,64,);

    //set up StateMachine
    scene.statemachine = new StateMachine( 'idle',
      {
        idle: new IdleState(),
        run: new RunState(),
        jump: new JumpState(),
        stab: new StabState(),
      },
      [scene, player]
    );


    //set up physics and camera
    scene.physics.world.enable(player);
    scene.physics.add.existing(player);

    scene.physics.add.collider(player, scene.midGround, ()=> {player.canJump = true});

    scene.playerCamera = scene.cameras.main
    .startFollow(player)
    .setLerp(0.05)
    .setDeadzone(100,100)
    //.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
    .zoom = 1;

        //controls the camera's lerp on an update by update bases
        scene.contLerp = 0.05;
        scene.centerDist = 1;

    const moveSpeed = 200;
    const jumpPow = 400;
    let lastKey = 'g';



    setPlayerKeys(moveSpeed, player, scene);
    setPlayerAnimations();




  }


  function setPlayerAnimations() {


  }


/*
    this.anims.create({
      key: 'readyUp',
      frames: this.anims.generateFrameNames("MSbossman", {prefix: 'ready', end:44}),
      frameRate: 12
    });

 function setPlayerKeys(moveSpeed, player, scene) {


      // Track the arrow keys & WASD
      const { LEFT, RIGHT, UP, DOWN, SPACE, W, A, D, S, Z, X, C} = Phaser.Input.Keyboard.KeyCodes;
      scene.keys = scene.input.keyboard.addKeys({
        left: LEFT,
        right: RIGHT,
        up: UP,
        down: DOWN,
        space: SPACE,
        w: W,
        a: A,
        d: D,
        s: S,
        z: Z,
        x: X,
        c: C
      });
/*
      this.scene.input.keyboard.on('keydown', function(event){
        switch (player._state) {
          case "standing":

              if (player.keys.x.isDown){

                jump();

              }else if(player.keys.right.isDown){


                player.sprite.setVelocityX(moveSpeed);
                player.sprite.flipX = false;
                run();


              }else if (player.keys.left.isDown) {


                player.sprite.setVelocityX(-moveSpeed);
                player.sprite.flipX = true;
                run();

              }else if (player.keys.c.isDown) {

                attack();
              }
            break;

          case "running":

              if(player.keys.c.isDown){

                attack();



              }else if (player.keys.x.isDown){
                jump();

              }else if (player.keys.left.isDown) {

                //player._state = player.states.running;
                player.sprite.setVelocityX(-moveSpeed);
                player.sprite.flipX = true;

          }else if (player.keys.right.isDown) {


            //player._state = player.states.running;
            player.sprite.setVelocityX(moveSpeed);
            player.sprite.flipX = false;

            }
            break;

          case 'jumping':

          if (player.keys.left.isDown) {

            //player._state = player.states.running;
            player.sprite.setVelocityX(-moveSpeed);
            player.sprite.flipX = true;

      }else if (player.keys.right.isDown) {


        //player._state = player.states.running;
        player.sprite.setVelocityX(moveSpeed);
        player.sprite.flipX = false;

        }

            break;


          default:
            return;

        }

      });


      this.scene.input.keyboard.on('keyup', function(event){

        switch (player._state) {
          case "standing":

            break;

          case "running":
          if(player.keys.right.isUp && player.keys.left.isUp){
            player._state = player.states.standing;
            player.sprite.setVelocityX(0);
          }
            break;

          case 'jumping':
          if(player.keys.right.isUp && player.keys.left.isUp){
            player.sprite.setVelocityX(0);
          }
            break;


          default:
            return;
        }
      });

      function jump(){
        player.sprite.setVelocityY(-800);
        player._state = player.states.jumping;
        player.sprite.setDrag(0,0);
        //player.sprite.anims.play('jump');
      }

      function run(){
        player._state = player.states.running;
        player.sprite.setDrag(0,0);
      }

      function attack() {
        player._state = player.states.attacking;
        if (player.sprite.flipX === false) { player.sprite.setVelocityX(20); }else{ player.sprite.setVelocityX(-20); }
        player.sprite.setDrag(40,0);
        //player.sprite.on('animationcomplete', () => {player._state = player.states.standing; player.sprite.anims.chain('idle'); player.sprite.setVelocityX(0)}, this);
        player.sprite.once("animationcomplete", () => stand());
      }

      function stand(){
        player._state = player.states.standing;
        player.sprite.setDrag(40,0);
      }

  }




function  handleInput(input) {

  }

function  update(time,delta) {


  }




  class IdleState extends State {
    enter(scene, player) {
      player.setVelocity(0);
      player.anims.stop();
    }

    execute(scene, player) {
      const {left, right, space, x} = scene.keys;

      // Transition to swing if pressing space
      if (space.isDown) {
        scene.statemachine.transition('jump');
        return;
      }

      // Transition to move if pressing a movement key
      if (left.isDown || right.isDown) {
        scene.statemachine.transition('run');
        return;
      }
    }
}

class RunState extends State {
  enter(scene, player) {


  }

  execute(scene, player) {
    const {left, right, space, x} = scene.keys;


    if (x.isDown) {
      scene.statemachine.transition('stab');
      return;
    }

    //jump if pressing space
    if (space.isDown){
      scene.statemachine.transition('jump');
      return;
    }

    if (!(left.isDown || right.isDown)) {
      scene.statmachine.transition('idle');
    }

    if (left.isDown){
      player.setVelocityX(-200);
    }else if (right.isDown){
      player.setVelocityX(200);
    }

  }
}

class JumpState extends State {
  enter(scene, player) {
    player.anims.stop();
  }

  execute(scene, player) {

  }
}

class StabState extends State {
  enter(scene, player) {
    player.anims.stop();
  }

  execute(scene, player) {

  }
}

*/
