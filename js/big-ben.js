/**
 * Created by Nathan on 4/22/14.
 */

var debug = true,
    origin = window.location.origin + "/";

if(debug === true) {
    setInterval(function() {
        var d = new Date();
        document.getElementById("debug").innerHTML = d.toLocaleString();
    }, 1000);
}

var BigBen = (function() {
    function BigBen() {

        this.init = function init() {
            this._preloadAssets();
        };

        this._srcAudio = {
            q1:     origin + "sounds/5227__hyderpotter__big-ben/93143__hyderpotter__quarter.wav",
            q2:     origin + "sounds/5227__hyderpotter__big-ben/93142__hyderpotter__half.wav",
            q3:     origin + "sounds/5227__hyderpotter__big-ben/93141__hyderpotter__3quarter.wav",
            q4:     origin + "sounds/5227__hyderpotter__big-ben/80289__hyderpotter__hourlychimebeg.mp3",
            strikes: origin + "sounds/5227__hyderpotter__big-ben/80290__hyderpotter__bigbenstrikes.mp3"
        };

        this._preloadAssets = function _preloadAssets() {

        };

        this.hourlyChime = function(hourNum) {
            var normalized = hourNum % 12;
        };

        this.hourSegments = {
            1: { s: 0, e: 4400 },
            2: { s: 4445, e: 8684 },
            3: { s: 8704, e: 12845 },
            4: { s: 12863, e: 16862 },
            5: { s: 16887, e: 20923 },
            6: { s: 20957, e: 25000 },
            7: { s: 25078, e: 29127 },
            8: { s: 29149, e: 33155 },
            9: { s: 33227, e: 37161 },
            10: { s: 37238, e: 41286 },
            11: { s: 41358, e: 45430 },
            12: { s: 45491, e: 53550 }
        };

    }

    return new BigBen();
})();

var Clock =  {
    //_timeFormat: "",
    _events: {},

    time: function time() {
    },

    timeInMS: function timeInMS() {
        return Date.now();
    },

    scheduleEvent: function scheduleEvent() {

    }
};

var Mixer = (function() {
    function Mixer() {
        var me = this;

        this.ctx = undefined;
        this.sounds = {};


        this._init = function _init() {
            this._testCapabilities();
        };

        this._testCapabilities = function _testCapabilities() {
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
            }catch(e) {
                // handle unsupported AudioContext
            }
        };

        this._loadSound = function _loadSound(src, cb) {
            var request = new XMLHttpRequest();
            request.open("GET", src, true);
            request.responseType = "arraybuffer";
            request.onload = function() {
                me.ctx.decodeAudioData(request.response, function(buffer) {
                    me.sounds[src] = buffer;
                    cb.call(null, src);
                }
                , function () { /* Decode Error */
                    console.error("Decode error");
                });
            };
            request.onerror = function() {
                console.error("Error loading sound " + src);
            };
            request.send();
        };


        this.load = function load(src, cb) {
            cb = cb || function() {};

            if((src in this.sounds) === false) {
                this._loadSound(src, cb);
            }else{
                cb.call(this.sounds[src], src);
            }
        };

        this.play = function play(src) {
            var source = this.ctx.createBufferSource();

            this.load(src, function(url) {
                source.buffer = me.sounds[url];
                source.connect(me.ctx.destination);
                source.start();
            });
        };


        this._init();
    }

    return new Mixer();
})();

$(document).ready(function() {
    BigBen.init();
});