(function() {
  var canvas = null;
  var context = null;
  var canvasRect = null; // dims where the canvas is on the page
  var collisions = null;  // collision detection system
  var background = null;  // background object
  var pPaddle, cPaddle, ball; // game playing elements
  var pKbd = false, computer = true; // using kbd=true or mouse=false; person/computer
  var ballSprite, paddleSprite, pMouseSprite, pKbdSprite,
      cMouseSprite, cKbdSprite, playerSprite, computerSprite; // game sprites
  var cWidth = 480, cHeight = 300; // screen dimesions
  var stop = true; // stop play (don't animate moving objects)
  var gameOver = false; //
  var flashInterval = 30; // flashing text at this fps
  var flashing = true;  // are we showing text now?
  var flashCount = 0; // how long we have been within a flashInterval
  var lastY = -1; // for mouse, where we were at last mouse move on y axis

  var Side = {'COMPUTER': 'computer', 'PLAYER': 'player', 'NONE': 'none'}
  var Input = {'MOUSE': 'mouse', 'KBD': 'kbd', 'NONE': 'none'}
  var maxScore = 11; //

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
      // background sprite
      context.drawImage(this.sprite.image, 0, 0, this.sprite.width, this.sprite.height);

      // player1/player2 or player/computer
      this.showTitles();

      // player2 or computer
      this.showVsIcons();

      // mouse/kbd
      this.showInputIcons();

      this.showScore();

      if (gameOver) {
        this.showGameOver();
      }
      else if (stop) {
        this.showClickToStart();
      }
    }

    getKMPad() {
      return 15;
    }

    showVsIcons() {
      var fontSize = 32;
      context.font = `${fontSize}px sans-serif`;
      context.fillStyle = 'white';

      var p = this.getVsDims();
      this.selectVsImage(computerSprite.image, playerSprite.image, computer);

      context.drawImage(computerSprite.image, p.cx, p.cy, p.cw, p.ch);
      context.fillText("/", p.px-7, p.py+fontSize-8);
      context.drawImage(playerSprite.image, p.px, p.py, p.pw, p.ph);
    }

    selectVsImage(imgComputer, imgPlayer, computer) {
      imgComputer.src = computer ? 'images/computer_on.png' : 'images/computer_off.png';
      imgPlayer.src = computer ? 'images/player_off.png' : 'images/player_on.png';
    }

    getVsDims() {
      return {
        cx: cWidth*5/6, cy: 3, cw: computerSprite.width, ch: computerSprite.height,
        px: cWidth*5/6+playerSprite.width+12, py: 3, pw: playerSprite.width, ph: playerSprite.height
      }
    }

    showKbdMouse(side, p) {
      var fontSize = 32;
      context.font = `${fontSize}px sans-serif`;
      context.fillStyle = 'white';

      var mouse = (side === Side.PLAYER) ? pMouseSprite.image : cMouseSprite.image;
      var kbd = (side === Side.PLAYER) ? pKbdSprite.image : cKbdSprite.image;

      this.selectKbdMouseImage(mouse, kbd, (side === Side.PLAYER ? pKbd : !pKbd));

      context.drawImage(mouse, p.mx, p.my, p.mw, p.mh);
      context.fillText("/", p.mx+p.mw+1, p.my+p.mh);
      context.drawImage(kbd, p.kx, p.ky, p.kw, p.kh);
    }

    getPlayerInputDims() {
      return {
        mx: cWidth/6, my: cHeight - pMouseSprite.height - 5, mw: pMouseSprite.width, mh: pMouseSprite.height,
        kx: cWidth/6+this.getKMPad()+pMouseSprite.width, ky: cHeight - pKbdSprite.height - 5, kw: pKbdSprite.width, kh: pKbdSprite.height
      };
    }
    getComputerInputDims() {
      return {
        mx: cWidth*4/6, my: cHeight - cMouseSprite.height - 5, mw: cMouseSprite.width, mh: cMouseSprite.height,
        kx: cWidth*4/6+this.getKMPad()+cMouseSprite.width, ky: cHeight - cKbdSprite.height - 5, kw: cKbdSprite.width, kh: cKbdSprite.height
      };
    }

    showInputIcons() {
      // Player
      var p = this.getPlayerInputDims();
      this.showKbdMouse(Side.PLAYER, p);
      // Computer
      var p = this.getComputerInputDims();
      this.showKbdMouse(Side.COMPUTER, p);
    }

    selectKbdMouseImage(imgMouse, imgKbd, kbd) {
      imgKbd.src = kbd ? 'images/kbd_on.png' : 'images/kbd_off.png';
      imgMouse.src = kbd ? 'images/mouse_off.png' : 'images/mouse_on.png';
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
    }

    showTitles() {
      context.font = '30px Arial';
      context.fillStyle = 'white';

      var cStringWidth = context.measureText(computer ? "Computer" : "Player 2").width;

      context.fillText(computer ? "Player" : "Player 1", 25, 50);
      context.fillText(computer ? "Computer" : "Player 2", cWidth-cStringWidth-25, 50);
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
        var elem = document.getElementById("you-won");
        if (side === Side.PLAYER) {
          elem.innerHTML = computer ? "You Won!!!" : "Player 1 Won!!!";
          elem.style.display = "block";
        }
        else {
          elem.innerHTML = computer ? "You Lost!!!" : "Player 2 Won!!!";
          elem.style.display = "block";
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
      // if player2, don't update computer paddle
      if (!computer) return;

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
    constructor(lScoredCallback, rScoredCallback, randomizeCallback) {
      this.lScoredCallback = lScoredCallback;
      this.rScoredCallback = rScoredCallback;
      this.randomizeCallback = randomizeCallback;
    }

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
          if (x - r < 0) this.rScoredCallback.call(cPaddle);//cPaddle.scored();
          else this.lScoredCallback.call(pPaddle);//pPaddle.scored();

          // stop play and move ball to center of midline
          stop = true;
          ball.x = cWidth / 2;
          ball.y = cHeight / 2;
          // random direction and speed
          this.randomizeCallback.call(ball);//ball.randomizeVelocity();
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

    function buildCanvas() {
      // build canvas
      canvas = document.getElementById("canvas");
      canvas.width = cWidth;
      canvas.height = cHeight;
      context = canvas.getContext("2d");
    }

    function kbdListener() {
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
        // if computer has the keyboard and playing computer, leave
        if (!pKbd && computer) return;

        var paddle = pKbd ? pPaddle : cPaddle;

        switch(event.keyCode) {
          case 32: //spacebar
            stop = false; // start play
            break;
          case 38: //paddle up
            paddle.move(-10);
            break;
          case 40: //paddle down
            paddle.move(10);
            break;
        }
      });
    }

    function mouseClickListener() {
      function clickInputInRange(x, y, p) {
        if (x >= p.mx && x <= p.mx+p.mw && y >= p.my && y <= p.my+p.mh) return Input.MOUSE
        else if (x >= p.kx && x <= p.kx+p.kw && y >= p.ky && y <= p.ky+p.kh) return Input.KBD;
        return Input.NONE;
      }

      function clickVsInRange(x, y, p) {
        if (x >= p.cx && x <= p.cx+p.cw && y >= p.cy && y <= p.cy+p.ch) return Side.COMPUTER
        else if (x >= p.px && x <= p.px+p.pw && y >= p.py && y <= p.py+p.ph) return Side.PLAYER;
        return Side.NONE;
      }

      function selectInput(side, input) {
        if (side === Side.PLAYER) {
          pKbd = input === Input.KBD;
        }
        else {
          pKbd = input !== Input.KBD;
        }
      }

      function selectVs(side) {
        computer = side === Side.COMPUTER;
      }

      // start game on click
      window.addEventListener('click', function(event) {
        // mouse/kbd select
        canvasRect = canvas.getBoundingClientRect();
        var x = event.clientX - canvasRect.left;
        var y = event.clientY - canvasRect.top;

        var cInput = null;
        var pInput = clickInputInRange(x, y, background.getPlayerInputDims());
        // player clicked on mouse or kbd
        if (pInput !== Input.NONE) {
          selectInput(Side.PLAYER, pInput);
          return;
        }
        else {
          cInput = clickInputInRange(x, y, background.getComputerInputDims());
          // computer clicked on mouse or kbd
          if (cInput !== Input.NONE) {
            selectInput(Side.COMPUTER, cInput);
            return;
          }
        }

        // computer or player select
        var side = clickVsInRange(x, y, background.getVsDims());
        if (side !== Side.NONE) {
          selectVs(side);
          return;
        }

        // ignore click events if game over
        if (gameOver) return;

        stop = false;         // start play
      });
    }

    function mouseMoveListener() {
      window.addEventListener('mousemove', function(event) {
        // if computer has the mouse and playing computer, leave
        if (pKbd && computer) return;

        var paddle = pKbd ? cPaddle : pPaddle;
        var dir = event.screenY - lastY;
        paddle.move(dir > 0 ? 10 : dir === 0 ? 0 : -10);
        lastY = event.screenY;
      });
    }

    function addListeners() {
      kbdListener();
      mouseClickListener();
      mouseMoveListener();
    }

    function createGameElements() {
      // create paddles and ball
      pPaddle = new Paddle(0, (cHeight-Paddle.height())/2);
      cPaddle = new ComputerPaddle(cWidth-Paddle.width(), (cHeight-Paddle.height())/2);
      ball = new Ball((cWidth-Ball.radius()*2)/2, (cHeight-Ball.radius()*2)/2);

      // bg
      background = new Background();

      // ball sprite
      var xy = Ball.radius()*2;
      var imgBall = new Image(xy, xy);
      imgBall.src = 'images/ball.png';
      ballSprite = new Sprite(imgBall, xy, xy);

      // player mouse sprite
      var imgMouse = new Image(25, 25);
      pMouseSprite = new Sprite(imgMouse, 25, 25);
      // player kbd sprite
      var imgKbd = new Image(25, 25);
      pKbdSprite = new Sprite(imgKbd, 25, 25);
      // get images
      background.selectKbdMouseImage(imgMouse, imgKbd, pKbd);

      // computer mouse sprite
      imgMouse = new Image(25, 25);
      cMouseSprite = new Sprite(imgMouse, 25, 25);
      // computer kbd sprite
      imgKbd = new Image(25, 25);
      cKbdSprite = new Sprite(imgKbd, 25, 25);
      // get images
      background.selectKbdMouseImage(imgMouse, imgKbd, !pKbd);

      //computer
      var imgComputer = new Image(25, 25);
      computerSprite = new Sprite(imgComputer, 25, 25);
      //player
      var imgPlayer = new Image(25, 25);
      playerSprite = new Sprite(imgPlayer, 25, 25);
      // get images
      background.selectVsImage(imgComputer, imgPlayer, computer);

      // create collision detection
      collision = new Collision(pPaddle.scored, cPaddle.scored, ball.randomizeVelocity);
    }

    ///////////////////////////////////
    // do the work
    ///////////////////////////////////
    buildCanvas();
    addListeners();
    createGameElements();
    clearWonLost();
    // run step() at every animation frame, god help us otherwise
    window.requestAnimationFrame(step) || function(step) {
      window.setTimeout(step, 1000/60);
    }
  });
})();
