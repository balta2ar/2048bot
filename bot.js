//
// bot that plays 2048 tile game
// http://gabrielecirulli.github.io/2048/
// (c) Yuri Bochkarev, 2014
//

// How to use:
//
// 1. Load the page with the game
// 2. Open console, Sources tab, select 2024/js/application.js
// 3. Add breakpoint after this line:
//
//    var manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
//
// 4. Reload the page. When you're on the breakpoint, type in the console:
//
//    window.m = manager;
//
//    This will save manager variable into window object that is accessible
//    from the console later.
// 5. Let JavaScript go (press F8 in Chromium)
// 6. Copy and paste scriptc and hot functions into the console.
// 7. Make sure to either change the address of the bot.js or run
//    python -m http.server (python3) / python -m SimpleHTTPServer (python2)
//    beforehand.
// 8. Now load bot code:
//
//    hot()
//
// 9. You are ready to run the game under the bot's control:
//
//    play(m, 1000);
//
//    Where 1000 is delay in milliseconds between bot moves. Bot will be making
//    moves until you win or lose (I didn't manage to win even a single time).

/*
function scriptc(a,b){
  var __d=document;
  var __h = __d.getElementsByTagName("head")[0];
  var s = __d.createElement("script");
  s.setAttribute("src", a);
  s.id = b;
  __h.appendChild(s);
}
hot = function() { scriptc("http://localhost:8000/bot.js"); };


//scriptc("http://localhost:8000/bot.js");
*/

function FakeInputManager() {}
FakeInputManager.prototype.on = function (event, callback) {}

function FakeActuator() {}
FakeActuator.prototype.actuate = function (grid, metadata) {}
FakeActuator.prototype.restart = function () {}

/*
 * [_] not all movements might be available
 */

function Bot(manager) {
    this.manager = manager;
}

Bot.prototype.crippledClone = function() {
    p = new GameManager(this.manager.size, FakeInputManager, FakeActuator);
    for (var x = 0; x < this.manager.size; x++) {
        for (var y = 0; y < this.manager.size; y++) {
            c = this.manager.grid.cells[x][y];
            if (c != null) {
                tile = new Tile({x: c.x, y: c.y}, c.value);
                tile.previousPosition = c.previousPosition;
                tile.mergedFrom = c.mergedFrom;
                p.grid.cells[x][y] = tile;
            } else {
                p.grid.cells[x][y] = null;
            }
        }
    }
    return p;
}

Bot.prototype.cell = function(x, y) {
    return this.manager.grid.cells[x][y];
}

Bot.prototype.gridChanged = function(a, b) {
    for (var x = 0; x < this.manager.size; x++) {
        for (var y = 0; y < this.manager.size; y++) {
            ca = a.grid.cells[x][y];
            cb = b.grid.cells[x][y];
            if ((ca == null) && (cb == null)) {
                continue;
            } else {
                if ((ca != null) && (cb != null)) {
                    if (ca.value != cb.value) {
                        return true;
                    }
                } else {
                    // one of them is null while the other one isn't
                    return true;
                }
            }
        }
    }
    return false;
}

Bot.prototype.estimateMove = function(x) {
    managerCopy = this.crippledClone();
    managerCopy.move(x);
    return [managerCopy.grid.cells, this.gridChanged(this.manager, managerCopy)];
    if (this.gridChanged(this.manager, managerCopy)) {
        return managerCopy.grid.availableCells().length;
    } else {
        return -1;
    }
}

Bot.prototype.estimateMoves = function() {
    var estimates = [];
    for (var x = 0; x < 4; x++) {
        managerCopy = this.crippledClone();
        managerCopy.move(x);
        if (this.gridChanged(this.manager, managerCopy)) {
            estimates.push(managerCopy.grid.availableCells().length);
        } else {
            estimates.push(-1);
        }
    }
    return estimates;
}

Bot.prototype.recommendedMove = function() {
    return randArgmax(argmax(this.estimateMoves()));
}

var randint = function(n) {
    return Math.floor(Math.random() * n);
}

var randArgmax = function(xs) {
    return xs[randint(xs.length)];
}

var argmax = function(xs) {
    var max = [];
    for (var i = 0; i < xs.length; i++) {
        x = xs[i];
        if ((max.length == 0) || ((max.length > 0) && (x > xs[max[0]]))) {
            max.length = 0;
            max.push(i);
            continue;
        }

        if (x == xs[max[0]]) {
            max.push(i);
        }
    }
    return max;
}

bestMove = function(manager) {
    var b = new Bot(manager);
    var move = b.recommendedMove();
    manager.move(move);
    return move;
}

refire = function(manager, timeout) {
    if (manager.over || manager.won) {
        return;
    }

    setTimeout(function() {refire(manager, timeout)}, timeout);
    bestMove(manager);
}

play = function(manager, timeout) {
    setTimeout(function() {refire(manager, timeout)}, timeout);
}

reset = function(manager) {
    hot();
    b = new Bot(manager);
    return randArgmax(argmax(b.estimateMoves()));
    //return argmax(b.estimateMoves());
}

console.log("Code has been reloaded");
