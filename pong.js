(function() {
  var canvas = null;
  var context = null;
  var pPaddle, cPaddle;
  var cWidth = 480, cHeight = 480;

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
        this.x = x
        this.y = y
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
        this.x = x;
        this.y = y;
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
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    pPaddle = new Paddle(0, (cHeight-Paddle.height())/2);
    cPaddle = new Paddle(cWidth-Paddle.width(), (cHeight-Paddle.height())/2);
    ball = new Ball((cWidth-Ball.radius()*2)/2, (cHeight-Ball.radius()*2)/2);

    document.getElementById("canvas").addEventListener('click', function() {
      pPaddle.render();
      cPaddle.render();
      ball.render();
    });
  });
})();
