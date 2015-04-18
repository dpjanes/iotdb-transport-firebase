/*
 *  about.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-04-16
 *
 *  Make sure to see README first
 */

var FirebaseTransport = require('../FirebaseTransport').FirebaseTransport;

var transport = new FirebaseTransport({
    prefix: "/samples/",
    xprefix: "/76ca1468-7ebe-46d5-890f-315cb1ecf315/homestar/",
});
transport.about({
    id: "MyThingID",
    xid: "urn:iotdb:thing:WeMoSocket:Socket-1_0-221248K01026FC:we-mo-socket",
}, function(ad) {
    console.log(ad);
});
