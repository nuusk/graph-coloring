import p5 from 'p5';
export default function sketch(s) {
  let x, y, backgroundColor;

  const _windowWidth = window.innerWidth;
  const _windowHeight = window.innerHeight;

  let graphData;
  let dataFile = '../../resources/data/sugar.txt';
  let graph;
  let colors = new Array();
  let numberOfColors = 0;

  s.preload = () => {
    graphData = s.loadStrings('../gc/' + dataFile );
  }

  s.setup = () => {
    s.createCanvas(_windowWidth, _windowHeight);
    graphData = graphData.toString().split(',');
    graph = new Graph();
    // graph.showInfo();
    graph.greedyColoring();
    console.log(colors);
  };

  s.draw = () => {
    s.background(44, 44, 44);
    // population.run();
    graph.drawLines();
    graph.drawVertices();
  }

  function Graph() {
    this.vertices = [];
    this.size = parseInt(graphData[0], 10);
    // console.log('POPULATION SIZE: ' + this.size);

    //create vertices
    //!! INDEXING FROM 1 !!
    for (let i=1; i<=this.size; i++) {
      this.vertices[i] = new Vertex(i);
    }

    //assign vertices to their neighbors
    for (let i=1; i<graphData.length; i++) {
      // console.log('CURRENT RELATION: ' + graphData[i]);
      let neighbors = graphData[i].split(' ');
      try {
        this.vertices[parseInt(neighbors[0])].relateNeighbors(parseInt(neighbors[1]));
        this.vertices[parseInt(neighbors[1])].relateNeighbors(parseInt(neighbors[0]));
      } catch (err) {
        console.log(neighbors);
        console.error(err);
      }
    }

    this.showInfo = () => {
      this.vertices.forEach(vertex => {
        console.log(vertex);
      });
    }

    this.drawVertices = () => {
      this.vertices.forEach(vertex => {
        vertex.show();
      });
    }

    this.drawLines = () => {
      this.vertices.forEach(vertex => {
        vertex.connectNeighbors();
      });
    }

    this.greedyColoring = () => {
      this.vertices.forEach(vertex => {
        vertex.assignGreedyColor();
      });
    }
  }

  function Vertex(index) {
    this.index = index;
    this.position = s.createVector(_windowWidth*0.1 + s.random(0.8)*_windowWidth, _windowHeight*0.1+s.random(0.8)*_windowHeight);
    this.neighbors = new Set();
    this.radius = 25 + s.random(1)*10;
    this.colorIndex = -1;
    this.lineColor = s.random(12);

    this.relateNeighbors = (neighbourIndex) => {
      this.neighbors.add(neighbourIndex);
      // console.log('added neighbour ' + neighbourIndex + ' to ' + this.index);
    }

    this.show = () => {
      s.push();
      // console.log(this.color);
      s.noStroke();
      if (this.colorIndex != -1) {
        s.fill(colors[this.colorIndex]);
      }
      s.ellipse(this.position.x, this.position.y, this.radius, this.radius);
      s.pop();
    }

    this.connectNeighbors = () => {
      this.neighbors.forEach(neighbourIndex => {
        s.push();
        s.stroke(this.lineColor);
        s.line(this.position.x, this.position.y, graph.vertices[neighbourIndex].position.x, graph.vertices[neighbourIndex].position.y);
        s.pop();
      });
    }

    this.assignGreedyColor = () => {
      let alreadyUsed = new Set();
      this.neighbors.forEach(neighbour => {
        // console.log(neighbour);
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
      // console.log('wszystkie sie powtarzaly');
      this.colorIndex = colors.length;
      colors.push(s.color(s.random(255), s.random(255), s.random(255)));
      console.log('nowy kolor ' + this.colorIndex);
      // console.log(this.color);
    }
  }

}
