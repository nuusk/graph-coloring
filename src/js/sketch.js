import p5 from 'p5';
export default function sketch(s) {
  let x, y, backgroundColor;

  const _windowWidth = window.innerWidth;
  const _windowHeight = window.innerHeight;

  //raw file
  let dataFile = '../../resources/data/sugar.txt';
  let graphData;
  let graph;
  let results;
  let colors = new Array();
  let numberOfColors = 0;
  let _canvas;

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
  }

  function Vertex(index) {
    //number of the vertex in the graph
    this.index = index;

    //center position of each vertex
    this.position = s.createVector(_windowWidth*0.2 + s.random(0.7)*_windowWidth, _windowHeight*0.1+s.random(0.8)*_windowHeight);

    //used for skewing graph while mouse is moving
    this.offset = {
      x: this.position.x - _windowWidth/2,
      y: this.position.y - _windowHeight/2
    };

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
      s.ellipse(this.position.x, this.position.y, this.radius, this.radius);
      s.pop();
    }

    //draw lines between this vertex and its neighbors
    this.connectNeighbors = () => {
      this.neighbors.forEach(neighbourIndex => {
        s.push();
        s.stroke(this.lineColor);
        s.line(this.position.x, this.position.y, graph.vertices[neighbourIndex].position.x, graph.vertices[neighbourIndex].position.y);
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
