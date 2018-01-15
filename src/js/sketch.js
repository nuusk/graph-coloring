import p5 from 'p5';
export default function sketch(s) {
  let x, y, backgroundColor;

  const _windowWidth = window.innerWidth;
  const _windowHeight = window.innerHeight;

  const POPULATION_SIZE = 100;
  //how many generations until we stop the algorithm
  const GENERATION_LIMIT = 1000000000;

  const GAMMA_RATE = 0.3;

  let generationNumber = 0;

  //raw file
  let dataFile = '../../resources/data/chocolate.txt';
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
  let drawMode = false;

  //skew mode makes the graph moves according to the mouse movement
  let skewMode = false;

  let pauseMode = false;
  let evolve = true;
  let stopAfterEvolving = false;

  s.preload = () => {
    graphData = s.loadStrings('../gc/' + dataFile );
  }

  let buttons = {};

  s.mousePressed = () => {
    if (
      !buttons.pause.checkIfClicked() &&
      !buttons.run.checkIfClicked() &&
      !buttons.iteration.checkIfClicked() &&
      !buttons.data.checkIfClicked()
    ) {
      skewMode = !skewMode;
      console.log(skewMode);
      if (skewMode) {
        graph.assignSkew();
      } else {
        pivotPoint.x = s.mouseX;
        pivotPoint.y = s.mouseY;
      }
    }
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
    //population.showInfo();

    results = new Results();

    buttons = {
      pause: new Button(80, _windowHeight-80, s.color(150, 50, 50)),
      run: new Button(160, _windowHeight-80, s.color(50, 150, 50)),
      iteration: new Button(240, _windowHeight-80, s.color(50, 70, 100)),
      data: new Button(320, _windowHeight-80, s.color(150, 150, 50))
    };

    buttons.pause.clicked = () => {
      pauseMode != pauseMode;
    }

    buttons.run.clicked = () => {
      stopAfterEvolving != stopAfterEvolving;
    }

    buttons.iteration.clicked = () => {
      evolve = true;
    }

    buttons.data.clicked = () => {
      console.log('not yet');
    }

  };

  s.draw = () => {
    if (evolve) {
      if (generationNumber < GENERATION_LIMIT) {
        //background gray color
        if (skewMode) {
          s.background(40, 50, 60);
        } else {
          s.background(44, 44, 44);
        }

        population.selection();
        population.crossover(); //creates new element and applies mutationBeta to it

        if (drawMode) {
          // GREEDY
          //draw lines between vertices
          // graph.drawLines();
          //draw vertices on top of that
          // graph.drawVertices()
        }
        //show the results
        results.show();

        buttons.pause.show();
        buttons.run.show();
        buttons.data.show();
        buttons.iteration.show();
      }
      generationNumber++;
    }
    evolve = stopAfterEvolving ? false:true;
  }

  function Button(x, y, color) {
    this.radius = 70;
    this.position = s.createVector(x, y);
    this.color = color;

    this.show = () => {
      s.push();
      s.noStroke();
      s.fill(this.color)
      s.ellipse(this.position.x, this.position.y, this.radius, this.radius);
      s.pop();
    }

    this.checkIfClicked = () => {
      let distanceFromMouse = s.dist(s.mouseX, s.mouseY, this.position.x, this.position.y);
      if (distanceFromMouse < this.radius) {
        this.clicked();
        return true;
      }
      return false;
    }
  }


  function Population() {
    this.size = POPULATION_SIZE;

    //array of all graphs in the population
    this.graphs = [];
    //in each population, two graphs will be parents that will produce a child
    this.parents = [];

    //the fitness of the whole population;
    this.fitness = 0;
    this.bestFitness = 0;

    //index of the graph that will be replaced by the newborn
    this.EX = 0;

    //colors used by the child in the population
    this.colorsUsed = 0;

    //for creating first generation
    //runs only once during initialization step
    this.generate = () => {
      //!! indexing from 1 !!
      for (let i=1; i<=this.size; i++) {
        this.graphs[i] = new Graph(i);
        this.graphs[i].randomize();
        this.graphs[i].mutationAlpha();
      }
    }

    //displaying info about the population ~ debug mode
    this.showInfo = () => {
      this.graphs.forEach(graph => {
        console.log('F: ' + graph.fitness);
        console.log('~~~~P: ' + graph.probability);
      });
    }

    //selection will choose two parents of the population
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
          //the graph that will be extinct from the population
          //it will be replaced by the newborn
          this.EXIndex = graph.index;
        }
        if (graph.fitness > this.maxFitness) {
          this.maxFitness = graph.fitness;
        }
      });
      //find probability to be selected as a parent by normalizing fitness
      this.graphs.forEach(graph => {
        graph.normalizeFitness();
      });
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

      //this.parents contains two selected parents
      this.parents.push(this.graphs[indexA]);
      this.parents.push(this.graphs[indexB]);
    }

    //crosses two parents and produces a child. the child's dna is a combination of both parents' dna
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
      }
      //eliminate the worst graph and generate the new population element with given dna
      this.graphs[this.EXIndex] = new Graph(this.EXIndex, dna);
      //after we create the child, apply mutations to it.
      //mutation will add variation to the population
      this.graphs[this.EXIndex].mutationBeta();
      this.graphs[this.EXIndex].mutationGamma();
    }
  }

  //a component that is used just for displaying the current state of the results
  function Results() {
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
      //fitness of the population
      s.text('Fitness: ' + population.fitness.toFixed(5), this.position.x, this.position.y*8);
      // s.text('Min fitness: ' + population.minFitness.toFixed(15), this.position.x, this.position.y*9);
      // s.text('Max fitness: ' + population.maxFitness.toFixed(15), this.position.x, this.position.y*10);
      s.text('Number of generation: ' + generationNumber, this.position.x, this.position.y*9);

    }
  }

  function Graph(index = 0, dna) {
    //index in the population
    this.index = index;
    //graph is made from vertices that are hold in this array
    this.vertices = [];
    //fitness determines if the graph is going in the right direction
    this.fitness = -1;
    //the graph will be selected as a parent of the population depending of its fitness
    //the probability is just a normalized fitness value
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

    //for each vertex check if there is collision between him and his neighbors.
    //if so, create the set of all colors used by its neighbors.
    //assign new color to the vertex that is taken from all possible the set of all possible colors minus those that are taken by its neighbors
    this.mutationBeta = () => {
      let applyBeta = false;
      this.vertices.forEach(vertex => {
        applyBeta = false;
        vertex.neighbors.forEach(neighbour => {
          //if there is a collision, apply beta mutation to this vertex
          if (vertex.colorIndex == this.vertices[neighbour].colorIndex) {
            applyBeta = true;
          }
        });
        if (applyBeta) {
          //create set of colors taken by its neighbors
          let adjacentColors = new Set();
          //available colors is the set of colors that we can assign to the vertex
          let availableColors = new Set();
          vertex.neighbors.forEach(neighbour => {
            adjacentColors.add(neighbour.colorIndex);
          });
          for (let i=0; i<colors.length; i++) {
            //if the color from all colors array is not in the set of neighbors' colors, mark it as a valid color
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

    //last, pretty straight-forward mutation that is applied with a given probability to a vertex that collides with its neighbors
    this.mutationGamma = () => {
      this.vertices.forEach(vertex => {
        if (s.random(1) <= GAMMA_RATE) {
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
      //this is the abstract value. currentscenario can't be greater than this value, so it's a good measurement point
      let worstCaseScenario = this.size * this.size + this.size;
      //if the graph has the better result (number of colors), the value colorUsed is assigned to the population as the best result
      if (population.colorsUsed <= 0 || population.colorsUsed > setOfColors.size) {
        population.colorsUsed = setOfColors.size;
      }
      //current scenario determines if the graph is evolving in the right direction
      //we want to eliminate all bad edges and optimize number of colors used
      let currentScenario = numberOfBadEdges * this.size + setOfColors.size;
      //to sort fitness in ascending order, I divide worstCaseScenario by currentScenario
      //the more fitness the graph has, the more likely it is to be picked
      this.fitness = worstCaseScenario/currentScenario;
      population.fitness += this.fitness;
    }

    //the probability determines the chance of the graph to be picked during selection phase
    this.normalizeFitness = () => {
      this.probability = this.fitness/population.fitness;
    }

  }

  function Vertex(index) {
    this.radius = 25 + s.random(1)*10;
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
