(function() {
  var canvas = null;
  var context = null;
  var animate = null;
  var pPaddle, cPaddle;
  var cWidth = 480, cHeight = 300;

  class Paddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static height() {
      return 20;
    }

    static width() {
      return 10;
    }

    move(x, y) {
      context.clearRect(this.x, this.y, Paddle.width(), Paddle.height());
      this.x += x;
      this.y += y;

      if (this.y < 0) this.y = 0
      else if (this.y > cHeight - Paddle.height()) this.y = cHeight - Paddle.height();

      var el = document.getElementById("xyz");
      el.innerHTML = "coord: " + this.x + ", " + this.y;
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
    }

    static radius() {
      return 10;
    }

    move(x, y) {
      this.x += x;
      this.y += y;
    }

    render() {
      var sAngle = 0 * Math.PI;
      var eAngle = 2 * Math.PI;
      var counterCW = false;

      context.fillStyle = 'black';
      context.beginPath();
      context.arc(this.x, this.y, Ball.radius(), sAngle, eAngle, counterCW);
      context.lineWidth = 5;
      context.strokeStyle = 'black';
      context.stroke();
      context.fill();
    }
  }

  document.addEventListener("DOMContentLoaded", function(event) {
    function step() {
      pPaddle.render();
      cPaddle.render();
      ball.render();
      requestAnimationFrame(step);
    }

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    window.requestAnimationFrame(step) || function(step) {
      window.setTimeout(step, 1000/60);
    }
    window.addEventListener('keydown', function(event) {
      switch(event.keyCode) {
        case 38: //up
          pPaddle.move(0, -5);
          break;
        case 40: //down
          pPaddle.move(0, 5);
          break;
      }
    });
    requestAnimationFrame(step);

    pPaddle = new Paddle(0, (cHeight-Paddle.height())/2);
    cPaddle = new Paddle(cWidth-Paddle.width(), (cHeight-Paddle.height())/2);
    ball = new Ball((cWidth-Ball.radius()*2)/2, (cHeight-Ball.radius()*2)/2);
  });
})();
