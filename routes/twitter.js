var carrier = require('carrier');

// dealing with listening & posting using Twitter API 

// post a tweet to Twitter
exports.tweet = function(req, res){
	req.api('statuses/update').post({
		status: req.body.status
	}, function (err, json){
		if(err){
			res.json({error: err});
		}else{
			res.redirect('http://twitter.com/' + json.user.screen_name + '/status/' + json.id_str);
		}
	});	
}

// access Twitter's stream 
exports.stream = function(req, res){
	req.api.stream('statuses/filter').post({
		track: ['obama', 'usa']
	}, function (err, stream){
		carrier.carry(stream, function (line){
			var line = JSON.parse(line);
			res.write(line.text + '\n');
		});
	});
}