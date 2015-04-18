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
}, function(d) {
    console.log("+", "get", d.id, d.band, d.value);
});
p.updated(function(d) {
    console.log("+", "updated", d.id, d.band, d.value);
});
