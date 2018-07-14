// Initialize data variables
var final_data = {};
var config = get_confs();

// Get list of zips to process
var zips = read_into_array('zips.txt');
for ( i=0; i < zips.length; i++ ) {
    final_data[zips[i]] = {
        restaurants: {
            white: 0,
            asian: 0,
            black: 0,
            api: 0,
            hispanic: 0,
            total: 0,
        },
    };
    if ( zips[i].length < 5 ) {
        var missing_chars = 5 - zips[i].length;
        zips[i] = '0'.repeat(missing_chars) + zips[i];
    }
}

// Get list of categories and associated race
var cats = read_into_array('categories.txt');
var cats_race = {};

for ( i=0; i < cats.length; i++ ) {
    var split_cats = cats[i].split(', ');
    cats_race[ split_cats[0] ] = split_cats[1];
}

// Call yelp API 
var current_offset = [];
for ( i=0; i < zips.length ; i++ ) {;
    current_offset[zips[i]] = 0;
    yelp_api_request(zips[i],current_offset[zips[i]]);
    write_json_to_file('data_files/yelp_data.json',final_data);
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

function get_confs() {
    var result = {};
    var contents;
    var config_array;
    fs = require('fs');
    contents = fs.readFileSync('config/config.txt', 'utf8');

    config_array = contents.split('\n');
    for ( var i=0; i < config_array.length; i++ ){
        var config_ind = config_array[i].split(' = ');
        result[config_ind[0]] = config_ind[1];
    }
    return result;
}

/*
function yelp_api_request(zip_code, offset, callback){
    sleep(300);
    var https = require('https');
    var options = {
        host: 'api.yelp.com',
        port: 443,
        path: '/v3/graphql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/graphql',
            'Authorization': 'Bearer ' + config['yelp_api_key'],
        }
    };

    var req = https.request(options, function(res) {
        var str = '';
        res.setEncoding('utf8');
        res.on('data', function (body) {
            str += body;
        });
        res.on('end', function() {
            callback(str,zip_code);
            write_json_to_file('data_files/yelp_data.json', final_data);
        });
    });
    // write data to request body
    
    var query = `{
        search(term:\"restaurant\",
        location:\"` + zip_code + `\",
            limit: 50,
            offset:` + offset + `,
        ){
            total
            business {
                name
                categories {
                    title
                    alias
                }
            }
        }
    }`
    req.write(query);
    req.end();
} */

function yelp_api_request(zip_code, offset){
    var request = require('sync-request');
    var options = {
        headers: {
            'Content-Type': 'application/graphql',
            'Authorization': 'Bearer ' + config['yelp_api_key'],
        },
        body: `{
            search(term:\"restaurant\",
            location:\"` + zip_code + `\",
                limit: 50,
                offset:` + offset + `,
            ){
                total
                business {
                    name
                    categories {
                        title
                        alias
                    }
                }
            }
        }`,
    };
    var res = request('POST', 'https://api.yelp.com/v3/graphql', options);
    var yelp_data = JSON.parse(res.getBody('utf8'));
    yelp_data = yelp_data['data']['search'];

    for ( j=0; j < yelp_data['business'].length; j++ ) {
        business = yelp_data['business'][j];
        
        var business_races = [];
        for ( k=0; k < business['categories'].length; k++ ) {
            if ( business['categories'][k]['title'] in cats_race ) {
                business_races.push(cats_race[business['categories'][k]['title']]);
            }
        }

        // From Stack Overflow on how to remove duplicates from arrays: https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
        var seen_cats = {};
        business_races = business_races.filter(function(item) {
            return seen_cats.hasOwnProperty(item) ? false : (seen_cats[item] = true);
        });

        // Remove 'none' from the array if there is: https://stackoverflow.com/questions/5767325/how-do-i-remove-a-particular-element-from-an-array-in-javascript
        var none_index = business_races.indexOf('none');
        if (none_index > -1) {
            business_races.splice(none_index, 1);
        }

        
        for ( m=0; m < business_races.length; m++ ) {
            final_data[zip_code]['restaurants'][business_races[m]]++; 
            final_data[zip_code]['restaurants']['total']++; 
        }
    }

    console.log('Just ran Zip Code ' + zip_code + ' at offset ' + offset );
    
    if ( yelp_data['total'] > current_offset[zip_code] + 50 ) {
        current_offset[zip_code] = current_offset[zip_code] + 50;
        if ( current_offset[zip_code] < 1000 ) {
            yelp_api_request(zip_code,current_offset[zip_code]);
        }
    }
}

// Write to file
function write_json_to_file(path,data){
    var fs = require('fs');
    fs.writeFileSync(path, JSON.stringify(data));
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }