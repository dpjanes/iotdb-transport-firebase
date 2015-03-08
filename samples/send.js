/*
 *  send.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-07
 *
 *  Demonstrate sending something
 */

var FirebaseTransport = require('../FirebaseTransport').FirebaseTransport;

var p = new FirebaseTransport();
var tmeta = p.connect("MyThingID", "meta");
tmeta.send({
    first: "David",
    last: "Janes 111",
    now: (new Date()).toISOString(),
});
