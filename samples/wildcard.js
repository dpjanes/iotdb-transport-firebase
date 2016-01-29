/*
 *  wildcard.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-07
 *
 *  Demonstrate receiving
 *  Make sure to see README first
 */

var FirebaseTransport = require('../FirebaseTransport').FirebaseTransport;

var p = new FirebaseTransport({
    prefix: "/samples/",
});
p.get({
    id: "MyThingID", 
    band: "meta", 
}, function(error, gd) {
    if (error) {
        console.log("#", error);
        return;
    }
    console.log("+", "get", gd.id, gd.band, gd.value);
});
p.updated(function(error, d) {
    if (error) {
        console.log("#", error);
        return;
    }

    console.log("+", "updated", d.id, d.band, d.value);
});
