import p5 from 'p5';
export default function sketch(s) {
  let x, y, backgroundColor;

  const _windowWidth = window.innerWidth;
  const _windowHeight = window.innerHeight;

  const POPULATION_SIZE = 100;
  //how many generations until we stop the algorithm
  const GENERATION_LIMIT = 100;

  const GAMMA_RATE = 0.1;

  //how many frames for each iteration of drawing function
  const frameTime = 100;
  //holds the value of the current frame. it is incremented with each draw loop
  let currentFrame = 0;

  //raw file
  let dataFile = '../../resources/data/kakao.txt';
  //graph in the data file
  let graphData;

  //graph colored using greedy algorithm. it's used to determine the max possible number of colors
  let graph;

  //population that consists of a given number of graphs.
  let population;

  //component for showing results on the screen
  let results;

  //array of all currently used colors
  let colors = new Array();

  //number of colors assigned with greedy algorithm
  let greedyColorsNumber = 0;

  //number of colors assigned with genetic algorithm in the current population
  let geneticColorsNumber = 0;

  //p5.js canvas
  let _canvas;

  //pivot point is the point that the graph moves around during mouse movement (when skew mode is activated)
  let pivotPoint = {
    x: s.mouseX,
    y: s.mouseY
  }

  //draw mode makes the graph appear on the screen
  //should be disabled for very large instances
  let drawMode = true;

  //skew mode makes the graph moves according to the mouse movement
  let skewMode = false;

  s.preload = () => {
    graphData = s.loadStrings('../gc/' + dataFile );
  }

  s.mousePressed = () => {
    if (skewMode) {
      graph.assignSkew();
    } else {
      pivotPoint.x = s.mouseX;
      pivotPoint.y = s.mouseY;
    }
    skewMode = !skewMode;
  }

  s.setup = () => {
    _canvas = s.createCanvas(_windowWidth, _windowHeight);
    graphData = graphData.toString().split(',');
    graph = new Graph();
    // graph.showInfo();
    graph.greedyColoring();     //it gives us the value max possible number of colors that we have to optimize
    greedyColorsNumber = colors.length;
    geneticColorsNumber = greedyColorsNumber;

    population = new Population();
    population.generate();
    population.selection();
    population.crossover();
    // population.showInfo();

    results = new Results();
  };

  s.draw = () => {
    //background gray color
    if (skewMode) {
      s.background(40, 50, 60);
    } else {
      s.background(44, 44, 44);
    }

    if (drawMode) {
      // // GREEDY
      // //draw lines between vertices
      // graph.drawLines();
      // //draw vertices on top of that
      // graph.drawVertices();

      population.selection();
      population.crossover(); //creates new element and applies mutationBeta to it
    }
    //show the results
    results.show();

    currentFrame++;
  }


  function Population() {
    this.size = POPULATION_SIZE;

    this.graphs = [];
    this.parents = [];

    //the fitness of the whole population;
    this.fitness = 0;

    this.worstGraph = 0;

    this.colorsUsed = 0;

    //for creating first generation
    this.generate = () => {
      //!! indexing from 1 !!
      for (let i=1; i<=this.size; i++) {
        this.graphs[i] = new Graph(i);
        this.graphs[i].randomize();
        this.graphs[i].mutationAlpha();
      }
    }

    this.showInfo = () => {
      this.graphs.forEach(graph => {
        console.log('F: ' + graph.fitness);
        console.log('~~~~P: ' + graph.probability);
      });
    }



    this.selection = () => {
      //this function will add the fitness of each graph to the population fitness
      //hence we have to make it 0 before starting the procedure
      this.fitness = 0;
      this.graphs.forEach(graph => {
        graph.calculateFitness();
      });
      //the current min fitness is temporarly the fitness of the first element
      this.minFitness = this.graphs[1].fitness;
      this.maxFitness = this.graphs[1].fitness;
      //find the min fitness
      this.graphs.forEach(graph => {
        if (graph.fitness < this.minFitness) {
          this.minFitness = graph.fitness;
          this.worstGraphIndex = graph.index;
        }
        if (graph.fitness > this.maxFitness) {
          this.maxFitness = graph.fitness;
        }
      });
      console.log(this.worstGraph);
      console.log(this.graphs);
      //find probability to be selected as a parent by normalizing fitness
      this.graphs.forEach(graph => {
        graph.normalizeFitness();
      });
      console.log('POPULATION FITNESS : ' + this.fitness);

      let indexA = 1;
      let parentA = s.random(1);
      let indexB = 1;
      let parentB = s.random(1);

      //making a list that will help us pick the graph according to the probability
      while (parentA > 0) {
        parentA = parentA - this.graphs[indexA].probability;
        indexA++;
      }
      while (parentB > 0) {
        parentB = parentB - this.graphs[indexB].probability;
        indexB++;
      }
      indexA--;
      indexB--;

      //this parents contains two selected parents
      this.parents.push(this.graphs[indexA]);
      this.parents.push(this.graphs[indexB]);
    }

    this.crossover = () => {
      let dna = [];
      let chromosomeSize = this.parents[0].size;
      //crosspoint is a random value between 0 and the number of vertices in the graph
      let crosspoint = s.floor(s.random(chromosomeSize));
      for (let i=1; i<=chromosomeSize; i++) {

        if (i < crosspoint) {
          dna.push(this.parents[0].vertices[i].colorIndex);
        } else {
          dna.push(this.parents[1].vertices[i].colorIndex);
        }
        console.log('color ' + dna[i]);
      }
      //eliminate the worst graph and generate the new population element with given dna
      this.graphs[this.worstGraphIndex] = new Graph(this.worstGraphIndex, dna);
      this.graphs[this.worstGraphIndex].mutationBeta();
      this.graphs[this.worstGraphIndex].mutationGamma();

    }
  }

  function Results() {
    //a component that is used just for displaying the current state of the results
    this.fontSize = 32;
    this.fontColor = s.color(220, 220, 220);
    this.position = s.createVector(5, this.fontSize);

    this.show = () => {
      s.textSize(this.fontSize);
      s.fill(this.fontColor);

      if (skewMode) {
        s.text(' ~ skew mode (click to swap) ~', this.position.x, this.position.y);
      } else {
        s.text(' ~ (click to skew) ~', this.position.x, this.position.y);
      }
      s.text('GREEDY', this.position.x, this.position.y*3);
      s.text('Colors used: ' + greedyColorsNumber, this.position.x, this.position.y*4);

      s.text('GENETIC', this.position.x, this.position.y*6);
      s.text('Colors used: ' + population.colorsUsed, this.position.x, this.position.y*7);
      s.text('Population fitness: ' + s.floor(population.fitness), this.position.x, this.position.y*8);
      s.text('Min fitness: ' + s.floor(population.minFitness), this.position.x, this.position.y*9);
      s.text('Max fitness: ' + s.floor(population.maxFitness), this.position.x, this.position.y*10);

    }
  }

  function Graph(index = 0, dna) {
    //index in the population
    this.index = index;
    //graph is made from vertices that are hold in this array
    this.vertices = [];
    this.fitness = -1;
    this.probability = 0;



    //number of vertices
    this.size = parseInt(graphData[0], 10);

    //create vertices
    //!! INDEXING FROM 1 !!
    for (let i=1; i<=this.size; i++) {
      this.vertices[i] = new Vertex(i);
      if (dna) {
        console.log('created new graph with given dna');
        this.vertices[i].colorIndex = dna[i];
      }
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

    //when creating a population, assign random DNA to the graph
    this.randomize = () => {
      //for each vertex, give it a random color index from the current maximum range of colors
      //the current colors pool is generated by genetic algorithm
      this.vertices.forEach(vertex => {
        vertex.colorIndex = s.floor(s.random(greedyColorsNumber));
      });
    }

    //this mutation is applied to eliminate incorrect coloring.
    //there still is a chance that vertices will end up with incorrect coloring
    //however this steps adds variation that is needed for the population to evolve
    this.mutationAlpha = () => {
      this.vertices.forEach(vertex => {
        vertex.neighbors.forEach(neighbour => {
          if (vertex.colorIndex == this.vertices[neighbour].colorIndex) {
            //if neighbour has the same color, assign new color from the list of available colors
            vertex.colorIndex = s.floor(s.random(greedyColorsNumber));
          }
        });
      });
    }

    this.mutationBeta = () => {
      let applyBeta = false;
      this.vertices.forEach(vertex => {
        applyBeta = false;
        vertex.neighbors.forEach(neighbour => {
          if (vertex.colorIndex == this.vertices[neighbour].colorIndex) {
            applyBeta = true;
          }
        });
        if (applyBeta) {
          let adjacentColors = new Set();
          let availableColors = new Set();
          vertex.neighbors.forEach(neighbour => {
            adjacentColors.add(neighbour.colorIndex);
          });
          for (let i=0; i<colors.length; i++) {
            if (!adjacentColors.has(i)) {
              availableColors.add(i);
            }
          }

          //get random color from the valid colors set
          let r = Math.floor(Math.random() * availableColors.size);
          vertex.colorIndex = availableColors[r];
        }
      });
    }

    this.mutationGamma = () => {
      this.vertices.forEach(vertex => {
        let r = s.random(1);
        if (r <= GAMMA_RATE) {
          vertex.colorIndex = Math.floor(Math.random(colors.length));
        }
      });
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

    //fitness value of the graph means how likely we are to pick this graph as a parent
    this.calculateFitness = () => {
      let setOfColors = new Set();
      let numberOfBadEdges = 0;
      this.vertices.forEach(vertex => {
        //colors
        setOfColors.add(vertex.colorIndex);
        //bad edges
        vertex.neighbors.forEach(neighbour => {
          if (vertex.colorIndex == this.vertices[neighbour].colorIndex) {
            numberOfBadEdges++;
          }
        });
      });
      //every edge is counted twice, so we divide it by half to get the actual number of bad edges
      numberOfBadEdges = numberOfBadEdges/2;
      let worstCaseScenario = this.size * this.size + this.size;
      if (population.colorsUsed <= 0 || population.colorsUsed > setOfColors.size) {
        population.colorsUsed = setOfColors.size;
      }
      let currentScenario = numberOfBadEdges * this.size + setOfColors.size;
      this.fitness = worstCaseScenario/currentScenario;
      population.fitness += this.fitness;
    }

    this.normalizeFitness = () => {
      this.probability = this.fitness/population.fitness;
    }

  }

  function Vertex(index) {
    //number of the vertex in the graph
    this.index = index;

    //random multiplier used for skewing graph (when moving a mouse)
    this.multiplier = s.random(1);

    //center position of each vertex
    this.position = s.createVector(_windowWidth*0.2 + s.random(0.7)*_windowWidth, _windowHeight*0.1+s.random(0.8)*_windowHeight);

    //calculate the vertex center based on the mouse position on the screen
    this.calculatePosition = () => {
      let x = this.position.x + this.multiplier * (s.mouseX-pivotPoint.x);
      let y = this.position.y + this.multiplier * (s.mouseY-pivotPoint.y);
      return [x, y];
    }

    //set of all vertex's neighbors
    this.neighbors = new Set();

    this.radius = 25 + s.random(1)*10;

    //color index determines the value of color from the colors array (global)
    this.colorIndex = -1;

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
        s.stroke(skewMode ? 200:12);
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
          //assign the color that already exists
          this.colorIndex = i;
          return;
        }
      }
      //create new color and push it to the colors array
      this.colorIndex = colors.length;
      colors.push(s.color(s.random(255), s.random(255), s.random(255)));
    }
  }

}
