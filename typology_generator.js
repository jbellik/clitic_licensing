var person_features = ['sp', 'pa', 'pi'];
var gender_features = ['el', 'hu', 'anim', 'gamma'];
var number_features = ['#'];

function generate_clitics(feature_list){
	var clitics = [];
	var g = [].concat(feature_list);
	var f = number_features.concat(g.reverse());
	for(var i=1; i<f.length; i++){
		clitics.push(f.slice(0,i+1));
	}
	return clitics;
}

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
	for(var probe_num = 0; probe_num <= max_probe_num; probe_num++){
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


var emptyset = [];

function agree(a, b) {
	var aset = new Set(a);
	var bset = new Set(b);
	var abintersection = [];
	for(el of bset){
		if(aset.has(el))
			abintersection.push(el);
	}
	return abintersection;
}

/* This function is only safe for comparing (functional) sets -- a and b shouldn't contain any duplicates. */
function setequals(a,b){
	if(a.length!=b.length)
		return false;
	
	var aset = new Set(a);
	for(el of b){
		if(!aset.has(el))
			return false;
	}
	return true;
}

function match(looked,goal){
	for(var pair of looked){
		var subprobe = pair[0];
		var old_shared_features = pair[1];
		var new_shared_features = agree(subprobe, goal);
/*		if(new_shared_features.length===0)
			console.log('matches bc Agree is empty');
		if(setequals(new_shared_features, old_shared_features))
			console.log('matches:', new_shared_features, old_shared_features);*/
		if(!(new_shared_features.length===0 || setequals(new_shared_features, old_shared_features))){
			return false;
		}
	}
	return true;
}

function generate_clitic_clusters(clitics, cluster_size, options){
	var clusters = [];
	var c;
	if(cluster_size<=1) {
		for (c of clitics)
			clusters.push([c]);
	}
	else {
		var smaller_clusters = generate_clitic_clusters(clitics, cluster_size-1);
		// for typologies that include clusters of various sizes:
		if(options && options.includeSmaller && cluster_size>2)
			clusters = clusters.concat(smaller_clusters);
		for (c of clitics) {
			for (sub_cluster of smaller_clusters){
				clusters.push([c].concat(sub_cluster));
			}
		}
	}
	return clusters;
}

/*output a list of Probe–phiCC pairs, one for every possible probe. Each phiCC will be a modified version of a clitic paradigm (10); each cluster / paradigm cell will be annotated for whether or not the relevant probe can licenses that cluster.*/
function generate_PCC_typology(probe_set, clitic_cluster_set){
	var typology = [];
	for(var probe of probe_set){
		var phiCC = [];
		
		for(var cluster of clitic_cluster_set){
			var clitic_counter = 0;
			var goal = cluster[clitic_counter];
			var looked = [];
			var licensable = true;
			
			for(var p of probe){
				if(agree(p, goal).length===0){
					looked.push([p, emptyset]);
				}
				else{
					if(clitic_counter===0 || match(looked,goal)){
						looked.push([p, agree(p, goal)]);
						clitic_counter++;
						goal = cluster[clitic_counter];
					}
					else{
						licensable = false;
						break;
					}
				}
			}			
			phiCC.push([cluster, licensable]);
		}
		typology.push([probe, phiCC]);
	}
	return typology;
}

/* typology = an array of [probe, PhiCC] pairs
	PhiCC = array of cells
	each cell = [clitic cluster, licensable] pairs
	clitic cluster = array of two or three clitics
	clitic = array of features
*/


// will only be defined for clusters of two clitics
// and for either person or gender
function visualize_phiCC(phiCC){
	// Identify which feature set we are working with
	var feature_set;
	var levels;
	var clitic = phiCC[0][0][0];
	if(clitic.indexOf('pi')>=0){
		feature_set = person_features;
		levels = ['1st','2nd','3rd'];
	}
	else if(clitic.indexOf('gamma')>=0){
		feature_set = gender_features;
		levels = ['3El','3Hu','3An','3In'];
	}
	else
		throw new Error("Error: can't visualize unrecognized feature set");
	
	// inner function to help determine which cell to log a clitic cluster in
	function get_index(clitic){
		var clitic_index = feature_set.length - clitic.length + 1;
		if(clitic_index < 0)
			throw new Error("Negative clitic index -- invalid clitic / feature set combination");
		return clitic_index;
	}
	
	// Convert the PhiCC to a nxn array, where n = feature_set.length
	var phiCC_table = new Array(feature_set.length);
	for(var i = 0; i<feature_set.length; i++){
		phiCC_table[i] = new Array(feature_set.length);
	}
	
	for(var cell of phiCC){
//		console.log(JSON.stringify(cell));
		var cluster = cell[0];
		var licensable = cell[1];
		var cl1 = cluster[0];
		var cl2 = cluster[1];
		phiCC_table[get_index(cl1)][get_index(cl2)] = licensable;
	}

	// Make an html string of a table to show the PhiCC.
	var phiCC_table_html = ['<table border="1"><tbody><tr><td></td>'];
	//header row
	for(var l of levels){
		phiCC_table_html.push('<td>');
		phiCC_table_html.push(l);
		phiCC_table_html.push('</td>');
	}
	phiCC_table_html.push('</tr>');
	//table body
	var level_counter = 0;
	var checkcell = '<td>&#x2713;</td>';
	var xcell = '<td style="background-color:grey">&#x2717;</td>';
	for(var row of phiCC_table){
		phiCC_table_html.push('<tr><td>');
		phiCC_table_html.push(levels[level_counter]);
		phiCC_table_html.push('</td>');
		level_counter++;
		for(var col of row){
			if(col)
				phiCC_table_html.push(checkcell);
			else
				phiCC_table_html.push(xcell);
		}
		phiCC_table_html.push('</tr>');
	}
	phiCC_table_html.push('</tbody></table>');
	return phiCC_table_html.join('');
}