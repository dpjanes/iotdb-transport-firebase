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

var p = new FirebaseTransport({
    prefix: "/samples/",
});

var _update = function() {
    var when = (new Date()).toISOString();

    console.log("+", "send", when);
    p.update({
        id: "MyThingID", 
        band: "meta", 
        value: {
            first: "David",
            last: "Janes",
            now: when,
        },
    });
};


setInterval(_update, 10 * 1000);
_update();
