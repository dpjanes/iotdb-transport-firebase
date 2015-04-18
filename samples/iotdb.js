/*
 *  iotdb.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-04-13
 *  "45th Anniversary of Apollo 13 Accident"
 *
 *  Demonstrate binding Firebase to IOTDB
 *
 *  Make sure to do "npm install iotdb-transport-iotdb" also
 */

var iotdb = require('iotdb');

var FirebaseTransport = require('../FirebaseTransport').FirebaseTransport;
var IOTDBTransport = require("iotdb-transport-iotdb").Transport;

var iot = iotdb.iot();
var things = iot.connect();

var iotdb_transport = new IOTDBTransport(things);
var firebase_transport = new FirebaseTransport({
    prefix: "/iotdb/",
});

iotdb.transporter.bind(iotdb_transport, firebase_transport, {
    updated: [ "ostate" ], // uncomment and you can remotely control All Things (!)
});
