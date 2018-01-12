import p5 from 'p5';
export default function sketch(s) {
  let x, y, backgroundColor;

  const _windowWidth = 640;
  const _windowHeight = 480;

  let graphData;
  let dataFile = 'kam2';
  let graph;

  s.preload = () => {
    graphData = s.loadStrings('../gc/' + dataFile );
  }

  s.setup = () => {
    s.createCanvas(_windowWidth, _windowHeight);
    graphData = graphData.toString().split(',');
    graph = new Graph();
    // graph.showInfo();
  };

  s.draw = () => {
    s.background(0);
    // population.run();
    graph.update();
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

    this.update = () => {
      this.vertices.forEach(vertex => {
        vertex.show();
      });
    }
  }

  function Vertex(index) {
    this.index = index;
    this.position = s.createVector(_windowWidth*0.1 + s.random(0.8)*_windowWidth, _windowHeight*0.1+s.random(0.8)*_windowHeight);
    this.neighbors = new Set();
    this.radius = 25 + s.random(1)*5;

    this.relateNeighbors = (neighbourIndex) => {
      this.neighbors.add(neighbourIndex);
      // console.log('added neighbour ' + neighbourIndex + ' to ' + this.index);
    }

    this.show = () => {
      s.push();
      s.ellipse(this.position.x, this.position.y, this.radius, this.radius);
      s.pop();
    }
  }
  
}
