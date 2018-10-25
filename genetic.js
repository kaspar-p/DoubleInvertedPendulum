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

	savedControllers = controllers.slice();
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
	list.map(item => item.score = item.score * item.score);

	// Add up all the scores
	let sum = 0;
	list.forEach(item => sum += item.score);

	// Divide by the sum
	list.forEach(item => item.fitness = item.score / sum);
}
