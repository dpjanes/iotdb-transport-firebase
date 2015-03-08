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

var iotdb = require('iotdb');
var _ = iotdb._;
var bunyan = iotdb.bunyan;

var firebase = require('firebase');

var events = require('events');
var util = require('util');

var logger = bunyan.createLogger({
    name: 'iotdb-transport-firebase',
    module: 'FirebaseTransport',
});

/**
 */
var FirebaseTransport = function (initd) {
    var self = this;

    self.initd = _.defaults(initd,
        iotdb.keystore().get("/transports/FirebaseTransport/initd"), {
            host: null
        }
    );

    self.native = new firebase(self.initd.host);

    events.EventEmitter.call(this);
    this.setMaxListeners(0);
};

util.inherits(FirebaseTransport, events.EventEmitter);

/**
 */
FirebaseTransport.prototype.connect = function (thing_id, band) {
    var self = this;

    var firebase_channel = util.format("%s/%s", thing_id, band);

    return {
        send: function (messaged) {
            self.native.child(firebase_channel).set(messaged);
        },

        on_update: function (f) {
            self.native.child(firebase_channel).on("value", function (snapshot) {
                f(snapshot.val());
            });
        },
    };
};

/**
 */
FirebaseTransport.prototype.send = function (paramd) {
    var self = this;

};

/**
 *  API
 */
exports.FirebaseTransport = FirebaseTransport;
