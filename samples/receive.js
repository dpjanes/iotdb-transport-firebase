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
p.updated("MyThingID", "meta", function(id, band, value) {
    if (value === undefined) {
        p.get(id, band, function(_id, _band, value) {
            console.log("+", id, band, value);
        });
    } else {
        console.log("+", id, band, value);
    }
});
