/*
 *  receive.js
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
p.get("MyThingID", "meta", function(id, band, value) {
    console.log("+", "get", id, band, value);
});
p.updated(function(id, band, value) {
    console.log("+", "updated", id, band, value);
});
