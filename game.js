
/*
 *
 * Nazwa gry: 
 * Autor: Darknov
 * Strona: darknov.cba.pl
 * 
 *
 */


/*
 * Canvas
 */
var canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = window.innerWidth - 50;
canvas.height = window.innerHeight;

//zabezpieczenie przed zaznaczaniem tekstu na stronie
canvas.onmousedown = function(event){
    event.preventDefault();
};

var context = canvas.getContext('2d');

var height = canvas.height;
var width  = canvas.width;

var center = {
  x: width/2,
  y: height/2
};

/*
 * Podpięcie eventów do sterowania
 */

document.addEventListener('keydown',    onkeydown,   false);
document.addEventListener('keyup',      onkeyup,     false);
document.addEventListener('keypress',   onkeypressed,  false);

canvas.addEventListener('click',        onclick,     false);
canvas.addEventListener('mousemove',    onmousemove, false);

canvas.addEventListener('mousedown',    onmousedown, false);
canvas.addEventListener('mouseup',      onmouseup,   false);

/*
 * Obrazki
 */
var pathToImages = "images/";
var images = ["statek1"      , "statek2"    , "statek3"   , "pocisk1", 
              "laser1"       , "laser2"     , "laser3"    , "skala1", 
              "tlo1"         , "tlo2"       , "wybuch1"   , "wybuch2", 
              "wybuch3"      , "plomienbeta", "startgame" , "startgame2", 
              "options"      , "options2"   , "credits"   , "credits2",
              "zdrowie"      , "endless"    , "endless2"  , "experimental",
              "experimental2", "classic"    , "classic2"  , "belt",
              "boss1"        , "tlo3"
              ];
/*
 * Automatycznie wczytywanie obrazkow z listy
 */
(function loadImages(){
  for(var i = 0; i < images.length; i++){
    images[images[i]] = new Image();
    images[images[i]].src = pathToImages + images[i] + ".png";
  }
})();


/*
 * Mapa
 */

var map = {
    x: 3500,
    y: 3500,

    img: images["tlo3"],

    renderBackground: function(){
      var pat=context.createPattern(this.img,"repeat");
      context.rect(clamp(player.x - width/2,0,map.x - width),
                   clamp(player.y - height/2,0,map.y - height),width,height);
      context.fillStyle=pat;
      context.fill();
    }
};


/*
 * Sterowanie
 */
var keyboard = {
  w: false,
  s: false,
  a: false,
  d: false,
  enter: false,
  space: false,
  k1: false,
  k2: false,
  k3: false,
  k4: false,
  k5: false,
  k6: false,
  k7: false,
  k8: false,
  k9: false
};

var mouse = {
  x: 0,
  y: 0,

  leftButton: false,
  rightButton: false,

  getXOnCanvas: function(){
    return clamp(player.x - width/2 + this.x, this.x, map.x - width + this.x);
  },

  getYOnCanvas: function(){
    return clamp(player.y - height/2 + this.y, this.y, map.y - height + this.y);
  }
};

/*
 * Grafika
 */

var graphics = {

  /*
   * ustaw kamere na graczu
   */
  setCamera: function() {
    context.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
    context.clearRect(0, 0, width, height);//clear the viewport AFTER the matrix is reset

    //Clamp the camera position to the world bounds while centering the camera around the player                                             
    var camX = clamp(-player.x + width/2, - map.x + width,0);
    var camY = clamp(-player.y + height/2, - map.y + height,0);

    // var camX = -player.x + width/2;
    // var camY = -player.y + height/2;

    context.translate( camX, camY );
  },

  /*
   * Obroc dany obiekt do danego punktu
   */
  rotateTo: function(object, targetX, targetY){
    var dx = targetX - object.x;
    var dy = targetY - object.y;

    var radians = Math.atan2(dy,dx);
    context.save();
    context.translate(object.x, object.y);
    context.rotate(radians +  0.5 * Math.PI);
    context.drawImage(object.img, -(object.img.width/2), -(object.img.height/2));
    context.restore();
  }

}

/*
 * Funkcja do "zaczepiania" elementu na ekranie
 * aktualnie służy tylko do poruszania kamery za graczem
 */
function clamp(value, min, max){
    if(value < min) return min;
    else if(value > max) return max;
    return value;
}

/*
 * Obiekty w grze
 */

var gameObjects = [];
var gameObjectsIndependent = [];
var player;

/*
 * Gracz
 */

function Player(x,y){

  this.x = x;
  this.y = y;

  this.typeOfObject = "player";

  this.img = images["statek1"];

  this.maxHp = 500;
  this.hp = this.maxHp;

  this.bulletType = "type1";

  this.maxSpeed = 350;

  this.acceleration = 10;

  this.speedX = 0;

  this.speedY = 0;

  this.bulletDelay = 0.10;

  this.lastTimeBullet = 0;

  this.rotateToMouse = function(){
    graphics.rotateTo(this, mouse.getXOnCanvas(), mouse.getYOnCanvas());
  }

  /*
   * zmienia predkosc w poziomie i pionie
   */
  this.accelerate = function(){
    if (keyboard.w === true && this.maxSpeed > -this.speedY){
      this.speedY -= this.acceleration;

    } else if(keyboard.w === false && this.speedY < 0) {
      this.speedY += this.acceleration;      
    }

    if (keyboard.s === true && this.maxSpeed > this.speedY){
      this.speedY += this.acceleration;

    } else if(keyboard.s === false && this.speedY > 0) {
      this.speedY -= this.acceleration;
    }

    if (keyboard.a === true && this.maxSpeed > -this.speedX){
      this.speedX -= this.acceleration;

    } else if(keyboard.a === false && this.speedX < 0) {
      this.speedX += this.acceleration;      
    }

    if (keyboard.d === true && this.maxSpeed > this.speedX){
      this.speedX += this.acceleration;

    } else if(keyboard.d === false && this.speedX > 0) {
      this.speedX -= this.acceleration;      
    }
  }

  /*
   * poruszanie gracza
   */
  this.move = function(step){
    this.accelerate();
    if(this.x + this.speedX * step >= this.img.width/2 && 
       this.x + this.speedX * step <= map.x - this.img.width/2)
        this.x = this.x + this.speedX * step;
    else
        this.speedX = 0;
    if(this.y + this.speedY * step >= this.img.height/2 && 
       this.y + this.speedY * step <= map.y - this.img.height/2)
        this.y = this.y + this.speedY * step; 
    else
        this.speedY = 0;
  }

  this.renderFlame = function(){

  }

  this.onMouseDown = function(){
    if(mouse.leftButton === true && this.lastTimeBullet >= this.bulletDelay){
      this.fireBullet(this.bulletType);
      this.lastTimeBullet = 0;
    }
  }

  this.render = function(){
    this.renderFlame();
    this.rotateToMouse();
    hp.render(this, "green");

    //context.drawImage(this.img, this.x, this.y);
  }

  this.update = function(step){
    if(this.lastTimeBullet <= this.bulletDelay + 1)
      this.lastTimeBullet += step;
    this.move(step);
    this.onMouseDown();
  }

  /*
   * Wystrzeliwuje pocisk
   */
  this.fireBullet = function(type){
    new Bullet(this.x, this.y,
               mouse.getXOnCanvas(), mouse.getYOnCanvas(),
               type, 0, 0, true);

  }

  gameObjects[gameObjects.length] = this;
}

/*
 * Uniwersalny przeciwnik
 */
function Enemy(x, y, maxSpeed, range, maxHp, img, bulletType){
  this.x = x;
  this.y = y;

  this.target = 0;

  this.maxSpeed = maxSpeed;

  this.speedX = 0;
  this.speedY = 0;

  this.range = range;

  this.bulletType = bulletType;

  this.typeOfObject = "enemy";

  this.acceleration = 15;

  this.lastTimeBullet = 0;

  this.maxHp = maxHp;
  this.hp = this.maxHp;

  this.img = img;

  this.toDelete = false;

  this.destination = {
    lastTime: 0,
    x: 0,
    y: 0
  };


  this.getRatio = function(){

    /*
     * obiekt bedzie sie poruszal w kierunku losowego miejsca z ktorego jest
     * w zasiegu swojego ostrzalu
     */
    //console.log(this.target.x + " " + this.target.y + " " + this.destination.lastTime);
    var ratioX = (this.destination.x + this.target.x - this.x) / 
                 (Math.abs(this.destination.x + this.target.x - this.x) + 
                  Math.abs(this.destination.y + this.target.y - this.y));
    

    var ratioY = (this.destination.y + this.target.y - this.y) / 
                 (Math.abs(this.destination.x + this.target.x - this.x) + 
                  Math.abs(this.destination.y + this.target.y - this.y));

    return {x: ratioX, y: ratioY};
  }


  /*
   * po 2.5 sekundy +-0.5 zmienia cel swojego lotu 
   */
  this.getDestination = function(step){
    this.destination.lastTime = this.destination.lastTime + step;
    if((this.destination.lastTime >= 3) ||
       (this.destination.x === 0 && this.destination.y === 0)){
      this.destination.x = getRandomInt(-this.range/4,this.range/4);
      this.destination.y = getRandomInt(-this.range/4,this.range/4);      
      this.destination.lastTime = 0 + getRandom(0,1);

    }
  }

  /*
   * Zwieksza predkosc w poziomie
   */
  this.accelerate = function(ratio){
    if(Math.abs(this.speedX + this.acceleration * ratio.x) < this.maxSpeed)
      this.speedX = this.speedX + this.acceleration * ratio.x;
    if(Math.abs(this.speedY + this.acceleration * ratio.y) < this.maxSpeed)
      this.speedY = this.speedY + this.acceleration * ratio.y;
  }

  /*
   * Zwraca true jesli cel jest w zasiegu
   */
  this.isInRange = function(){

    if( ((this.target.x - this.x) * (this.target.x - this.x) + 
         (this.target.y - this.y) * (this.target.y - this.y)) < (this.range * this.range)){
      //console.log("object in range!");
      return true;
    }

    return false;
  }
  /*
   * Jesli nie ma ustawionego celu to znajduje kolejny
   */
  this.searchForTarget = function(){
    if(this.target === 0){
      for(var i = 0; i < gameObjects.length;i++){
        if(gameObjects[i].typeOfObject === "player"){
          this.target = gameObjects[i];
          break;
        }
      }
    }
  }

  /*
   * Jesli cel umarl to ustawia target na 0(czyli bedzie poszukiwal nastepnego celu)
   */
  this.isTargetDead = function(){
    if(this.target.hp <= 0){
      this.target = 0;
    }
  }

  this.fireBullet = function(type){
    new Bullet(this.x, this.y,
               this.target.x, this.target.y,
               type, 0, 0, false);
  }

  /*
   * strzela pociskiem w losowym odcinku czasu z minimalnym czasem 500ms
   */
  this.fireToTarget = function(step){
    this.lastTimeBullet += step
    if(this.isInRange()){
      if(this.lastTimeBullet > 1.5){
        //console.log("lol");
        this.fireBullet(this.bulletType);
        this.lastTimeBullet = 0 + getRandom(0, 1);
      }
    }
  }

  this.loot = function(){
    gamemodes[gamemodes.mode].loot(this.x, this.y);
  }

  /*
   * Logika poruszania obiektu
   */
  this.ai = function(step){
    this.searchForTarget();
    this.fireToTarget(step);
    this.getDestination(step);
    this.accelerate(this.getRatio());
    this.isTargetDead();
    this.x = this.x + this.speedX * step;
    this.y = this.y + this.speedY * step;


  }

  this.render = function(){
    graphics.rotateTo(this, this.target.x, this.target.y);
    hp.render(this, "red");
  }

  this.update = function(step){
    if(this.hp <= 0){
      this.toDelete = true;
      hud.points.amount += 10;
      create.explosion(this.x, this.y, "type3");
      this.loot();
    }
    this.ai(step);
  }
  gameObjects[gameObjects.length] = this;
}



function Boss(x, y, maxSpeed, range, points, maxHp, img, bulletType){
  this.x = x;
  this.y = y;

  this.target = 0;

  this.maxSpeed = maxSpeed;

  this.speedX = 0;
  this.speedY = 0;

  this.range = range;

  this.bulletType = bulletType;

  this.typeOfObject = "enemy";

  this.acceleration = 15;

  this.lastTimeBullet = 0;

  this.points = points;

  this.maxHp = maxHp;
  this.hp = this.maxHp;

  this.img = img;

  this.toDelete = false;

  this.destination = {
    lastTime: 0,
    x: 0,
    y: 0
  };


  this.getRatio = function(){

    /*
     * obiekt bedzie sie poruszal w kierunku losowego miejsca z ktorego jest
     * w zasiegu swojego ostrzalu
     */
    //console.log(this.target.x + " " + this.target.y + " " + this.destination.lastTime);
    var ratioX = (this.destination.x + this.target.x - this.x) / 
                 (Math.abs(this.destination.x + this.target.x - this.x) + 
                  Math.abs(this.destination.y + this.target.y - this.y));
    

    var ratioY = (this.destination.y + this.target.y - this.y) / 
                 (Math.abs(this.destination.x + this.target.x - this.x) + 
                  Math.abs(this.destination.y + this.target.y - this.y));

    return {x: ratioX, y: ratioY};
  }


  /*
   * po 2.5 sekundy +-0.5 zmienia cel swojego lotu 
   */
  this.getDestination = function(step){
    this.destination.lastTime = this.destination.lastTime + step;
    if((this.destination.lastTime >= 3) ||
       (this.destination.x === 0 && this.destination.y === 0)){
      this.destination.x = getRandomInt(-this.range/4,this.range/4);
      this.destination.y = getRandomInt(-this.range/4,this.range/4);      
      this.destination.lastTime = 0 + getRandom(0,1);

    }
  }

  /*
   * Zwieksza predkosc w poziomie
   */
  this.accelerate = function(ratio){
    if(Math.abs(this.speedX + this.acceleration * ratio.x) < this.maxSpeed)
      this.speedX = this.speedX + this.acceleration * ratio.x;
    if(Math.abs(this.speedY + this.acceleration * ratio.y) < this.maxSpeed)
      this.speedY = this.speedY + this.acceleration * ratio.y;
  }

  /*
   * Zwraca true jesli cel jest w zasiegu
   */
  this.isInRange = function(){

    if( ((this.target.x - this.x) * (this.target.x - this.x) + 
         (this.target.y - this.y) * (this.target.y - this.y)) < (this.range * this.range)){
      //console.log("object in range!");
      return true;
    }

    return false;
  }
  /*
   * Jesli nie ma ustawionego celu to znajduje kolejny
   */
  this.searchForTarget = function(){
    if(this.target === 0){
      for(var i = 0; i < gameObjects.length;i++){
        if(gameObjects[i].typeOfObject === "player"){
          this.target = gameObjects[i];
          break;
        }
      }
    }
  }

  /*
   * Jesli cel umarl to ustawia target na 0(czyli bedzie poszukiwal nastepnego celu)
   */
  this.isTargetDead = function(){
    if(this.target.hp <= 0){
      this.target = 0;
    }
  }

  this.fireBullet = function(type){
    new Bullet(this.x, this.y,
               this.target.x, this.target.y,
               type, 0, 0, false);
    new Bullet(this.x + 50, this.y + 50,
               this.target.x, this.target.y,
               type, 0, 0, false);
    new Bullet(this.x + 100, this.y + 100,
               this.target.x, this.target.y,
               type, 0, 0, false);
    new Bullet(this.x - 50, this.y - 50,
               this.target.x, this.target.y,
               type, 0, 0, false);
    new Bullet(this.x - 100, this.y - 100,
               this.target.x, this.target.y,
               type, 0, 0, false);
  }

  /*
   * strzela pociskiem w losowym odcinku czasu z minimalnym czasem 500ms
   */
  this.fireToTarget = function(step){
    this.lastTimeBullet += step
    if(this.isInRange()){
      if(this.lastTimeBullet > 0.65){
        //console.log("lol");
        this.fireBullet(this.bulletType);
        this.lastTimeBullet = 0;
      }
    }
  }

  this.loot = function(){
    for(var i = 0; i < 5; i++){
      for(var j = 0; j < 5;j++){
        gamemodes[gamemodes.mode].loot(this.x + i * 50, this.y + j * 50);
      }
    }
  }

  /*
   * Logika poruszania obiektu
   */
  this.ai = function(step){
    this.searchForTarget();
    this.fireToTarget(step);
    this.getDestination(step);
    this.accelerate(this.getRatio());
    this.isTargetDead();
    this.x = this.x + this.speedX * step;
    this.y = this.y + this.speedY * step;


  }

  this.render = function(){
    graphics.rotateTo(this, this.target.x, this.target.y);
    hp.render(this, "red");
  }

  this.update = function(step){
    if(this.hp <= 0){
      this.toDelete = true;
      hud.points.amount += this.points;
      create.explosion(this.x, this.y, "type3");
      this.loot();
    }
    this.ai(step);
  }
  gameObjects[gameObjects.length] = this;
}





/*
 * pocisk
 */
function Bullet(x, y, targetX, targetY, type,speedX,speedY, friendly){
  this.x = x;
  this.y = y;

  this.typeOfObject = "bullet";

  this.hp = 1;

  this.friendly = friendly;

  this.img = bulletTypes[type]["img"];

  //jesli ma sie usunac z tablicy obiektow
  this.toDelete = false;

  this.dmg = bulletTypes[type]["dmg"];
  this.speed = 1500;
  
  this.speedX = - ((this.x - targetX) / 
                  (Math.abs(this.x - targetX) + Math.abs(this.y - targetY))) 
                  * this.speed;
  this.speedY = - ((this.y - targetY) / 
                  (Math.abs(this.x - targetX) + Math.abs(this.y - targetY))) 
                  * this.speed; 


  /*
   * Sprawdza kolizje pociskow
   * oddzielnie dla naboi wystrzelonych przez sprzymierzencow i wrogow
   */
  this.checkCollision = function(){
    for (var i = 0; i < gameObjects.length; i++) {
      if((this.x >  gameObjects[i].x - gameObjects[i].img.width/2 + 5) && 
         (this.x < (gameObjects[i].x + gameObjects[i].img.width/2 - 5)) &&
         (this.y >  gameObjects[i].y - gameObjects[i].img.height/2 + 5) && 
         (this.y < (gameObjects[i].y + gameObjects[i].img.height/2 - 5)) &&
         (gameObjects[i].typeOfObject !== "bullet")) {
        
        if (this.friendly === true) {
          if(gameObjects[i].typeOfObject !== "player" &&
             gameObjects[i].typeOfObject !== "friendly") {
            create.explosion(this.x, this.y, "type2");
            if(gameObjects[i].hp - this.dmg < 0)
              gameObjects[i].hp = 0;
            else
              gameObjects[i].hp -= this.dmg;
              this.toDelete = true;
              break;
          }
        } else if (gameObjects[i].typeOfObject === "player" ||
                   gameObjects[i].typeOfObject === "friendly"){
          create.explosion(this.x, this.y, "type2");
          if(gameObjects[i].hp - this.dmg < 0)
            gameObjects[i].hp = 0;
          else
            gameObjects[i].hp -= this.dmg;
          this.toDelete = true;
          break;
        }
      }
    }
  }

  this.render = function(){
    graphics.rotateTo(this, this.speedX + this.x, this.speedY + this.y);
  }

  this.update = function(step){
    if(checkObjectBoundary(this)){
      this.toDelete = true;
    }

    this.checkCollision();
    this.x = this.x + (this.speedX + speedX)* step;
    this.y = this.y + (this.speedY + speedY)* step;

    //console.log("lol2");
  }
  gameObjects[gameObjects.length] = this;
}


/*
 * Asteroida
 */
function Asteroid(x , y, speedX, speedY){
  this.x = x;
  this.y = y;

  this.typeOfObject = "asteroid";

  this.speedX = speedX;
  this.speedY = speedY;

  this.img = images["skala1"];

  this.maxHp = 50;
  this.hp = this.maxHp;

  //jesli ma sie usunac z tablicy obiektow
  this.toDelete = false;

  this.render = function(){
    // context.fillStyle = "red";
    // context.fillRect(this.x - this.img.width/2 + 5, this.y - this.img.height/2 + 5, this.img.width - 10, this.img.height - 10);
    graphics.rotateTo(this, this.speedX + this.x, this.speedY + this.y);
    hp.render(this,"yellow");
  }

  this.update = function(step){
    if(checkObjectBoundary(this)){
      this.toDelete = true;
    }

    if(this.hp <= 0){
      this.toDelete = true;
      hud.points.amount++;
      create.explosion(this.x, this.y, "type3");
    }

    this.x = this.x + this.speedX * step;
    this.y = this.y + this.speedY * step;

    //console.log("lol");
  }

  gameObjects[gameObjects.length] = this;  
}



/*
 * wybuch
 */
function Explosion(x, y, img, size){
  this.x = x;
  this.y = y

  this.state = 0;

  this.typeOfObject = "explosion";

  this.size = size;

  this.img = img;

  this.toDelete = false;

  this.lastStateChange = 0;

  this.render = function(){
    context.drawImage(this.img,this.size * this.state,0,this.size,this.size,this.x,this.y,this.size,this.size);
  }

  this.update = function(step){
    this.lastStateChange += step;
    //console.log(this.lastStateChange);
    if(this.state >= 5){
      this.toDelete = true;
    }

    if(this.lastStateChange > 0.035){
      this.lastStateChange = 0;
      this.state++;
    }

  }

  gameObjectsIndependent[gameObjectsIndependent.length] = this;   
}

/*
 * zdrowie do zbierania
 */
function Health(x, y, hp){
  this.x = x;
  this.y = y;

  this.typeOfObject = "health";

  this.hp = hp;

  this.img = images["zdrowie"];

  //jesli ma sie usunac z tablicy obiektow
  this.toDelete = false;

  this.render = function(){
    context.drawImage(this.img,this.x,this.y);
  }

  /*
   * Sprawdza kolizje pociskow
   * oddzielnie dla naboi wystrzelonych przez sprzymierzencow i wrogow
   * bo nie lubie friendly fire :>
   */

  this.update = function(){
    this.checkCollision();
  }

  this.checkCollision = function(){
    if((this.x + this.img.width >  player.x - player.img.width/2- 5) && 
       (this.x < player.x + player.img.width/2 + 5) &&
       (this.y + this.img.height >  player.y - player.img.height/2 - 5) && 
       (this.y < player.y + player.img.height/2 + 5)) {
        
      this.toDelete = true;
      if(player.hp + this.hp <= player.maxHp)
        player.hp += this.hp;
      else
        player.hp = player.maxHp;

    }

  }
  gameObjectsIndependent[gameObjectsIndependent.length] = this;  
}



function Flame(object){

}



/*
 * Funkcje roznego typu do obiektow w grze
 */


/*
 * funkcja do wyświetlenia paska hp nad danym obiektem
 */
var hp = {
  render: function(object,color){
    context.fillStyle = "black";
    context.fillRect(object.x - object.img.width/2 - 1,object.y - object.img.height/2 - 7,object.img.width + 2, 5);
    context.fillStyle = color;
    context.fillRect(object.x - object.img.width/2,object.y - object.img.height/2 - 6,object.hp/object.maxHp * object.img.width, 3);
  }
}





/*
 * Wrog
 */


/*
 *
 * Stary sposob tworzenia wrogow
 *
 */
//   function Enemy1(type,x,y){
//   this.x = x;
//   this.y = y;

//   this.target = 0;

//   this.maxSpeed = 320;

//   this.speedX = 0;
//   this.speedY = 0;

//   this.range = 600;

//   this.typeOfObject = "enemy";

//   this.acceleration = this.maxSpeed / 32;

//   this.lastTimeBullet = 0;

//   this.maxHp = 350;
//   this.hp = this.maxHp;

//   this.img = images["statek2"];

//   this.toDelete = false;


//   this.getRatio = function(){

//     /*
//      * obiekt bedzie sie poruszal w kierunku losowego miejsca z ktorego jest
//      * w zasiegu swojego ostrzalu
//      */
//     var x = getRandomInt(-this.range + 1,this.range - 1);
//     var y = (Math.sqrt(this.range) - Math.sqrt(Math.abs(x))) * getPosNeg();
//     var ratioX = (this.target.x + x - this.x) / (Math.abs(this.target.x + x - this.x) + Math.abs(this.target.x + x - this.x));
//     var ratioY = (this.target.y + y - this.y) / (Math.abs(this.target.y + y - this.y) + Math.abs(this.target.y + y - this.y));

//     return {x: ratioX, y: ratioY};
//   }

//   /*
//    * Zwieksza predkosc w poziomie
//    */
//   this.accelerate = function(ratio){
//     if(Math.abs(this.speedX + this.acceleration * ratio.x) < this.maxSpeed)
//       this.speedX = this.speedX + this.acceleration * ratio.x;
//     if(Math.abs(this.speedY + this.acceleration * ratio.y) < this.maxSpeed)
//       this.speedY = this.speedY + this.acceleration * ratio.y;
//   }

//   /*
//    * Zwraca true jesli cel jest w zasiegu
//    */
//   this.isInRange = function(){

//     if( ((this.target.x - this.x) * (this.target.x - this.x) + 
//          (this.target.y - this.y) * (this.target.y - this.y)) < (this.range * this.range)){
//       //console.log("object in range!");
//       return true;
//     }

//     return false;
//   }
//   /*
//    * Jesli nie ma ustawionego celu to znajduje kolejny
//    */
//   this.searchForTarget = function(){
//     for(var i = 0; i < gameObjects.length;i++){
//       if(gameObjects[i].typeOfObject === "player"){
//         this.target = gameObjects[i];
//         break;
//       }
//     }
//   }

//   /*
//    * Jesli cel umarl to ustawia target na 0(czyli bedzie poszukiwal nastepnego celu)
//    */
//   this.isTargetDead = function(){
//     if(this.target.hp <= 0){
//       this.target = 0;
//     }
//   }

//   this.fireBullet = function(type){
//     new Bullet(this.x, this.y,
//                this.target.x, this.target.y,
//                type, 0, 0, false);
//   }

//   /*
//    * strzela pociskiem w losowym odcinku czasu z minimalnym czasem 500ms
//    */
//   this.fireToTarget = function(step){
//     this.lastTimeBullet += step
//     if(this.isInRange()){
//       if(this.lastTimeBullet > 1.5){
//         //console.log("lol");
//         this.fireBullet("type1");
//         this.lastTimeBullet = 0 + getRandom(0, 1);
//       }
//     }
//   }

//   /*
//    * Logika poruszania obiektu
//    */
//   this.ai = function(step){
//     this.fireToTarget(step);
//     this.accelerate(this.getRatio());
//     this.isTargetDead();
//     this.x = this.x + this.speedX * step;
//     this.y = this.y + this.speedY * step;


//   }

//   this.render = function(){
//     graphics.rotateTo(this, this.target.x, this.target.y);
//     hp.render(this, "red");
//   }

//   this.update = function(step){
//     if(this.hp <= 0){
//       this.toDelete = true;
//       hud.points.amount += 10;
//       new Explosion3(this.x,this.y);
//     }
//     if(this.target !== 0){
//       this.ai(step);
//     } else {
//       this.searchForTarget();
//     }


//   }
//   gameObjects[gameObjects.length] = this;
// }

// function Enemy2(type,x,y){
//   this.x = x;
//   this.y = y;

//   this.target = 0;

//   this.time = new Date();

//   this.maxSpeed = 320;

//   this.speedX = 0;
//   this.speedY = 0;

//   this.range = 600;

//   this.typeOfObject = "enemy";

//   this.acceleration = this.maxSpeed / 32;

//   this.lastTimeBullet = this.time.getTime();

//   this.maxHp = 850;
//   this.hp = this.maxHp;

//   this.img = images["statek3"];

//   this.toDelete = false;


//   this.getRatio = function(){

//     /*
//      * obiekt bedzie sie poruszal w kierunku losowego miejsca z ktorego jest
//      * w zasiegu swojego ostrzalu
//      */
//     var x = getRandomInt(-this.range + 1,this.range - 1);
//     var y = (Math.sqrt(this.range) - Math.sqrt(Math.abs(x))) * getPosNeg();
//     var ratioX = (this.target.x + x - this.x) / (Math.abs(this.target.x + x - this.x) + Math.abs(this.target.x + x - this.x));
//     var ratioY = (this.target.y + y - this.y) / (Math.abs(this.target.y + y - this.y) + Math.abs(this.target.y + y - this.y));

//     return {x: ratioX, y: ratioY};
//   }

//   /*
//    * Zwieksza predkosc w poziomie
//    */
//   this.accelerate = function(ratio){
//     if(Math.abs(this.speedX + this.acceleration * ratio.x) < this.maxSpeed)
//       this.speedX = this.speedX + this.acceleration * ratio.x;
//     if(Math.abs(this.speedY + this.acceleration * ratio.y) < this.maxSpeed)
//       this.speedY = this.speedY + this.acceleration * ratio.y;
//   }

//   /*
//    * Zwraca true jesli cel jest w zasiegu
//    */
//   this.isInRange = function(){

//     if( ((this.target.x - this.x) * (this.target.x - this.x) + 
//          (this.target.y - this.y) * (this.target.y - this.y)) < (this.range * this.range)){
//       //console.log("object in range!");
//       return true;
//     }

//     return false;
//   }
//   /*
//    * Jesli nie ma ustawionego celu to znajduje kolejny
//    */
//   this.searchForTarget = function(){
//     for(var i = 0; i < gameObjects.length;i++){
//       if(gameObjects[i].typeOfObject === "player"){
//         this.target = gameObjects[i];
//         break;
//       }
//     }
//   }

//   /*
//    * Jesli cel umarl to ustawia target na 0(czyli bedzie poszukiwal nastepnego celu)
//    */
//   this.isTargetDead = function(){
//     if(this.target.hp <= 0){
//       this.target = 0;
//     }
//   }

//   this.fireBullet = function(type){
//     new Bullet(this.x, this.y,
//                this.target.x, this.target.y,
//                type, 0, 0, false);
//   }

//   /*
//    * strzela pociskiem w losowym odcinku czasu z minimalnym czasem 500ms
//    */
//   this.fireToTarget = function(){
//     this.time = new Date();
//     if(this.isInRange()){
//       if(this.time.getTime() - this.lastTimeBullet > 1500){
//         //console.log("lol");
//         this.fireBullet("type1");
//         this.lastTimeBullet = this.time.getTime() + getRandomInt(-1000,0);
//       }
//     }
//   }

//   /*
//    * Logika poruszania obiektu
//    */
//   this.ai = function(step){
//     this.fireToTarget();
//     this.accelerate(this.getRatio());
//     this.isTargetDead();
//     this.x = this.x + this.speedX * step;
//     this.y = this.y + this.speedY * step;


//   }

//   this.render = function(){
//     graphics.rotateTo(this, this.target.x, this.target.y);
//     hp.render(this, "red");
//   }

//   this.update = function(step){
//     if(this.hp <= 0){
//       this.toDelete = true;
//       hud.points.amount += 30;
//       new Explosion3(this.x,this.y);
//     }
//     if(this.target !== 0){
//       this.ai(step);
//     } else {
//       this.searchForTarget();
//     }


//   }
//   gameObjects[gameObjects.length] = this;
// }






/*
 * eksplozja pocisku 1
 */

/*
 * Stary sposob tworzenia wybuchow
 */

// function Explosion1(x,y){
//   this.x = x;
//   this.y = y

//   this.state = 0;

//   this.typeOfObject = "explosion";

//   this.size = 8;

//   this.img = images["wybuch1"];

//   this.toDelete = false;

//   this.lastStateChange = 0;

//   this.render = function(){
//     context.drawImage(this.img,this.size * this.state,0,this.size,this.size,this.x,this.y,this.size,this.size);
//   }

//   this.update = function(step){
//     this.lastStateChange += step;
//     //console.log(this.lastStateChange);
//     if(this.state >= 5){
//       this.toDelete = true;
//     }

//     if(this.lastStateChange > 0.035){
//       this.lastStateChange = 0;
//       this.state++;
//     }

//   }

//   gameObjectsVisuals[gameObjectsVisuals.length] = this;   
// }

// function Explosion2(x,y){
//   this.x = x;
//   this.y = y

//   this.state = 0;

//   this.typeOfObject = "explosion";

//   this.size = 16;

//   this.img = images["wybuch2"];

//   this.toDelete = false;

//   this.time = new Date();

//   this.lastStateChange = 0;

//   this.render = function(){
//     context.drawImage(this.img,this.size * this.state,0,this.size,this.size,this.x,this.y,this.size,this.size);
//   }

//   this.update = function(step){
//     this.lastStateChange += step;
//     //console.log(this.lastStateChange);
//     if(this.state >= 5){
//       this.toDelete = true;
//     }

//     if(this.lastStateChange > 0.035){
//       this.lastStateChange = 0;
//       this.state++;
//     }

//   }

//   gameObjectsVisuals[gameObjectsVisuals.length] = this;   
// }

// function Explosion3(x,y){
//   this.x = x;
//   this.y = y

//   this.state = 0;

//   this.typeOfObject = "explosion";

//   this.size = 64;

//   this.img = images["wybuch3"];

//   this.toDelete = false;

//   this.time = new Date();

//   this.lastStateChange = 0;

//   this.render = function(){
//     context.drawImage(this.img,this.size * this.state,0,this.size,this.size,this.x,this.y,this.size,this.size);
//   }

//   this.update = function(step){
//     this.lastStateChange += step;
//     //console.log(this.lastStateChange);
//     if(this.state >= 5){
//       this.toDelete = true;
//     }

//     if(this.lastStateChange > 0.035){
//       this.lastStateChange = 0;
//       this.state++;
//     }

//   }

//   gameObjectsVisuals[gameObjectsVisuals.length] = this;   
// }




/*
 * Podstawowe typy obiektow i ich tworzenie
 */

/*
 * Typy pociskow
 */
var bulletTypes = {
  type1: {img: images["pocisk1"], dmg: 10},
  type2: {img: images["laser1"], dmg: 20},
  type3: {img: images["laser2"], dmg: 30},
  type4: {img: images["laser3"], dmg: 40},
  type5: {img: images["laser3"], dmg: 40},
  type6: {img: images["laser3"], dmg: 40},
  type7: {img: images["laser3"], dmg: 40},
  type8: {img: images["laser3"], dmg: 40},
  type9: {img: images["laser3"], dmg: 40},
  type0: {img: images["laser3"], dmg: 40},
};

/*
 * Typy przeciwnikow
 */
var enemyTypes = {
  type1: {
    img: images["statek2"], 
    maxSpeed: 320,
    range: 600,
    maxHp: 100,
    bulletType: "type1",
  },
  type2: {
    img: images["statek3"], 
    maxSpeed: 330,
    range: 600,
    maxHp: 200,
    bulletType: "type3",
  }
};

/*
 * Typy eksplozji
 */
var explosionTypes = {
  type1: {img: images["wybuch1"], size: 8},
  type2: {img: images["wybuch2"], size: 16},
  type3: {img: images["wybuch3"], size: 64}
};

/*
 * Tworzenie obiektu na podstawie typu 
 */

var create = {
  bullet: function(x, y, targetX, targetY, type,speedX,speedY, friendly){
    new Bullet(x, y, targetX, targetY, type,speedX,speedY, friendly);
  },

  enemy: function(x, y, type){
    new Enemy(x, y, enemyTypes[type]["maxSpeed"], 
                    enemyTypes[type]["range"], 
                    enemyTypes[type]["maxHp"], 
                    enemyTypes[type]["img"], 
                    enemyTypes[type]["bulletType"]);
  },

  explosion: function(x, y, type){
    new Explosion(x, y, explosionTypes[type]["img"], 
                        explosionTypes[type]["size"]);
  }
};



/*
 * Inne obiekty
 */


/*
 * Button
 * do dokonczenia
 */

function Button(x, y, imgoff, imgon){
  var mouseon = false;
  var x = 0;
  var y = 0;

  var imgoff = images[imgoff];
  var imgon = images[imgon];
} 

/*
 * Interfejs(nieruchome obrazki :) )
 */
var hud = {
  version: {
    text: "0.150 alpha",
    color: "white",
    font: "9px Arial",
    render: function(){
      context.font = this.font;
      context.fillStyle = this.color;
      context.fillText(this.text,width - 50,height - 2);
    }
  },

  points: {
    amount: 0,
    text: "Points: ",
    color: "white",
    font: "25px Arial",
    render: function(){
      context.font = this.font;
      context.fillStyle = this.color;
      context.fillText(this.text + this.amount,5,25);
    }
  },

  /*
   * dolny pasek
   */
  belt: {
    img: images["belt"],
    render: function(){
      context.drawImage(this.img, width - this.img.width - 15, height - this.img.height - 15);
      var i;

      /*
       * wyswietlanie typow pociskow na pasku
       */
      for(i = 1; i < 10;i++){
        context.drawImage(bulletTypes["type" + i].img, 
          width - this.img.width - 15 + 33 * (i - 1) + 17 - bulletTypes["type" + i].img.width/2, 
          height - this.img.height - 15 + 17 - bulletTypes["type" + i].img.height/2);
      }
      context.drawImage(bulletTypes["type" + 0].img, 
        width - this.img.width - 15 + 33 * (i - 1) + 17 - bulletTypes["type" + 0].img.width/2, 
        height - this.img.height - 15 + 17 - bulletTypes["type" + 0].img.height/2);
    }

  },

  render: function(){
    context.setTransform(1,0,0,1,0,0);
    this.version.render();
    this.points.render();
    this.belt.render();
    gamemodes[gamemodes.mode].render();
  },

  update: function(){

  }
};


/*
 * Opcje gry
 */


/*
 * ustawienia gry, funkcje update i render
 */
var options = {
  slow: 1,
  fps: 60,
  update: function(step){
    states[game.state].update(step);
  },

  render: function(){
    states[game.state].render();
  },

}

/*
 * Stany gry
 */

var states = {
  load: {
    loaded: 1,

    onstart: function(){
      game.state = "load";
      //this.loadImages();
    },

    render: function(){

    },

    update: function(step){
      // if(this.loaded - 1 === images.length)
      //   states.menu.onstart();
    },

    onclick: function(){
      
    },

    onkeypressed: function(e){

    },

  },


  menu: {

    onstart: function(){
      this.updatePosition();
      game.state = "menu";
    },

    render: function(){
      menu.render();
    },

    update: function(step){
      this.checkButtons();

    },
    /*
     * sprawdza czy myszka najechala na ktorys z przyciskow
     */
    checkButtons: function(){
      if(checkMousePosition(this.startGame.x, this.startGame.y, 
                            this.startGame.x + this.startGame.imgoff.width,
                            this.startGame.y + this.startGame.imgoff.height))
        this.startGame.mouseon = true;
      else
        this.startGame.mouseon = false;

      if(checkMousePosition(this.options.x, this.options.y, 
                            this.options.x + this.options.imgoff.width,
                            this.options.y + this.options.imgoff.height))
        this.options.mouseon = true;
      else
        this.options.mouseon = false;

      if(checkMousePosition(this.credits.x, this.credits.y, 
                            this.credits.x + this.credits.imgoff.width,
                            this.credits.y + this.credits.imgoff.height))
        this.credits.mouseon = true;
      else
        this.credits.mouseon = false;
    },

    onclick: function(){
      if(this.startGame.mouseon)
        this.onstartGame();
      if(this.options.mouseon)
        this.onoptions();
      if(this.credits.mouseon)
        this.oncredits();
    },

    onkeypressed: function(e){

    },

    onstartGame: function(){
      states.modechoice.onstart();
    },

    onoptions: function(){
      states.options.onstart();
    },

    oncredits: function(){
      states.credits.onstart();
    },

    startGame: {
      imgoff: images["startgame"],
      imgon: images["startgame2"],
      x: 0,
      y: 0,
      mouseon: false,
      render: function(){
        if(this.mouseon === false)
         context.drawImage(this.imgoff, this.x, this.y);
        else 
          context.drawImage(this.imgon, this.x, this.y);
      }
    },

    options: {
      imgoff: images["options"],
      imgon: images["options2"],
      x: 0,
      y: 0,
      mouseon: false,
      render: function(){
        if(this.mouseon === false)
          context.drawImage(this.imgoff, this.x, this.y);
        else
          context.drawImage(this.imgon, this.x, this.y);
      }
    },

    credits: {
      imgoff: images["credits"],
      imgon: images["credits2"],
      x: 0,
      y: 0,
      mouseon: false,
      render: function(){
        if(this.mouseon === false)
          context.drawImage(this.imgoff, this.x, this.y);
        else
          context.drawImage(this.imgon, this.x, this.y);
      }
    },

    render: function(){
      context.fillStyle = "white";
      context.fillRect(0,0,width,height);
      this.startGame.render();
      this.options.render();
      this.credits.render();
    },

    updatePosition: function(){
      this.startGame.x = width/2 - 160;
      //console.log(this.startGame.img)
      this.startGame.y = height/2;

      this.options.x = width/2 - 160;
      this.options.y = height/2 + 40 + 15

      this.credits.x = width/2 - 160;
      this.credits.y = height/2 + 2 * 40 + 30;
    }
  },

  modechoice: {

    modes: {

      experimental: {
        imgoff: images["experimental"],
        imgon: images["experimental2"],
        x: 0,
        y: 0,
        mouseon: false,
        render: function(){
          if(this.mouseon === false)
           context.drawImage(this.imgoff, this.x, this.y);
          else 
            context.drawImage(this.imgon, this.x, this.y);
        }
      },

      classic: {
        imgoff: images["classic"],
        imgon: images["classic2"],
        x: 0,
        y: 0,
        mouseon: false,
        render: function(){
          if(this.mouseon === false)
           context.drawImage(this.imgoff, this.x, this.y);
          else 
            context.drawImage(this.imgon, this.x, this.y);
        }
      },

      endless: {
        imgoff: images["endless"],
        imgon: images["endless2"],
        x: 0,
        y: 0,
        mouseon: false,
        render: function(){
          if(this.mouseon === false)
           context.drawImage(this.imgoff, this.x, this.y);
          else 
            context.drawImage(this.imgon, this.x, this.y);
        }
      },

      updatePosition: function(){
        this.experimental.x = width/2 - 160;
        this.experimental.y = height/2 - height/4;

        this.classic.x = width/2 - 160;
        this.classic.y = height/2 - height/4 + 40 + 15

        this.endless.x = width/2 - 160;
        this.endless.y = height/2 - height/4 + 2 * 40 + 30;
      },

      render: function(){
        this.experimental.render();
        this.classic.render();
        this.endless.render();
      }

    },

    onstart: function(){
      this.modes.updatePosition();
      game.state = "modechoice";
    },

    render: function(){
      context.fillStyle = "white";
      context.fillRect(0,0,width,height);
      this.modes.render();
      var text = "Choose Gamemode:"
      context.font = "70px Arial";
      context.fillStyle = "black";
      context.fillText(text,width/2 - context.measureText(text).width/2,height/2 - height/4 - height/6);
    },

    update: function(step){
      this.checkButtons();
    },

    checkButtons: function(){
      if(checkMousePosition(this.modes.experimental.x, this.modes.experimental.y, 
                            this.modes.experimental.x + this.modes.experimental.imgoff.width,
                            this.modes.experimental.y + this.modes.experimental.imgoff.height))
        this.modes.experimental.mouseon = true;
      else
        this.modes.experimental.mouseon = false;

      if(checkMousePosition(this.modes.classic.x, this.modes.classic.y, 
                            this.modes.classic.x + this.modes.classic.imgoff.width,
                            this.modes.classic.y + this.modes.classic.imgoff.height))
        this.modes.classic.mouseon = true;
      else
        this.modes.classic.mouseon = false;

      if(checkMousePosition(this.modes.endless.x, this.modes.endless.y, 
                            this.modes.endless.x + this.modes.endless.imgoff.width,
                            this.modes.endless.y + this.modes.endless.imgoff.height))
        this.modes.endless.mouseon = true;
      else
        this.modes.endless.mouseon = false;
    },

    onclick: function(){
      if(this.modes.experimental.mouseon)
        gamemodes.mode1.onstart();
      if(this.modes.classic.mouseon)
        gamemodes.mode2.onstart();
      if(this.modes.endless.mouseon)
        gamemodes.mode3.onstart();
    },

    onkeypressed: function(e){

    }
  },

  options: {
    onstart: function(){
      game.state = "options";
    },

    render: function(){
      context.fillStyle = "white";
      context.fillRect(0,0,width,height);
      context.font = "50px Arial";
      context.fillStyle = "black";

      var text = "Controls";
      context.fillText(text,width/2 - context.measureText(text).width/2, 50);

      text = "Move: WSAD";
      context.fillText(text,width/2 - width/4, 3 * 50);
      text = "Fire: Left Mouse Button";
      context.fillText(text,width/2 - width/4, 4 * 50 + 15);
      text = "Pause: 'P'";
      context.fillText(text,width/2 - width/4, 5 * 50 + 30);
      text = "Inventory: 'I'";
      context.fillText(text,width/2 - width/4, 6 * 50 + 45);
    },

    update: function(step){
      
    },

    onclick: function(){
      states.menu.onstart();
    },
    onkeypressed: function(e){

    }
  },

  credits: {

    listOfAutors: ["Main Programmer: ","Przemyslaw 'Darknov' Maciaszek",
                   "Main graphic designer: ","Piotr 'MordenLye' Lewczuk",
                   "Gameplay: ", "Przemyslaw 'Darknov' Maciaszek"],
    onstart: function(){
      game.state = "credits";
    },

    render: function(){
      context.fillStyle = "white";
      context.fillRect(0,0,width,height);
      var text;

      for(var i = 0; i < this.listOfAutors.length;i++){
        text = this.listOfAutors[i];
        context.font = "30px Arial";
        context.fillStyle = "black";
        context.fillText(text,width/2 - context.measureText(text).width/2 ,height/4 +  i * 30 + i *15);
      }
    },

    update: function(step){
      console.log(this.listOfAutors.length);
    },

    onclick: function(){
      states.menu.onstart();
    },

    onkeypressed: function(e){

    }
  },

  playing: {
    onstart: function(){
      game.state = "playing";
      
    },

    render: function(){
      graphics.setCamera();
      context.beginPath();
      map.renderBackground();

      for (var i = gameObjects.length - 1; i >= 0; i--) {
        if (checkObjectView(gameObjects[i])) {
          gameObjects[i].render();
        }
      }

      for (var i = gameObjectsIndependent.length - 1; i >= 0; i--) {
        if (checkObjectView(gameObjectsIndependent[i])) {
          gameObjectsIndependent[i].render();
        }
      }
      hud.render();
    },

    update: function(step){
      gamemodes[gamemodes.mode].ingame(step);

      if(player.hp <=0)
        states.death.onstart();
      for (var i = 0; i < gameObjects.length; i++) {
        if(gameObjects[i].toDelete === true){
          gameObjects.splice(i,1);
          i--;
          continue;
        } else {
          gameObjects[i].update(step);
        }  
      }

      for (var i = 0; i < gameObjectsIndependent.length; i++) {
        // usuwa numery z tablicy ktore zostaly usuniete
        if(gameObjectsIndependent[i].toDelete === true){
          gameObjectsIndependent.splice(i,1);
          i--;
          continue;
        } else {
          gameObjectsIndependent[i].update(step);
        }  
      }      
    },

    onclick: function(){
      
    },

    onkeypressed: function(e){
      if(e === "i"){
        states.inventory.onstart();
      }

      if(e === "p"){
        states.pause.onstart();
      }

      if(e >= 0 && e <= 9){
        player.bulletType = "type" + e;
      }

    }
  },

  inventory: {
    onstart: function(){
      game.state = "inventory";
    },

    render: function(){

    },

    update: function(step){
      
    },

    onclick: function(){
      
    },

    onkeypressed: function(e){
      if(e === "i"){
        states.playing.onstart();
      }
    }
  },

  pause: {
    onstart: function(){
      game.state = "pause";
    },

    render: function(){
      context.font = "80px Arial";
      context.fillStyle = "white";
      var text = "PAUSE";

      context.fillText(text,width/2 - context.measureText(text).width/2,height/2);
    },

    update: function(step){
      
    },

    onclick: function(){
      
    },

    onkeypressed: function(e){
      if(e === "p"){
        states.playing.onstart();
      }
    }
  },

  map: {
    onstart: function(){
      game.state = "map";
    },

    render: function(){

    },

    update: function(step){
      
    },

    onclick: function(){
      
    },

    onkeypressed: function(e){

    }
  },

  shop: {
    onstart: function(){
      game.state = "shop";
    },

    render: function(){

    },

    update: function(step){
      
    },

    onclick: function(){
      
    },

    onkeypressed: function(e){

    }
  },

  death: {
    onstart: function(){
      game.state = "death";
      gamemodes[gamemodes.mode].reset();
      gameObjects.splice(0,gameObjects.length);
      gameObjectsIndependent.splice(0,gameObjectsIndependent.length);
    },

    render: function(){
      context.fillStyle = "white";
      context.fillRect(0,0,width,height);
      context.font = "50px Arial";
      context.fillStyle = "black";
      var text = "YOU DIED!";

      context.fillText(text,width/2 - context.measureText(text).width/2,height/2);
      text = "Score: " + hud.points.amount;
      context.fillText(text,width/2 - context.measureText(text).width/2,height/2 + 50);
      text = "Click ENTER to back to the menu";
      context.fillText(text,width/2 - context.measureText(text).width/2,height/2 + 100);
    },

    update: function(step){
      if(keyboard.enter === true)
        states.menu.onstart();
    },

    onclick: function(){
      
    },

    onkeypressed: function(e){

    }
  }

};
/*
 * Tryby gry
 */

var gamemodes = {
  mode: 0,

  mode1: {

    asteroidTime: 0,

    onstart: function(){
      gamemodes.mode = "mode1"; 
      player = new Player(map.x/2, map.y/2);
      hud.points.amount = 0;
      create.enemy(250,250,"type1");
      create.enemy(450,450,"type1");
      create.enemy(550,50,"type1");
      create.enemy(50,550,"type1");
      create.enemy(350,750,"type1");
      create.enemy(150,550,"type1");
      create.enemy(350, 650,"type2");
      create.enemy(800,800,"type2");
      states.playing.onstart();    
    },

    render: function(){

    },

    getAsteroid: function(step){
      this.asteroidTime += step;
      if(this.asteroidTime >= 0.3){
          new Asteroid(getRandomInt(player.x - width/2 + 100,player.x + width/2 - 100),
          getRandomInt(player.y - height/2 + 100,player.y + height/2 - 100),
          getRandomInt(-80,80),getRandomInt(-80,80));
          this.asteroidTime = 0;
      }
    },

    ingame: function(step){
      this.getAsteroid(step);
    },

    loot: function(){

    },

    reset: function(){
      
    }

  },

  mode2: {

    asteroidTime: 0,

    onstart: function(){
      gamemodes.mode = "mode2";
      player = new Player(100,100);
      hud.points.amount = 0;
      states.playing.onstart();
    },

    render: function(){

    },

    getAsteroid: function(step){
      this.asteroidTime += step;
      if(this.asteroidTime >= 0.3){
          new Asteroid(getRandomInt(player.x - width/2 + 100,player.x + width/2 - 100),
                       getRandomInt(player.y - height/2 + 100,player.y + height/2 - 100),
                       getRandomInt(-80,80),getRandomInt(-80,80));
          
          this.asteroidTime = 0;
      }
    },

    ingame: function(step){
      this.getAsteroid(step);
    },

    loot: function(){

    },

    reset: function(){
      
    }
  },

  mode3: {

    amountOfEnemies: 2,
    wave: 0,
    onstart: function(){
      gamemodes.mode = "mode3";
      player = new Player(map.x/2, map.y/2);
      hud.points.amount = 0;
      states.playing.onstart();
    },

    render: function(){
      context.font = "25px Arial";
      context.fillStyle = "white";
      var text = "WAVE: " + this.wave;
      context.fillText(text,width/2 - text.length * 12,45);
    },

    getEnemies: function(step){
      var allEnemiesDead = true;

      for(var i = 0; i < gameObjects.length;i++){
        if(gameObjects[i].typeOfObject === "enemy")
          allEnemiesDead = false;
      }

      if(allEnemiesDead === true){
        this.amountOfEnemies++;
        this.wave++;
        if(this.wave % 10 === 0)
          new Boss(getRandomInt(0,map.x), getRandomInt(0,map.y), 400,
                      1500, 350 + this.wave * 15, 3500 + this.wave * 150, images["boss1"], "type2");
        for(var i = 1; i <= this.amountOfEnemies;i++){

          if(i % 4 === 0)
            create.enemy(getRandomInt(0,map.x),
                         getRandomInt(0,map.y),
                         "type2");
          else
            create.enemy(getRandomInt(0,map.x),
                         getRandomInt(0,map.y),
                         "type1");
        }
      }

    },

    ingame: function(step){
      this.getEnemies();
    },

    loot: function(x,y,boss){
      var random = getRandomInt(0,2);
      if( random === 1)
        new Health(x + getRandomInt(-5, 5), y + getRandomInt(-5, 5), 25);
    },

    reset: function(){
      this.amountOfEnemies = 2;
      this.wave = 0;
      //hud.points.amount = 0;
    }

  }

}








/*
 * Gra
 */
var game = {


  state: 0,

  /*
   * start gry
   */ 
  run: function(){
    states.menu.onstart();

    var now,
        dt = 0,
        last = timestamp(),
        slow = options.slow,
        step = 1/options.fps,
        update = options.update,
        render = options.render;


    /*
     * klatka
     */
    function frame(){
      now = timestamp();
      dt = dt + Math.min(1, (now - last) / 1000);
      

      while(dt > step) {
        dt = dt - step;
        update(step);
      }

      render();
      last = now;
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

  }
};

game.run();


/*
 * Sterowanie 
 */

function onkeydown(event) {
  if(event.keyCode === 87){
    keyboard.w = true;
  }

  if(event.keyCode === 83){
    keyboard.s = true;
  }

  if(event.keyCode === 65){
    keyboard.a = true;
  }

  if(event.keyCode === 68){
    keyboard.d = true;
  }

  if(event.keyCode === 13){
    keyboard.enter = true;
  }

  if(event.keyCode === 48){
    keyboard.k0 = true;
  }

  if(event.keyCode === 49){
    keyboard.k1 = true;
  }

  if(event.keyCode === 50){
    keyboard.k2 = true;
  }

  if(event.keyCode === 51){
    keyboard.k3 = true;
  }

  if(event.keyCode === 52){
    keyboard.k4 = true;
  }

  if(event.keyCode === 53){
    keyboard.k5 = true;
  }

  if(event.keyCode === 54){
    keyboard.k6 = true;
  }

  if(event.keyCode === 55){
    keyboard.k7 = true;
  }

  if(event.keyCode === 56){
    keyboard.k8 = true;
  }

  if(event.keyCode === 57){
    keyboard.k9 = true;
  }
}

function onkeyup(event) {
  if(event.keyCode === 87){
    keyboard.w = false;
  }

  if(event.keyCode === 83){
    keyboard.s = false;
  }

  if(event.keyCode === 65){
    keyboard.a = false;
  }

  if(event.keyCode === 68){
    keyboard.d = false;
  }

  if(event.keyCode === 13){
    keyboard.enter = false;
  }
  if(event.keyCode === 48){
    keyboard.k0 = false;
  }

  if(event.keyCode === 49){
    keyboard.k1 = false;
  }

  if(event.keyCode === 50){
    keyboard.k2 = false;
  }

  if(event.keyCode === 51){
    keyboard.k3 = false;
  }

  if(event.keyCode === 52){
    keyboard.k4 = false;
  }

  if(event.keyCode === 53){
    keyboard.k5 = false;
  }

  if(event.keyCode === 54){
    keyboard.k6 = false;
  }

  if(event.keyCode === 55){
    keyboard.k7 = false;
  }

  if(event.keyCode === 56){
    keyboard.k8 = false;
  }

  if(event.keyCode === 57){
    keyboard.k9 = false;
  }
}


/*
 * Tak, mialem duzo wolnego czasu 
 */
function onkeypressed(e){
  var value = e.keyCode;
  if(value >= 97 && value <= 122)
    value -= 32;
  var key;
  switch(value){
    case 48:
      key = "0";
      break;
    case 49:
      key = "1";
      break;
    case 50:
      key = "2";
      break;
    case 51:
      key = "3";
      break;
    case 52:
      key = "4";
      break;
    case 53:
      key = "5";
      break;
    case 54:
      key = "6";
      break;
    case 55:
      key = "7";
      break;
    case 56:
      key = "8";
      break;
    case 57:
      key = "9";
      break;
    case 65:
      key = "a";
      break;
    case 66:
      key = "b";
      break;
    case 67:
      key = "c";
      break;
    case 68:
      key = "d";
      break;
    case 69:
      key = "e";
      break;
    case 70:
      key = "f";
      break;
    case 71:
      key = "g";
      break;
    case 72:
      key = "h";
      break;
    case 73:
      key = "i";
      break;
    case 74:
      key = "j";
      break;
    case 75:
      key = "k";
      break;
    case 76:
      key = "l";
      break;
    case 77:
      key = "m";
      break;
    case 78:
      key = "n";
      break;
    case 79:
      key = "o";
      break;
    case 80:
      key = "p";
      break;
    case 81:
      key = "q";
      break;
    case 82:
      key = "r";
      break;
    case 83:
      key = "s";
      break;
    case 84:
      key = "t";
      break;
    case 85:
      key = "u";
      break;
    case 86:
      key = "v";
      break;
    case 87:
      key = "w";
      break;
    case 88:
      key = "x";
      break;
    case 89:
      key = "y";
      break;
    case 90:
      key = "z";
      break;
    default:
      key = "unknown";
  }



  states[game.state].onkeypressed(key);
}


/*
 * Sprawdza czy obiekt znajduje sie w polu widzenia gracza.
 * Zwraca true jesli obiekt znajduje sie w polu widzenia.
 * False jesli nie znajduje sie w polu widzenia.
 */
function checkObjectView(object) {
  if (player.x < width/2) {
    if(object.x > width + object.img.width|| object.x < - object.img.width){
      return false;
    }

  } else if(player.x < map.x - width/2) {
    if(object.x > player.x + width/2 + object.img.width|| object.x < player.x - width/2- object.img.width){
      return false;
    }    

  } else {
    if(object.x < player.x - width - object.img.width|| object.x > player.x + width - object.img.width){
      return false;
    }
  }

  if(player.y < height/2) {
    if(object.y > height  + object.img.height || object.y <  - object.img.height){
      return false;
    }

  } else if(player.y < map.y - height/2) {
    if(object.y > player.y + height/2 + object.img.height || object.y < player.y - height/2  - object.img.height){
      return false;
    }    

  } else {
    if(object.y < player.y - height  - object.img.height || object.y > player.y + height  - object.img.height){
      return false;
    }
  }
  return true;
}




/*
 * Sprawdza czy obiekt wyszedl poza mape
 */
function checkObjectBoundary(object){
  if(object.x + object.img.width < 0  ||
     object.y + object.img.height < 0 ||
     object.x > map.x                 ||
     object.y > map.y){
    return true;
  }
  return false;
}

/*
 * Przy kliknieciu myszy
 */
function onclick(event) {
  states[game.state].onclick();
}

function onmousedown(e) {
  if(e.button === 0){
    mouse.leftButton = true;
  }

  if(e.button === 2){
    mouse.rightButton = true;
  }
}

function onmouseup(e) {
  if(e.button === 0){
    mouse.leftButton = false;
  }

  if(e.button === 2){
    mouse.rightButton = false;
  }
}

/*
 * Zwraca pozycje myszki
 */
function onmousemove(event) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    //console.log(mouse.x + " " + mouse.y);
}

/*
 * Zwraca czas
 */
function timestamp(){
  return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

/*
 * sprawdza czy mysz znajduje sie w podanym kwadracie
 * x,y -> x + a, y + b 
 */
function checkMousePosition(x1,y1,x2,y2){
  if(mouse.x > x1 && mouse.y > y1 && mouse.x < x2 && mouse.y < y2)
    return true;
  return false;
}


/*
 * Zwraca liczbe int z przedzialu
 */
function getRandomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
 * Zwraca liczbe z przedzialu
 */
function getRandom(min, max){
  return Math.random() * (max - min) + min;
}

/*
 * Zwraca -1 lub 1
 */
function getPosNeg(){
  var number = Math.floor(Math.random() * (3)) -1;
  while(number === 0){
    number = Math.floor(Math.random() * (3)) -1;
  }
  return number;
}


