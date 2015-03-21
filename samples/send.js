/*
 *  send.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-07
 *
 *  Demonstrate sending something
 *  Make sure to see README first
 */

var FirebaseTransport = require('../FirebaseTransport').FirebaseTransport;

var p = new FirebaseTransport();
var tmeta = p.connect("MyThingID", "meta");
tmeta.update({
    first: "David",
    last: "Janes",
    now: (new Date()).toISOString(),
});
