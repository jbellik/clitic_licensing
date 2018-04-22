var person_features = ['sp', 'pa', 'pi'];
var gender_features = ['el', 'hu', 'anim', 'gamma'];
var number_features = ['#'];

// Ξ, a function which takes Φ, a set of φ-features
// Returns the set of all possible exhaustive orderings of every partition of Φ.
function generate_probes(phi_features){
	// make all the numbers containing only digits in the range of [0:phi_features.length)
	// 0 is included to account for a feature not being included in the subset that is being ordered
	// [1:phi_features.length] allow a feature to fall in the first element in the partition, 2nd, etc.
	var n = phi_features.length;
	if(n>8){
		console.log("Too many features! We can't compute all those probes right now.");
		return;
	}
	if(n>6){
		console.log("Please be patient while we compute your thousands of probes.");
	}
	var probe_spec = new Array(n);
	
	// Iterate over all the possible probes
	var max_probe_num = Math.pow(n+1, n)-1; // (n+1)^n is 1 with n 0s after it in base (n+1). Therefore (n+1)^n - 1 is n n's in base (n+1)
	var probe_results = [];
	for(var probe_num = 1; probe_num <= max_probe_num; probe_num++){
		var temp = probe_num;
		var digit_validation = new Array(n+1);
		var max_partitions = 0;
		
		//specify a potential probe
		for (var digit_num = 0; digit_num < n; digit_num++) {
			var current_digit = temp % (n+1);
			probe_spec[digit_num] = current_digit; 
			digit_validation[current_digit] = true;
			if(current_digit > max_partitions)
				max_partitions = current_digit;
			temp = Math.floor(temp/(n+1));
		}
		//validate probe_spec: we don't want any probes that skip partition position k but assign elements to partition position k+1
		var valid_spec = true;
		for(digit_num = 1; digit_num < digit_validation.length-1; digit_num++){
			if(!digit_validation[digit_num] && digit_validation[digit_num+1]){
				valid_spec = false;
				break;
			}
		}
		// move on if this isn't a valid probe specification
		if(!valid_spec)
			continue;
		
		// if valid, convert the probe specification to a probe (ordered partition)
		var probe = new Array(max_partitions);
		for(digit_num = 0; digit_num < probe_spec.length; digit_num++){
			var feature_pos = probe_spec[digit_num] - 1;
			if(feature_pos >= 0)	// if the feature_pos is less than 0, then that feature is not part of this (non-exhaustive) partition.
			{
				var feature = phi_features[digit_num];
				if(probe[feature_pos])
					probe[feature_pos].push(feature);
				else
					probe[feature_pos] = [feature];

			}
		}
		probe_results.push(probe);
	}
	return probe_results;
}

function pretty_print(probe_results) {
	var parts = [];
	for (var i = 0; i < Math.min(probe_results.length, 100); i++) {
		parts.push(JSON.stringify(probe_results[i]));
	}
	if (probe_results.length > 100) parts.push('...');
	return parts.join('\n');
}

//generate_probes(person_features);