/*
 *  FirebaseTransport.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-07
 *
 *  Copyright [2013-2015] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

var iotdb = require('iotdb');
var _ = iotdb._;
var bunyan = iotdb.bunyan;

var firebase = require('firebase');
var validate = require('validate');

var util = require('util');

var logger = bunyan.createLogger({
    name: 'iotdb-transport-firebase',
    module: 'FirebaseTransport',
});

var _validate_initd = validate({}, {
    typecast: true,
    scrub: false
});
_validate_initd
    .path("host")
    .type("string")
    .required(true)
    .message("'host' is required");
_validate_initd
    .path("channel_prefix")
    .type("string")
    .required(false);

/**
 *  Create a transport for FireBase.
 */
var FirebaseTransport = function (initd) {
    var self = this;

    self.initd = _.defaults(initd,
        iotdb.keystore().get("/transports/FirebaseTransport/initd"),
        {
            channel_prefix: "/",
            host: null
        }
    );

    var errors = _validate_initd.validate(self.initd);
    if (errors.length) {
        console.log("ERRORS", errors);
        throw errors[0];
    }

    self.native = new firebase(self.initd.host);
};

var _validate_connect = validate({}, {
    typecast: true,
    scrub: false
});
_validate_connect
    .path("id")
    .type("string")
    .required(true)
    .message("'id' is required");
_validate_connect
    .path("band")
    .type("string")
    .required(true)
    .message("'band' is required");
_validate_initd
    .path("channel_prefix")
    .type("string")
    .required(false);

/**
 *  Returns an object with two functions:
 *  - send(message): send a message on id/band
 *  - on_update: on changes to id/band, call the callback.
 */
FirebaseTransport.prototype.connect = function (id, band, paramd) {
    var self = this;

    paramd = _.defaults(paramd, self.initd, {});

    var errors = _validate_connect.validate({ id: id, band: band });
    if (errors.length) {
        throw errors[0];
    }

    var firebase_channel = util.format("%s/%s/%s", paramd.channel_prefix, _encode(id), band);

    return {
        update: function (messaged) {
            self.native.child(firebase_channel).set(_pack_out(messaged));
        },

        on_update: function (callback) {
            self.native.child(firebase_channel).on("value", function (snapshot) {
                callback(_pack_in(snapshot.val()));
            });
        },
    };
};

/* -- internals -- */
var _encode = function(s) {
    return s.replace(/[\/#.]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

var _pack_out = function(d) {
    var outd = {};
    var d = _.ld.compact(d);

    for (var key in d) {
        var value = d[key];
        var okey = _encode(key);

        outd[okey] = value;
    }

    return outd;
};

var _pack_in = function(d) {
    var ind = {};

    for (var key in d) {
        var value = d[key];
        ind[decodeURIComponent(key)] = value;
    }

    return ind;
};

/**
 *  API
 */
exports.FirebaseTransport = FirebaseTransport;
