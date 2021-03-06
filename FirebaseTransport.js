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
var iotdb_transport = require('iotdb-transport');
var _ = iotdb._;

var firebase = require('firebase');

var util = require('util');
var url = require('url');

var logger = iotdb.logger({
    name: 'iotdb-transport-firebase',
    module: 'FirebaseTransport',
});

/* --- forward definitions --- */
var _encode;
var _decode;
var _unpack;
var _pack;
var _split;

/* --- constructor --- */

/**
 *  See {iotdb_transport.Transport#Transport} for documentation.
 *
 *  @param {object} initd.firebase
 *  pass in a Firebase object (great for sharing connections)
 */
var FirebaseTransport = function (initd) {
    var self = this;

    self.initd = _.defaults(
        initd,
        iotdb.keystore().get("/transports/FirebaseTransport/initd"), {
            prefix: "/",
            host: null,
            firebase: null,
            user: null,
        }
    );

    self.initd.parts = _split(self.initd.prefix);
    self._ud = {};

    if (self.initd.firebase) {
        self.native = self.initd.firebase;
    } else {
        self.native = new firebase(self.initd.host);
    }
};

FirebaseTransport.prototype = new iotdb_transport.Transport();
FirebaseTransport.prototype._class = "FirebaseTransport";

/**
 *  See {iotdb_transport.Transport#list} for documentation.
 *  <p>
 *  Note that this may not be memory efficient due
 *  to the way "value" works. This could be revisited
 *  in the future.
 */
FirebaseTransport.prototype.list = function (paramd, callback) {
    var self = this;

    self._validate_list(paramd, callback);

    var channel = self._channel();
    self.native
        .child(channel)
        .orderByKey()
        .on("value", function (parent_snapshot) {
            parent_snapshot.forEach(function (snapshot) {
                var ld = _.d.clone.shallow(paramd);
                ld.id = _decode(snapshot.key());
                return callback(null, ld);
            });
            callback(null, null);
        });
};

/**
 *  See {iotdb_transport.Transport#added} for documentation.
 *  <p>
 *  NOT FINISHED
 */
FirebaseTransport.prototype.added = function (paramd, callback) {
    var self = this;

    self._validate_added(paramd, callback);
};

/**
 *  See {iotdb_transport.Transport#bands} for documentation.
 */
FirebaseTransport.prototype.bands = function (paramd, callback) {
    var self = this;

    self._validate_bands(paramd, callback);

    var channel = self._channel(paramd.id);
    self.native.child(channel).once("value", function (snapshot) {
        var keys = _.keys(snapshot.val());
        keys = _.map(keys, _decode);

        var bandd = {};
        keys.map(function (key) {
            bandd[key] = key;
        });

        callback(null, {
            id: paramd.id,
            bandd: bandd,
            user: self.initd.user,
        });
    });
};

/**
 *  See {iotdb_transport.Transport#get} for documentation.
 */
FirebaseTransport.prototype.get = function (paramd, callback) {
    var self = this;

    self._validate_get(paramd, callback);

    var channel = self._channel(paramd.id, paramd.band);
    self.native.child(channel).once("value", function (snapshot) {
        callback(null, {
            id: paramd.id,
            band: paramd.band,
            value: _unpack(snapshot.val()),
            user: self.initd.user,
        });
    });
};

/**
 *  See {iotdb_transport.Transport#update} for documentation.
 */
FirebaseTransport.prototype.put = function (paramd, callback) {
    var self = this;

    self._validate_update(paramd, callback);

    if ((paramd.id === "urn:iotdb:thing:Nest:A8U2EcjZj7E5Zty2zWKIa34FvE9u2uVE") && (paramd.band === "meta")) {
        console.log("-----------");
        console.log("id", paramd.id);
        console.log("band", paramd.band);
        console.log("value", paramd.value);
        console.trace();
        process.exit(0);
    }
    /* useful for debugging
     */

    var channel = self._channel(paramd.id, paramd.band);
    var d;
    if (self.initd.add_timestamp) {
        d = _pack(_.timestamp.add(paramd.value));
    } else {
        d = _pack(paramd.value);
    }

    var timestamp = d['@timestamp'];
    if (timestamp) {
        var key = paramd.id + '@@@' + paramd.band;
        self._ud[key] = timestamp;
    }

    self.native.child(channel).set(d);

    callback(null, {
        id: paramd.id,
        band: paramd.band,
        value: paramd.value,
        user: self.initd.user,
    });
};

/**
 *  See {iotdb_transport.Transport#updated} for documentation.
 */
FirebaseTransport.prototype.updated = function (paramd, callback) {
    var self = this;

    self._validate_updated(paramd, callback);

    var _callback = function (cd) {
        var n_timestamp = cd.value && cd.value['@timestamp'];
        if (n_timestamp) {
            var key = cd.id + '@@@' + cd.band;
            var o_timestamp = self._ud[key];
            if (o_timestamp === n_timestamp) {
                return;
            }
        }

        callback(null, cd);
    };

    /**
     *  We should probably just listen to each individual thing. This is too expensive
     */
    var channel = self._channel(paramd.id, paramd.band);
    self.native.child(channel).on("child_changed", function (snapshot, name) {
        var snapshot_url = snapshot.ref().toString();
        var snapshot_path = url.parse(snapshot_url).path;
        var snapshot_parts = _split(snapshot_path);
        for (var i in snapshot_parts) {
            snapshot_parts[i] = _decode(snapshot_parts[i]); // once for Firebase
            snapshot_parts[i] = _decode(snapshot_parts[i]); // once for IOTDB's encoding
        }
        var snapshot_id;
        var snapshot_band;
        var snapshot_value;

        var parts = self.initd.parts;
        var diff = snapshot_parts.length - parts.length;
        if (diff > 2) {
            snapshot_id = (snapshot_parts[parts.length]);
            snapshot_band = (snapshot_parts[parts.length + 1]);
            snapshot_value = undefined;
            _callback({
                id: snapshot_id,
                band: snapshot_band,
                value: snapshot_value,
                user: self.initd.user,
            });
        } else if (diff === 2) {
            snapshot_id = (snapshot_parts[parts.length]);
            snapshot_band = (snapshot_parts[parts.length + 1]);
            snapshot_value = _unpack(snapshot.val());
            _callback({
                id: snapshot_id,
                band: snapshot_band,
                value: snapshot_value,
                user: self.initd.user,
            });
        } else if (diff === 1) {
            snapshot_id = (snapshot_parts[parts.length]);
            var d = _unpack(snapshot.val());
            for (snapshot_band in d) {
                snapshot_value = d[snapshot_band];
                _callback({
                    id: snapshot_id,
                    band: snapshot_band,
                    value: snapshot_value,
                    user: self.initd.user,
                });
            }
        } else {
            /* ignoring massive udpates */
        }
    });
};

/**
 *  See {iotdb_transport.Transport#remove} for documentation.
 */
FirebaseTransport.prototype.remove = function (paramd, callback) {
    var self = this;

    self._validate_remove(paramd, callback);

    var channel = self._channel(paramd.id);
    self.native.child(channel).remove();

    var rd = _.d.clone.shallow(paramd);
    delete rd.band;
    delete rd.value;

    callback(null, rd);
};

/* --- internals --- */
FirebaseTransport.prototype._channel = function (id, band) {
    var self = this;

    var parts = _.d.clone.deep(self.initd.parts);
    if (id) {
        parts.push(_encode(id));

        if (band) {
            parts.push(_encode(band));
        }
    }

    return parts.join("/");
};

var _encode = function (s) {
    return s.replace(/[\/$%#.\]\[]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

var _decode = function (s) {
    return decodeURIComponent(s);
};

var _unpack = function (d) {
    return _.d.transform(d, {
        pre: _.ld_compact,
        key: _decode,
    });
};

var _pack = function (d) {
    return _.d.transform(d, {
        pre: _.ld_compact,
        key: _encode,
    });
};

var _split = function (path) {
    var nparts = [];
    var oparts = path.split("/");

    for (var pi in oparts) {
        var part = oparts[pi];
        if (part.length > 0) {
            nparts.push(part);
        }
    }

    return nparts;
};

/**
 *  API
 */
exports.FirebaseTransport = FirebaseTransport;
