console.log("spline");
/*
const points = [
  { x: 500, y: 300 },
  { x: 528, y: 312 },
  { x: 556, y: 329 },
  { x: 575, y: 360 },
  { x: 579, y: 400 },
  { x: 566, y: 440 },
  { x: 534, y: 470 },
  { x: 490, y: 481 },
  { x: 442, y: 469 },
  { x: 405, y: 437 }
];
*/
let points = [];
var c = document.getElementById("myCanvas");
var b = document.getElementById("btn");
var ctx = c.getContext("2d");
const tension = 0.5;

function drawPoints(point) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
}
function drawLines(){
  ctx.moveTo(points[0].x,points[0].y);
  for(let i = 0; i <= points.length -1; i++){
    ctx.lineTo(points[i].x,points[i].y);
  }
}

function calc_b(p0,p1,p2,p3) {
  ctx.beginPath();
  //ctx.moveTo(p0.x,p0.y);
  for (let t = 0; t <= 1.01; t += 0.01) {
    //console.log(t);
    let x = tension *((2*p1.x)+ (-p0.x + p2.x)*t+(2*p0.x -5*p1.x+4*p2.x -p3.x)*t**2 + (-p0.x + 3*p1.x - 3*p2.x + p3.x)*t**3);
    let y = tension *((2*p1.y)+ (-p0.y + p2.y)*t+(2*p0.y -5*p1.y+4*p2.y -p3.y)*t**2 + (-p0.y + 3*p1.y - 3*p2.y + p3.y)*t**3);
    //console.log("x:" + x + "y:" + y);
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "blue";
  ctx.stroke();
}
let i = 0;
c.addEventListener("click",function(event){
  let x = event.offsetX;
  let y = event.offsetY;
  points.push({ x, y });
  drawPoints(points[i]);
  i++;
  console.log("foi");
})
b.addEventListener("click",function(event){
  drawLines();
  for(let i = -1 ; i <= points.length - 3 ; i++){
    console.log("fodase");
    if(i == -1){
      calc_b(points[0],points[0], points[1],points[2]);
    }else if (i == points.length - 3) {
      calc_b(points[i],points[i+1], points[i+2],points[i+2]);
    } else {
      calc_b(points[i],points[i+ 1], points[i + 2],points[i+3]); 
    }
  
  }
})


