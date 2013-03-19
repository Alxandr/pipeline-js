!function() {

function Pipeline() {
    var pipes = [],
        starts = [],
        stops = [],
        onces = [],
        created = false;

    var queue = [],
        running = false;

    var has = Object.prototype.hasOwnProperty ?
        function has(obj, name) {
            return obj.hasOwnProperty(name);
        } : function has(obj, name) {
            var proto = obj.__proto__ || obj.constructor.prototype;
            return (name in this) && (!(name in proto) || proto[name] !== this[name]);
        };

    function ensureNotCreated()
    {
        if(created) throw new Error('Pipeline already created.');
    }

    function pipeAsync(pipe) {
        ensureNotCreated();

        pipes.push(pipe);
        return this;
    }

    function pipe(simplePipe) {
        return pipeAsync.apply(this, [
            function runSimplePipe(state, cb) {
                simplePipe.apply(this, [state]);
                cb();
            }
        ]);
    }

    function startAsync(start) {
        ensureNotCreated();

        starts.push(start);
        return this;
    }

    function start(simpleStart) {
        return startAsync.apply(this, [
            function runSimpleStart(cb) {
                simpleStart.apply(this, []);
                cb();
            }
        ]);
    }

    function stopAsync(stop) {
        ensureNotCreated();

        stops.push(stop);
        return this;
    }

    function stop(simpleStop) {
        return stopAsync.apply(this, [
            function runSimpleStop(cb) {
                simpleStop.apply(this, []);
                cb();
            }
        ]);
    }

    function runState(item) {
        var _started = [],
            _completed = [],
            _step = [];

        item.start = onStarted;
        item.step = onStep;
        item.stop = onCompleted;

        return {
            started: started,
            completed: completed,
            step: step,
            state: state
        };

        function onStarted(state) {
            for(var i = 0, l = _started.length; i < l; i++) {
                _started[i] && _started[i](state);
            }
        }

        function onStep(state) {
            for(var i = 0, l = _step.length; i < l; i++) {
                _step[i] && _step[i](state);
            }
        }

        function onCompleted(state) {
            for(var i = 0, l = _completed.length; i < l; i++) {
                _completed[i] && _completed[i](state);
            }
        }

        function started(cb) {
            if(cb === undefined) {
                return item.started;
            }

            _started.push(cb);
        }

        function completed(cb) {
            if(cb === undefined) {
                return item.completed;
            }

            _completed.push(cb);
        }

        function step(cb) {
            if(cb === undefined) {
                return state();
            }

            _step.push(cb);
        }

        function state() {
            return item.state;
        }
    }

    function create() {
        created = true;

        function commit(object) {
            var item = {state: object};
            item.runState = runState(item);
            queue.push(item);
            run();
            return item.runState;
        }

        function once(cb) {
            setTimeout(
                function applyOnce() {
                    if(!running) return cb();
                    onces.push(cb);
                },
                1
            );
        }

        function backlog() {
            return queue.length;
        }

        commit.once = once;
        commit.backlog = backlog;
        return commit;
    }

    function run() {
        if(running) return;

        running = true;
        setTimeout(runInt, 1);
    }

    function runInt() {
        execute({
            list: starts,
            cb: runItem
        });
    }

    function execute(settings) {
        if(!has(settings, 'list')) settings.list = [];
        if(!has(settings, 'cb')) settings.cb = function emptyCb() {};
        if(!has(settings, 'thisArg')) settings.thisArg = null;
        if(!has(settings, 'args')) settings.args = [];
        if(!has(settings, 'index')) settings.index = 0;
        if(!has(settings, 'start')) settings.start = function emptyStart() {};
        if(!has(settings, 'stop')) settings.stop = function emptyStop() {};
        if(!has(settings, 'step')) settings.step = function emptyStep() {};

        var customArgs = settings.args.slice(0);
        settings.start.apply(settings.thisArg, customArgs);
        settings.args.push(runNext);
        runNext();

        function runNext()
        {
            if(settings.index == -1 || settings.index >= settings.list.length) {
                settings.stop.apply(settings.thisArg, customArgs);
                return settings.cb();
            }

            var current = settings.index++;
            var fn = settings.list[current];
            settings.current = current;
            settings.step.apply(settings.thisArg, customArgs);
            fn.apply(settings.thisArg, settings.args);
        }
    }

    function runItem()
    {
        if(queue.length === 0) return execute({
            list: stops,
            cb: ensureEmpty
        });

        var item = queue.shift();
        item.list = pipes;
        item.args = [item.state];
        item.cb = runItem;
        item.thisArg = {
            skip: skip,
            redo: redo
        };
        execute(item);

        function skip() {
            item.index = -1;
        }

        function redo() {
            item.index = item.current;
        }
    }

    function ensureEmpty()
    {
        if(queue.length > 0) return runInt();

        running = false;
        for(var i = 0, l = onces.length; i < l; i++) {
            onces[i]();
        }
        onces = [];
    }

    return {
        pipeAsync: pipeAsync,
        pipe: pipe,
        startAsync: startAsync,
        start: start,
        stopAsync: stopAsync,
        stop: stop,
        create: create
    };
}

if(typeof module !== "undefined") { module.exports = Pipeline; }
else { window.Pipeline = Pipeline; }

}();