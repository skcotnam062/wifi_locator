var mongoose = require('mongoose');
var Loc = mongoose.model('Location');


var sendJsonResponse = function(res, status, content) {
  res.status(status);
  res.json(content);
}

var theEarth = (function() {
  var earthRadius = 6371; // km, miles is 3959

  var getDistanceFromRads = function(rads) {
    return parseFloat(rads * earthRadius);
  };

  var getRadsFromDistance = function(distance) {
    console.log('---getRadsFromDistance(', distance, ')');
    console.log('in radians: ', parseFloat(distance / earthRadius));
    return parseFloat(distance / earthRadius);
  };

  return {
    getDistanceFromRads : getDistanceFromRads,
    getRadsFromDistance : getRadsFromDistance
  };
}) ();

module.exports.locationsListByDistance = function(req, res) {
  console.log('---locationsListByDistance()');
  console.log("req.query: ", req.query);

  // Original code
  // var lng = parseFloat(req.query.lng);
  // var lat = parseFloat(req.query.lat);

  // **** I Flipped these...i think mongoose changed...??
  var lng = parseFloat(req.query.lat);
  var lat = parseFloat(req.query.lng);


  console.log("lng: " + lng + ", lat: " + lat);

  var point = {
    type: "Point",
    coordinates: [lng, lat]
  };

  var geoOptions = {
    spherical: true,
    maxDistance: theEarth.getRadsFromDistance(parseFloat(req.query.maxDistance)),
    num: 10  // max 10 objects returned
  };

  if ((!lng && lng!=0)|| (!lat && lat!=0)) {
    sendJsonResponse(res, 404, {
      "message": "lng and lat query parameters are required"
    });
    return;
  }

  Loc.geoNear(point, geoOptions, function(err, results, stats) {
    console.log("inside geoNear()-------");
    console.log("geoOptions:", geoOptions);
    console.log("results: ", results);

    var locations = [];
    if (err) {
      sendJsonResponse(res, 404, err);
    }
    else {
      results.forEach(function(doc) {
        console.log('----' + doc.obj.name + ": " + doc.dis)
        locations.push({
          distance: theEarth.getDistanceFromRads(doc.dis),
          name: doc.obj.name,
          address: doc.obj.address,
          rating: doc.obj.rating,
          facilities: doc.obj.facilities,
          _id: doc.obj._id
        });
      });
      sendJsonResponse(res, 200, locations);
    }
  });
};


module.exports.locationsCreate = function(req, res) {
  Loc.create({
    name: req.body.name,
    address: req.body.address,
    facilities: req.body.facilities.split(","),
    coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    openingTimes: [{
      days: req.body.days1,
      opening: req.body.opening1,
      closing: req.body.closing1,
      closed: req.body.closed1
    },
    {
      days: req.body.days2,
      opening: req.body.opening2,
      closing: req.body.closing2,
      closed: req.body.closed2
    }]
  },
  function(err, location) {
    if (err) {
      sendJsonResponse(res, 400, err);
    }
    else {
      sendJsonResponse(res, 201, location);
    }
  });
};

module.exports.locationsReadOne = function(req, res) {
  console.log("Reading One: ", req.params);
  // if there are params and a locationid in the params
  if(req.params && req.params.locationid) {
    Loc.findById(req.params.locationid).exec(function(err, location){
      // Location ID not found
      if(!location) {
        sendJsonResponse(res, 404, { messages: "locationid not found"});
        return;
      }
      // DB error
      else if (err) {
        sendJsonResponse(res, 404, err);
        return;
      }
      // Found location.  Return location info
      sendJsonResponse(res, 200, location);
    });
  }
  else {
    console.log("No locationid in");
    sendJsonResponse(res, 404, { messages: "No locationid in request"});
  }
};

module.exports.locationsUpdateOne = function(req, res) {
  if (!req.params.locationid) {
    sendJsonResponse(res, 404, {
      "message": "Not found, locationid is required"
    });
    return;
  }
  Loc
    .findById(req.params.locationid)
    .select('-reviews -ratings')
    exec(function(err, location) {
      if (!location) {
        sendJsonResponse(res, 404, {
          "message": "locationid not found"
        });
        return;
      }
      else if (err) {
        sendJsonResponse(res, 404, {
          "message": "locationid not found"
        });
        return;
      }
      location.name = req.body.name;
      location.address = req.body.address;
      location.facilities = req.body.facilities.split(",");
      location.coords = [parseFloat(req.body.lng), parseFLoat(req.body.lat)],
      location.openingTimes = [{
        days: req.body.days1,
        opening: req.body.opening1,
        closing: req.body.closing1,
        closed: req.body.closed1
      },
      {
        days: req.body.days2,
        opening: req.body.opening2,
        closing: req.body.closing2,
        closed: req.body.closed2
      }];

    });
    location.save(function(err, location){
      if (err) {
        sendJsonResponse(res, 404, err);
      }
      else {
        sendJsonResponse(res, 200, location);
      }

    });

};

module.exports.locationsDeleteOne = function(req, res) {
  var locationid = req.params.locationid;
  if (locationid) {
    Loc
      .findByIdAndRemove(locationid)
      .exec(
        function(err, location) {
          if (err) {
            sendJsonResponse(res, 404, err);
            return;
          }
          sendJsonResponse(res, 404, err);
        }
      );
  }
  else {
    sendJsonResponse(res, 404, {
      "message": "No locationid"
    });
  }
};
