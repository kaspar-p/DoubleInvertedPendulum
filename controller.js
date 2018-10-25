function Controller(passedBrain = null) {
	//  Initial values - changeable but work as they are
	const gravity = 9.8;
	const cart_mass = 1;
	const pole_mass1 = 0.1;
	const pole_mass2 = 0.1;

	const l1 = 0.5; // length of pole, but only half
	const l2 = 0.5; // length of pole, but only half

	//  A timestep
	const dt = 0.02;

	// this means if there is a child. If this is an original controller, they will
	// not have any parameters passed in, but the child gets a brain
	if (passedBrain instanceof NeuralNetwork) {
		// make the brain the brain that was given to us
		// and change it a little bit
		this.brain = passedBrain.copy();
		this.brain.mutate(mutate);
	} else {
		// if this is an original controller, make a whole new brain
		// 6 inputs nodes for each of the elements in state
		// 25 hidden nodes per hidden layer because why not
		// 3 output nodes corresponding to the binary directions, right and left
		// third output is the strength of the movement
		this.brain = new NeuralNetwork(6, 25, 25, 3);
	}

	// the score is literally the amount of frames they have been alive for
	this.score = 0;

	// a value from 0-1, the lowest of this is the best. This represents the best of the bunch
	this.fitness = 0;

	// set the state initially with a little bit of variation in the x and theta
	// set the derivatives of this variation to the same, this makes it a little bit
	// more exciting and robust, as they now learn to deal with bad situations and
	// cannot simply be "born rich"
	this.state = [random(-2, 2), random(-1, 1), random(-1.9, 1.9), random(-1, 1), random(-1.9, 1.9), random(-1, 1)];

	this.copy = function () {
		return new Controller(this.brain);
	}

	// a function that actually makes the prediction from the NN
	this.chooseAction = function () {
		// make an empty array
		let inputs = [];

		// fill it with everything in this.state
		for (x of this.state) {
			inputs.push(x);
		}

		// each of the numbers outputted by the brain
		// the length is equal to the output nodes of the brain, which is 4
		const actionArray = this.brain.predict(inputs);

		// direction is for the first 2 nodes. this is left or right
		const directionArray = [actionArray[0], actionArray[1]];

		// the amount they want to give to these nodes is how much force they want to used
		// this ends up creating more sophistication which is good
		const chosenMagnitude = map(actionArray[2], 0, 1, 0, 10);

		// returns a the value of the spot. For example, if the controller wants
		// to go left, they choose index 0, and a number there. This is that number
		// this ends up being a 1 or a -1
		const chosenDirection = (2 * (highscore(directionArray))) - 1;

		return chosenDirection * chosenMagnitude;
	}

	this.update = function () {
		//a number that ranges from -10 to 10 representing force
		let action = this.chooseAction();

		// Will be changed later for multiple poles
		this.runDoublePhysics(action);
		this.score++;
	}

	this.display = function () {
		const state = this.state;

		const cart_x = state[0] * 5;
		const cart_y = 0;

		const theta1 = state[2];
		const theta2 = state[4];

		const offset = 3 * PI / 2;

		// polar to cartesian conversion
		const pole1_x = cart_x + 100 * l1 * cos(theta1 + offset);
		const pole1_y = cart_y + 100 * l1 * sin(theta1 + offset);

		const pole2_x = pole1_x + 100 * l2 * cos(theta2 + offset);
		const pole2_y = pole1_y + 100 * l2 * sin(theta2 + offset);

		// cart
		rectMode(CENTER);
		fill(47, 73, 114);
		rect(cart_x, 0, 60, 15);

		// first pole, cart to joint
		line(cart_x, cart_y, pole1_x, pole1_y);

		// joint
		fill(0);
		fill(209, 132, 16);
		ellipse(pole1_x, pole1_y, 10);

		// second pole, joint to bob
		line(pole1_x, pole1_y, pole2_x, pole2_y);

		// bob
		fill(209, 132, 16);
		ellipse(pole2_x, pole2_y, 10);
	}

	this.runDoublePhysics = function (action) {
		// these are used in the big equations, so they start as 0
		let x_double_dot = 0;
		let theta1_double_dot = 0;
		let theta2_double_dot = 0;

		// variables to be used in the EOM
		let x = this.state[0];
		let x_dot = this.state[1];

		let theta1 = this.state[2];
		let theta1_dot = this.state[3];

		let theta2 = this.state[4];
		let theta2_dot = this.state[5];

		//the actual length of the rod, l1 and l2 are just the length to the center of masses
		const L1 = 2 * l1;
		const L2 = 2 * l2;

		//moments of inertia
		const j1 = 1 / 3 * pole_mass1 * l1 * l1;
		const j2 = 1 / 3 * pole_mass2 * l2 * l2;

		//QOL variables, to make things more readable
		const h1 = cart_mass + pole_mass1 + pole_mass2;
		const h2 = pole_mass1 * l1 + pole_mass2 * L1;
		const h3 = pole_mass2 * l2;
		const h4 = pole_mass1 * l1 * l1 + pole_mass2 * L1 * L1 + j1;
		const h5 = pole_mass2 * l2 * L1;
		const h6 = pole_mass2 * l2 * l2 + j2;
		const h7 = pole_mass1 * l1 * gravity + pole_mass2 * L1 * gravity;
		const h8 = pole_mass2 * l2 * gravity;

		//the three equations of motion, each solved for their respective parts
		x_double_dot = (
				(h2 * theta1_dot * theta1_dot * sin(theta1)) +
				(h3 * theta2_dot * theta2_dot * sin(theta2)) +
				(action) -
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
		// if for some reason the accelerations added onto eachother, that would result in jerk
		// which means everything goes out of control
		x_double_dot = 0;
		theta1_double_dot = 0;
		theta2_double_dot = 0;

		// reupdate state
		this.state = [x, x_dot, theta1, theta1_dot, theta2, theta2_dot];
	}
}
