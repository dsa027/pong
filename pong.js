(function() {
  var canvas = null;
  var context = null;
  var animate = null;
  var pPaddle, cPaddle, ball;
  var cWidth = 480, cHeight = 300;
  var stop = true;

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

    getScore() { return this.score; }
    scored() { this.score++; }

    move(y) {
      context.clearRect(this.x-1, this.y-1, Paddle.width()+2, Paddle.height()+2);
      // move coords
      this.y += y;

      // don't let paddle get beyond bounds
      if (this.y < 0) this.y = 0
      else if (this.y > cHeight - Paddle.height()) this.y = cHeight - Paddle.height();
    }

    render() {
      context.fillStyle = 'blue';
      context.fillRect(this.x, this.y, Paddle.width(), Paddle.height());
    }
  } // PADDLE

  //////////////////
  class ComputerPaddle extends Paddle {
  //////////////////
    constructor(x, y) {
      super(x, y);
    }
    moveBy() { return 2; }

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
      // degrees
      while (++count < 100 && !this.normalServeAngle(this.angle)) {
        this.angle = Math.floor(Math.random() * 360);
      }
      // radians
      this.angle = this.degToRad(this.angle);

      var max = 45, min = 20;
      // starting speed is semi-random
      this.speed = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static radius() { return 5; }
    // util functions
    degToRad(deg) { return deg * Math.PI / 180; }
    radToDeg(rad) { return rad * 180 / Math.PI; }

    // vector.x for this angle
    getX() { return Math.cos(this.angle) * (this.speed / 10); }
    // vector.y for this angle
    getY() { return Math.sin(this.angle) * (this.speed / 10); }
    // move x
    xPlusDelta() { return this.x + this.getX(); }
    // move y
    yPlusDelta() { return this.y + this.getY(); }

    paddleCollision(x, y, r) {
      return y >= pPaddle.y-2 && y <= pPaddle.y+Paddle.height()+2 && x-r < 0+Paddle.width() // person's
          || y >= cPaddle.y-2 && y <= cPaddle.y+Paddle.height()+2 && x+r > cWidth-Paddle.width(); // computers
    }
    xWallCollision(x, r) { return x-r < 0 || x+r > cWidth; }
    yWallCollision(y, r) { return y-r < 0 || y+r > cHeight; }
    xBounceAngle() { this.angle = this.degToRad(180 - this.radToDeg(this.angle)); }
    yBounceAngle() { this.angle = this.degToRad(360 - this.radToDeg(this.angle)); }

    showScore() {
      document.getElementById("score").innerHTML = `SCORE: You: ${pPaddle.getScore()}, Computer: ${cPaddle.getScore()}`
    }

    move() {
      // get rid of last ball
      context.clearRect(this.x-Ball.radius()-1, this.y-Ball.radius()-1, Ball.radius()*2+2, Ball.radius()*2+2);

      // move ball
      var x = this.xPlusDelta();
      var y = this.yPlusDelta();
      var r = Ball.radius();

      // collision with paddle? Bounce.
      if (this.paddleCollision(x, y, r)) {
        this.xBounceAngle();
      }
      // collision with wall? The other gets a point
      else if (this.xWallCollision(x, r)) {
        // Person didn't hit ball
        if (x - r < 0 || x + r > cWidth) {
          // SCORE SCORE SCORE
          // note the score
          if (x -r < 0) cPaddle.scored();
          else pPaddle.scored();
          // show the score
          this.showScore();

          // stop play and move ball to center of midline
          stop = true;
          ball.x = cWidth / 2;
          ball.y = cHeight / 2;
          // random direction and speed
          this.randomizeVelocity();
        }
      }
      // top/bottom collision, bounce
      else if (this.yWallCollision(y, r)) {
        this.yBounceAngle();
      }

      this.x = this.xPlusDelta();
      this.y = this.yPlusDelta();
    }

    render() {
      this.drawBall('black');
    }

    drawBall(color) {
      // all this to draw a ball
      var sAngle = 0 * Math.PI;
      var eAngle = 2 * Math.PI;
      var counterCW = false;

      context.fillStyle = color;
      context.beginPath();
      context.arc(this.x, this.y, Ball.radius(), sAngle, eAngle, counterCW);
      context.lineWidth = 1;
      context.strokeStyle = color;
      context.stroke();
      context.fill();
    }
  } // BALL

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
      pPaddle.render();
      cPaddle.render();
      ball.render();

      requestAnimationFrame(step);
    }

    // build canvas
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    // move person's paddle on keydown
    window.addEventListener('keydown', function(event) {
      switch(event.keyCode) {
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
      stop = false;
    });

    // create paddles and ball
    pPaddle = new Paddle(0, (cHeight-Paddle.height())/2);
    cPaddle = new ComputerPaddle(cWidth-Paddle.width(), (cHeight-Paddle.height())/2);
    ball = new Ball((cWidth-Ball.radius()*2)/2, (cHeight-Ball.radius()*2)/2);

    ball.showScore();

    // get animation frame
    window.requestAnimationFrame(step) || function(step) {
      window.setTimeout(step, 1000/60);
    }
  });
})();
