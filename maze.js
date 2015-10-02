function point(x,y,id){
  this.x = x;
  this.y = y;
  this.id = id;
};

SVG = {

  createCanvas : function( width, height, containerId ){
    var container = document.getElementById( containerId );
    var canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    container.appendChild( canvas );
    return canvas;
  },

  createLine : function(x1, y1, x2, y2, color, width){
    var aLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    aLine.setAttribute('x1', x1);
    aLine.setAttribute('y1', y1);
    aLine.setAttribute('x2', x2);
    aLine.setAttribute('y2', y2);
    aLine.setAttribute('stroke', color);
    aLine.setAttribute('stroke-width', width);
    return aLine;
  },

  createRectangle : function(x, y, width, height, color, strokeWidth){
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', strokeWidth);
    rect.setAttributeNS(null,'fill', 'rgb(255,255,255)');
    return rect;
  },

  createCircle : function(x, y, r,color){
    var circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circ.setAttribute('cx', x);
    circ.setAttribute('cy', y);
    circ.setAttribute('r', r);
    circ.setAttributeNS(null,'fill', color);
    return circ;
  }
};

function mazeView(mazeSize, cellSize, domParentID){
  this.container;
  this.mazeSize = mazeSize;
  this.cellWidth = cellSize;
  this.width = mazeSize * cellSize;
  this.offset = cellSize;

  this.setContainer =  function(height, width, domParentID) {
   this.container = SVG.createCanvas(height, width, domParentID);
  };

  this.drawBorder = function(size) {
    this.container.appendChild(SVG.createRectangle(0, 0, size, size, 'rgb(0,0,0)', .5))
  };

  this.updateView = function(model){

    for(var k = 0; k < model.nodes.length; k++){
      var base = model.nodes[k];
      var neighbors = model.allNeighbors(base);

      for(var l=0; l < neighbors.length; l++){
        if(model.isConnected(base, neighbors[l]) == false){
          this.drawWall(base, neighbors[l]);
        }
      }
    }

    this.markStart(model.start.x, model.start.y);
    this.markFinish(model.finish.x, model.finish.y);
  };

  this.markStart = function(x,y){
    this.container.appendChild(SVG.createCircle(this.offset / 2 + x * this.cellWidth, this.offset / 2 + y * this.cellWidth, 2,'rgb(0,255,0)'));
  };

  this.markFinish = function(x,y){
    this.container.appendChild(SVG.createCircle(this.offset / 2 + x * this.cellWidth, this.offset / 2 + y * this.cellWidth, 2,'rgb(0,0,255)'));
  }

  this.drawWall = function(node1, node2){

    if(node1.x == node2.x){
      this.container.appendChild(SVG.createLine(node1.x * this.cellWidth, this.offset / 2 + (node1.y+node2.y)/2 * this.cellWidth,node1.x * this.cellWidth + this.cellWidth, this.offset / 2 + (node1.y+node2.y)/2 * this.cellWidth, 'rgb(0,0,0)', 1))
    }

    if(node1.y == node2.y){
      this.container.appendChild(SVG.createLine(this.offset / 2 + (node1.x+node2.x)/2 * this.cellWidth,node1.y * this.cellWidth,this.offset / 2 + (node1.x+node2.x)/2 * this.cellWidth,node1.y * this.cellWidth + this.cellWidth, 'rgb(0,0,0)', 1))
    }

  };

  // these run when the object is initialized
  this.setContainer(this.width, this.width, domParentID);
  this.drawBorder(this.width);
}

function mazeModel(size){
  this.size = size;
  this.nodes = [];
  this.connectionMatrix = [];
  this.start;
  this.finish;
  this.currentCell;
  this.buildVisiteds = [];
  this.buildCrumTrail = [];

  this.initialize = function(){
    this.initNodes();
    this.initMatrix();
    this.initWalls();
    this.setStart();
    this.setFinish();
    this.initMazePaths();
  };

  this.checkVisited = function(cell){
    for(var i = 0; i < this.buildVisiteds.length; i++){
      if(cell == this.buildVisiteds[i]){
        return true;
      }
    }
    return false;
  };

  this.initMazePaths = function(){
    var allNeighbors;
    var openNeighbors;
    var nextCell;
    var beforeCell;

    while(this.buildVisiteds.length < this.nodes.length){

      if(this.checkVisited(this.currentCell) == false){
        this.buildVisiteds.push(this.currentCell);
      };

      openNeighbors = this.openNeighbors(this.currentCell);

      if(openNeighbors.length > 0){

        nextCell = openNeighbors[this.randIndex(openNeighbors.length)];

        this.buildCrumTrail.push(this.currentCell);
        this.buildPath(this.currentCell, nextCell);
        this.currentCell = nextCell;
      }
      else{
        beforeCell = this.buildCrumTrail.pop();
        this.currentCell = beforeCell;
      }

    }
  };

  this.randIndex = function(length){
    return Math.floor((Math.random() * length));
  };

  this.setStart = function(){
    this.start = this.getNodeByCoordinates(0,0);
  };

  this.setFinish = function(){
    this.finish = this.getNodeByCoordinates(this.size-1,this.size-1);
    this.currentCell = this.finish;
  };

  this.initNodes = function(){
    var counter = 0;
    for(var i = 0; i < this.size; i++){
      for(var j = 0; j < this.size; j++){
        this.nodes.push(new point(i,j,counter));
        counter++;
      }
    }
  };

  this.initMatrix = function(){
    for(var i = 0; i < this.nodes.length; i++){
      this.connectionMatrix[i] = [];
      for(var j = 0; j < this.nodes.length; j++){
        this.connectionMatrix[i][j] = 0;
      }
    }
  };

  this.initWalls = function(){
    for(var i = 0; i < this.nodes.length; i++){
      var base = this.nodes[i];
      var neighbors = this.allNeighbors(base);

      for(var j = 0; j < neighbors.length; j++){
        this.buildWall(base, neighbors[j]);
      }
    }
  };

  this.buildWall = function(node1, node2){
    this.connectionMatrix[node1.id][node2.id] = 1;
    this.connectionMatrix[node2.id][node1.id] = 1;
  };

  this.buildPath = function(node1, node2){
    this.connectionMatrix[node1.id][node2.id] = 2;
    this.connectionMatrix[node2.id][node1.id] = 2;
  };

  this.isConnected = function(node1, node2){
    if(this.connectionMatrix[node1.id][node2.id] == 2){
      return true;
    }
    else{
      return false;
    }
  }

  this.allNeighbors = function(node){
    var neighbors = [];

    if(node.x > 0){
      neighbors.push(this.getNodeByCoordinates(node.x - 1, node.y))
    }
    if(node.y > 0){
      neighbors.push(this.getNodeByCoordinates(node.x, node.y - 1))
    }
    if(node.x < this.size - 1){
      neighbors.push(this.getNodeByCoordinates(node.x + 1, node.y))
    }
    if(node.y < this.size - 1){
      neighbors.push(this.getNodeByCoordinates(node.x, node.y + 1))
    }

    return neighbors;
  };

  this.openNeighbors = function(node){
    var openNeighbors = [];
    var allNeighbors = this.allNeighbors(node);

    for(var i=0; i < allNeighbors.length; i++){
      if(this.checkVisited(allNeighbors[i]) == false){
        openNeighbors.push(allNeighbors[i]);
      }
    };
    return openNeighbors;
  };

  this.getNodeByCoordinates = function(x, y){
    for(var i=0; i < this.nodes.length; i++){
      if(this.nodes[i].x == x && this.nodes[i].y == y){
        return this.nodes[i];
      }
    }

    return null;
  }

  // this runs when the object is initialized
  this.initialize();

};

function mazeController(){

  var maze_size = 50;
  var cell_size = 10;

  this.model = new mazeModel(maze_size);
  this.view = new mazeView(maze_size,cell_size, 'maze-svg-container');
  this.view.updateView(this.model);
}


$(document).ready(function(){
  var controller = new mazeController();

});