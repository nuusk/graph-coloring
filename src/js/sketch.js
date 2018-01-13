import p5 from 'p5';
export default function sketch(s) {
  let x, y, backgroundColor;

  const _windowWidth = window.innerWidth;
  const _windowHeight = window.innerHeight;

  //raw file
  let dataFile = '../../resources/data/sugar.txt';
  //graph in the data file
  let graphData;

  let graph;
  let results;
  let colors = new Array();
  let numberOfColors = 0;
  let _canvas;
  let pivotPoint = {
    x: s.mouseX,
    y: s.mouseY
  }

  let skewMode = false;

  s.preload = () => {
    graphData = s.loadStrings('../gc/' + dataFile );
  }

  s.setup = () => {
    _canvas = s.createCanvas(_windowWidth, _windowHeight);
    graphData = graphData.toString().split(',');
    graph = new Graph();
    _canvas.mouseOver(graph.skewGraph);
    // graph.showInfo();
    graph.greedyColoring();
    console.log(colors);
    results = new Results();
  };

  s.mousePressed = () => {
    if (skewMode) {
      graph.assignSkew();
    } else {
      pivotPoint.x = s.mouseX;
      pivotPoint.y = s.mouseY;
      // graph.updateOffset();
    }
    skewMode = !skewMode;
  }

  s.draw = () => {
    //background gray color
    s.background(44, 44, 44);
    //draw lines between vertices
    graph.drawLines();
    //draw vertices on top of that
    graph.drawVertices();
    //show the results
    results.show();
  }

  function Results() {
    //a component that is used just for displaying the current state of the results
    this.fontSize = 32;
    this.fontColor = s.color(220, 220, 220);
    this.position = s.createVector(5, this.fontSize);

    this.show = () => {
      s.textSize(this.fontSize);
      s.fill(this.fontColor);
      s.text('GREEDY ALGORITHM', this.position.x, this.position.y);
      s.text('Colors used: ' + colors.length, this.position.x, this.position.y*2);
    }
  }

  function Graph() {
    //graph is made from vertices that are hold in this array
    this.vertices = [];

    //population size
    this.size = parseInt(graphData[0], 10);

    //create vertices
    //!! INDEXING FROM 1 !!
    for (let i=1; i<=this.size; i++) {
      this.vertices[i] = new Vertex(i);
    }

    //assign vertices to their neighbors
    for (let i=1; i<graphData.length; i++) {
      let neighbors = graphData[i].split(' ');
      try {
        this.vertices[parseInt(neighbors[0])].relateNeighbors(parseInt(neighbors[1]));
        this.vertices[parseInt(neighbors[1])].relateNeighbors(parseInt(neighbors[0]));
      } catch (err) {
        console.log(neighbors);
        console.error(err);
      }
    }

    //when the mouse moves, skew the graph a little
    this.skewGraph = () => {
     console.log('X: ' + s.mouseX);
     console.log('Y: ' + s.mouseY);
    }

    //FOR DEBUGGING
    this.showInfo = () => {
      this.vertices.forEach(vertex => {
        console.log(vertex);
      });
    }

    //draw the vertices of this graph
    this.drawVertices = () => {
      this.vertices.forEach(vertex => {
        vertex.show();
      });
    }

    //draw the lines between vertices that are neighbors
    this.drawLines = () => {
      this.vertices.forEach(vertex => {
        vertex.connectNeighbors();
      });
    }

    //greedy coloring algorithm
    this.greedyColoring = () => {
      this.vertices.forEach(vertex => {
        vertex.assignGreedyColor();
      });
    }

    //to set the new position values based on the skew
    this.assignSkew = () => {
      this.vertices.forEach(vertex => {
        let skewedPosition = vertex.calculatePosition();
        vertex.position.x = skewedPosition[0];
        vertex.position.y = skewedPosition[1];
      });
    }

    this.updateOffset = () => {
      this.vertices.forEach(vertex => {
        vertex.offset.x = vertex.position.x - pivotPoint.x;
        vertex.offset.y = vertex.position.y - pivotPoint.y;
      });
    }
  }

  function Vertex(index) {
    //number of the vertex in the graph
    this.index = index;

    this.multiplier = s.random(1);

    //center position of each vertex
    this.position = s.createVector(_windowWidth*0.2 + s.random(0.7)*_windowWidth, _windowHeight*0.1+s.random(0.8)*_windowHeight);

    //used for skewing graph while mouse is moving
    this.offset = {
      x: this.position.x - pivotPoint.x,
      y: this.position.y - pivotPoint.y
    };

    //calculate the vertex center based on the mouse position on the screen
    this.calculatePosition = () => {
      let x = this.position.x + this.multiplier * this.offset.x * (s.mouseX-pivotPoint.x/2)*0.01;
      let y = this.position.y + this.multiplier * this.offset.y * (s.mouseY-pivotPoint.y/2)*0.01;
      return [x, y];
    }

    //set of all vertex's neighbors
    this.neighbors = new Set();

    this.radius = 25 + s.random(1)*10;

    //color index determines the value of color from the colors array (global)
    this.colorIndex = -1;

    //color of the edge
    this.lineColor = s.random(12);

    //function used for adding neighbors to the vertex
    this.relateNeighbors = (neighbourIndex) => {
      this.neighbors.add(neighbourIndex);
    }

    //draw vertex
    this.show = () => {
      s.push();
      s.noStroke();
      if (this.colorIndex != -1) {
        s.fill(colors[this.colorIndex]);
      }
      let skewedPosition = skewMode ? this.calculatePosition() : [this.position.x, this.position.y];
      s.ellipse(skewedPosition[0], skewedPosition[1], this.radius, this.radius);
      s.pop();
    }

    //draw lines between this vertex and its neighbors
    this.connectNeighbors = () => {
      this.neighbors.forEach(neighbourIndex => {
        s.push();
        s.stroke(this.lineColor);
        let skewedPositionA = skewMode ? this.calculatePosition() : [this.position.x, this.position.y];
        let skewedPositionB = skewMode ? graph.vertices[neighbourIndex].calculatePosition() : [graph.vertices[neighbourIndex].position.x, graph.vertices[neighbourIndex].position.y];
        s.line(skewedPositionA[0], skewedPositionA[1], skewedPositionB[0], skewedPositionB[1]);
        s.pop();
      });
    }

    //function to get a color for this vertex. it's assigned using greedy algorithm
    this.assignGreedyColor = () => {
      let alreadyUsed = new Set();
      this.neighbors.forEach(neighbour => {
        alreadyUsed.add(graph.vertices[neighbour].colorIndex);
      });
      for (let i=0; i<colors.length; i++) {
        if (alreadyUsed.has(i)) continue;
        else {
          this.colorIndex = i;
          console.log('aktualny kolor: ' + this.colorIndex);
          return;
        }
      }
      this.colorIndex = colors.length;
      colors.push(s.color(s.random(255), s.random(255), s.random(255)));
      console.log('nowy kolor ' + this.colorIndex);
    }
  }

}
