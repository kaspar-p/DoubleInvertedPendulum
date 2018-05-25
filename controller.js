//the big controller function. This is the cartpole by itself.

function Controller(passedBrain = null) {
	//initial values
	//these can be changed, but they work how they are
	let gravity = 9.8;
	let cart_mass = 1;
	let pole_mass1 = 0.1;
	let pole_mass2 = 0.1;

	let l1 = 0.5; //length of pole, but only half
	let l2 = 0.5; //length of pole, but only half

	//the time between every timestep
	let dt = 0.02;

	//this means if there is a child. If this is an original controller, they will
	//not have any parameters passed in, but the child gets a brain
	if (passedBrain instanceof NeuralNetwork) {
		//make the brain the brain that was given to us
		//and change it a little bit
		this.brain = passedBrain.copy();
		this.brain.mutate(mutate);
	} else {
		//if this is an original controller, make a whole new brain
		//6 inputs nodes for each of the elements in state
		//16 hidden nodes because I like the number 16
		//3 output nodes corresponding to the binary directions, right and left
		//third output is the strength of the movement
		this.brain = new NeuralNetwork(6, 25, 25, 3);
	}

	//the score is literally the amount of frames they have been alive for
	this.score = 0;

	//a value from 0-1, the lowest of this is the best. This represents the best of the bunch
	this.fitness = 0;

	//set the state initially with a little bit of variation in the x and theta
	//set the derivatives of this variation to the same, this makes it a little bit
	//more exciting and robust, as they now learn to deal with bad situations and
	//cannot simply be "born rich"
	this.state = [random(-2, 2), random(-1, 1), random(-1.9, 1.9), random(-1, 1), random(-1.9, 1.9), random(-1, 1)];

	this.copy = function() {
		return new Controller(this.brain);
	}

	//a function that actually makes the prediction from the NN
	this.chooseAction = function() {
		//make an empty array
		let inputs = [];

		//fill it with everything in this.state
		for (x of this.state) {
			inputs.push(x);
		}

		//each of the numbers outputted by the brain
		//the length is equal to the output nodes of the brain, which is 4
		let actionArray = this.brain.predict(inputs);

		//direction is for the first 2 nodes. this is left or right
		let directionArray = [actionArray[0], actionArray[1]];

		//the amount they want to give to these nodes is how much force they want to used
		//this ends up creating more sophistication which is good
		let chosenMagnitude = map(actionArray[2], 0, 1, 0, 10);

		//returns a the value of the spot. For example, if the controller wants
		//to go left, they choose index 0, and a number there. This is that number
		//this ends up being a 1 or a -1
		let chosenDirection = (2 * (highscore(directionArray))) - 1;

		//the final vector for the force
		let finalAction = chosenDirection * chosenMagnitude;
		return finalAction;
	}

	//the big called function, connects everything
	this.update = function() {
		//a number that ranges from -10 to 10 representing force
		let action = this.chooseAction();

		this.runDoublePhysics(action);
		this.score++;
	}

	this.display = function() {
		state = this.state;

		let cart_x = state[0] * 5;
		let cart_y = 0;

		let theta1 = state[2];
		let theta2 = state[4];

		let offset = 3 * PI / 2;

		//polar to cartesian conversion
		let pole1_x = cart_x + 100 * l1 * cos(theta1 + offset);
		let pole1_y = cart_y + 100 * l1 * sin(theta1 + offset);

		let pole2_x = pole1_x + 100 * l2 * cos(theta2 + offset);
		let pole2_y = pole1_y + 100 * l2 * sin(theta2 + offset);

		//cart
		rectMode(CENTER);
		fill(47, 73, 114);
		rect(cart_x, 0, 60, 15);

		//first pole, cart to joint
		line(cart_x, cart_y, pole1_x, pole1_y);

		//joint
		fill(0);
		fill(209, 132, 16);
		ellipse(pole1_x, pole1_y, 10);

		//second pole, joint to bob
		line(pole1_x, pole1_y, pole2_x, pole2_y);

		//bob
		fill(209, 132, 16);
		ellipse(pole2_x, pole2_y, 10);
	}

	this.runDoublePhysics = function(action) {
		//these are used in the big equations, so they start as 0
		let x_double_dot = 0;
		let theta1_double_dot = 0;
		let theta2_double_dot = 0;

		//number ranging from -10 to 10
		let force = action;

		//QOL variable
		let s = this.state;

		//variables to be used in the EOM
		let x = s[0];
		let x_dot = s[1];

		let theta1 = s[2];
		let theta1_dot = s[3];

		let theta2 = s[4];
		let theta2_dot = s[5];

		//the actual length of the rod, l1 and l2 are just the length to the center of masses
		let L1 = 2 * l1;
		let L2 = 2 * l2;

		//moments of inertia
		let j1 = 1 / 3 * pole_mass1 * l1 * l1;
		let j2 = 1 / 3 * pole_mass2 * l2 * l2;

		//QOL variables, to make things more readable
		let h1 = cart_mass + pole_mass1 + pole_mass2;
		let h2 = pole_mass1 * l1 + pole_mass2 * L1;
		let h3 = pole_mass2 * l2;
		let h4 = pole_mass1 * l1 * l1 + pole_mass2 * L1 * L1 + j1;
		let h5 = pole_mass2 * l2 * L1;
		let h6 = pole_mass2 * l2 * l2 + j2;
		let h7 = pole_mass1 * l1 * gravity + pole_mass2 * L1 * gravity;
		let h8 = pole_mass2 * l2 * gravity;

		//the three equations of motion, each solved for their respective parts
		x_double_dot = (
				(h2 * theta1_dot * theta1_dot * sin(theta1)) +
				(h3 * theta2_dot * theta2_dot * sin(theta2)) +
				(force) -
				(h2 * theta1_double_dot * cos(theta1)) -
				(h3 * theta2_double_dot * cos(theta2))) /
			(h1);

		theta1_double_dot = (
				(h7 * sin(theta1)) -
				(h5 * theta2_dot * theta2_dot * sin(theta1 - theta2)) -
				(h2 * cos(theta1) * x_double_dot) -
				(h5 * cos(theta1 - theta2) * theta2_double_dot)) /
			(h4);

		theta2_double_dot = (
				(h5 * theta1_dot * theta1_dot * sin(theta1 - theta2)) +
				(h8 * sin(theta2)) -
				(h3 * cos(theta2) * x_double_dot) -
				(h5 * cos(theta1 - theta2) * theta1_double_dot)) /
			(h6);


		//reupdate the states so that the effects can compound
		x = x + x_dot * dt;
		x_dot += dt * x_double_dot;

		theta1 += theta1_dot * dt;
		theta1_dot += theta1_double_dot * dt;

		theta2 += theta2_dot * dt;
		theta2_dot += theta2_double_dot * dt;

		//this is a failsafe
		//if for some reason the accelerations added onto eachother, that would result in jerk
		//which means everything goes out of control
		x_double_dot = 0;
		theta1_double_dot = 0;
		theta2_double_dot = 0;

		//reupdate state
		this.state = [x, x_dot, theta1, theta1_dot, theta2, theta2_dot];
	}
}
