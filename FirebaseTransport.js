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

var util = require('util');
var url = require('url');

var logger = bunyan.createLogger({
    name: 'iotdb-transport-firebase',
    module: 'FirebaseTransport',
});

/* --- constructor --- */

/**
 *  See {iotdb.transporter.Transport#Transport} for documentation.
 */
var FirebaseTransport = function (initd) {
    var self = this;

    self.initd = _.defaults(
        initd,
        iotdb.keystore().get("/transports/FirebaseTransport/initd"),
        {
            prefix: "/",
            host: null
        }
    );

    self.initd.parts = _split(self.initd.prefix);

    self.native = new firebase(self.initd.host);
};

FirebaseTransport.prototype = new iotdb.transporter.Transport;

/**
 *  See {iotdb.transporter.Transport#list} for documentation.
 *  <p>
 *  Note that this may not be memory efficient due
 *  to the way "value" works. This could be revisited
 *  in the future.
 */
FirebaseTransport.prototype.list = function(paramd, callback) {
    var self = this;

    if (arguments.length === 1) {
        paramd = {};
        callback = arguments[0];
    }

    var channel = self._channel();
    self.native
        .child(channel)
        .orderByKey()
        .on("value", function(parent_snapshot) {
            parent_snapshot.forEach(function(snapshot) {
                callback(_decode(snapshot.key()));
            });
            callback(null);
        });

};

/**
 *  See {iotdb.transporter.Transport#added} for documentation.
 *  <p>
 *  NOT FINISHED
 */
FirebaseTransport.prototype.added = function(paramd, callback) {
    var self = this;

    if (arguments.length === 1) {
        paramd = {};
        callback = arguments[0];
    }

    var channel = self._channel();
};

/**
 *  See {iotdb.transporter.Transport#get} for documentation.
 */
FirebaseTransport.prototype.get = function(id, band, callback) {
    var self = this;

    if (!id) {
        throw new Error("id is required");
    }
    if (!band) {
        throw new Error("band is required");
    }

    var channel = self._channel(id, band);
    self.native.child(channel).once("value", function(snapshot) {
        // console.log("HERE:AAA", channel, id, band, snapshot.val(), snapshot);
        callback(id, band, _unpack(snapshot.val()));
    });
};

/**
 *  See {iotdb.transporter.Transport#update} for documentation.
 */
FirebaseTransport.prototype.update = function(id, band, value) {
    var self = this;

    if (!id) {
        throw new Error("id is required");
    }
    if (!band) {
        throw new Error("band is required");
    }

    var channel = self._channel(id, band);
    var d = _pack(value);

    self.native.child(channel).set(d);
};

/**
 *  See {iotdb.transporter.Transport#updated} for documentation.
 */
FirebaseTransport.prototype.updated = function(id, band, callback) {
    var self = this;

    if (arguments.length === 1) {
        id = null;
        band = null;
        callback = arguments[0];
    } else if (arguments.length === 2) {
        band = null;
        callback = arguments[1];
    }

    var channel = self._channel(id, band);
    self.native.child(channel).on("child_changed", function (snapshot, name) {
        var snapshot_url = snapshot.ref().toString();
        var snapshot_path = url.parse(snapshot_url).path;
        var snapshot_parts = _split(snapshot_path);

        var parts = self.initd.parts;
        var diff = snapshot_parts.length - parts.length;
        if (diff > 2) {
            var snapshot_id = _decode(snapshot_parts[parts.length]);
            var snapshot_band = _decode(snapshot_parts[parts.length + 1]);
            var snapshot_value = undefined;
            callback(snapshot_id, snapshot_band, snapshot_value);
        } else if (diff === 2) {
            var snapshot_id = _decode(snapshot_parts[parts.length]);
            var snapshot_band = _decode(snapshot_parts[parts.length + 1]);
            var snapshot_value = _unpack(snapshot.val());
            callback(snapshot_id, snapshot_band, snapshot_value);
        } else if (diff === 1) {
            var snapshot_id = _decode(snapshot_parts[parts.length]);
            var d = _unpack(snapshot.val());
            for (var snapshot_band in d) {
                var snapshot_value = d[snapshot_band];
                callback(snapshot_id, snapshot_band, snapshot_value);
            }
        } else {
            /* ignoring massive udpates */
        }
    });
};

/**
 *  See {iotdb.transporter.Transport#remove} for documentation.
 */
FirebaseTransport.prototype.remove = function(id) {
    var self = this;

    if (!id) {
        throw new Error("id is required");
    }

    var channel = self._channel(id, band);
    self.native.child(channel).remove();
};

/* --- internals --- */
FirebaseTransport.prototype._channel = function(id, band) {
    var self = this;

    var parts = _.deepCopy(self.initd.parts);
    if (id) {
        parts.push(_encode(id));

        if (band) {
            parts.push(_encode(band));
        }
    }

    return parts.join("/");
};

var _encode = function(s) {
    return s.replace(/[\/$%#.\]\[]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

var _decode = function(s) {
    return decodeURIComponent(s);
}

var _unpack = function(d) {
    return _.d.transform(d, {
        pre: _.ld_compact,
        key: _decode,
    });
};

var _pack = function(d) {
    return _.d.transform(d, {
        pre: _.ld_compact,
        key: _encode,
    });
};

var _split = function(path) {
    var nparts = [];
    var oparts = path.split("/");

    for (var pi in oparts) {
        var part = oparts[pi];
        if (part.length > 0) {
            nparts.push(part);
        }
    }

    return nparts;
}

/**
 *  API
 */
exports.FirebaseTransport = FirebaseTransport;
