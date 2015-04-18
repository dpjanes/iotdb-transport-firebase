/*
 *  list.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-24
 *
 *  Demonstrate receiving
 *  Make sure to see README first
 */

var FirebaseTransport = require('../FirebaseTransport').FirebaseTransport;

var p = new FirebaseTransport({
    xprefix: "/samples/",
    prefix: "/76ca1468-7ebe-46d5-890f-315cb1ecf315/homestar/",
});
p.list(function(d) {
    if (!d) {
        return;
    }

    console.log(d.id);
});
