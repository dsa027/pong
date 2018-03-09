(function() {
  var cWidth = 480, cHeight = 300; // screen dimesions
  var canvas = null;
  var context = null;
  var canvasRect = null; // dims where the canvas is on the page
  var collisions = null;  // collision detection system
  var background = null;  // background object
  var pPaddle, cPaddle, ball; // game playing elements
  var easy, medium, hard; // levels
  var pKbd = false, computer = true; // using kbd=true or mouse=false; person/computer
  var ballSprite, paddleSprite, pMouseSprite, pKbdSprite,
      cMouseSprite, cKbdSprite, playerSprite, computerSprite; // game sprites
  var stop = true; // stop play (don't animate moving objects)
  var gameOver = false; //

  var Side = {'COMPUTER': 'COMPUTER', 'PLAYER': 'PLAYER', 'NONE': 'NONE'};
  var Input = {'MOUSE': 'MOUSE', 'KBD': 'KBD', 'NONE': 'NONE'};
  var Level = {'EASY': 'EASY', 'MEDIUM': 'MEDIUM', 'HARD': 'HARD', 'NONE': 'NONE'};
  var LevelTitles = {'EASY': 'Easy', 'MEDIUM': 'Medium', 'HARD': 'Hard', 'NONE': 'None'};
  var level = Level.EASY;
  var maxScore = 11; //

  //////////////////
  class Button {
  //////////////////
    constructor(x, y, color, text, size) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.text = text;
      this.size = size;
      this.selected = false;

      context.font = `${size}px sans-serif`;
      this.textLength = context.measureText(text).width;
    }

    select() {
      this.selected = true;
    }

    unselect() {
      this.selected = false;
    }

    render() {
      context.beginPath();
      context.rect(this.x-3, this.y-3, this.textLength+6, this.size+6);
      context.lineWidth = this.selected ? 4 : 1;
      context.strokeStyle = this.color;
      context.stroke();

      context.font = `${this.size}px sans-serif`;
      context.fillStyle = 'white';
      context.fillText(this.text, this.x, this.y+this.size-2);
    }
  }

  //////////////////
  class Flash {
  //////////////////
    constructor(interval) {
      this.flashInterval = interval;
      this.flashCount = 0;
      this.flashing = true;
    }

    check() {
      if (++this.flashCount >= this.flashInterval) {
        this.flashCount = 0;
        this.flashing = !this.flashing;
      }

      return this.flashing;
    }
  }

  //////////////////
  class Background {
  //////////////////
    constructor() {
      var image = new Image(cWidth, cHeight);
      image.src = 'images/bg.png';
      this.sprite = new Sprite(image, cWidth, cHeight);
      this.justScored = Side.NONE;
      this.gameOverFlash = new Flash(30);
    }

    render() {
      // background sprite
      context.drawImage(this.sprite.image, 0, 0, this.sprite.width, this.sprite.height);

      // player1/player2 or player/computer
      this.showTitles();

      // easy, medium, hard
      this.showLevelIcons();

      // player2 or computer
      this.showComputerAndPlayerIcons();

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

    /**************************************************************
    /* Show Easy, Medium, and Hard levels
     **************************************************************/
    showLevelIcons() {
      easy.render();
      medium.render();
      hard.render();
    }

    getLevelDims() {
      return {
        0: {x: easy.x, y: easy.y, w: easy.textLength, h: easy.size},
        1: {x: medium.x, y: medium.y, w: medium.textLength, h: medium.size},
        2: {x: hard.x, y: hard.y, w: hard.textLength, h: hard.size}
      }
    }

    /**************************************************************
    /* Show Computer or Player select
     **************************************************************/
    showComputerAndPlayerIcons() {
      var fontSize = 32;
      context.font = `${fontSize}px sans-serif`;
      context.fillStyle = 'white';

      var p = this.getVsDims();
      this.selectVsImage(computerSprite.image, playerSprite.image, computer);

      context.drawImage(computerSprite.image, p[0].x, p[0].y, p[0].w, p[0].h);
      context.fillText("/", p[1].x-7, p[1].y+fontSize-8);
      context.drawImage(playerSprite.image, p[1].x, p[1].y, p[1].w, p[1].h);
    }

    selectVsImage(imgComputer, imgPlayer, computer) {
      imgComputer.src = computer ? 'images/computer_on.png' : 'images/computer_off.png';
      imgPlayer.src = computer ? 'images/player_off.png' : 'images/player_on.png';
    }

    getVsDims() {
      return {
        0: {x: cWidth*5/6, y: 3, w: computerSprite.width, h: computerSprite.height},
        1: {x: cWidth*5/6+playerSprite.width+12, y: 3, w: playerSprite.width, h: playerSprite.height}
      }
    }

    /**************************************************************
    /* Show Mouse or Keyboard selects
     **************************************************************/
    getKeyMousePad() {
      return 15;
    }

    showKbdMouse(side, p) {
      var fontSize = 32;
      context.font = `${fontSize}px sans-serif`;
      context.fillStyle = 'white';

      var mouse = (side === Side.PLAYER) ? pMouseSprite.image : cMouseSprite.image;
      var kbd = (side === Side.PLAYER) ? pKbdSprite.image : cKbdSprite.image;

      this.selectKbdMouseImage(mouse, kbd, (side === Side.PLAYER ? pKbd : !pKbd));

      context.drawImage(mouse, p[0].x, p[0].y, p[0].w, p[0].h);
      context.fillText("/", p[0].x+p[0].w+1, p[0].y+p[0].h);
      context.drawImage(kbd, p[1].x, p[1].y, p[1].w, p[1].h);
    }

    getPlayerInputDims() {
      return {
        0: {x: cWidth/6, y: cHeight - pMouseSprite.height - 5, w: pMouseSprite.width, h: pMouseSprite.height},
        1: {x: cWidth/6+this.getKeyMousePad()+pMouseSprite.width, y: cHeight - pKbdSprite.height - 5, w: pKbdSprite.width, h: pKbdSprite.height}
      };
    }
    getComputerInputDims() {
      return {
        0: {x: cWidth*4/6, y: cHeight - cMouseSprite.height - 5, w: cMouseSprite.width, h: cMouseSprite.height},
        1: {x: cWidth*4/6+this.getKeyMousePad()+cMouseSprite.width, y: cHeight - cKbdSprite.height - 5, w: cKbdSprite.width, h: cKbdSprite.height}
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
      // don't show elements unless flashing === true
      if (!this.gameOverFlash.check()) return;

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
      if (!val) { // read
        return this.justScored
      }
      else {  // write
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

    static height() {
      return level === Level.EASY ? 80 : level === Level.MEDIUM ? 40 : 20;
    }
    static width() {
      return 10;
    }

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

    move(y) {
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
    moveBy() { return level === Level.EASY ? 1 : level === Level.MEDIUM ? 2 : 3; }

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
        this.selectVelocity();
    }

    resetBall() {
      ball.x = cWidth / 2;
      ball.y = cHeight / 2;
      // random direction and speed
      this.selectVelocity();//ball.selectVelocity();
    }

    normalServeAngle(x) {
      x += 90; // 0 degrees points right
      return (x >= 55 && x <= 125) || (x >= 235 && x <= 305)
    }
    selectSpeed() {
      // speed of ball range
      this.speed = level === Level.EASY ? 3 : level === Level.MEDIUM ? 7 : 10;
    }
    selectVelocity() {
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

      this.selectSpeed();
    }

    static radius() { return 10; }
    // util functions
    degToRad(deg) { return deg * Math.PI / 180; }
    radToDeg(rad) { return rad * 180 / Math.PI; }

    // delta .x for this angle
    deltaX() { return Math.cos(this.angle) * (this.speed); }
    // delta y for this angle
    deltaY() { return Math.sin(this.angle) * (this.speed); }
    // move x
    xPlusDelta() { return this.x + this.deltaX(); }
    // move y
    yPlusDelta() { return this.y + this.deltaY(); }

    move() {
      collision.detectCollision();

      this.x = this.xPlusDelta();
      this.y = this.yPlusDelta();
    }

    render() {
      this.drawBall();
    }

    drawBall() {
      context.drawImage (
        ballSprite.image,
        this.x-Ball.radius(),
        this.y-Ball.radius(),
        ballSprite.width,
        ballSprite.height
      );
    }
  } // BALL

  //////////////////
  class Collision {
  //////////////////
    constructor(lScored, rScored) {
      this.lScored = lScored;
      this.rScored = rScored;

      // sounds
      this.pSound = new Audio('sounds/ping1.wav');
      this.cSound = new Audio('sounds/ping2.wav');

      this.resetHitCount();
    }

    resetHitCount() {
      this.pHitCount = 0;
      this.cHitCount = 0;
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
        if (x - r < 0 + Paddle.width()) {
          this.pSound.play();
          this.pHitCount++;  // for speeding up ball on every hit
        }
        else {
          this.cSound.play();
          this.cHitCount++;
        }

        // increase speed at every paddle hit in medium and hard level
        if (this.pHitCount > 5) {
          ball.speed += 0.25;
        }

        this.xBounceAngle();
      }
      // Scoring wall collision...+1 score and stop
      else if (this.xWallCollision(x, r)) {
        // Player didn't hit ball
        if (x - r < 0 || x + r > cWidth) {
          // SCORE SCORE SCORE
          if (x - r < 0) {
            this.rScored.call(cPaddle);
          }
          else {
            this.lScored.call(pPaddle);
          }

          // stop play and move ball to center of midline
          stop = true;
          collision.resetHitCount();
          ball.resetBall();
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
      this.lastY = -1;

      // is (x,y) in rect p:(x,y,w,h)?
      function isIn(x, y, p) {
        if (x >= p.x
            && x <= p.x + p.w
            && y >= p.y
            && y <= p.y + p.h) {
          return true;
        }

        return false;
      }
      // is x,y in rect p?
      function clickInRect(x, y, p, type) {
        var types = Object.entries(type);
        var ps = Object.entries(p);
        // for each entry in p (each p is a button/screen element)
        for (var i = 0; i < ps.length; i++) {
          if (isIn(x, y, ps[i][1])) {
            // yes, clicked in this element, return element type
            return types[i][0];
          }
        }
        return type.NONE;
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

      function checkForInputSelect(x, y) {
        var cInput = null;
        var pInput = clickInRect(x, y, background.getPlayerInputDims(), Input);
        // player clicked on mouse or kbd
        if (pInput !== Input.NONE) {
          selectInput(Side.PLAYER, pInput);
          return true;
        }
        else {
          cInput = clickInRect(x, y, background.getComputerInputDims(), Input);
          // computer clicked on mouse or kbd
          if (cInput !== Input.NONE) {
            selectInput(Side.COMPUTER, cInput);
            return true;
          }
        }

        return false;
      }

      function checkForVsSelect(x, y) {
        var side = clickInRect(x, y, background.getVsDims(), Side);
        if (side !== Side.NONE) {
          selectVs(side);
          return true;
        }

        return false;
      }

      function checkForLevelSelect(x, y) {
        function getLevelButton(x, y) {
          return button = level === Level.EASY ? easy : level === Level.MEDIUM ? medium : hard;
        }
        function selectLevel() {
          getLevelButton().select(x, y);
        }
        function unselectLevel() {
          getLevelButton().unselect(x, y);
        }

        // level easy, medium, hard
        var lev = clickInRect(x, y, background.getLevelDims(), Level);
        if (lev !== Level.NONE) {
          unselectLevel();
          level = lev;
          selectLevel();
          ball.selectSpeed();
          return true;
        }

        return false;
      }

      // start game on click, or click on canvas elements
      window.addEventListener('click', function(event) {
        canvasRect = canvas.getBoundingClientRect();
        var x = event.clientX - canvasRect.left;
        var y = event.clientY - canvasRect.top;

        // mouse/kbd select
        var buttonSelected = checkForInputSelect(x, y);

        // computer or player select
        if (!buttonSelected) {
          buttonSelected = checkForVsSelect(x, y);
        }

        // game level
        if (!buttonSelected) {
          buttonSelected = checkForLevelSelect(x, y);
        }

        // ignore click events if game over
        if (!buttonSelected) {
          if (gameOver) return;
          stop = false;         // start play
        }
      });
    }

    function mouseMoveListener() {
      window.addEventListener('mousemove', function(event) {
        // if computer has the mouse and playing computer, leave
        if (pKbd && computer) return;

        var paddle = pKbd ? cPaddle : pPaddle;
        var dir = event.screenY - this.lastY;
        paddle.move(dir > 0 ? 10 : dir === 0 ? 0 : -10);
        this.lastY = event.screenY;
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

      //computer or player 2
      var imgComputer = new Image(25, 25);
      computerSprite = new Sprite(imgComputer, 25, 25);
      //player 2
      var imgPlayer = new Image(25, 25);
      playerSprite = new Sprite(imgPlayer, 25, 25);
      // get images
      background.selectVsImage(imgComputer, imgPlayer, computer);

      //easy, medium, hard
      easy = new Button(0, 12, 'palegreen', LevelTitles.EASY, 12);
      medium = new Button(0, 12, 'yellow', LevelTitles.MEDIUM, 12);
      hard = new Button(0, 12, 'red', LevelTitles.HARD, 12);
      // need to create buttons first, then figure x out after because new sets textLength
      var start = (cWidth - (easy.textLength + medium.textLength + hard.textLength + 40)) / 2;
      easy.x = start;
      medium.x = start + easy.textLength + 20;
      hard.x = medium.x + medium.textLength + 20;
      easy.selected = true;

      // create collision detection
      collision = new Collision(pPaddle.scored, cPaddle.scored);
    }

    ///////////////////////////////////
    // do the work
    ///////////////////////////////////
    buildCanvas();
    createGameElements();
    addListeners();
    clearWonLost();
    // run step() at every animation frame, god help us otherwise
    window.requestAnimationFrame(step) || function(step) {
      window.setTimeout(step, 1000/60);
    }
  });
})();
