/**
 * Created by Nathan on 4/22/14.
 */

var debug = true,
    origin = window.location.origin + "/";

if(debug === true) {
    setInterval(function() {
        document.getElementById("debug").innerHTML = Clock.time();
    }, 1000);
}


var BigBen = (function() {
    function BigBen() {

        var c = this;

        this.hour = 60 * 60 * 1000;
        this.nextHour = this.hour - (Date.now() % this.hour) + Date.now();
        this.quarterHour = 15 * 60 * 1000;
        this.nextQuarterHour = this.quarterHour - (Date.now() % this.quarterHour) + Date.now();
        this.nextPreHour = this.nextHour - 22 * 60 * 1000; // 22-second lead-in to hour

        this.init = function init() {
            this._preloadAssets();
            this._setupActions();
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

        this._setupActions = function _setupActions() {
            new TimedAction(c.nextQuarterHour, c.handleQuarterHour, c.quarterHour);
            new TimedAction(c.nextPreHour, c.handlePreHour, c.hour);
        };

        this.handleQuarterHour = function handleQuarterHour() {
            var d = new Date(this.timestamp),
                h = 12 - (d.getHours() % 12),
                m = d.getMinutes();

            console.log("Hour number: " + h + " Quarter-hour minutes: " + m);

            switch(m) {
                case 0:
                    Mixer.play(c._srcAudio.strikes, c.hourSegments[h].s);
                    break;
                case 15:
                    Mixer.play(c._srcAudio.q1, 0);
                    break;
                case 30:
                    Mixer.play(c._srcAudio.q2, 0);
                    break;
                case 45:
                    Mixer.play(c._srcAudio.q3, 0);
                    break;
            }
        };

        this.handlePreHour = function handlePreHour() {
            Mixer.play(c._srcAudio.q4, 0);
        };

        this.hourSegments = {
            12: { s: 0, e: 4400 },
            11: { s: 4445, e: 8684 },
            10: { s: 8704, e: 12845 },
            9: { s: 12863, e: 16862 },
            8: { s: 16887, e: 20923 },
            7: { s: 20957, e: 25000 },
            6: { s: 25078, e: 29127 },
            5: { s: 29149, e: 33155 },
            4: { s: 33227, e: 37161 },
            3: { s: 37238, e: 41286 },
            2: { s: 41358, e: 45430 },
            1: { s: 45491, e: 53550 }
        };

    }

    return new BigBen();
})();


function TimedAction(timestamp, handler, interval) {

    var c = this;
    this.timestamp = timestamp;
    this.handler = handler;
    this.interval = interval || false;
    this.timer = null;
    this.lastExec = 0;

    this._init = function _init() {
        this._scheduleNext();
    };

    this._scheduleNext = function _scheduleNext() {
        var delay = this.timestamp - (this.lastExec || Date.now());

        if(delay > -1)
            this.timer = setTimeout(this._actionHandler, delay);
    };

    this._actionHandler = function _actionHandler() {
        c.handler.call(c);

        if(c.interval) {
            c.lastExec = c.timestamp;
            c.timestamp = c.lastExec + c.interval;
            c._scheduleNext();
        }
    };

    this.stop = function stop() {
        clearTimeout(this.timer);
    };

    this.finish = function finish() {
        this.interval = 0;
    }

    this._init();
}


var Clock =  (function() {
    function Clock() {

        this._init = function _init() {};

        this.time = function time() {
            var d = new Date();
            return (d.getHours() % 12) + ":" + ("0"+d.getMinutes()).slice(-2) + ":" + ("0"+d.getSeconds()).slice(-2);
        };

        this.timeInMS = function timeInMS() {
            return Date.now();
        };

        this.parseTime = function (str) {
            // Just h/m/s for now. Dates are hard.
            var terms = str.split(":"),
                ms = 0;

            terms.reverse().forEach(function(v, idx, arr) {
                if(Number(v) && idx <= 2)
                    ms += Number(v) * Math.pow(60, idx);
            });

            return ms;
        };

        this._init();
    }

    return new Clock();
})();



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
                , function () {
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

        this.play = function play(src, begin, cb) {
            begin = begin || 0;
            var source = this.ctx.createBufferSource();

            this.load(src, function(url) {
                source.buffer = me.sounds[url];
                source.connect(me.ctx.destination);
                source.start(begin);

                if(cb)
                    source.onended = cb;
            });
        };


        this._init();
    }

    return new Mixer();
})();



$(document).ready(function() {
    BigBen.init();
});