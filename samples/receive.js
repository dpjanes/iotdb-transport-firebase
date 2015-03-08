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

var p = new FirebaseTransport();
var tmeta = p.connect("MyThingID", "meta");
tmeta.on_update(function (messaged) {
    console.log("+", messaged);
});
