//this is a function that encompasses lots of different functions
//this makes more and more generations, is called every time
function makeNewGeneration() {
	//normalize fitness of all the savedControllers
	//this means make them values from 0-1
	//the best being nearer to 0, it pretty much decides which
	//controller is the best controller
	normalizeFitness(savedControllers);

	//after the controller array is empty, since they all died, we need new ones
	controllers = generateNew(savedControllers);

	//before I had code that looked like:
	//savedControllers = controllers;
	//this is a problem because it referenced the same data, so
	//anything that changes with the controller array, SUCH AS BEING DELETED
	//also deleted from the savedControllers array
	//this is pretty much saying that at the beginning of each generation
	//we need to redo our savedControllers array, like we do in setup()
	for (let i = 0; i < controllers.length; i++) {
		savedControllers[i] = controllers[i];
	}

	//console.log("All time best's score: " + bestController.score);
}

//returns an array of newly created controllers
function generateNew(list) {
	let newC = [];
	for (let i = 0; i < list.length; i++) {
		// Select a controller based on fitness
		let bestC = selectFrom(list);
		newC[i] = bestC;
	}
	return newC;
}

// An algorithm for picking one controller from an array
// based on fitness
function selectFrom(list) {
	// Start at 0
	let index = 0;

	// Pick a random number between 0 and 1
	let r = random(1);

	// Keep subtracting probabilities until you get less than zero
	// Higher probabilities will be more likely to be fixed since they will
	// subtract a larger number towards zero
	while (r > 0) {
		r -= list[index].fitness;
		// And move on to the next
		index += 1;
	}

	// Go back one
	index -= 1;

	// Make sure it's a copy!
	// (this includes mutation)
	return list[index].copy();
}

//mutate the individual weights of the neural network
//returns the new weight, changed or not
function mutate(x) {
	//10% chance
	if (random() < 0.1) {
		//this is a normal distribution, toned down a bit
		mutatedX = x + randomGaussian() * 0.5;
		return mutatedX;
	} else {
		return x;
	}
}

function normalizeFitness(list) {
	// Make score exponentially better?
	for (let i = 0; i < list.length; i++) {
		list[i].score = pow(list[i].score, 2);
	}

	// Add up all the scores
	let sum = 0;
	for (let i = 0; i < list.length; i++) {
		sum += list[i].score;
	}
	// Divide by the sum
	for (let i = 0; i < list.length; i++) {
		list[i].fitness = list[i].score / sum;
	}
}
