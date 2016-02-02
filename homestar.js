/*
 *  firebase.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-05-07
 *
 *  Manage FireBase connection
 *
 *  Copyright [2013-2016] [David P. Janes]
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
var _ = iotdb.helpers;

var firebase = require('firebase'); // NOTE: the real thing, not this module
var FirebaseTransport = require('./FirebaseTransport').FirebaseTransport;

var homestar = null;

var logger = iotdb.logger({
    name: 'homestar-firebase',
    module: 'firebase',
});

var _firebase = null;
var _cfg = null;

/**
 */
var _connect_iotdb = function () {
    /* check the timestamp */
    var firebase_transporter_check = new FirebaseTransport({
        firebase: _firebase,
        prefix: _cfg.path + "/" + homestar.settings.keys.homestar.key + "/things",
        add_timestamp: true,
        check_timestamp: true,
        user: homestar.users.owner(),
    });
    iotdb_transport.bind(homestar.things.make_transporter(), firebase_transporter_check, {
        bands: ["meta", "istate", "model", ],
        updated: ["meta", ],
        user: homestar.users.owner(),
    });

    /* don't check the timestamp */
    var firebase_transporter_nocheck = new FirebaseTransport({
        firebase: _firebase,
        prefix: _cfg.path + "/" + homestar.settings.keys.homestar.key + "/things",
        add_timestamp: true,
        check_timestamp: false,
        user: homestar.users.owner(),
    });
    iotdb_transport.bind(homestar.things.make_transporter(), firebase_transporter_nocheck, {
        bands: ["ostate", ],
        updated: ["ostate", ],
        user: homestar.users.owner(),
    });
};

var _connect_recipe = function () {
    /* check the timestamp */
    var firebase_transporter_check = new FirebaseTransport({
        firebase: _firebase,
        prefix: _cfg.path + "/" + homestar.settings.keys.homestar.key + "/things",
        add_timestamp: true,
        check_timestamp: true,
        user: homestar.users.owner(),
    });
    iotdb_transport.bind(homestar.recipes.make_transporter(), firebase_transporter_check, {
        bands: ["meta", "istate", "model", ],
        updated: ["meta", ],
        user: homestar.users.owner(),
    });

    /* don't check the timestamp */
    var firebase_transporter_nocheck = new FirebaseTransport({
        firebase: _firebase,
        prefix: _cfg.path + "/" + homestar.settings.keys.homestar.key + "/things",
        add_timestamp: true,
        check_timestamp: false,
        user: homestar.users.owner(),
    });
    iotdb_transport.bind(homestar.recipes.make_transporter(), firebase_transporter_nocheck, {
        bands: ["ostate", ],
        updated: ["ostate", ],
        user: homestar.users.owner(),
    });
};

var _connect = function () {
    _connect_iotdb();
    _connect_recipe();
};

var _setup = function () {
    if (_firebase) {
        return;
    }

    if (!iotdb.keystore().get("/enabled/homestar/FirebaseTransport", false)) {
        logger.error({
            method: "_transport_coap",
            cause: "do $ homestar set --boolean /enabled/homestar/FirebaseTransport false",
        }, "Transporter not enabled");
        return;
    }

    _firebase = new firebase(_cfg.host);
    _firebase.auth(_cfg.token,
        function () {
            logger.info({
                method: "_setup/auth",
                firebase: {
                    host: _cfg.host,
                    path: _cfg.path,
                }
            }, "connected to FireBase");
            _connect();
        },
        function (error) {
            logger.error({
                method: "_setup/auth/error",
                error: error,
                cause: "see the message - maybe network?",
            }, "could not auth with FireBase");
            _firebase = null;
            return;
        }
    );
};

/**
 *  This is called by homestar.profile
 */
var on_profile = function (locals, cfgd) {
    homestar = locals.homestar;

    if (cfgd === null) {} else if (_cfg === null) {
        _cfg = cfgd;
        _setup();
    } else if (!_.isEqual(_cfg, cfgd)) {
        /*
         *  XXX someday we'll be able to deal with this
        _cfg = cfgd;
        _restart();
         */
    } else {}
};

/*
 *  API
 */
module.exports = {
    /**
     *  Called when the profile is updated
     */
    on_profile: function (locals, profile) {
        if (!profile.firebase) {
            return;
        }

        firebase.on_profile(locals, profile.firebase);
    },
};
