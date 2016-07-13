var express = require('express');
var router = express.Router();
var moment = require('moment');
var elasticsearch = require('elasticsearch');
var _ = require('underscore')
var es_client = null;

router.post('/events/:deviceId/:temp/:humid', function (req,res) {
    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var eventObj = {
					"deviceId":req.params.deviceId,
					"temperature":parseFloat(req.params.temp),
					"humidity":parseFloat(req.params.humid),
					"timeStamp":moment.utc().toDate() ,
                    "installationId": req.config.installationId
	};
	  // Set our collection
    var collection = db.get("events");
	
    // Submit to the DB
    collection.insert(eventObj, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.status(500).send("There was a problem adding the information to the database.");
        }
        else {
            // And forward to success page
           res.status(200).json({"_id": eventObj._id});
        }
    });	
}) ;
/* POST to Add User Service */
router.post('/:coll', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var userName = req.body.username;
    var userEmail = req.body.useremail;
	
	req.body.createDate= moment.utc().toDate();
    // Set our collection
    var collection = db.get(req.params.coll||"defaultcollection");
	
    // Submit to the DB
    collection.insert(req.body, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.status(500).send("There was a problem adding the information to the database.");
        }
        else {
            // And forward to success page
           res.status(200).json({"_id": req.body._id});
        }
    });
});
router.get('/move/:coll/:typename',function(req,res){
	var collection = db.get(req.params.coll||"defaultcollection");
	 collection.find({},{},function(e,docs){
		 var bulkRequest = create_bulk(req.config,docs);
		 es_client.bulk({body:bulkRequest}, function(err,resp){
			 
			 if (err) {
				res.status(500).send(err.message);
				} else {
				res.status(200).json(resp);
			}
			 
		 });
        res.render('userlist', {
            "userlist" : docs
        });
    });
	
	
});
router.get('/elastic', function(req,res){
	
	initES(req);
	es_client.cluster.health(function (err, resp) {
	  if (err) {
		res.status(500).send(err.message);
	  } else {
		res.status(200).json(resp);
	  }
	});
});
function create_bulk (config,input, type) {
    var obj;
	var bulk_request = [];
	var xloop = _.size(input);

	for (i = 0; i < xloop; i++) {
		obj = input[1]
		// Insert header of record
		bulk_request.push({index: {_index: config.es_index, _type: type, _id: obj._id}});
		bulk_request.push(obj);    
								};
    return bulk_request;
  };
function initES(req){
	
	if (es_client== null){
		  es_client = elasticsearch.Client({
											 hosts:  req.config.es_urls,
											 sniffOnStart: true,
											 sniffInterval: 30000
										  });
	}
}
/* POST to Add User Service */
module.exports = router;
