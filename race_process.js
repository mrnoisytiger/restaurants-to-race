// Initialize data variables
var final_data = read_json_file('data_files/pop_data.json');

// Get list of zips to process
var zips = read_into_array('zips.txt');
var unprocessed_zips = [];
for ( i=0; i < zips.length; i++ ) {
    if ( zips[i].length < 5 ) {
        var missing_chars = 5 - zips[i].length;
        zips[i] = '0'.repeat(missing_chars) + zips[i];
    }

    if ( final_data[zips[i]] == undefined ) {
        unprocessed_zips.push(zips[i]);
    }
    
}

// Iterate over the zips in the object and prompt for answers
loop1:
for ( var i = 0; i < unprocessed_zips.length; i++ ) {
    zip = unprocessed_zips[i];
    final_data[zip] = {
        population: {
            white: 0,
            asian: 0,
            black: 0,
            api: 0,
            hispanic: 0,
        },
    };
    var total = 0;
    debugger;
    loop2:
    for ( race in final_data[zip].population ) {
        var prompt = require('prompt-sync')();
        value = prompt("Zip: " + zip + "  ->  " + race + ":  " );
        if ( value == 'exit' ) {
            delete final_data[zip];
            write_json_to_file('data_files/pop_data.json',final_data);
            break loop1;
        } else {
            final_data[zip].population[race] = parseInt(value);
            total = total + parseInt(final_data[zip].population[race]);
            final_data[zip].population['total'] = total;
            write_json_to_file('data_files/pop_data.json',final_data);
        }

    }


}



// Read from file (newline-delimited) into array
function read_into_array(path) {
    var result;
    var contents;
    fs = require('fs');
    contents = fs.readFileSync(path, 'utf8');

    result = contents.split('\n');
    return result;
}

function read_json_file(path) {
    fs = require('fs');
    return JSON.parse(fs.readFileSync(path, 'utf8')) ;
}


// Write to file
function write_json_to_file(path,data){
    var fs = require('fs');
    fs.writeFileSync(path, JSON.stringify(data));
}
