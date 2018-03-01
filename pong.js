(function() {
  var canvas = null;
  var context = null;
  var animate = null;
  var pPaddle, cPaddle, ball;
  var cWidth = 480, cHeight = 300;
  var stop = true;

  class Paddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static height() {
      return 40;
    }

    static width() {
      return 10;
    }

    move(x, y) {
      context.clearRect(this.x, this.y, Paddle.width(), Paddle.height());
      // move coords
      this.x += x;
      this.y += y;

      // don't let paddle get beyond bounds
      if (this.y < 0) this.y = 0
      else if (this.y > cHeight - Paddle.height()) this.y = cHeight - Paddle.height();

      // update testing info
      document.getElementById("coords").innerHTML = "coord: " + this.x + ", " + this.y;
    }

    render() {
      context.fillStyle = 'blue';
      context.fillRect(this.x, this.y, Paddle.width(), Paddle.height());
    }
  }

  class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // starting angle is random
        this.angle = this.degToRad(Math.floor(Math.random() * 360));
        var max = 35, min = 10;
        // starting speed is semi-random
        this.speed = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    degToRad(deg) {
      return deg * Math.PI / 180;
    }

    radToDeg(rad) {
      return rad * 180 / Math.PI;
    }

    static radius() {
      return 5;
    }
    // vector.x for this angle
    getX() {
      return Math.cos(this.angle) * (this.speed / 10);
    }
    // vector.y for this angle
    getY() {
      return Math.sin(this.angle) * (this.speed / 10);
    }
    // move x
    xPlusDelta() {
      return this.x + this.getX();
    }
    // move y
    yPlusDelta() {
      return this.y + this.getY();
    }

    paddleCollision(x, y, r) {
      return y >= pPaddle.y && y <= pPaddle.y+Paddle.height() && x-r < 0+Paddle.width() // person's
          || y >= cPaddle.y && y <= cPaddle.y+Paddle.height() && x+r > cWidth-Paddle.width(); // computers
    }

    xWallCollision(x, r) {
      return x-r < 0 || x+r > cWidth;
    }

    yWallCollision(y, r) {
      return y-r < 0 || y+r > cHeight;
    }

    xBounceAngle() {
      this.angle = this.degToRad(180 - this.radToDeg(this.angle));
    }

    yBounceAngle() {
      this.angle = this.degToRad(360 - this.radToDeg(this.angle));
    }

    move() {
      // get rid of last ball
      context.clearRect(this.x-Ball.radius()-1, this.y-Ball.radius()-1, Ball.radius()*2+2, Ball.radius()*2+2);

      // show testing stuff
      document.getElementById("angle-speed").innerHTML = `a:${this.angle}, s:${this.speed}`

      // move ball
      var x = this.xPlusDelta();
      var y = this.yPlusDelta();
      var r = Ball.radius();

      // collision with paddle? We're good
      if (this.paddleCollision(x, y, r)) {
        this.xBounceAngle();
      }
      // collision with wall? Not good
      else if (this.xWallCollision(x, r)) {
        // Person didn't hit ball
        if (x - r < 0) {
          stop = true;
          ball.x = cWidth / 2;
          ball.y = cHeight / 2;
        }
        // for now, who cares if the ball hit computer's paddle! just bounce
        else {
          this.xBounceAngle();
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
  }

  document.addEventListener("DOMContentLoaded", function(event) {
    // animate
    function step() {
      // at start of game/end of game? don't animate
      if (!stop) ball.move();

      pPaddle.render();
      cPaddle.render();
      ball.render();

      requestAnimationFrame(step);
    }

    // build canvas
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    // get animation frame
    window.requestAnimationFrame(step) || function(step) {
      window.setTimeout(step, 1000/60);
    }

    // move person's paddle on keydown
    window.addEventListener('keydown', function(event) {
      switch(event.keyCode) {
        case 38: //up
          pPaddle.move(0, -10);
          break;
        case 40: //down
          pPaddle.move(0, 10);
          break;
      }
    });

    // start game on click
    window.addEventListener('click', function(event) {
      stop = false;
    });

    // create paddles and ball
    pPaddle = new Paddle(0, (cHeight-Paddle.height())/2);
    cPaddle = new Paddle(cWidth-Paddle.width(), (cHeight-Paddle.height())/2);
    ball = new Ball((cWidth-Ball.radius()*2)/2, (cHeight-Ball.radius()*2)/2);

    // get first animation frame
    requestAnimationFrame(step);
  });
})();
