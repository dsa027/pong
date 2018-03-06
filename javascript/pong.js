(function() {
  var canvas = null;
  var context = null;
  var animate = null;
  var collisions = null;
  var background = null;
  var pPaddle, cPaddle, ball;
  var ballSprite, paddleSprite;
  var cWidth = 480, cHeight = 300;
  var stop = true;
  var gameOver = false;
  var flashInterval = 30;
  var flashing = false;
  var flashCount = 0;

  var Side = {"COMPUTER": 'computer', 'PLAYER': 'player', 'NONE': 'none'}
  var cStringWidth = -1;
  var maxScore = 11;

  //////////////////
  class Background {
  //////////////////
    constructor() {
      var image = new Image(cWidth, cHeight);
      image.src = 'images/bg.png';
      this.sprite = new Sprite(image, cWidth, cHeight);
      this.justScored = Side.NONE;
    }

    render() {
      context.drawImage(
        this.sprite.image,
        0,
        0,
        this.sprite.width,
        this.sprite.height);

      this.showScore();

      if (gameOver) {
        this.showGameOver();
      }
      else if (stop) {
        this.showClickToStart();
      }
    }

    showGameOver() {
      if (++flashCount >= flashInterval) {
        flashCount = 0;
        flashing = !flashing;
      }
      if (!flashing) return;

      var fontSize = 76;
      context.font = `${fontSize}px sans-serif`;
      context.fillStyle = 'red';

      var gW = context.measureText("GAME").width;
      var oW = context.measureText("OVER").width;

      var ySpace = (cHeight - fontSize*2) / 3;
      ySpace *= .7;
      var xSpace = (cWidth - Math.max(gW, oW)) / 2;

      context.fillText("GAME", xSpace, ySpace+fontSize);
      context.fillText("OVER", xSpace, fontSize*2 + ySpace*2);

      var str = "Press any key to continue...";
      fontSize = 32;
      context.font = `${fontSize}px sans-serif`;
      context.fillText(str, (cWidth - context.measureText(str).width) / 2, cHeight-5);
    }

    showClickToStart() {
      context.fillStyle = 'palegreen';
      var str = "Click mouse or press spacebar to serve...";
      var fontSize = 22;
      context.font = `${fontSize}px sans-serif`;
      context.fillText(str, (cWidth - context.measureText(str).width) / 2, cHeight / 2 + fontSize*2);
    }

    whichSideScored(val) {
      if (!val) {
        return this.justScored
      }
      else {
        this.justScored = val;
      }
    }

    showScore() {
      context.font = '30px Arial';
      var cColor = this.whichSideScored() === Side.COMPUTER ? 'lime' : 'white';
      var pColor = this.whichSideScored() === Side.PLAYER ? 'lime' : 'white';

      context.fillStyle = pColor;
      context.fillText(pPaddle.getScore(), 25, cHeight-20);

      context.fillStyle = cColor;
      var x = context.measureText(cPaddle.getScore()).width;
      context.fillText(cPaddle.getScore(), cWidth-x-25, cHeight-20);

      if (cStringWidth === -1) cStringWidth = context.measureText("Computer").width;
      context.fillStyle = 'white';
      context.fillText("Player", 25, 50);
      context.fillText("Computer", cWidth-cStringWidth-25, 50);
    }
  }

  //////////////////
  class Paddle {
  //////////////////
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.score = 0;
    }

    static height() { return 40; }
    static width() { return 10; }

    getScore() {
      return this.score;
    }

    scored() {
      this.score++;
      var side = (this == cPaddle) ? Side.COMPUTER : Side.PLAYER;
      background.whichSideScored(side);
      if (this.score >= maxScore) {
        gameOver = true;
        if (side === Side.PLAYER) {
          document.getElementById("you-won").style.display = "block";
        }
        else {
          document.getElementById("you-lost").style.display = "block";
        }
      }
    }

    clearPaddle() {
      context.clearRect(this.x-1, this.y-1, Paddle.width()+2, Paddle.height()+2);
    }

    move(y) {
      // this.clearPaddle();
      // move up/down
      this.y += y;

      // don't let paddle get beyond bounds
      if (this.y < 0) this.y = 0
      else if (this.y > cHeight - Paddle.height()) this.y = cHeight - Paddle.height();
    }

    render() {
      context.fillStyle = 'white';
      context.fillRect(this.x, this.y, Paddle.width(), Paddle.height());
      // this.drawPaddle();
    }

    drawPaddle() {
      context.drawImage(
        paddleSprite.image,
        this.x,
        this.y,
        paddleSprite.width,
        paddleSprite.height);
    }
  } // PADDLE

  //////////////////
  class ComputerPaddle extends Paddle {
  //////////////////
    constructor(x, y) {
      super(x, y);
    }
    moveBy() { return 1; }

    update() {
      var diff = Math.abs(this.y - ball.y);
      var y = this.y + Paddle.height()/2;

      if (this.y > ball.y && y > ball.y) {
        diff > this.moveBy() ? this.move(-this.moveBy()) : this.move(-diff);
      }
      else if (this.y < ball.y && y < ball.y) {
        diff > this.moveBy() ? this.move(this.moveBy()) : this.move(diff);
      }
    }
  } // COMPUTERPADDLE

  //////////////////
  class Ball {
  //////////////////
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.randomizeVelocity();
    }

    normalServeAngle(x) {
      x += 90; // 0 degrees points right
      return (x >= 55 && x <= 125) || (x >= 235 && x <= 305)
    }
    randomizeVelocity() {
      // starting angle is random
      var count = 0;
      this.angle = 1000;
      // get to a normal serving angle (non-obtuse)
      while (++count < 100 && !this.normalServeAngle(this.angle)) {
        // degrees
        this.angle = Math.floor(Math.random() * 360);
      }
      // radians
      this.angle = this.degToRad(this.angle);
      // speed of ball range
      var max = 45, min = 45;
      // starting speed is semi-random
      this.speed = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static radius() { return 10; }
    // util functions
    degToRad(deg) { return deg * Math.PI / 180; }
    radToDeg(rad) { return rad * 180 / Math.PI; }

    // delta .x for this angle
    deltaX() { return Math.cos(this.angle) * (this.speed / 10); }
    // delta y for this angle
    deltaY() { return Math.sin(this.angle) * (this.speed / 10); }
    // move x
    xPlusDelta() { return this.x + this.deltaX(); }
    // move y
    yPlusDelta() { return this.y + this.deltaY(); }

    clearBall() {
      var r = Ball.radius();
      context.clearRect(this.x-r-1, this.y-r-1, r*2+2, r*2+2);
    }

    move() {
      collision.detectCollision();

      this.x = this.xPlusDelta();
      this.y = this.yPlusDelta();
    }

    render() {
      this.drawBall();
    }

    drawBall() {
      this.drawBallSprite();
    }

    drawBallSprite() {
      context.drawImage(
        ballSprite.image,
        this.x-Ball.radius(),
        this.y-Ball.radius(),
        ballSprite.width,
        ballSprite.height);
    }
  } // BALL

  //////////////////
  class Collision {
  //////////////////
    paddleCollision(x, y, r) {
      var pad = Ball.radius() * 0.4;
      return y >= pPaddle.y-pad && y <= pPaddle.y+Paddle.height()+pad && x-r < 0+Paddle.width() // player's
          || y >= cPaddle.y-pad && y <= cPaddle.y+Paddle.height()+pad && x+r > cWidth-Paddle.width(); // computers
    }
    xWallCollision(x, r) { return x-r < 0 || x+r > cWidth; }
    yWallCollision(y, r) { return y-r < 0 || y+r > cHeight; }
    xBounceAngle() { ball.angle = ball.degToRad(180 - ball.radToDeg(ball.angle)); }
    yBounceAngle() { ball.angle = ball.degToRad(360 - ball.radToDeg(ball.angle)); }

    detectCollision() {
      // this is where the ball wants to go to
      var x = ball.xPlusDelta();
      var y = ball.yPlusDelta();
      var r = Ball.radius();

      // collision with paddle? Bounce.
      if (this.paddleCollision(x, y, r)) {
        this.xBounceAngle();
      }
      // Scoring wall collision...+1 score and stop
      else if (this.xWallCollision(x, r)) {
        // Player didn't hit ball
        if (x - r < 0 || x + r > cWidth) {
          // SCORE SCORE SCORE
          // note the score
          if (x -r < 0) cPaddle.scored();
          else pPaddle.scored();

          // stop play and move ball to center of midline
          stop = true;
          ball.x = cWidth / 2;
          ball.y = cHeight / 2;
          // random direction and speed
          ball.randomizeVelocity();
        }
      }
      // top/bottom collision, bounce
      else if (this.yWallCollision(y, r)) {
        this.yBounceAngle();
      }
    }
  } // COLLISION

  //////////////////
  class Sprite {
  //////////////////
    constructor(image, width, height) {
      this.image = image;
      this.width = width;
      this.height = height;
    }
  } // Sprite

  //////////////////
  document.addEventListener("DOMContentLoaded", function(event) {
  //////////////////
    // animate
    function step() {
      // at start of game/end of game? don't animate
      if (!stop) {
        ball.move();
        cPaddle.update()
      }
      background.render();
      pPaddle.render();
      cPaddle.render();
      ball.render();

      requestAnimationFrame(step);
    }

    function clearWonLost() {
      document.getElementById("you-won").style.display = "none";
      document.getElementById("you-lost").style.display = "none";
    }

    function centerPaddles() {
      pPaddle.x = 0;
      pPaddle.y = (cHeight-Paddle.height()) / 2;

      cPaddle.x = cWidth-Paddle.width();
      cPaddle.y = (cHeight-Paddle.height()) / 2;
    }

    // build canvas
    canvas = document.getElementById("canvas");
    canvas.width = cWidth;
    canvas.height = cHeight;
    context = canvas.getContext("2d");

    // move player's paddle on keydown
    window.addEventListener('keydown', function(event) {
      if (gameOver) {
        gameOver = false;
        stop = true;
        cPaddle.score = 0;
        pPaddle.score = 0;
        clearWonLost();
        background.whichSideScored(Side.NONE);
        centerPaddles();
        return;
      }
      switch(event.keyCode) {
        case 32: //spacebar
          stop = false; // start play
          break;
        case 38: //up
          pPaddle.move(-10);
          break;
        case 40: //down
          pPaddle.move(10);
          break;
      }
    });

    // start game on click
    window.addEventListener('click', function(event) {
      if (gameOver) return;

      stop = false;
    });

    // create paddles and ball
    pPaddle = new Paddle(0, (cHeight-Paddle.height())/2);
    cPaddle = new ComputerPaddle(cWidth-Paddle.width(), (cHeight-Paddle.height())/2);
    ball = new Ball((cWidth-Ball.radius()*2)/2, (cHeight-Ball.radius()*2)/2);
    collision = new Collision();
    background = new Background();
    clearWonLost();

    var xy = Ball.radius()*2;
    var img = new Image(xy, xy);
    img.src = 'images/ball.png';
    ballSprite = new Sprite(img, xy, xy);

    // get animation frame
    window.requestAnimationFrame(step) || function(step) {
      window.setTimeout(step, 1000/60);
    }
  });
})();
