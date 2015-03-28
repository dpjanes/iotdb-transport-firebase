/*
 *  bad_list.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-07
 *
 *  Deal with data that does not exist
 *  Expect to see just 'null'
 */

var FirebaseTransport = require('../FirebaseTransport').FirebaseTransport;

var p = new FirebaseTransport({
    prefix: "/no-samples/",
});
p.list(function(ids) {
    console.log(ids);
});
