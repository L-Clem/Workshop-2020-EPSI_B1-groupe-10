/* Made with ct.js http://ctjs.rocks/ */

const deadPool = []; // a pool of `kill`-ed copies for delaying frequent garbage collection
const copyTypeSymbol = Symbol('I am a ct.js copy');
setInterval(function cleanDeadPool() {
    deadPool.length = 0;
}, 1000 * 60);

/**
 * The ct.js library
 * @namespace
 */
const ct = {
    /**
     * A target number of frames per second. It can be interpreted as a second in timers.
     * @type {number}
     */
    speed: [60][0] || 60,
    types: {},
    snd: {},
    stack: [],
    fps: [60][0] || 60,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * Use ct.delta to balance your movement and other calculations on different framerates by
     * multiplying it with your reference value.
     *
     * Note that `this.move()` already uses it, so there is no need to premultiply
     * `this.speed` with it.
     *
     * **A minimal example:**
     * ```js
     * this.x += this.windSpeed * ct.delta;
     * ```
     *
     * @type {number}
     */
    delta: 1,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * This is a version for UI elements, as it is not affected by time scaling, and thus works well
     * both with slow-mo effects and game pause.
     *
     * @type {number}
     */
    deltaUi: 1,
    /**
     * The camera that outputs its view to the renderer.
     * @type {Camera}
     */
    camera: null,
    /**
     * ct.js version in form of a string `X.X.X`.
     * @type {string}
     */
    version: '1.4.2',
    meta: [{"name":"Arcade Park","author":"Quentin Launay/Maxime Baudoin/ Clement Lafon/Jules Serrato","site":"","version":"1.0.0"}][0],
    main: {
        fpstick: 0,
        pi: 0
    },
    get width() {
        return ct.pixiApp.renderer.view.width;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New width in pixels
     * @type {number}
     */
    set width(value) {
        ct.camera.width = ct.roomWidth = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(value, ct.height);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    },
    get height() {
        return ct.pixiApp.renderer.view.height;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New height in pixels
     * @type {number}
     */
    set height(value) {
        ct.camera.height = ct.roomHeight = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(ct.width, value);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    },
    /**
     * The width of the current view, in UI units
     * @type {number}
     * @deprecated Since v1.3.0. See `ct.camera.width`.
     */
    get viewWidth() {
        return ct.camera.width;
    },
    /**
     * The height of the current view, in UI units
     * @type {number}
     * @deprecated Since v1.3.0. See `ct.camera.height`.
     */
    get viewHeight() {
        return ct.camera.height;
    }
};

// eslint-disable-next-line no-console
console.log(
    `%c 😺 %c ct.js game editor %c v${ct.version} %c https://ctjs.rocks/ `,
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;',
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;'
);

ct.highDensity = [true][0];
const pixiAppSettings = {
    width: [1024][0],
    height: [575][0],
    antialias: ![false][0],
    powerPreference: 'high-performance',
    sharedTicker: true,
    sharedLoader: true
};
try {
    /**
     * The PIXI.Application that runs ct.js game
     * @type {PIXI.Application}
     */
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
} catch (e) {
    console.error(e);
    // eslint-disable-next-line no-console
    console.warn('[ct.js] Something bad has just happened. This is usually due to hardware problems. I\'ll try to fix them now, but if the game still doesn\'t run, try including a legacy renderer in the project\'s settings.');
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
}

PIXI.settings.ROUND_PIXELS = [false][0];
PIXI.Ticker.shared.maxFPS = [60][0] || 0;
if (!ct.pixiApp.renderer.options.antialias) {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
}
/**
 * @type PIXI.Container
 */
ct.stage = ct.pixiApp.stage;
ct.pixiApp.renderer.autoDensity = ct.highDensity;
document.getElementById('ct').appendChild(ct.pixiApp.view);

/**
 * A library of different utility functions, mainly Math-related, but not limited to them.
 * @namespace
 */
ct.u = {
    /**
     * Returns the length of a vector projection onto an X axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldx(l, d) {
        return l * Math.cos(d * Math.PI / -180);
    },
    /**
     * Returns the length of a vector projection onto an Y axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldy(l, d) {
        return l * Math.sin(d * Math.PI / -180);
    },
    /**
     * Returns the direction of a vector that points from the first point to the second one.
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The angle of the resulting vector, in degrees
     */
    pdn(x1, y1, x2, y2) {
        return (Math.atan2(y2 - y1, x2 - x1) * -180 / Math.PI + 360) % 360;
    },
    // Point-point DistanCe
    /**
     * Returns the distance between two points
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The distance between the two points
     */
    pdc(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    /**
     * Convers degrees to radians
     * @param {number} deg The degrees to convert
     * @returns {number} The resulting radian value
     */
    degToRad(deg) {
        return deg * Math.PI / -180;
    },
    /**
     * Convers radians to degrees
     * @param {number} rad The radian value to convert
     * @returns {number} The resulting degree
     */
    radToDeg(rad) {
        return rad / Math.PI * -180;
    },
    /**
     * Rotates a vector (x; y) by `deg` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} deg The degree to rotate by
     * @returns {Array<number>} A pair of new `x` and `y` parameters.
     */
    rotate(x, y, deg) {
        return ct.u.rotateRad(x, y, ct.u.degToRad(deg));
    },
    /**
     * Rotates a vector (x; y) by `rad` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} rad The radian value to rotate around
     * @returns {Array<number>} A pair of new `x` and `y` parameters.
     */
    rotateRad(x, y, rad) {
        const sin = Math.sin(rad),
              cos = Math.cos(rad);
        return [
            cos * x - sin * y,
            cos * y + sin * x
        ];
    },
    /**
     * Gets the most narrow angle between two vectors of given directions
     * @param {number} dir1 The direction of the first vector
     * @param {number} dir2 The direction of the second vector
     * @returns {number} The resulting angle
     */
    deltaDir(dir1, dir2) {
        dir1 = ((dir1 % 360) + 360) % 360;
        dir2 = ((dir2 % 360) + 360) % 360;
        var t = dir1,
            h = dir2,
            ta = h - t;
        if (ta > 180) {
            ta -= 360;
        }
        if (ta < -180) {
            ta += 360;
        }
        return ta;
    },
    /**
     * Returns a number in between the given range (clamps it).
     * @param {number} min The minimum value of the given number
     * @param {number} val The value to fit in the range
     * @param {number} max The maximum value of the given number
     * @returns {number} The clamped value
     */
    clamp(min, val, max) {
        return Math.max(min, Math.min(max, val));
    },
    /**
     * Linearly interpolates between two values by the apha value.
     * Can also be describing as mixing between two values with a given proportion `alpha`.
     * @param {number} a The first value to interpolate from
     * @param {number} b The second value to interpolate to
     * @param {number} alpha The mixing value
     * @returns {number} The result of the interpolation
     */
    lerp(a, b, alpha) {
        return a + (b - a) * alpha;
    },
    /**
     * Returns the position of a given value in a given range. Opposite to linear interpolation.
     * @param  {number} a The first value to interpolate from
     * @param  {number} b The second value to interpolate top
     * @param  {number} val The interpolated values
     * @return {number} The position of the value in the specified range.
     * When a <= val <= b, the result will be inside the [0;1] range.
     */
    unlerp(a, b, val) {
        return (val - a) / (b - a);
    },
    /**
     * Translates a point from UI space to game space.
     * @param {number} x The x coordinate in UI space.
     * @param {number} y The y coordinate in UI space.
     * @returns {Array<number>} A pair of new `x` and `y` coordinates.
     */
    uiToGameCoord(x, y) {
        return ct.camera.uiToGameCoord(x, y);
    },
    /**
     * Translates a point from fame space to UI space.
     * @param {number} x The x coordinate in game space.
     * @param {number} y The y coordinate in game space.
     * @returns {Array<number>} A pair of new `x` and `y` coordinates.
     */
    gameToUiCoord(x, y) {
        return ct.camera.gameToUiCoord(x, y);
    },
    /**
     * Tests whether a given point is inside the given rectangle
     * (it can be either a copy or an array).
     * @param {number} x The x coordinate of the point.
     * @param {number} y The y coordinate of the point.
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a rectangular shape)
     * or an array in a form of [x1, y1, x2, y2], where (x1;y1) and (x2;y2) specify
     * the two opposite corners of the rectangle.
     * @returns {boolean} `true` if the point is inside the rectangle, `false` otherwise.
     */
    prect(x, y, arg) {
        var xmin, xmax, ymin, ymax;
        if (arg.splice) {
            xmin = Math.min(arg[0], arg[2]);
            xmax = Math.max(arg[0], arg[2]);
            ymin = Math.min(arg[1], arg[3]);
            ymax = Math.max(arg[1], arg[3]);
        } else {
            xmin = arg.x - arg.shape.left * arg.scale.x;
            xmax = arg.x + arg.shape.right * arg.scale.x;
            ymin = arg.y - arg.shape.top * arg.scale.y;
            ymax = arg.y + arg.shape.bottom * arg.scale.y;
        }
        return x >= xmin && y >= ymin && x <= xmax && y <= ymax;
    },
    /**
     * Tests whether a given point is inside the given circle (it can be either a copy or an array)
     * @param {number} x The x coordinate of the point
     * @param {number} y The y coordinate of the point
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a circular shape)
     * or an array in a form of [x1, y1, r], where (x1;y1) define the center of the circle
     * and `r` defines the radius of it.
     * @returns {boolean} `true` if the point is inside the circle, `false` otherwise
     */
    pcircle(x, y, arg) {
        if (arg.splice) {
            return ct.u.pdc(x, y, arg[0], arg[1]) < arg[2];
        }
        return ct.u.pdc(0, 0, (arg.x - x) / arg.scale.x, (arg.y - y) / arg.scale.y) < arg.shape.r;
    },
    /**
     * Copies all the properties of the source object to the destination object.
     * This is **not** a deep copy. Useful for extending some settings with default values,
     * or for combining data.
     * @param {object} o1 The destination object
     * @param {object} o2 The source object
     * @param {any} [arr] An optional array of properties to copy. If not specified,
     * all the properties will be copied.
     * @returns {object} The modified destination object
     */
    ext(o1, o2, arr) {
        if (arr) {
            for (const i in arr) {
                if (o2[arr[i]]) {
                    o1[arr[i]] = o2[arr[i]];
                }
            }
        } else {
            for (const i in o2) {
                o1[i] = o2[i];
            }
        }
        return o1;
    },
    /**
     * Loads and executes a script by its URL, optionally with a callback
     * @param {string} url The URL of the script file, with its extension.
     * Can be relative or absolute.
     * @param {Function} callback An optional callback that fires when the script is loaded
     * @returns {void}
     */
    load(url, callback) {
        var script = document.createElement('script');
        script.src = url;
        if (callback) {
            script.onload = callback;
        }
        document.getElementsByTagName('head')[0].appendChild(script);
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer is run in gameplay time scale, meaning that it is affected by time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    wait(time) {
        return ct.timer.add(time);
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer runs in UI time scale and is not sensitive to time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    waitUi(time) {
        return ct.timer.addUi(time);
    }
};
ct.u.ext(ct.u, {// make aliases
    lengthDirX: ct.u.ldx,
    lengthDirY: ct.u.ldy,
    pointDirection: ct.u.pdn,
    pointDistance: ct.u.pdc,
    pointRectangle: ct.u.prect,
    pointCircle: ct.u.pcircle,
    extend: ct.u.ext
});

// eslint-disable-next-line max-lines-per-function
(() => {
    const killRecursive = copy => {
        copy.kill = true;
        if (copy.onDestroy) {
            ct.types.onDestroy.apply(copy);
            copy.onDestroy.apply(copy);
        }
        for (const child of copy.children) {
            if (child[copyTypeSymbol]) {
                killRecursive(child);
            }
        }
        const stackIndex = ct.stack.indexOf(copy);
        if (stackIndex !== -1) {
            ct.stack.splice(stackIndex, 1);
        }
        if (copy.type) {
            const typelistIndex = ct.types.list[copy.type].indexOf(copy);
            if (typelistIndex !== -1) {
                ct.types.list[copy.type].splice(typelistIndex, 1);
            }
        }
        deadPool.push(copy);
    };
    const manageCamera = () => {
        if (ct.camera) {
            ct.camera.update(ct.delta);
            ct.camera.manageStage();
        }
    };

    ct.loop = function loop(delta) {
        ct.delta = delta;
        ct.deltaUi = PIXI.Ticker.shared.elapsedMS / (1000 / (PIXI.Ticker.shared.maxFPS || 60));
        ct.inputs.updateActions();
        ct.timer.updateTimers();
        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.types.beforeStep.apply(ct.stack[i]);
            ct.stack[i].onStep.apply(ct.stack[i]);
            ct.types.afterStep.apply(ct.stack[i]);
        }
        // There may be a number of rooms stacked on top of each other.
        // Loop through them and filter out everything that is not a room.
        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeStep.apply(item);
            item.onStep.apply(item);
            ct.rooms.afterStep.apply(item);
        }
        // copies
        for (const copy of ct.stack) {
            // eslint-disable-next-line no-underscore-dangle
            if (copy.kill && !copy._destroyed) {
                killRecursive(copy); // This will also allow a parent to eject children
                                     // to a new container before they are destroyed as well
                copy.destroy({
                    children: true
                });
            }
        }

        for (const cont of ct.stage.children) {
            cont.children.sort((a, b) =>
                ((a.depth || 0) - (b.depth || 0)) || ((a.uid || 0) - (b.uid || 0)) || 0);
        }

        manageCamera();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.types.beforeDraw.apply(ct.stack[i]);
            ct.stack[i].onDraw.apply(ct.stack[i]);
            ct.types.afterDraw.apply(ct.stack[i]);
            ct.stack[i].xprev = ct.stack[i].x;
            ct.stack[i].yprev = ct.stack[i].y;
        }

        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeDraw.apply(item);
            item.onDraw.apply(item);
            ct.rooms.afterDraw.apply(item);
        }

        ct.main.fpstick++;
        if (ct.rooms.switching) {
            ct.rooms.forceSwitch();
        }
    };
})();




/**
 * @property {number} value The current value of an action. It is always in the range from -1 to 1.
 * @property {string} name The name of the action.
 */
class CtAction {
    /**
     * This is a custom action defined in the Settings tab → Edit actions section.
     * Actions are used to abstract different input methods into one gameplay-related interface:
     * for example, joystick movement, WASD keys and arrows can be turned into two actions:
     * `MoveHorizontally` and `MoveVertically`.
     * @param {string} name The name of the new action.
     */
    constructor(name) {
        this.name = name;
        this.methodCodes = [];
        this.methodMultipliers = [];
        this.prevValue = 0;
        this.value = 0;
        return this;
    }
    /**
     * Checks whether the current action listens to a given input method.
     * This *does not* check whether this input method is supported by ct.
     *
     * @param {string} code The code to look up.
     * @returns {boolean} `true` if it exists, `false` otherwise.
     */
    methodExists(code) {
        return this.methodCodes.indexOf(code) !== -1;
    }
    /**
     * Adds a new input method to listen.
     *
     * @param {string} code The input method's code to listen to. Must be unique per action.
     * @param {number} [multiplier] An optional multiplier, e.g. to flip its value.
     * Often used with two buttons to combine them into a scalar input identical to joysticks.
     * @returns {void}
     */
    addMethod(code, multiplier) {
        if (this.methodCodes.indexOf(code) === -1) {
            this.methodCodes.push(code);
            this.methodMultipliers.push(multiplier !== void 0 ? multiplier : 1);
        } else {
            throw new Error(`[ct.inputs] An attempt to add an already added input "${code}" to an action "${name}".`);
        }
    }
    /**
     * Removes the provided input method for an action.
     *
     * @param {string} code The input method to remove.
     * @returns {void}
     */
    removeMethod(code) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodCodes.splice(ind, 1);
            this.methodMultipliers.splice(ind, 1);
        }
    }
    /**
     * Changes the multiplier for an input method with the provided code.
     * This method will produce a warning if one is trying to change an input method
     * that is not listened by this action.
     *
     * @param {string} code The input method's code to change
     * @param {number} multiplier The new value
     * @returns {void}
     */
    setMultiplier(code, multiplier) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodMultipliers[ind] = multiplier;
        } else {
            // eslint-disable-next-line no-console
            console.warning(`[ct.inputs] An attempt to change multiplier of a non-existent method "${code}" at event ${this.name}`);
            // eslint-disable-next-line no-console
            console.trace();
        }
    }
    /**
     * Recalculates the digital value of an action.
     *
     * @returns {number} A scalar value between -1 and 1.
     */
    update() {
        this.prevValue = this.value;
        this.value = 0;
        for (let i = 0, l = this.methodCodes.length; i < l; i++) {
            const rawValue = ct.inputs.registry[this.methodCodes[i]] || 0;
            this.value += rawValue * this.methodMultipliers[i];
        }
        this.value = Math.max(-1, Math.min(this.value, 1));
    }
    /**
     * Resets the state of this action, setting its value to `0`
     * and its pressed, down, released states to `false`.
     *
     * @returns {void}
     */
    reset() {
        this.prevValue = this.value = 0;
    }
    /**
     * Returns whether the action became active in the current frame,
     * either by a button just pressed or by using a scalar input.
     *
     * `true` for being pressed and `false` otherwise
     * @type {boolean}
     */
    get pressed() {
        return this.prevValue === 0 && this.value !== 0;
    }
    /**
     * Returns whether the action became inactive in the current frame,
     * either by releasing all buttons or by resting all scalar inputs.
     *
     * `true` for being released and `false` otherwise
     * @type {boolean}
     */
    get released() {
        return this.prevValue !== 0 && this.value === 0;
    }
    /**
     * Returns whether the action is active, e.g. by a pressed button
     * or a currently used scalar input.
     *
     * `true` for being active and `false` otherwise
     * @type {boolean}
     */
    get down() {
        return this.value !== 0;
    }
    /* In case you need to be hated for the rest of your life, uncomment this */
    /*
    valueOf() {
        return this.value;
    }
    */
}

/**
 * A list of custom Actions. They are defined in the Settings tab → Edit actions section.
 * @type {Object.<string,CtAction>}
 */
ct.actions = {};
/**
 * @namespace
 */
ct.inputs = {
    registry: {},
    /**
     * Adds a new action and puts it into `ct.actions`.
     *
     * @param {string} name The name of an action, as it will be used in `ct.actions`.
     * @param {Array<Object>} methods A list of input methods. This list can be changed later.
     * @returns {CtAction} The created action
     */
    addAction(name, methods) {
        if (name in ct.actions) {
            throw new Error(`[ct.inputs] An action "${name}" already exists, can't add a new one with the same name.`);
        }
        const action = new CtAction(name);
        for (const method of methods) {
            action.addMethod(method.code, method.multiplier);
        }
        ct.actions[name] = action;
        return action;
    },
    /**
     * Removes an action with a given name.
     * @param {string} name The name of an action
     * @returns {void}
     */
    removeAction(name) {
        delete ct.actions[name];
    },
    /**
     * Recalculates values for every action in a game.
     * @returns {void}
     */
    updateActions() {
        for (const i in ct.actions) {
            ct.actions[i].update();
        }
    }
};

ct.inputs.addAction('NewAction', []);


/* eslint-disable no-underscore-dangle */
/* global SSCD */
/* eslint prefer-destructuring: 0 */
(function ctPlace(ct) {
    const circlePrecision = 16,
          twoPi = Math.PI * 0;
    var getSSCDShape = function (copy) {
        const {shape} = copy,
              position = new SSCD.Vector(copy.x, copy.y);
        if (shape.type === 'rect') {
            if (copy.rotation === 0) {
                position.x -= copy.scale.x > 0 ? (shape.left * copy.scale.x) : (-copy.scale.x * shape.right);
                position.y -= copy.scale.y > 0 ? (shape.top * copy.scale.y) : (-shape.bottom * copy.scale.y);
                return new SSCD.Rectangle(
                    position,
                    new SSCD.Vector(Math.abs((shape.left + shape.right) * copy.scale.x), Math.abs((shape.bottom + shape.top) * copy.scale.y))
                );
            }
            const upperLeft = ct.u.rotate(-shape.left * copy.scale.x, -shape.top * copy.scale.y, copy.rotation),
                  bottomLeft = ct.u.rotate(-shape.left * copy.scale.x, shape.bottom * copy.scale.y, copy.rotation),
                  bottomRight = ct.u.rotate(shape.right * copy.scale.x, shape.bottom * copy.scale.y, copy.rotation),
                  upperRight = ct.u.rotate(shape.right * copy.scale.x, -shape.top * copy.scale.y, copy.rotation);
            return new SSCD.LineStrip(position, [
                new SSCD.Vector(upperLeft[0], upperLeft[1]),
                new SSCD.Vector(bottomLeft[0], bottomLeft[1]),
                new SSCD.Vector(bottomRight[0], bottomRight[1]),
                new SSCD.Vector(upperRight[0], upperRight[1])
            ], true);
        }
        if (shape.type === 'circle') {
            if (Math.abs(copy.scale.x) === Math.abs(copy.scale.y)) {
                return new SSCD.Circle(position, shape.r * Math.abs(copy.scale.x));
            }
            const vertices = [];
            for (let i = 0; i < circlePrecision; i++) {
                const point = [
                    Math.sin(twoPi / circlePrecision * i) * shape.r * copy.scale.x,
                    Math.cos(twoPi / circlePrecision * i) * shape.r * copy.scale.y
                ];
                if (copy.rotation !== 0) {
                    vertices.push(ct.u.rotate(point[0], point[1], copy.rotation));
                } else {
                    vertices.push(point);
                }
            }
            return new SSCD.LineStrip(position, vertices, true);
        }
        if (shape.type === 'strip') {
            const vertices = [];
            if (copy.rotation !== 0) {
                for (const point of shape.points) {
                    const [x, y] = ct.u.rotate(point.x * copy.scale.x, point.y * copy.scale.y, copy.rotation);
                    vertices.push(new SSCD.Vector(x, y));
                }
            } else {
                for (const point of shape.points) {
                    vertices.push(new SSCD.Vector(point.x * copy.scale.x, point.y * copy.scale.y));
                }
            }
            return new SSCD.LineStrip(position, vertices, Boolean(shape.closedStrip));
        }
        if (shape.type === 'line') {
            return new SSCD.Line(
                new SSCD.Vector(copy.x + shape.x1 * copy.scale.x, copy.y + shape.y1 * copy.scale.y),
                new SSCD.Vector(copy.x + (shape.x2 - shape.x1) * copy.scale.x, copy.y + (shape.y2 - shape.y1) * copy.scale.y)
            );
        }
        return new SSCD.Circle(position, 0);
    };

    ct.place = {
        m: 1, // direction modifier in ct.place.go,
        gridX: [1024][0] || 512,
        gridY: [1024][0] || 512,
        grid: {},
        tileGrid: {},
        getHashes(copy) {
            var hashes = [];
            var x = Math.round(copy.x / ct.place.gridX),
                y = Math.round(copy.y / ct.place.gridY),
                dx = Math.sign(copy.x - ct.place.gridX * x),
                dy = Math.sign(copy.y - ct.place.gridY * y);
            hashes.push(`${x}:${y}`);
            if (dx) {
                hashes.push(`${x + dx}:${y}`);
                if (dy) {
                    hashes.push(`${x + dx}:${y + dy}`);
                }
            }
            if (dy) {
                hashes.push(`${x}:${y + dy}`);
            }
            return hashes;
        },
        /**
         * Applied to copies in the debug mode. Draws a collision shape
         * @this Copy
         * @returns {void}
         */
        drawDebugGraphic() {
            const shape = this._shape || getSSCDShape(this);
            const g = this.$cDebugCollision;
            const color = this.$cHadCollision ? 0x00ff00 : 0x0066ff;
            if (shape instanceof SSCD.Rectangle) {
                const pos = shape.get_position(),
                      size = shape.get_size();
                g.lineStyle(2, color)
                .drawRect(pos.x - this.x, pos.y - this.y, size.x, size.y);
            } else if (shape instanceof SSCD.LineStrip) {
                g.lineStyle(2, color)
                .moveTo(shape.__points[0].x, shape.__points[0].y);
                for (let i = 1; i < shape.__points.length; i++) {
                    g.lineTo(shape.__points[i].x, shape.__points[i].y);
                }
            } else if (shape instanceof SSCD.Circle) {
                g.lineStyle(2, color)
                .drawCircle(0, 0, shape.get_radius());
            } else {
                g.lineStyle(4, 0xff0000)
                .moveTo(-40, -40)
                .lineTo(40, 40)
                .moveTo(-40, 40)
                .lineTo(40, -40);
            }
        },
        drawDebugTileGraphic(tile) {
            const g = this.$cDebugCollision;
            const color = 0x0066ff;
            g.lineStyle(2, color)
            .drawRect(tile.x - this.x, tile.y - this.y, tile.width, tile.height);
        },
        collide(c1, c2) {
            // ct.place.collide(<c1: Copy, c2: Copy>)
            // Test collision between two copies
            c1._shape = c1._shape || getSSCDShape(c1);
            c2._shape = c2._shape || getSSCDShape(c2);
            if (c1._shape.__type === 'complex' || c2._shape.__type === 'strip' ||
            c2._shape.__type === 'complex' || c2._shape.__type === 'strip') {
                const aabb1 = c1._shape.get_aabb(),
                      aabb2 = c2._shape.get_aabb();
                if (!aabb1.intersects(aabb2)) {
                    return false;
                }
            }
            if (SSCD.CollisionManager.test_collision(c1._shape, c2._shape)) {
                if ([false][0]) {
                    c1.$cHadCollision = true;
                    c2.$cHadCollision = true;
                }
                return true;
            }
            return false;
        },
        /**
         * Determines if the place in (x,y) is occupied.
         * Optionally can take 'ctype' as a filter for obstackles' collision group (not shape type)
         *
         * @param {Copy} me The object to check collisions on
         * @param {number} [x] The x coordinate to check, as if `me` was placed there.
         * @param {number} [y] The y coordinate to check, as if `me` was placed there.
         * @param {String} [ctype] The collision group to check against
         * @param {Boolean} [multiple=false] If it is true, the function will return an array of all the collided objects.
         *                                   If it is false (default), it will return a copy with the first collision
         * @returns {Copy|Array<Copy>} The collided copy, or an array of all the detected collisions (if `multiple` is `true`)
         */
        occupied(me, x, y, ctype, multiple) {
            var oldx = me.x,
                oldy = me.y,
                shapeCashed = me._shape;
            let hashes;
            var results;
            if (typeof y === 'number') {
                me.x = x;
                me.y = y;
            } else {
                ctype = x;
                multiple = y;
                x = me.x;
                y = me.y;
            }
            if (typeof ctype === 'boolean') {
                multiple = ctype;
            }
            if (oldx !== me.x || oldy !== me.y) {
                me._shape = getSSCDShape(me);
                hashes = ct.place.getHashes(me);
            } else {
                hashes = me.$chashes || ct.place.getHashes(me);
            }
            if (multiple) {
                results = [];
            }
            for (const hash of hashes) {
                const array = ct.place.grid[hash];
                if (!array) {
                    continue;
                }
                for (let i = 0, l = array.length; i < l; i++) {
                    if (array[i] !== me && (!ctype || array[i].$ctype === ctype)) {
                        if (ct.place.collide(me, array[i])) {
                            /* eslint {"max-depth": "off"} */
                            if (!multiple) {
                                if (oldx !== me.x || oldy !== me.y) {
                                    me.x = oldx;
                                    me.y = oldy;
                                    me._shape = shapeCashed;
                                }
                                return array[i];
                            }
                            results.push(array[i]);
                        }
                    }
                }
            }
            if (oldx !== me.x || oldy !== me.y) {
                me.x = oldx;
                me.y = oldy;
                me._shape = shapeCashed;
            }
            if (!multiple) {
                return false;
            }
            return results;
        },
        free(me, x, y, ctype) {
            return !ct.place.occupied(me, x, y, ctype);
        },
        meet(me, x, y, type, multiple) {
            // ct.place.meet(<me: Copy, x: number, y: number>[, type: Type])
            // detects collision between a given copy and a copy of a certain type
            var oldx = me.x,
                oldy = me.y,
                shapeCashed = me._shape;
            let hashes;
            var results;
            if (typeof y === 'number') {
                me.x = x;
                me.y = y;
            } else {
                type = x;
                multiple = y;
                x = me.x;
                y = me.y;
            }
            if (typeof type === 'boolean') {
                multiple = type;
            }
            if (oldx !== me.x || oldy !== me.y) {
                me._shape = getSSCDShape(me);
                hashes = ct.place.getHashes(me);
            } else {
                hashes = me.$chashes || ct.place.getHashes(me);
            }
            if (multiple) {
                results = [];
            }
            for (const hash of hashes) {
                const array = ct.place.grid[hash];
                if (!array) {
                    continue;
                }
                for (let i = 0, l = array.length; i < l; i++) {
                    if (array[i].type === type && array[i] !== me && ct.place.collide(me, array[i])) {
                        if (!multiple) {
                            if (oldx !== me.x || oldy !== me.y) {
                                me._shape = shapeCashed;
                                me.x = oldx;
                                me.y = oldy;
                            }
                            return array[i];
                        }
                        results.push(array[i]);
                    }
                }
            }
            if (oldx !== me.x || oldy !== me.y) {
                me.x = oldx;
                me.y = oldy;
                me._shape = shapeCashed;
            }
            if (!multiple) {
                return false;
            }
            return results;
        },
        tile(me, x, y, ctype) {
            if (!me.shape || !me.shape.type) {
                return false;
            }
            var oldx = me.x,
                oldy = me.y,
                shapeCashed = me._shape;
            let hashes;
            if (y !== void 0) {
                me.x = x;
                me.y = y;
            } else {
                ctype = x;
                x = me.x;
                y = me.y;
            }
            if (oldx !== me.x || oldy !== me.y) {
                me._shape = getSSCDShape(me);
                hashes = ct.place.getHashes(me);
            } else {
                hashes = me.$chashes || ct.place.getHashes(me);
            }
            for (const hash of hashes) {
                const array = ct.place.tileGrid[hash];
                if (!array) {
                    continue;
                }
                for (let i = 0, l = array.length; i < l; i++) {
                    const tile = array[i];
                    const tileMatches = typeof ctype === 'string' ? tile.ctype === ctype : tile.depth === ctype;
                    if ((!ctype || tileMatches) && ct.place.collide(tile, me)) {
                        if (oldx !== me.x || oldy !== me.y) {
                            me.x = oldx;
                            me.y = oldy;
                            me._shape = shapeCashed;
                        }
                        return true;
                    }
                }
            }
            if (oldx !== me.x || oldy !== me.y) {
                me.x = oldx;
                me.y = oldy;
                me._shape = shapeCashed;
            }
            return false;
        },
        lastdist: null,
        nearest(x, y, type) {
            // ct.place.nearest(<x: number, y: number, type: Type>)
            if (ct.types.list[type].length > 0) {
                var dist = Math.hypot(x - ct.types.list[type][0].x, y - ct.types.list[type][0].y);
                var inst = ct.types.list[type][0];
                for (const copy of ct.types.list[type]) {
                    if (Math.hypot(x - copy.x, y - copy.y) < dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        furthest(x, y, type) {
            // ct.place.furthest(<x: number, y: number, type: Type>)
            if (ct.types.list[type].length > 0) {
                var dist = Math.hypot(x - ct.types.list[type][0].x, y - ct.types.list[type][0].y);
                var inst = ct.types.list[type][0];
                for (const copy of ct.types.list[type]) {
                    if (Math.hypot(x - copy.x, y - copy.y) > dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        moveAlong(me, dir, length, ctype, precision) {
            if (typeof ctype === 'number') {
                precision = ctype;
                ctype = void 0;
            }
            precision = Math.abs(precision || 1);
            if (length < 0) {
                length *= -1;
                dir += 180;
            }
            var dx = Math.cos(dir * Math.PI / -180) * precision,
                dy = Math.sin(dir * Math.PI / -180) * precision;
            for (let i = 0; i < length; i += precision) {
                const occupied = ct.place.occupied(me, me.x + dx, me.y + dy, ctype) ||
                                 ct.place.tile(me, me.x + dx, me.y + dy, ctype);
                if (!occupied) {
                    me.x += dx;
                    me.y += dy;
                    delete me._shape;
                } else {
                    return occupied;
                }
            }
            return false;
        },
        moveByAxes(me, dx, dy, ctype, precision) {
            if (typeof ctype === 'number') {
                precision = ctype;
                ctype = void 0;
            }
            const obstacles = {
                x: false,
                y: false
            };
            precision = Math.abs(precision || 1);
            while (Math.abs(dx) > precision) {
                if (ct.place.free(me, me.x + Math.sign(dx) * precision, me.y, ctype) &&
                    !ct.place.tile(me, me.x + Math.sign(dx) * precision, me.y, ctype)
                ) {
                    me.x += Math.sign(dx) * precision;
                    dx -= Math.sign(dx) * precision;
                } else {
                    obstacles.x = true;
                    break;
                }
            }
            while (Math.abs(dy) > precision) {
                if (ct.place.free(me, me.x, me.y + Math.sign(dy) * precision, ctype) &&
                    !ct.place.tile(me, me.x, me.y + Math.sign(dy) * precision, ctype)
                ) {
                    me.y += Math.sign(dy) * precision;
                    dy -= Math.sign(dy) * precision;
                } else {
                    obstacles.y = true;
                    break;
                }
            }
            if (!obstacles.x && !obstacles.y) {
                return false;
            }
            return obstacles;
        },
        go(me, x, y, length, ctype) {
            // ct.place.go(<me: Copy, x: number, y: number, length: number>[, ctype: String])
            // tries to reach the target with a simple obstacle avoidance algorithm

            // if we are too close to the destination, exit
            if (ct.u.pdc(me.x, me.y, x, y) < length) {
                if (ct.place.free(me, x, y, ctype)) {
                    me.x = x;
                    me.y = y;
                    delete me._shape;
                }
                return;
            }
            var dir = ct.u.pdn(me.x, me.y, x, y);

            //if there are no obstackles in front of us, go forward
            let projectedX = me.x + ct.u.ldx(length, dir),
                projectedY = me.y + ct.u.ldy(length, dir);
            if (ct.place.free(me, projectedX, projectedY, ctype)) {
                me.x = projectedX;
                me.y = projectedY;
                delete me._shape;
                me.dir = dir;
            // otherwise, try to change direction by 30...60...90 degrees.
            // Direction changes over time (ct.place.m).
            } else {
                for (var i = -1; i <= 1; i += 2) {
                    for (var j = 30; j < 150; j += 30) {
                        projectedX = me.x + ct.u.ldx(length, dir + j * ct.place.m * i);
                        projectedY = me.y + ct.u.ldy(length, dir + j * ct.place.m * i);
                        if (ct.place.free(me, projectedX, projectedY, ctype)) {
                            me.x = projectedX;
                            me.y = projectedY;
                            delete me._shape;
                            me.dir = dir + j * ct.place.m * i;
                            return;
                        }
                    }
                }
            }
        },
        /**
         * Throws a ray from point (x1, y1) to (x2, y2), returning all the copies
         * that touched the ray. The first copy in the returned array is the closest copy,
         * the last one is the furthest.
         *
         * @param {number} x1 A horizontal coordinate of the starting point of the ray.
         * @param {number} y1 A vertical coordinate of the starting point of the ray.
         * @param {number} x2 A horizontal coordinate of the ending point of the ray.
         * @param {number} y2 A vertical coordinate of the ending point of the ray.
         * @param {String} [ctype] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         *
         * @returns {Array<Copy>} Array of all the copies that touched the ray
         */
        trace(x1, y1, x2, y2, ctype) {
            var copies = [],
                ray = {
                    x: 0,
                    y: 0,
                    scale: {
                        x: 1,
                        y: 1
                    },
                    rotation: 0,
                    shape: {
                        type: 'line',
                        x1: x1,
                        y1: y1,
                        x2: x2,
                        y2: y2
                    }
                };
            for (var i in ct.stack) {
                if (!ctype || ct.stack[i].ctype === ctype) {
                    if (ct.place.collide(ray, ct.stack[i])) {
                        copies.push(ct.stack[i]);
                    }
                }
            }
            if (copies.length > 1) {
                copies.sort(function sortCopies(a, b) {
                    var dist1, dist2;
                    dist1 = ct.u.pdc(x1, y1, a.x, a.y);
                    dist2 = ct.u.pdc(x1, y1, b.x, b.y);
                    return dist1 - dist2;
                });
            }
            return copies;
        }
    };
    // a magic procedure which tells 'go' function to change its direction
    setInterval(function switchCtPlaceGoDirection() {
        ct.place.m *= -1;
    }, 789);
})(ct);

(function fittoscreen(ct) {
    document.body.style.overflow = 'hidden';
    var canv = ct.pixiApp.view;
    var resize = function resize() {
        const {mode} = ct.fittoscreen;
        const pixelScaleModifier = ct.highDensity ? (window.devicePixelRatio || 1) : 1;
        const kw = window.innerWidth / ct.roomWidth,
              kh = window.innerHeight / ct.roomHeight;
        let k = Math.min(kw, kh);
        if (mode === 'fastScaleInteger') {
            k = k < 1 ? k : Math.floor(k);
        }
        var canvasWidth, canvasHeight,
            cameraWidth, cameraHeight;
        if (mode === 'expandViewport' || mode === 'expand') {
            canvasWidth = Math.ceil(window.innerWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(window.innerHeight * pixelScaleModifier);
            cameraWidth = window.innerWidth;
            cameraHeight = window.innerHeight;
        } else if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canvasWidth = Math.ceil(ct.roomWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(ct.roomHeight * pixelScaleModifier);
            cameraWidth = ct.roomWidth;
            cameraHeight = ct.roomHeight;
        } else if (mode === 'scaleFit' || mode === 'scaleFill') {
            if (mode === 'scaleFill') {
                canvasWidth = Math.ceil(ct.roomWidth * kw * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * kh * pixelScaleModifier);
                cameraWidth = window.innerWidth / k;
                cameraHeight = window.innerHeight / k;
            } else { // scaleFit
                canvasWidth = Math.ceil(ct.roomWidth * k * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * k * pixelScaleModifier);
                cameraWidth = ct.roomWidth;
                cameraHeight = ct.roomHeight;
            }
        }

        ct.pixiApp.renderer.resize(canvasWidth, canvasHeight);
        if (mode !== 'scaleFill' && mode !== 'scaleFit') {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier;
        } else {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier * k;
        }
        canv.style.width = Math.ceil(canvasWidth / pixelScaleModifier) + 'px';
        canv.style.height = Math.ceil(canvasHeight / pixelScaleModifier) + 'px';
        ct.camera.width = cameraWidth;
        ct.camera.height = cameraHeight;

        if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canv.style.transform = `translate(-50%, -50%) scale(${k})`;
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        } else if (mode === 'expandViewport' || mode === 'expand' || mode === 'scaleFill') {
            canv.style.position = 'static';
            canv.style.top = 'unset';
            canv.style.left = 'unset';
        } else if (mode === 'scaleFit') {
            canv.style.transform = 'translate(-50%, -50%)';
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        }
    };
    var toggleFullscreen = function () {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow();
            win.setFullScreen(!win.isFullScreen());
            return;
        } catch (e) {
            void e; // Continue with web approach
        }
        var canvas = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement,
            requester = document.getElementById('ct'),
            request = requester.requestFullscreen ||
                      requester.webkitRequestFullscreen ||
                      requester.mozRequestFullScreen ||
                      requester.msRequestFullscreen,
            exit = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
        if (!canvas) {
            var promise = request.call(requester);
            if (promise) {
                promise
                .catch(function fullscreenError(err) {
                    console.error('[ct.fittoscreen]', err);
                });
            }
        } else if (exit) {
            exit.call(document);
        }
    };
    var queuedFullscreen = function queuedFullscreen() {
        toggleFullscreen();
        document.removeEventListener('mouseup', queuedFullscreen);
        document.removeEventListener('keyup', queuedFullscreen);
        document.removeEventListener('click', queuedFullscreen);
    };
    var queueFullscreen = function queueFullscreen() {
        document.addEventListener('mouseup', queuedFullscreen);
        document.addEventListener('keyup', queuedFullscreen);
        document.addEventListener('click', queuedFullscreen);
    };
    window.addEventListener('resize', resize);
    ct.fittoscreen = resize;
    ct.fittoscreen.toggleFullscreen = queueFullscreen;
    var $mode = 'scaleFit';
    Object.defineProperty(ct.fittoscreen, 'mode', {
        configurable: false,
        enumerable: true,
        set(value) {
            $mode = value;
        },
        get() {
            return $mode;
        }
    });
    ct.fittoscreen.mode = $mode;
    ct.fittoscreen.getIsFullscreen = function getIsFullscreen() {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow;
            return win.isFullScreen;
        } catch (e) {
            void e; // Continue with web approach
        }
        return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
    };
})(ct);

(function ctMouse() {
    var keyPrefix = 'mouse.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    var buttonMap = {
        0: 'Left',
        1: 'Middle',
        2: 'Right',
        3: 'Special1',
        4: 'Special2',
        5: 'Special3',
        6: 'Special4',
        7: 'Special5',
        8: 'Special6',
        unknown: 'Unknown'
    };

    ct.mouse = {
        xprev: 0,
        yprev: 0,
        xuiprev: 0,
        yuiprev: 0,
        inside: false,
        pressed: false,
        down: false,
        released: false,
        button: 0,
        hovers(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.x === copy.x && ct.mouse.y === copy.y;
            }
            return false;
        },
        hoversUi(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.xui === copy.x && ct.mouse.yui === copy.y;
            }
            return false;
        },
        hide() {
            ct.pixiApp.renderer.view.style.cursor = 'none';
        },
        show() {
            ct.pixiApp.renderer.view.style.cursor = '';
        },
        get x() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui)[0];
        },
        get y() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui)[1];
        }
    };

    ct.mouse.listenerMove = function listenerMove(e) {
        var rect = ct.pixiApp.view.getBoundingClientRect();
        ct.mouse.xui = (e.clientX - rect.left) * ct.camera.width / rect.width;
        ct.mouse.yui = (e.clientY - rect.top) * ct.camera.height / rect.height;
        if (ct.mouse.xui > 0 &&
            ct.mouse.yui > 0 &&
            ct.mouse.yui < ct.camera.height &&
            ct.mouse.xui < ct.camera.width
        ) {
            ct.mouse.inside = true;
        } else {
            ct.mouse.inside = false;
        }
        window.focus();
    };
    ct.mouse.listenerDown = function listenerDown(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 1);
        ct.mouse.pressed = true;
        ct.mouse.down = true;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerUp = function listenerUp(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 0);
        ct.mouse.released = true;
        ct.mouse.down = false;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerContextMenu = function listenerContextMenu(e) {
        e.preventDefault();
    };
    ct.mouse.listenerWheel = function listenerWheel(e) {
        setKey('Wheel', ((e.wheelDelta || -e.detail) < 0) ? -1 : 1);
        //e.preventDefault();
    };

    ct.mouse.setupListeners = function setupListeners() {
        if (document.addEventListener) {
            document.addEventListener('mousemove', ct.mouse.listenerMove, false);
            document.addEventListener('mouseup', ct.mouse.listenerUp, false);
            document.addEventListener('mousedown', ct.mouse.listenerDown, false);
            document.addEventListener('wheel', ct.mouse.listenerWheel, false, {
                passive: false
            });
            document.addEventListener('contextmenu', ct.mouse.listenerContextMenu, false);
            document.addEventListener('DOMMouseScroll', ct.mouse.listenerWheel, {
                passive: false
            });
        } else { // IE?
            document.attachEvent('onmousemove', ct.mouse.listenerMove);
            document.attachEvent('onmouseup', ct.mouse.listenerUp);
            document.attachEvent('onmousedown', ct.mouse.listenerDown);
            document.attachEvent('onmousewheel', ct.mouse.listenerWheel);
            document.attachEvent('oncontextmenu', ct.mouse.listenerContextMenu);
        }
    };
})();

/* global ct */
/* eslint {"no-multi-spaces": "off", "object-property-newline": "off"} */

(function() {
    var keyPrefix = 'keyboard.';
    var setKey = function(key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    
    ct.keyboard = {
        string: '',
        lastKey: '',
        lastCode: '',
        alt: false,
        shift: false,
        ctrl: false,
        clear() {
            delete ct.keyboard.lastKey;
            delete ct.keyboard.lastCode;
            ct.keyboard.string = '';
            ct.keyboard.alt = false;
            ct.keyboard.shift = false;
            ct.keyboard.ctrl = false;
        },
        check: [],
        onDown(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            ct.keyboard.lastKey = e.key;
            ct.keyboard.lastCode = e.code;
            if (e.code) {
                setKey(e.code, 1);
            } else {
                setKey('Unknown', 1);
            }
            if (e.key) {
                if (e.key.length === 1) {
                    ct.keyboard.string += e.key;
                } else if (e.key === 'Backspace') {
                    ct.keyboard.string = ct.keyboard.string.slice(0, -1);
                } else if (e.key === 'Enter') {
                    ct.keyboard.string = '';
                }
            }
            e.preventDefault();
        },
        onUp(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            if (e.code) {
                setKey(e.code, 0);
            } else {
                setKey('Unknown', 0);
            }
            e.preventDefault();
        }
    };
    
    if (document.addEventListener) {
        document.addEventListener('keydown', ct.keyboard.onDown, false);
        document.addEventListener('keyup', ct.keyboard.onUp, false);
    } else {
        document.attachEvent('onkeydown', ct.keyboard.onDown);
        document.attachEvent('onkeyup', ct.keyboard.onUp);
    }
})();

(function(global) {
    'use strict';
  
    var nativeKeyboardEvent = ('KeyboardEvent' in global);
    if (!nativeKeyboardEvent)
      global.KeyboardEvent = function KeyboardEvent() { throw TypeError('Illegal constructor'); };
  
    [
      ['DOM_KEY_LOCATION_STANDARD', 0x00], // Default or unknown location
      ['DOM_KEY_LOCATION_LEFT', 0x01], // e.g. Left Alt key
      ['DOM_KEY_LOCATION_RIGHT', 0x02], // e.g. Right Alt key
      ['DOM_KEY_LOCATION_NUMPAD', 0x03], // e.g. Numpad 0 or +
    ].forEach(function(p) { if (!(p[0] in global.KeyboardEvent)) global.KeyboardEvent[p[0]] = p[1]; });
  
    var STANDARD = global.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
        LEFT = global.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        RIGHT = global.KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
        NUMPAD = global.KeyboardEvent.DOM_KEY_LOCATION_NUMPAD;
  
    //--------------------------------------------------------------------
    //
    // Utilities
    //
    //--------------------------------------------------------------------
  
    function contains(s, ss) { return String(s).indexOf(ss) !== -1; }
  
    var os = (function() {
      if (contains(navigator.platform, 'Win')) { return 'win'; }
      if (contains(navigator.platform, 'Mac')) { return 'mac'; }
      if (contains(navigator.platform, 'CrOS')) { return 'cros'; }
      if (contains(navigator.platform, 'Linux')) { return 'linux'; }
      if (contains(navigator.userAgent, 'iPad') || contains(navigator.platform, 'iPod') || contains(navigator.platform, 'iPhone')) { return 'ios'; }
      return '';
    } ());
  
    var browser = (function() {
      if (contains(navigator.userAgent, 'Chrome/')) { return 'chrome'; }
      if (contains(navigator.vendor, 'Apple')) { return 'safari'; }
      if (contains(navigator.userAgent, 'MSIE')) { return 'ie'; }
      if (contains(navigator.userAgent, 'Gecko/')) { return 'moz'; }
      if (contains(navigator.userAgent, 'Opera/')) { return 'opera'; }
      return '';
    } ());
  
    var browser_os = browser + '-' + os;
  
    function mergeIf(baseTable, select, table) {
      if (browser_os === select || browser === select || os === select) {
        Object.keys(table).forEach(function(keyCode) {
          baseTable[keyCode] = table[keyCode];
        });
      }
    }
  
    function remap(o, key) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        var item = o[k];
        if (key in item) {
          r[item[key]] = item;
        }
      });
      return r;
    }
  
    function invert(o) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        r[o[k]] = k;
      });
      return r;
    }
  
    //--------------------------------------------------------------------
    //
    // Generic Mappings
    //
    //--------------------------------------------------------------------
  
    // "keyInfo" is a dictionary:
    //   code: string - name from UI Events KeyboardEvent code Values
    //     https://w3c.github.io/uievents-code/
    //   location (optional): number - one of the DOM_KEY_LOCATION values
    //   keyCap (optional): string - keyboard label in en-US locale
    // USB code Usage ID from page 0x07 unless otherwise noted (Informative)
  
    // Map of keyCode to keyInfo
    var keyCodeToInfoTable = {
      // 0x01 - VK_LBUTTON
      // 0x02 - VK_RBUTTON
      0x03: { code: 'Cancel' }, // [USB: 0x9b] char \x0018 ??? (Not in D3E)
      // 0x04 - VK_MBUTTON
      // 0x05 - VK_XBUTTON1
      // 0x06 - VK_XBUTTON2
      0x06: { code: 'Help' }, // [USB: 0x75] ???
      // 0x07 - undefined
      0x08: { code: 'Backspace' }, // [USB: 0x2a] Labelled Delete on Macintosh keyboards.
      0x09: { code: 'Tab' }, // [USB: 0x2b]
      // 0x0A-0x0B - reserved
      0X0C: { code: 'Clear' }, // [USB: 0x9c] NumPad Center (Not in D3E)
      0X0D: { code: 'Enter' }, // [USB: 0x28]
      // 0x0E-0x0F - undefined
  
      0x10: { code: 'Shift' },
      0x11: { code: 'Control' },
      0x12: { code: 'Alt' },
      0x13: { code: 'Pause' }, // [USB: 0x48]
      0x14: { code: 'CapsLock' }, // [USB: 0x39]
      0x15: { code: 'KanaMode' }, // [USB: 0x88]
      0x16: { code: 'Lang1' }, // [USB: 0x90]
      // 0x17: VK_JUNJA
      // 0x18: VK_FINAL
      0x19: { code: 'Lang2' }, // [USB: 0x91]
      // 0x1A - undefined
      0x1B: { code: 'Escape' }, // [USB: 0x29]
      0x1C: { code: 'Convert' }, // [USB: 0x8a]
      0x1D: { code: 'NonConvert' }, // [USB: 0x8b]
      0x1E: { code: 'Accept' }, // [USB: ????]
      0x1F: { code: 'ModeChange' }, // [USB: ????]
  
      0x20: { code: 'Space' }, // [USB: 0x2c]
      0x21: { code: 'PageUp' }, // [USB: 0x4b]
      0x22: { code: 'PageDown' }, // [USB: 0x4e]
      0x23: { code: 'End' }, // [USB: 0x4d]
      0x24: { code: 'Home' }, // [USB: 0x4a]
      0x25: { code: 'ArrowLeft' }, // [USB: 0x50]
      0x26: { code: 'ArrowUp' }, // [USB: 0x52]
      0x27: { code: 'ArrowRight' }, // [USB: 0x4f]
      0x28: { code: 'ArrowDown' }, // [USB: 0x51]
      0x29: { code: 'Select' }, // (Not in D3E)
      0x2A: { code: 'Print' }, // (Not in D3E)
      0x2B: { code: 'Execute' }, // [USB: 0x74] (Not in D3E)
      0x2C: { code: 'PrintScreen' }, // [USB: 0x46]
      0x2D: { code: 'Insert' }, // [USB: 0x49]
      0x2E: { code: 'Delete' }, // [USB: 0x4c]
      0x2F: { code: 'Help' }, // [USB: 0x75] ???
  
      0x30: { code: 'Digit0', keyCap: '0' }, // [USB: 0x27] 0)
      0x31: { code: 'Digit1', keyCap: '1' }, // [USB: 0x1e] 1!
      0x32: { code: 'Digit2', keyCap: '2' }, // [USB: 0x1f] 2@
      0x33: { code: 'Digit3', keyCap: '3' }, // [USB: 0x20] 3#
      0x34: { code: 'Digit4', keyCap: '4' }, // [USB: 0x21] 4$
      0x35: { code: 'Digit5', keyCap: '5' }, // [USB: 0x22] 5%
      0x36: { code: 'Digit6', keyCap: '6' }, // [USB: 0x23] 6^
      0x37: { code: 'Digit7', keyCap: '7' }, // [USB: 0x24] 7&
      0x38: { code: 'Digit8', keyCap: '8' }, // [USB: 0x25] 8*
      0x39: { code: 'Digit9', keyCap: '9' }, // [USB: 0x26] 9(
      // 0x3A-0x40 - undefined
  
      0x41: { code: 'KeyA', keyCap: 'a' }, // [USB: 0x04]
      0x42: { code: 'KeyB', keyCap: 'b' }, // [USB: 0x05]
      0x43: { code: 'KeyC', keyCap: 'c' }, // [USB: 0x06]
      0x44: { code: 'KeyD', keyCap: 'd' }, // [USB: 0x07]
      0x45: { code: 'KeyE', keyCap: 'e' }, // [USB: 0x08]
      0x46: { code: 'KeyF', keyCap: 'f' }, // [USB: 0x09]
      0x47: { code: 'KeyG', keyCap: 'g' }, // [USB: 0x0a]
      0x48: { code: 'KeyH', keyCap: 'h' }, // [USB: 0x0b]
      0x49: { code: 'KeyI', keyCap: 'i' }, // [USB: 0x0c]
      0x4A: { code: 'KeyJ', keyCap: 'j' }, // [USB: 0x0d]
      0x4B: { code: 'KeyK', keyCap: 'k' }, // [USB: 0x0e]
      0x4C: { code: 'KeyL', keyCap: 'l' }, // [USB: 0x0f]
      0x4D: { code: 'KeyM', keyCap: 'm' }, // [USB: 0x10]
      0x4E: { code: 'KeyN', keyCap: 'n' }, // [USB: 0x11]
      0x4F: { code: 'KeyO', keyCap: 'o' }, // [USB: 0x12]
  
      0x50: { code: 'KeyP', keyCap: 'p' }, // [USB: 0x13]
      0x51: { code: 'KeyQ', keyCap: 'q' }, // [USB: 0x14]
      0x52: { code: 'KeyR', keyCap: 'r' }, // [USB: 0x15]
      0x53: { code: 'KeyS', keyCap: 's' }, // [USB: 0x16]
      0x54: { code: 'KeyT', keyCap: 't' }, // [USB: 0x17]
      0x55: { code: 'KeyU', keyCap: 'u' }, // [USB: 0x18]
      0x56: { code: 'KeyV', keyCap: 'v' }, // [USB: 0x19]
      0x57: { code: 'KeyW', keyCap: 'w' }, // [USB: 0x1a]
      0x58: { code: 'KeyX', keyCap: 'x' }, // [USB: 0x1b]
      0x59: { code: 'KeyY', keyCap: 'y' }, // [USB: 0x1c]
      0x5A: { code: 'KeyZ', keyCap: 'z' }, // [USB: 0x1d]
      0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
      0x5C: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
      0x5D: { code: 'ContextMenu' }, // [USB: 0x65] Context Menu
      // 0x5E - reserved
      0x5F: { code: 'Standby' }, // [USB: 0x82] Sleep
  
      0x60: { code: 'Numpad0', keyCap: '0', location: NUMPAD }, // [USB: 0x62]
      0x61: { code: 'Numpad1', keyCap: '1', location: NUMPAD }, // [USB: 0x59]
      0x62: { code: 'Numpad2', keyCap: '2', location: NUMPAD }, // [USB: 0x5a]
      0x63: { code: 'Numpad3', keyCap: '3', location: NUMPAD }, // [USB: 0x5b]
      0x64: { code: 'Numpad4', keyCap: '4', location: NUMPAD }, // [USB: 0x5c]
      0x65: { code: 'Numpad5', keyCap: '5', location: NUMPAD }, // [USB: 0x5d]
      0x66: { code: 'Numpad6', keyCap: '6', location: NUMPAD }, // [USB: 0x5e]
      0x67: { code: 'Numpad7', keyCap: '7', location: NUMPAD }, // [USB: 0x5f]
      0x68: { code: 'Numpad8', keyCap: '8', location: NUMPAD }, // [USB: 0x60]
      0x69: { code: 'Numpad9', keyCap: '9', location: NUMPAD }, // [USB: 0x61]
      0x6A: { code: 'NumpadMultiply', keyCap: '*', location: NUMPAD }, // [USB: 0x55]
      0x6B: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
      0x6C: { code: 'NumpadComma', keyCap: ',', location: NUMPAD }, // [USB: 0x85]
      0x6D: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD }, // [USB: 0x56]
      0x6E: { code: 'NumpadDecimal', keyCap: '.', location: NUMPAD }, // [USB: 0x63]
      0x6F: { code: 'NumpadDivide', keyCap: '/', location: NUMPAD }, // [USB: 0x54]
  
      0x70: { code: 'F1' }, // [USB: 0x3a]
      0x71: { code: 'F2' }, // [USB: 0x3b]
      0x72: { code: 'F3' }, // [USB: 0x3c]
      0x73: { code: 'F4' }, // [USB: 0x3d]
      0x74: { code: 'F5' }, // [USB: 0x3e]
      0x75: { code: 'F6' }, // [USB: 0x3f]
      0x76: { code: 'F7' }, // [USB: 0x40]
      0x77: { code: 'F8' }, // [USB: 0x41]
      0x78: { code: 'F9' }, // [USB: 0x42]
      0x79: { code: 'F10' }, // [USB: 0x43]
      0x7A: { code: 'F11' }, // [USB: 0x44]
      0x7B: { code: 'F12' }, // [USB: 0x45]
      0x7C: { code: 'F13' }, // [USB: 0x68]
      0x7D: { code: 'F14' }, // [USB: 0x69]
      0x7E: { code: 'F15' }, // [USB: 0x6a]
      0x7F: { code: 'F16' }, // [USB: 0x6b]
  
      0x80: { code: 'F17' }, // [USB: 0x6c]
      0x81: { code: 'F18' }, // [USB: 0x6d]
      0x82: { code: 'F19' }, // [USB: 0x6e]
      0x83: { code: 'F20' }, // [USB: 0x6f]
      0x84: { code: 'F21' }, // [USB: 0x70]
      0x85: { code: 'F22' }, // [USB: 0x71]
      0x86: { code: 'F23' }, // [USB: 0x72]
      0x87: { code: 'F24' }, // [USB: 0x73]
      // 0x88-0x8F - unassigned
  
      0x90: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0x91: { code: 'ScrollLock' }, // [USB: 0x47]
      // 0x92-0x96 - OEM specific
      // 0x97-0x9F - unassigned
  
      // NOTE: 0xA0-0xA5 usually mapped to 0x10-0x12 in browsers
      0xA0: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0xA1: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0xA2: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0xA3: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0xA4: { code: 'AltLeft', location: LEFT }, // [USB: 0xe2]
      0xA5: { code: 'AltRight', location: RIGHT }, // [USB: 0xe6]
  
      0xA6: { code: 'BrowserBack' }, // [USB: 0x0c/0x0224]
      0xA7: { code: 'BrowserForward' }, // [USB: 0x0c/0x0225]
      0xA8: { code: 'BrowserRefresh' }, // [USB: 0x0c/0x0227]
      0xA9: { code: 'BrowserStop' }, // [USB: 0x0c/0x0226]
      0xAA: { code: 'BrowserSearch' }, // [USB: 0x0c/0x0221]
      0xAB: { code: 'BrowserFavorites' }, // [USB: 0x0c/0x0228]
      0xAC: { code: 'BrowserHome' }, // [USB: 0x0c/0x0222]
      0xAD: { code: 'AudioVolumeMute' }, // [USB: 0x7f]
      0xAE: { code: 'AudioVolumeDown' }, // [USB: 0x81]
      0xAF: { code: 'AudioVolumeUp' }, // [USB: 0x80]
  
      0xB0: { code: 'MediaTrackNext' }, // [USB: 0x0c/0x00b5]
      0xB1: { code: 'MediaTrackPrevious' }, // [USB: 0x0c/0x00b6]
      0xB2: { code: 'MediaStop' }, // [USB: 0x0c/0x00b7]
      0xB3: { code: 'MediaPlayPause' }, // [USB: 0x0c/0x00cd]
      0xB4: { code: 'LaunchMail' }, // [USB: 0x0c/0x018a]
      0xB5: { code: 'MediaSelect' },
      0xB6: { code: 'LaunchApp1' },
      0xB7: { code: 'LaunchApp2' },
      // 0xB8-0xB9 - reserved
      0xBA: { code: 'Semicolon',  keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
      0xBB: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
      0xBC: { code: 'Comma', keyCap: ',' }, // [USB: 0x36] ,<
      0xBD: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
      0xBE: { code: 'Period', keyCap: '.' }, // [USB: 0x37] .>
      0xBF: { code: 'Slash', keyCap: '/' }, // [USB: 0x38] /? (US Standard 101)
  
      0xC0: { code: 'Backquote', keyCap: '`' }, // [USB: 0x35] `~ (US Standard 101)
      // 0xC1-0xCF - reserved
  
      // 0xD0-0xD7 - reserved
      // 0xD8-0xDA - unassigned
      0xDB: { code: 'BracketLeft', keyCap: '[' }, // [USB: 0x2f] [{ (US Standard 101)
      0xDC: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
      0xDD: { code: 'BracketRight', keyCap: ']' }, // [USB: 0x30] ]} (US Standard 101)
      0xDE: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
      // 0xDF - miscellaneous/varies
  
      // 0xE0 - reserved
      // 0xE1 - OEM specific
      0xE2: { code: 'IntlBackslash',  keyCap: '\\' }, // [USB: 0x64] \| (UK Standard 102)
      // 0xE3-0xE4 - OEM specific
      0xE5: { code: 'Process' }, // (Not in D3E)
      // 0xE6 - OEM specific
      // 0xE7 - VK_PACKET
      // 0xE8 - unassigned
      // 0xE9-0xEF - OEM specific
  
      // 0xF0-0xF5 - OEM specific
      0xF6: { code: 'Attn' }, // [USB: 0x9a] (Not in D3E)
      0xF7: { code: 'CrSel' }, // [USB: 0xa3] (Not in D3E)
      0xF8: { code: 'ExSel' }, // [USB: 0xa4] (Not in D3E)
      0xF9: { code: 'EraseEof' }, // (Not in D3E)
      0xFA: { code: 'Play' }, // (Not in D3E)
      0xFB: { code: 'ZoomToggle' }, // (Not in D3E)
      // 0xFC - VK_NONAME - reserved
      // 0xFD - VK_PA1
      0xFE: { code: 'Clear' } // [USB: 0x9c] (Not in D3E)
    };
  
    // No legacy keyCode, but listed in D3E:
  
    // code: usb
    // 'IntlHash': 0x070032,
    // 'IntlRo': 0x070087,
    // 'IntlYen': 0x070089,
    // 'NumpadBackspace': 0x0700bb,
    // 'NumpadClear': 0x0700d8,
    // 'NumpadClearEntry': 0x0700d9,
    // 'NumpadMemoryAdd': 0x0700d3,
    // 'NumpadMemoryClear': 0x0700d2,
    // 'NumpadMemoryRecall': 0x0700d1,
    // 'NumpadMemoryStore': 0x0700d0,
    // 'NumpadMemorySubtract': 0x0700d4,
    // 'NumpadParenLeft': 0x0700b6,
    // 'NumpadParenRight': 0x0700b7,
  
    //--------------------------------------------------------------------
    //
    // Browser/OS Specific Mappings
    //
    //--------------------------------------------------------------------
  
    mergeIf(keyCodeToInfoTable,
            'moz', {
              0x3B: { code: 'Semicolon', keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
              0x3D: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6B: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6D: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
              0xBB: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
              0xBD: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD } // [USB: 0x56]
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-mac', {
              0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-win', {
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'chrome-mac', {
              0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
            });
  
    // Windows via Bootcamp (!)
    if (0) {
      mergeIf(keyCodeToInfoTable,
              'chrome-win', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
  
      mergeIf(keyCodeToInfoTable,
              'ie', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
    }
  
    mergeIf(keyCodeToInfoTable,
            'safari', {
              0x03: { code: 'Enter' }, // [USB: 0x28] old Safari
              0x19: { code: 'Tab' } // [USB: 0x2b] old Safari for Shift+Tab
            });
  
    mergeIf(keyCodeToInfoTable,
            'ios', {
              0x0A: { code: 'Enter', location: STANDARD } // [USB: 0x28]
            });
  
    mergeIf(keyCodeToInfoTable,
            'safari-mac', {
              0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
              0x5D: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
              0xE5: { code: 'KeyQ', keyCap: 'Q' } // [USB: 0x14] On alternate presses, Ctrl+Q sends this
            });
  
    //--------------------------------------------------------------------
    //
    // Identifier Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send keyIdentifier which can be
    // used to disambiguate keys.
  
    // keyIdentifierTable[keyIdentifier] -> keyInfo
  
    var keyIdentifierTable = {};
    if ('cros' === os) {
      keyIdentifierTable['U+00A0'] = { code: 'ShiftLeft', location: LEFT };
      keyIdentifierTable['U+00A1'] = { code: 'ShiftRight', location: RIGHT };
      keyIdentifierTable['U+00A2'] = { code: 'ControlLeft', location: LEFT };
      keyIdentifierTable['U+00A3'] = { code: 'ControlRight', location: RIGHT };
      keyIdentifierTable['U+00A4'] = { code: 'AltLeft', location: LEFT };
      keyIdentifierTable['U+00A5'] = { code: 'AltRight', location: RIGHT };
    }
    if ('chrome-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('safari-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('ios' === os) {
      // These only generate keyup events
      keyIdentifierTable['U+0010'] = { code: 'Function' };
  
      keyIdentifierTable['U+001C'] = { code: 'ArrowLeft' };
      keyIdentifierTable['U+001D'] = { code: 'ArrowRight' };
      keyIdentifierTable['U+001E'] = { code: 'ArrowUp' };
      keyIdentifierTable['U+001F'] = { code: 'ArrowDown' };
  
      keyIdentifierTable['U+0001'] = { code: 'Home' }; // [USB: 0x4a] Fn + ArrowLeft
      keyIdentifierTable['U+0004'] = { code: 'End' }; // [USB: 0x4d] Fn + ArrowRight
      keyIdentifierTable['U+000B'] = { code: 'PageUp' }; // [USB: 0x4b] Fn + ArrowUp
      keyIdentifierTable['U+000C'] = { code: 'PageDown' }; // [USB: 0x4e] Fn + ArrowDown
    }
  
    //--------------------------------------------------------------------
    //
    // Location Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send location/keyLocation which
    // can be used to disambiguate keys.
  
    // locationTable[location][keyCode] -> keyInfo
    var locationTable = [];
    locationTable[LEFT] = {
      0x10: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0x11: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0x12: { code: 'AltLeft', location: LEFT } // [USB: 0xe2]
    };
    locationTable[RIGHT] = {
      0x10: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0x11: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0x12: { code: 'AltRight', location: RIGHT } // [USB: 0xe6]
    };
    locationTable[NUMPAD] = {
      0x0D: { code: 'NumpadEnter', location: NUMPAD } // [USB: 0x58]
    };
  
    mergeIf(locationTable[NUMPAD], 'moz', {
      0x6D: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0x6B: { code: 'NumpadAdd', location: NUMPAD } // [USB: 0x57]
    });
    mergeIf(locationTable[LEFT], 'moz-mac', {
      0xE0: { code: 'MetaLeft', location: LEFT } // [USB: 0xe3]
    });
    mergeIf(locationTable[RIGHT], 'moz-mac', {
      0xE0: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
    mergeIf(locationTable[RIGHT], 'moz-win', {
      0x5B: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
  
    mergeIf(locationTable[RIGHT], 'mac', {
      0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
    mergeIf(locationTable[NUMPAD], 'chrome-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD } // [USB: 0x53]
    });
  
    mergeIf(locationTable[NUMPAD], 'safari-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0xBB: { code: 'NumpadAdd', location: NUMPAD }, // [USB: 0x57]
      0xBD: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0xBE: { code: 'NumpadDecimal', location: NUMPAD }, // [USB: 0x63]
      0xBF: { code: 'NumpadDivide', location: NUMPAD } // [USB: 0x54]
    });
  
  
    //--------------------------------------------------------------------
    //
    // Key Values
    //
    //--------------------------------------------------------------------
  
    // Mapping from `code` values to `key` values. Values defined at:
    // https://w3c.github.io/uievents-key/
    // Entries are only provided when `key` differs from `code`. If
    // printable, `shiftKey` has the shifted printable character. This
    // assumes US Standard 101 layout
  
    var codeToKeyTable = {
      // Modifier Keys
      ShiftLeft: { key: 'Shift' },
      ShiftRight: { key: 'Shift' },
      ControlLeft: { key: 'Control' },
      ControlRight: { key: 'Control' },
      AltLeft: { key: 'Alt' },
      AltRight: { key: 'Alt' },
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' },
  
      // Whitespace Keys
      NumpadEnter: { key: 'Enter' },
      Space: { key: ' ' },
  
      // Printable Keys
      Digit0: { key: '0', shiftKey: ')' },
      Digit1: { key: '1', shiftKey: '!' },
      Digit2: { key: '2', shiftKey: '@' },
      Digit3: { key: '3', shiftKey: '#' },
      Digit4: { key: '4', shiftKey: '$' },
      Digit5: { key: '5', shiftKey: '%' },
      Digit6: { key: '6', shiftKey: '^' },
      Digit7: { key: '7', shiftKey: '&' },
      Digit8: { key: '8', shiftKey: '*' },
      Digit9: { key: '9', shiftKey: '(' },
      KeyA: { key: 'a', shiftKey: 'A' },
      KeyB: { key: 'b', shiftKey: 'B' },
      KeyC: { key: 'c', shiftKey: 'C' },
      KeyD: { key: 'd', shiftKey: 'D' },
      KeyE: { key: 'e', shiftKey: 'E' },
      KeyF: { key: 'f', shiftKey: 'F' },
      KeyG: { key: 'g', shiftKey: 'G' },
      KeyH: { key: 'h', shiftKey: 'H' },
      KeyI: { key: 'i', shiftKey: 'I' },
      KeyJ: { key: 'j', shiftKey: 'J' },
      KeyK: { key: 'k', shiftKey: 'K' },
      KeyL: { key: 'l', shiftKey: 'L' },
      KeyM: { key: 'm', shiftKey: 'M' },
      KeyN: { key: 'n', shiftKey: 'N' },
      KeyO: { key: 'o', shiftKey: 'O' },
      KeyP: { key: 'p', shiftKey: 'P' },
      KeyQ: { key: 'q', shiftKey: 'Q' },
      KeyR: { key: 'r', shiftKey: 'R' },
      KeyS: { key: 's', shiftKey: 'S' },
      KeyT: { key: 't', shiftKey: 'T' },
      KeyU: { key: 'u', shiftKey: 'U' },
      KeyV: { key: 'v', shiftKey: 'V' },
      KeyW: { key: 'w', shiftKey: 'W' },
      KeyX: { key: 'x', shiftKey: 'X' },
      KeyY: { key: 'y', shiftKey: 'Y' },
      KeyZ: { key: 'z', shiftKey: 'Z' },
      Numpad0: { key: '0' },
      Numpad1: { key: '1' },
      Numpad2: { key: '2' },
      Numpad3: { key: '3' },
      Numpad4: { key: '4' },
      Numpad5: { key: '5' },
      Numpad6: { key: '6' },
      Numpad7: { key: '7' },
      Numpad8: { key: '8' },
      Numpad9: { key: '9' },
      NumpadMultiply: { key: '*' },
      NumpadAdd: { key: '+' },
      NumpadComma: { key: ',' },
      NumpadSubtract: { key: '-' },
      NumpadDecimal: { key: '.' },
      NumpadDivide: { key: '/' },
      Semicolon: { key: ';', shiftKey: ':' },
      Equal: { key: '=', shiftKey: '+' },
      Comma: { key: ',', shiftKey: '<' },
      Minus: { key: '-', shiftKey: '_' },
      Period: { key: '.', shiftKey: '>' },
      Slash: { key: '/', shiftKey: '?' },
      Backquote: { key: '`', shiftKey: '~' },
      BracketLeft: { key: '[', shiftKey: '{' },
      Backslash: { key: '\\', shiftKey: '|' },
      BracketRight: { key: ']', shiftKey: '}' },
      Quote: { key: '\'', shiftKey: '"' },
      IntlBackslash: { key: '\\', shiftKey: '|' }
    };
  
    mergeIf(codeToKeyTable, 'mac', {
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' }
    });
  
    // Corrections for 'key' names in older browsers (e.g. FF36-, IE9, etc)
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.key#Key_values
    var keyFixTable = {
      Add: '+',
      Decimal: '.',
      Divide: '/',
      Subtract: '-',
      Multiply: '*',
      Spacebar: ' ',
      Esc: 'Escape',
      Nonconvert: 'NonConvert',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Menu: 'ContextMenu',
      MediaNextTrack: 'MediaTrackNext',
      MediaPreviousTrack: 'MediaTrackPrevious',
      SelectMedia: 'MediaSelect',
      HalfWidth: 'Hankaku',
      FullWidth: 'Zenkaku',
      RomanCharacters: 'Romaji',
      Crsel: 'CrSel',
      Exsel: 'ExSel',
      Zoom: 'ZoomToggle'
    };
  
    //--------------------------------------------------------------------
    //
    // Exported Functions
    //
    //--------------------------------------------------------------------
  
  
    var codeTable = remap(keyCodeToInfoTable, 'code');
  
    try {
      var nativeLocation = nativeKeyboardEvent && ('location' in new KeyboardEvent(''));
    } catch (_) {}
  
    function keyInfoForEvent(event) {
      var keyCode = 'keyCode' in event ? event.keyCode : 'which' in event ? event.which : 0;
      var keyInfo = (function(){
        if (nativeLocation || 'keyLocation' in event) {
          var location = nativeLocation ? event.location : event.keyLocation;
          if (location && keyCode in locationTable[location]) {
            return locationTable[location][keyCode];
          }
        }
        if ('keyIdentifier' in event && event.keyIdentifier in keyIdentifierTable) {
          return keyIdentifierTable[event.keyIdentifier];
        }
        if (keyCode in keyCodeToInfoTable) {
          return keyCodeToInfoTable[keyCode];
        }
        return null;
      }());
  
      // TODO: Track these down and move to general tables
      if (0) {
        // TODO: Map these for newerish browsers?
        // TODO: iOS only?
        // TODO: Override with more common keyIdentifier name?
        switch (event.keyIdentifier) {
        case 'U+0010': keyInfo = { code: 'Function' }; break;
        case 'U+001C': keyInfo = { code: 'ArrowLeft' }; break;
        case 'U+001D': keyInfo = { code: 'ArrowRight' }; break;
        case 'U+001E': keyInfo = { code: 'ArrowUp' }; break;
        case 'U+001F': keyInfo = { code: 'ArrowDown' }; break;
        }
      }
  
      if (!keyInfo)
        return null;
  
      var key = (function() {
        var entry = codeToKeyTable[keyInfo.code];
        if (!entry) return keyInfo.code;
        return (event.shiftKey && 'shiftKey' in entry) ? entry.shiftKey : entry.key;
      }());
  
      return {
        code: keyInfo.code,
        key: key,
        location: keyInfo.location,
        keyCap: keyInfo.keyCap
      };
    }
  
    function queryKeyCap(code, locale) {
      code = String(code);
      if (!codeTable.hasOwnProperty(code)) return 'Undefined';
      if (locale && String(locale).toLowerCase() !== 'en-us') throw Error('Unsupported locale');
      var keyInfo = codeTable[code];
      return keyInfo.keyCap || keyInfo.code || 'Undefined';
    }
  
    if ('KeyboardEvent' in global && 'defineProperty' in Object) {
      (function() {
        function define(o, p, v) {
          if (p in o) return;
          Object.defineProperty(o, p, v);
        }
  
        define(KeyboardEvent.prototype, 'code', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return keyInfo ? keyInfo.code : '';
        }});
  
        // Fix for nonstandard `key` values (FF36-)
        if ('key' in KeyboardEvent.prototype) {
          var desc = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key');
          Object.defineProperty(KeyboardEvent.prototype, 'key', { get: function() {
            var key = desc.get.call(this);
            return keyFixTable.hasOwnProperty(key) ? keyFixTable[key] : key;
          }});
        }
  
        define(KeyboardEvent.prototype, 'key', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
        }});
  
        define(KeyboardEvent.prototype, 'location', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
        }});
  
        define(KeyboardEvent.prototype, 'locale', { get: function() {
          return '';
        }});
      }());
    }
  
    if (!('queryKeyCap' in global.KeyboardEvent))
      global.KeyboardEvent.queryKeyCap = queryKeyCap;
  
    // Helper for IE8-
    global.identifyKey = function(event) {
      if ('code' in event)
        return;
  
      var keyInfo = keyInfoForEvent(event);
      event.code = keyInfo ? keyInfo.code : '';
      event.key = (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
      event.location = ('location' in event) ? event.location :
        ('keyLocation' in event) ? event.keyLocation :
        (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
      event.locale = '';
    };
  
  }(self));
  
/* global Howler Howl */
(function ctHowler() {
    ct.sound = {};
    ct.sound.howler = Howler;
    Howler.orientation(0, -1, 0, 0, 0, 1);
    Howler.pos(0, 0, 0);
    ct.sound.howl = Howl;

    var defaultMaxDistance = [][0] || 2500;
    ct.sound.useDepth = [false][0] === void 0 ?
        false :
        [false][0];
    ct.sound.manageListenerPosition = [false][0] === void 0 ?
        true :
        [false][0];

    /**
     * Detects if a particular codec is supported in the system
     * @param {string} type One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav",
     * "aac", "caf", m4a", "mp4", "weba", "webm", "dolby", "flac".
     * @returns {boolean} true/false
     */
    ct.sound.detect = Howler.codecs;

    /**
     * Creates a new Sound object and puts it in resource object
     *
     * @param {string} name Sound's name
     * @param {object} formats A collection of sound files of specified extension,
     * in format `extension: path`
     * @param {string} [formats.ogg] Local path to the sound in ogg format
     * @param {string} [formats.wav] Local path to the sound in wav format
     * @param {string} [formats.mp3] Local path to the sound in mp3 format
     * @param {object} options An options object
     *
     * @returns {object} Sound's object
     */
    ct.sound.init = function init(name, formats, options) {
        options = options || {};
        var sounds = [];
        if (formats.wav && formats.wav.slice(-4) === '.wav') {
            sounds.push(formats.wav);
        }
        if (formats.mp3 && formats.mp3.slice(-4) === '.mp3') {
            sounds.push(formats.mp3);
        }
        if (formats.ogg && formats.ogg.slice(-4) === '.ogg') {
            sounds.push(formats.ogg);
        }
        var howl = new Howl({
            src: sounds,
            autoplay: false,
            preload: !options.music,
            html5: Boolean(options.music),
            loop: options.loop,
            pool: options.poolSize || 5,

            onload: function () {
                if (!options.music) {
                    ct.res.soundsLoaded++;
                }
            },
            onloaderror: function () {
                ct.res.soundsError++;
                howl.buggy = true;
                console.error('[ct.sound.howler] Oh no! We couldn\'t load ' +
                    (formats.wav || formats.mp3 || formats.ogg) + '!');
            }
        });
        if (options.music) {
            ct.res.soundsLoaded++;
        }
        ct.res.sounds[name] = howl;
    };

    var set3Dparameters = (howl, opts, id) => {
        howl.pannerAttr({
            coneInnerAngle: opts.coneInnerAngle || 360,
            coneOuterAngle: opts.coneOuterAngle || 360,
            coneOuterGain: opts.coneOuterGain || 1,
            distanceModel: opts.distanceModel || 'linear',
            maxDistance: opts.maxDistance || defaultMaxDistance,
            refDistance: opts.refDistance || 1,
            rolloffFactor: opts.rolloffFactor || 1,
            panningModel: opts.panningModel || 'HRTF'
        }, id);
    };
    /**
     * Spawns a new sound and plays it.
     *
     * @param {string} name The name of a sound to be played
     * @param {object} [opts] Options object.
     * @param {Function} [cb] A callback, which is called when the sound finishes playing
     *
     * @returns {number} The ID of the created sound. This can be passed to Howler methods.
     */
    ct.sound.spawn = function spawn(name, opts, cb) {
        opts = opts || {};
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        var howl = ct.res.sounds[name];
        var id = howl.play();
        if (opts.loop) {
            howl.loop(true, id);
        }
        if (opts.volume !== void 0) {
            howl.volume(opts.volume, id);
        }
        if (opts.rate !== void 0) {
            howl.rate(opts.rate, id);
        }
        if (opts.x !== void 0 || opts.position) {
            if (opts.x !== void 0) {
                howl.pos(opts.x, opts.y || 0, opts.z || 0, id);
            } else {
                const copy = opts.position;
                howl.pos(copy.x, copy.y, opts.z || (ct.sound.useDepth ? copy.depth : 0), id);
            }
            set3Dparameters(howl, opts, id);
        }
        if (cb) {
            howl.once('end', cb, id);
        }
        return id;
    };

    /**
     * Stops playback of a sound, resetting its time to 0.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.stop = function stop(name, id) {
        ct.res.sounds[name].stop(id);
    };

    /**
     * Pauses playback of a sound or group, saving the seek of playback.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.pause = function pause(name, id) {
        ct.res.sounds[name].pause(id);
    };

    /**
     * Resumes a given sound, e.g. after pausing it.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.resume = function resume(name, id) {
        ct.res.sounds[name].play(id);
    };
    /**
     * Returns whether a sound is currently playing,
     * either an exact sound (found by its ID) or any sound of a given name.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {boolean} `true` if the sound is playing, `false` otherwise.
     */
    ct.sound.playing = function playing(name, id) {
        return ct.res.sounds[name].playing(id);
    };
    /**
     * Preloads a sound. This is usually applied to music files before playing
     * as they are not preloaded by default.
     *
     * @param {string} name The name of a sound
     * @returns {void}
     */
    ct.sound.load = function load(name) {
        ct.res.sounds[name].load();
    };


    /**
     * Changes/returns the volume of the given sound.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If empty, will return the existing volume.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {number} The current volume of the sound.
     */
    ct.sound.volume = function volume(name, volume, id) {
        return ct.res.sounds[name].volume(volume, id);
    };

    /**
     * Fades a sound to a given volume. Can affect either a specific instance or the whole group.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} newVolume The new volume from `0.0` to `1.0`.
     * @param {number} duration The duration of transition, in milliseconds.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {void}
     */
    ct.sound.fade = function fade(name, newVolume, duration, id) {
        var howl = ct.res.sounds[name],
            oldVolume = id ? howl.volume(id) : howl.volume;
        howl.fade(oldVolume, newVolume, duration, id);
    };

    /**
     * Moves the 3D listener to a new position.
     *
     * @see https://github.com/goldfire/howler.js#posx-y-z
     *
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.moveListener = function moveListener(x, y, z) {
        Howler.pos(x, y, z || 0);
    };

    /**
     * Moves a 3D sound to a new location
     *
     * @param {string} name The name of a sound to move
     * @param {number} id The ID of a particular sound.
     * Pass `null` if you want to affect all the sounds of a given name.
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.position = function position(name, id, x, y, z) {
        var howl = ct.res.sounds[name],
            oldPosition = howl.pos(id);
        howl.pos(x, y, z || oldPosition[2], id);
    };

    /**
     * Get/set the global volume for all sounds, relative to their own volume.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If omitted, will return the current global volume.
     *
     * @returns {number} The current volume.
     */
    ct.sound.globalVolume = Howler.volume.bind(Howler);

    ct.sound.exists = function exists(name) {
        return (name in ct.res.sounds);
    };
})();

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
ct.random = function random(x) {
    return Math.random() * x;
};
ct.u.ext(ct.random, {
    dice(...variants) {
        return variants[Math.floor(Math.random() * variants.length)];
    },
    range(x1, x2) {
        return x1 + Math.random() * (x2 - x1);
    },
    deg() {
        return Math.random() * 360;
    },
    coord() {
        return [Math.floor(Math.random() * ct.width), Math.floor(Math.random() * ct.height)];
    },
    chance(x, y) {
        if (y) {
            return (Math.random() * y < x);
        }
        return (Math.random() * 100 < x);
    },
    from(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    // Mulberry32, by bryc from https://stackoverflow.com/a/47593316
    createSeededRandomizer(a) {
        return function seededRandomizer() {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
});
{
    const handle = {};
    handle.currentRootRandomizer = ct.random.createSeededRandomizer(456852);
    ct.random.seeded = function seeded() {
        return handle.currentRootRandomizer();
    };
    ct.random.setSeed = function setSeed(seed) {
        handle.currentRootRandomizer = ct.random.createSeededRandomizer(seed);
    };
    ct.random.setSeed(9323846264);
}

function $_GET(param) {
    var vars = {};
    window.location.href.replace( location.hash, '' ).replace( 
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function( m, key, value ) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );

    if ( param ) {
        return vars[param] ? vars[param] : null;    
    }
    return vars;
};

var $_GET = $_GET(),
difficulte = 1;
difficulte = $_GET['difficulte']++;

setInterval(mycode, 1000);

function mycode() {
    if (ct.room.alienCount < 3) {
        ct.room.alienCount++;
        ct.types.copy('alienRouge', 922, ct.random.range(128, 448));
        ct.types.copy('alienJaune', 922, ct.random.range(128, 448));
        ct.types.copy('alienBlanc', 922, ct.random.range(128, 448));
        ct.types.copy('alienNoir', 922, ct.random.range(128, 448));
        ct.types.copy('alienBleu', 922, ct.random.range(128, 448));
        // Ici c'est win donc on continue
    } else {
        setTimeout(function () {
            if (ct.room.alienCount === 3 && ct.room.alienInHand !== 2) {
                document.location.href='../../server.php?gameover';
            };
        }, 1500);        
    };
};;

/**
 * @typedef IRoomMergeResult
 *
 * @property {Array<Copy>} copies
 * @property {Array<Tileset>} tileLayers
 * @property {Array<Background>} backgrounds
 */

class Room extends PIXI.Container {
    constructor(template) {
        super();
        this.x = this.y = 0;
        this.uid = 0;
        this.tileLayers = [];
        this.backgrounds = [];
        if (!ct.room) {
            ct.room = ct.rooms.current = this;
        }
        if (template) {
            if (template.extends) {
                ct.u.ext(this, template.extends);
            }
            this.onCreate = template.onCreate;
            this.onStep = template.onStep;
            this.onDraw = template.onDraw;
            this.onLeave = template.onLeave;
            this.template = template;
            this.name = template.name;
            if (this === ct.room) {
                ct.pixiApp.renderer.backgroundColor = Number('0x' + this.template.backgroundColor.slice(1));
            }
            ct.fittoscreen();

            for (let i = 0, li = template.bgs.length; i < li; i++) {
                const bg = new ct.types.Background(
                    template.bgs[i].texture,
                    null,
                    template.bgs[i].depth,
                    template.bgs[i].extends
                );
                this.backgrounds.push(bg);
                ct.stack.push(bg);
                this.addChild(bg);
            }
            for (let i = 0, li = template.tiles.length; i < li; i++) {
                const tl = ct.rooms.addTileLayer(template.tiles[i]);
                this.tileLayers.push(tl);
                this.addChild(tl);
            }
            for (let i = 0, li = template.objects.length; i < li; i++) {
                const exts = template.objects[i].exts || {};
                ct.types.make(
                    template.objects[i].type,
                    template.objects[i].x,
                    template.objects[i].y,
                    {
                        tx: template.objects[i].tx,
                        ty: template.objects[i].ty,
                        tr: template.objects[i].tr,
                        ...exts
                    },
                    this
                );
            }
        }
        return this;
    }
    get x() {
        return -this.position.x;
    }
    set x(value) {
        this.position.x = -value;
        return value;
    }
    get y() {
        return -this.position.y;
    }
    set y(value) {
        this.position.y = -value;
        return value;
    }
}
(function roomsAddon() {
    /* global deadPool */
    var nextRoom;
    /**
     * @namespace
     */
    ct.rooms = {
        templates: {},
        /**
         * An object that contains arrays of currently present rooms.
         * These include the current room (`ct.room`), as well as any rooms
         * appended or prepended through `ct.rooms.append` and `ct.rooms.prepend`.
         * @type {Object.<string,Array<Room>>}
         */
        list: {},
        /**
         * Creates and adds a background to the current room, at the given depth.
         * @param {string} texture The name of the texture to use
         * @param {number} depth The depth of the new background
         * @returns {Background} The created background
         */
        addBg(texture, depth) {
            const bg = new ct.types.Background(texture, null, depth);
            ct.room.addChild(bg);
            return bg;
        },
        /**
         * Adds a new empty tile layer to the room, at the given depth
         * @param {number} layer The depth of the layer
         * @returns {Tileset} The created tile layer
         */
        addTileLayer(layer) {
            return new ct.types.Tileset(layer);
        },
        /**
         * Clears the current stage, removing all rooms with copies, tile layers, backgrounds,
         * and other potential entities.
         * @returns {void}
         */
        clear() {
            ct.stage.children = [];
            ct.stack = [];
            for (var i in ct.types.list) {
                ct.types.list[i] = [];
            }
            ct.rooms.list = {};
            for (const name in ct.rooms.templates) {
                ct.rooms.list[name] = [];
            }
        },
        /**
         * This method safely removes a previously appended/prepended room from the stage.
         * It will trigger "On Leave" for a room and "On Destroy" event
         * for all the copies of the removed room.
         * The room will also have `this.kill` set to `true` in its event, if it comes in handy.
         * This method cannot remove `ct.room`, the main room.
         * @param {Room} room The `room` argument must be a reference
         * to the previously created room.
         * @returns {void}
         */
        remove(room) {
            if (!(room instanceof Room)) {
                if (typeof room === 'string') {
                    throw new Error('[ct.rooms] To remove a room, you should provide a reference to it (to an object), not its name. Provided value:', room);
                }
                throw new Error('[ct.rooms] An attempt to remove a room that is not actually a room! Provided value:', room);
            }
            const ind = ct.rooms.list[room.name];
            if (ind !== -1) {
                ct.rooms.list[room.name].splice(ind, 1);
            } else {
                // eslint-disable-next-line no-console
                console.warn('[ct.rooms] Removing a room that was not found in ct.rooms.list. This is strange…');
            }
            room.kill = true;
            ct.stage.removeChild(room);
            for (const copy of room.children) {
                copy.kill = true;
            }
            room.onLeave();
            ct.rooms.onLeave.apply(room);
        },
        /*
         * Switches to the given room. Note that this transition happens at the end
         * of the frame, so the name of a new room may be overridden.
         */
        'switch'(roomName) {
            if (ct.rooms.templates[roomName]) {
                nextRoom = roomName;
                ct.rooms.switching = true;
            } else {
                console.error('[ct.rooms] The room "' + roomName + '" does not exist!');
            }
        },
        switching: false,
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` after all the other rooms.
         * @param {string} roomName The name of the room to be appended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        append(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] append failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChild(room);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` before all the other rooms.
         * @param {string} roomName The name of the room to be prepended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        prepend(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] prepend failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChildAt(room, 0);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Merges a given room into the current one. Skips room's OnCreate event.
         *
         * @param {string} roomName The name of the room that needs to be merged
         * @returns {IRoomMergeResult} Arrays of created copies, backgrounds, tile layers,
         * added to the current room (`ct.room`). Note: it does not get updated,
         * so beware of memory leaks if you keep a reference to this array for a long time!
         */
        merge(roomName) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] merge failed: the room ${roomName} does not exist!`);
                return false;
            }
            const generated = {
                copies: [],
                tileLayers: [],
                backgrounds: []
            };
            const template = ct.rooms.templates[roomName];
            const target = ct.room;
            for (const t of template.bgs) {
                const bg = new ct.types.Background(t.texture, null, t.depth, t.extends);
                target.backgrounds.push(bg);
                ct.stack.push(bg);
                target.addChild(bg);
                generated.backgrounds.push(bg);
            }
            for (const t of template.tiles) {
                const tl = ct.rooms.addTileLayer(t);
                target.tileLayers.push(tl);
                target.addChild(tl);
                generated.tileLayers.push(tl);
            }
            for (const t of template.objects) {
                const c = ct.types.make(t.type, t.x, t.y, {
                    tx: t.tx || 1,
                    ty: t.ty || 1,
                    tr: t.tr || 0
                }, target);
                generated.copies.push(c);
            }
            return generated;
        },
        forceSwitch(roomName) {
            if (nextRoom) {
                roomName = nextRoom;
            }
            if (ct.room) {
                ct.room.onLeave();
                ct.rooms.onLeave.apply(ct.room);
                ct.room = void 0;
            }
            ct.rooms.clear();
            deadPool.length = 0;
            var template = ct.rooms.templates[roomName];
            ct.roomWidth = template.width;
            ct.roomHeight = template.height;
            ct.camera = new Camera(
                ct.roomWidth / 2,
                ct.roomHeight / 2,
                ct.roomWidth,
                ct.roomHeight
            );
            ct.pixiApp.renderer.resize(template.width, template.height);
            ct.rooms.current = ct.room = new Room(template);
            ct.stage.addChild(ct.room);
            ct.room.onCreate();
            ct.rooms.onCreate.apply(ct.room);
            ct.rooms.list[roomName].push(ct.room);
            
            ct.camera.manageStage();
            ct.rooms.switching = false;
            nextRoom = void 0;
        },
        onCreate() {
            /* global SSCD */
ct.place.tileGrid = {};
if (ct.types.list.TILELAYER) {
    for (const layer of ct.types.list.TILELAYER) {
        for (let i = 0, l = layer.tiles.length; i < l; i++) {
            const t = layer.tiles[i];
            // eslint-disable-next-line no-underscore-dangle
            t._shape = new SSCD.Rectangle(
                new SSCD.Vector(t.x, t.y),
                new SSCD.Vector(t.width, t.height)
            );
            t.ctype = layer.ctype;
            t.$chashes = ct.place.getHashes(t);
            /* eslint max-depth: 0 */
            for (const hash of t.$chashes) {
                if (!(hash in ct.place.tileGrid)) {
                    ct.place.tileGrid[hash] = [t];
                } else {
                    ct.place.tileGrid[hash].push(t);
                }
            }
            t.depth = layer.depth;
        }
        if ([false][0]) {
            for (let i = 0; i < layer.tiles.length; i++) {
                const pixiTile = layer.pixiTiles[i],
                      logicTile = layer.tiles[i];
                pixiTile.$cDebugCollision = new PIXI.Graphics();
                ct.place.drawDebugTileGraphic.apply(pixiTile, [logicTile]);
                pixiTile.addChild(pixiTile.$cDebugCollision);
            }
        }
    }
}

        },
        onLeave() {
            if (this === ct.room) {
    ct.place.grid = {};
}

        },
        /**
         * The name of the starting room, as it was set in ct.IDE.
         * @type {string}
         */
        starting: '1'
    };
})();
/**
 * The current room
 * @type {Room}
 */
ct.room = null;

ct.rooms.beforeStep = function beforeStep() {
    
};
ct.rooms.afterStep = function afterStep() {
    
};
ct.rooms.beforeDraw = function beforeDraw() {
    
};
ct.rooms.afterDraw = function afterDraw() {
    ct.mouse.xprev = ct.mouse.x;
ct.mouse.yprev = ct.mouse.y;
ct.mouse.xuiprev = ct.mouse.xui;
ct.mouse.yuiprev = ct.mouse.yui;
ct.mouse.pressed = ct.mouse.released = false;
ct.inputs.registry['mouse.Wheel'] = 0;
/* global ct */

ct.keyboard.clear();
if (ct.sound.follow && !ct.sound.follow.kill) {
    ct.sound.howler.pos(ct.sound.follow.x, ct.sound.follow.y, ct.sound.useDepth ? ct.sound.follow.z : 0);
} else if (ct.sound.manageListenerPosition) {
    ct.sound.howler.pos(ct.camera.x, ct.camera.y, ct.camera.z || 0);
}

};


ct.rooms.templates['1'] = {
    name: '1',
    width: 1024,
    height: 575,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[]'),
    bgs: JSON.parse('[{"depth":-3,"texture":"background_final_ecran","extends":{"repeat":"no-repeat","shiftX":16,"scaleX":0.97,"scaleY":1.29,"shiftY":-40}},{"depth":-1,"texture":"background_city","extends":{"repeat":"no-repeat"}},{"depth":2,"texture":"notice_alien","extends":{"repeat":"no-repeat","shiftY":-24,"shiftX":5}},{"depth":3,"texture":"s_barrel_0","extends":{"repeat":"no-repeat","shiftY":448,"shiftX":872}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    onStep() {
        console.log(ct.room.alienInHand)
    },
    onDraw() {
        if (ct.room.alienInHand === 0 || ct.room.alienInHand > 1){
    let fishingRodLeft = ct.types.copy('fishingRodLeft', ct.mouse.x, ct.mouse.y);
    fishingRodLeft.kill = true;

};
if (ct.room.alienInHand === 1) {
        fishingRodLeft = ct.types.copy('fishingRodAlien', ct.mouse.x, ct.mouse.y);
        fishingRodLeft.kill = true;
    if (ct.mouse.x > 864 && ct.mouse.y > 416) {
        ct.room.alienInHand++;
        let fishingRodLeft = ct.types.copy('fishingRodLeft', ct.mouse.x, ct.mouse.y);
        fishingRodLeft.kill = true;
        let allien = ct.room.allien;
        allien.visible = true;

        document.location.href='../../server.php?gamenext';
    };
};

ct.time;
    },
    onLeave() {
        
    },
    onCreate() {
        this.score = 0
this.alienCount = 0;
this.alienInHand = 0;

this.scoreLabel = new PIXI.Text('Score: ' + this.score);
this.addChild(this.scoreLabel);
this.scoreLabel.x = 32;
this.scoreLabel.y = 96;
this.scoreLabel.depth = -4;

this.allien = ct.types.copy('alienBleu_dup', 928, 448);
this.allien.depth = 2;
this.allien.visible = false;
    },
    extends: {}
}


/**
 * @namespace
 */
ct.styles = {
    types: { },
    /**
     * Creates a new style with a given name.
     * Technically, it just writes `data` to `ct.styles.types`
     */
    new(name, styleTemplate) {
        ct.styles.types[name] = styleTemplate;
        return styleTemplate;
    },
    /**
     * Returns a style of a given name. The actual behavior strongly depends on `copy` parameter.
     * @param {string} name The name of the style to load
     * @param {boolean|Object} [copy] If not set, returns the source style object.
     * Editing it will affect all new style calls.
     * When set to `true`, will create a new object, which you can safely modify
     * without affecting the source style.
     * When set to an object, this will create a new object as well,
     * augmenting it with given properties.
     * @returns {object} The resulting style
     */
    get(name, copy) {
        if (copy === true) {
            return ct.u.ext({}, ct.styles.types[name]);
        }
        if (copy) {
            return ct.u.ext(ct.u.ext({}, ct.styles.types[name]), copy);
        }
        return ct.styles.types[name];
    }
};



(function resAddon(ct) {
    const loader = new PIXI.Loader();
    const loadingScreen = document.querySelector('.ct-aLoadingScreen'),
          loadingBar = loadingScreen.querySelector('.ct-aLoadingBar');
    const dbFactory = window.dragonBones ? dragonBones.PixiFactory.factory : null;
    /**
     * An utility object that managess and stores textures and other entities
     * @namespace
     */
    ct.res = {
        soundsLoaded: 0,
        soundsTotal: [0][0],
        soundsError: 0,
        sounds: {},
        registry: [{"background_final_ecran":{"atlas":"./img/t0.png","frames":0,"shape":{"type":"rect","top":192,"bottom":128,"left":480,"right":480},"anchor":{"x":0.5,"y":0.5}},"ALIEN_POUR_LE_JEU_2":{"frames":1,"shape":{"type":"circle","r":50},"anchor":{"x":0.5,"y":0.4946236559139785}},"ALIEN_POUR_LE_JEU_3":{"frames":1,"shape":{"type":"circle","r":50},"anchor":{"x":0.5,"y":0.4946236559139785}},"ALIEN_POUR_LE_JEU_4":{"frames":1,"shape":{"type":"circle","r":50},"anchor":{"x":0.5,"y":0.4946236559139785}},"ALIEN_POUR_LE_JEU_5":{"frames":1,"shape":{"type":"circle","r":50},"anchor":{"x":0.5,"y":0.4946236559139785}},"ALIEN_POUR_LE_JEU":{"frames":1,"shape":{"type":"circle","r":50},"anchor":{"x":0.5,"y":0.4946236559139785}},"Canne_pour_droitier":{"frames":1,"shape":{"type":"circle","r":10},"anchor":{"x":0.15,"y":0.8882113821138211}},"Canne_de_base":{"frames":1,"shape":{"type":"circle","r":10},"anchor":{"x":0.8527777777777779,"y":0.897018970189702}},"Canne_avec_alien":{"frames":1,"shape":{"type":"circle","r":88},"anchor":{"x":0.3606403013182674,"y":0.5668549905838041}},"s_barrel_0":{"atlas":"./img/t1.png","frames":0,"shape":{"type":"rect","top":64,"bottom":64,"left":58,"right":58},"anchor":{"x":0.5,"y":0.5}},"citybg2":{"atlas":"./img/t2.png","frames":0,"shape":{"type":"rect","top":0,"bottom":352,"left":0,"right":653},"anchor":{"x":0,"y":0}},"notice_alien":{"atlas":"./img/t3.png","frames":0,"shape":{"type":"rect","top":0,"bottom":163,"left":0,"right":163},"anchor":{"x":0,"y":0}},"bords_ecran":{"atlas":"./img/t4.png","frames":0,"shape":{"type":"rect","top":0,"bottom":448,"left":0,"right":960},"anchor":{"x":0,"y":0}},"background_city":{"atlas":"./img/t5.png","frames":0,"shape":{"type":"rect","top":0,"bottom":576,"left":0,"right":1024},"anchor":{"x":0,"y":0}}}][0],
        atlases: [["./img/a0.json"]][0],
        skelRegistry: [{}][0],
        fetchImage(url, callback) {
            loader.add(url, url);
            loader.load((loader, resources) => {
                callback(resources);
            });
            loader.onError((loader, resources) => {
                loader.add(url, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2NkAAIAAAoAAggA9GkAAAAASUVORK5CYII=');
                console.error('[ct.res] An image from ' + resources + ' wasn\'t loaded :( Maybe refreshing the page will solve this problem…');
                ct.res.texturesError++;
            });
        },
        parseImages() {
            // filled by IDE and catmods. As usual, atlases are splitted here.
            PIXI.Loader.shared
.add('./img/a0.json')
.add('./img/t0.png')
.add('./img/t1.png')
.add('./img/t2.png')
.add('./img/t3.png')
.add('./img/t4.png')
.add('./img/t5.png');

PIXI.Loader.shared
            
            PIXI.Loader.shared.load();
        },
        /*
         * Gets a pixi.js texture from a ct.js' texture name,
         so that it can be used in pixi.js objects.
         * @param {string} name The name of the ct.js texture
         * @param {number} [frame] The frame to extract
         * @returns {PIXI.Texture|Array<PIXI.Texture>} If `frame` was specified,
         * returns a single PIXI.Texture. Otherwise, returns an array
         * with all the frames of this ct.js' texture.
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTexture(name, frame) {
            if (name === -1) {
                if (frame !== void 0) {
                    return PIXI.Texture.EMPTY;
                }
                return [PIXI.Texture.EMPTY];
            }
            const reg = ct.res.registry[name];
            if (frame !== void 0) {
                return reg.textures[frame];
            }
            return reg.textures;
        },
        /**
         * Creates a DragonBones skeleton, ready to be added to your copies.
         * @param {string} name The name of the skeleton asset
         * @param {string} [skin] Optional; allows you to specify the used skin
         * @returns {object} The created skeleton
         */
        makeSkeleton(name, skin) {
            const r = ct.res.skelRegistry[name],
                  skel = dbFactory.buildArmatureDisplay('Armature', r.data.name, skin);
            skel.ctName = name;
            skel.on(dragonBones.EventObject.SOUND_EVENT, function skeletonSound(event) {
                if (ct.sound.exists(event.name)) {
                    ct.sound.spawn(event.name);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn(`Skeleton ${skel.ctName} tries to play a non-existing sound ${event.name} at animation ${skel.animation.lastAnimationName}`);
                }
            });
            return skel;
        }
    };

    PIXI.Loader.shared.onLoad.add(e => {
        loadingScreen.setAttribute('data-progress', e.progress);
        loadingBar.style.width = e.progress + '%';
    });
    PIXI.Loader.shared.onComplete.add(() => {
        for (const texture in ct.res.registry) {
            const reg = ct.res.registry[texture];
            reg.textures = [];
            if (reg.frames) {
                for (let i = 0; i < reg.frames; i++) {
                    const frame = `${texture}@frame${i}`;
                    const atlas = PIXI.Loader.shared.resources[ct.res.atlases.find(atlas =>
                        frame in PIXI.Loader.shared.resources[atlas].textures)];
                    const tex = atlas.textures[frame];
                    tex.defaultAnchor = new PIXI.Point(reg.anchor.x, reg.anchor.y);
                    reg.textures.push(tex);
                }
            } else {
                const texture = PIXI.Loader.shared.resources[reg.atlas].texture;
                texture.defaultAnchor = new PIXI.Point(reg.anchor.x, reg.anchor.y);
                reg.textures.push(texture);
            }
        }
        for (const skel in ct.res.skelRegistry) {
            // eslint-disable-next-line id-blacklist
            ct.res.skelRegistry[skel].data = PIXI.Loader.shared.resources[ct.res.skelRegistry[skel].origname + '_ske.json'].data;
        }
        

        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            Object.defineProperty(ct.types.Copy.prototype, 'ctype', {
    set: function (value) {
        this.$ctype = value;
    },
    get: function () {
        return this.$ctype;
    }
});
Object.defineProperty(ct.types.Copy.prototype, 'moveContinuous', {
    value: function (ctype, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / -180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / -180);
        }
        return ct.place.moveAlong(this, this.direction, this.speed * ct.delta, ctype, precision);
    }
});

Object.defineProperty(ct.types.Copy.prototype, 'moveContinuousByAxes', {
    value: function (ctype, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / -180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / -180);
        }
        return ct.place.moveByAxes(
            this,
            this.hspeed * ct.delta,
            this.vspeed * ct.delta,
            ctype,
            precision
        );
    }
});
ct.mouse.setupListeners();

            PIXI.Ticker.shared.add(ct.loop);
            ct.rooms.forceSwitch(ct.rooms.starting);
        }, 0);
    });
    ct.res.parseImages();
})(ct);

/**
 * @extends {PIXI.TilingSprite}
 */
class Background extends PIXI.TilingSprite {
    constructor(bgName, frame, depth, exts) {
        exts = exts || {};
        var width = ct.camera.width,
            height = ct.camera.height;
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-x') {
            height = ct.res.getTexture(bgName, frame || 0).orig.height * (exts.scaleY || 1);
        }
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-y') {
            width = ct.res.getTexture(bgName, frame || 0).orig.width * (exts.scaleX || 1);
        }
        super(ct.res.getTexture(bgName, frame || 0), width, height);
        ct.types.list.BACKGROUND.push(this);
        this.anchor.x = this.anchor.y = 0;
        this.depth = depth;
        this.shiftX = this.shiftY = this.movementX = this.movementY = 0;
        this.parallaxX = this.parallaxY = 1;
        if (exts) {
            ct.u.extend(this, exts);
        }
        if (this.scaleX) {
            this.tileScale.x = Number(this.scaleX);
        }
        if (this.scaleY) {
            this.tileScale.y = Number(this.scaleY);
        }
        this.reposition();
    }
    onStep() {
        this.shiftX += ct.delta * this.movementX;
        this.shiftY += ct.delta * this.movementY;
    }
    reposition() {
        const cameraBounds = ct.camera.getBoundingBox();
        if (this.repeat !== 'repeat-x' && this.repeat !== 'no-repeat') {
            this.y = cameraBounds.y;
            this.tilePosition.y = -this.y * this.parallaxY + this.shiftY;
            this.height = cameraBounds.height;
        } else {
            this.y = this.shiftY + cameraBounds.y * (this.parallaxY - 1);
        }
        if (this.repeat !== 'repeat-y' && this.repeat !== 'no-repeat') {
            this.x = cameraBounds.x;
            this.tilePosition.x = -this.x * this.parallaxX + this.shiftX;
            this.width = cameraBounds.width;
        } else {
            this.x = this.shiftX + cameraBounds.x * (this.parallaxX - 1);
        }
    }
    onDraw() {
        this.reposition();
    }
    static onCreate() {
        void 0;
    }
    static onDestroy() {
        void 0;
    }
}
/**
 * @extends {PIXI.Container}
 */
class Tileset extends PIXI.Container {
    constructor(template) {
        super();
        this.depth = template.depth;
        this.tiles = template.tiles.map(tile => ({
            ...tile
        }));
        this.pixiTiles = [];
        if (template.extends) {
            Object.assign(this, template.extends);
        }
        ct.types.list.TILELAYER.push(this);
        for (let i = 0, l = template.tiles.length; i < l; i++) {
            const textures = ct.res.getTexture(template.tiles[i].texture);
            const sprite = new PIXI.Sprite(textures[template.tiles[i].frame]);
            sprite.anchor.x = sprite.anchor.y = 0;
            this.addChild(sprite);
            this.pixiTiles.push(sprite);
            sprite.x = template.tiles[i].x;
            sprite.y = template.tiles[i].y;
        }
        // Divide tiles into a grid of larger cells so that we can cache these cells as
        const bounds = this.getLocalBounds();
        const cols = Math.ceil(bounds.width / 1024),
              rows = Math.ceil(bounds.height / 1024);
        this.cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = new PIXI.Container();
                this.cells.push(cell);
            }
        }
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0],
                  x = Math.floor((tile.x - bounds.x) / 1024),
                  y = Math.floor((tile.y - bounds.y) / 1024);
            this.cells[y * cols + x].addChild(tile);
        }
        this.removeChildren();

        // Filter out empty cells, cache filled ones
        for (let i = 0, l = this.cells.length; i < l; i++) {
            if (this.cells[i].children.length === 0) {
                this.cells.splice(i, 1);
                i--;
                l--;
                continue;
            }
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }
    }
}
/**
 * @extends {PIXI.AnimatedSprite}
 * @class
 * @property {string} type The name of the type from which the copy was created
 * @property {IShapeTemplate} shape The collision shape of a copy
 * @property {number} depth The relative position of a copy in a drawing stack.
 * Higher values will draw the copy on top of those with lower ones
 * @property {number} xprev The horizontal location of a copy in the previous frame
 * @property {number} yprev The vertical location of a copy in the previous frame
 * @property {number} xstart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.types.copy`.
 * @property {number} ystart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.types.copy`.
 * @property {number} hspeed The horizontal speed of a copy
 * @property {number} vspeed The vertical speed of a copy
 * @property {number} gravity The acceleration that pulls a copy at each frame
 * @property {number} gravityDir The direction of acceleration that pulls a copy at each frame
 * @property {number} depth The position of a copy in draw calls
 * @property {boolean} kill If set to `true`, the copy will be destroyed by the end of a frame.
 */
const Copy = (function Copy() {
    const textureAccessor = Symbol('texture');
    class Copy extends PIXI.AnimatedSprite {
        /**
         * Creates an instance of Copy.
         * @param {string} type The name of the type to copy
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object with additional properties
         * that will exist prior to a copy's OnCreate event
         * @param {PIXI.DisplayObject|Room} [container] A container to set as copy's parent
         * before its OnCreate event. Defaults to ct.room.
         * @memberof Copy
         */
        constructor(type, x, y, exts, container) {
            container = container || ct.room;
            var t;
            if (type) {
                if (!(type in ct.types.templates)) {
                    throw new Error(`[ct.types] An attempt to create a copy of a non-existent type \`${type}\` detected. A typo?`);
                }
                t = ct.types.templates[type];
                if (t.texture && t.texture !== '-1') {
                    const textures = ct.res.getTexture(t.texture);
                    super(textures);
                    this[textureAccessor] = t.texture;
                    this.anchor.x = textures[0].defaultAnchor.x;
                    this.anchor.y = textures[0].defaultAnchor.y;
                } else {
                    super([PIXI.Texture.EMPTY]);
                }
                this.type = type;
                this.parent = container;
                if (t.extends) {
                    ct.u.ext(this, t.extends);
                }
            } else {
                super([PIXI.Texture.EMPTY]);
            }
            // it is defined in main.js
            // eslint-disable-next-line no-undef
            this[copyTypeSymbol] = true;
            if (exts) {
                ct.u.ext(this, exts);
                if (exts.tx) {
                    this.scale.x = exts.tx;
                    this.scale.y = exts.ty;
                }
                if (exts.tr) {
                    this.rotation = exts.tr;
                }
            }
            this.position.set(x || 0, y || 0);
            this.xprev = this.xstart = this.x;
            this.yprev = this.ystart = this.y;
            this.speed = this.direction = this.gravity = this.hspeed = this.vspeed = 0;
            this.gravityDir = 270;
            this.depth = 0;
            this.uid = ++ct.room.uid;
            if (type) {
                ct.u.ext(this, {
                    type,
                    depth: t.depth,
                    onStep: t.onStep,
                    onDraw: t.onDraw,
                    onCreate: t.onCreate,
                    onDestroy: t.onDestroy,
                    shape: t.texture ? ct.res.registry[t.texture].shape : {}
                });
                if (exts && exts.depth !== void 0) {
                    this.depth = exts.depth;
                }
                if (ct.types.list[type]) {
                    ct.types.list[type].push(this);
                } else {
                    ct.types.list[type] = [this];
                }
                this.onBeforeCreateModifier();
                ct.types.templates[type].onCreate.apply(this);
            }
            return this;
        }

        /**
         * The name of the current copy's texture, or -1 for an empty texture.
         * @param {string} value The name of the new texture
         * @type {(string|number)}
         */
        set tex(value) {
            this.textures = ct.res.getTexture(value);
            this[textureAccessor] = value;
            this.shape = value !== -1 ? ct.res.registry[value].shape : {};
            this.anchor.x = this.textures[0].defaultAnchor.x;
            this.anchor.y = this.textures[0].defaultAnchor.y;
            return value;
        }
        get tex() {
            return this[textureAccessor];
        }

        get speed() {
            return Math.hypot(this.hspeed, this.vspeed);
        }
        /**
         * The speed of a copy that is used in `this.move()` calls
         * @param {number} value The new speed value
         * @type {number}
         */
        set speed(value) {
            if (this.speed === 0) {
                this.hspeed = value;
                return;
            }
            var multiplier = value / this.speed;
            this.hspeed *= multiplier;
            this.vspeed *= multiplier;
        }
        get direction() {
            return (Math.atan2(this.vspeed, this.hspeed) * -180 / Math.PI + 360) % 360;
        }
        /**
         * The moving direction of the copy, in degrees, starting with 0 at the right side
         * and going with 90 facing upwards, 180 facing left, 270 facing down.
         * This parameter is used by `this.move()` call.
         * @param {number} value New direction
         * @type {number}
         */
        set direction(value) {
            var speed = this.speed;
            this.hspeed = speed * Math.cos(value * Math.PI / -180);
            this.vspeed = speed * Math.sin(value * Math.PI / -180);
            return value;
        }
        get rotation() {
            return this.transform.rotation / Math.PI * -180;
        }
        /**
         * The direction of a copy's texture.
         * @param {number} value New rotation value
         * @type {number}
         */
        set rotation(value) {
            this.transform.rotation = value * Math.PI / -180;
            return value;
        }

        /**
         * Performs a movement step, reading such parameters as `gravity`, `speed`, `direction`.
         * @returns {void}
         */
        move() {
            if (this.gravity) {
                this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / -180);
                this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / -180);
            }
            this.x += this.hspeed * ct.delta;
            this.y += this.vspeed * ct.delta;
        }
        /**
         * Adds a speed vector to the copy, accelerating it by a given delta speed
         * in a given direction.
         * @param {number} spd Additive speed
         * @param {number} dir The direction in which to apply additional speed
         * @returns {void}
         */
        addSpeed(spd, dir) {
            this.hspeed += spd * Math.cos(dir * Math.PI / -180);
            this.vspeed += spd * Math.sin(dir * Math.PI / -180);
        }

        /**
         * Returns the room that owns the current copy
         * @returns {Room} The room that owns the current copy
         */
        getRoom() {
            let parent = this.parent;
            while (!(parent instanceof Room)) {
                parent = parent.parent;
            }
            return parent;
        }

        // eslint-disable-next-line class-methods-use-this
        onBeforeCreateModifier() {
            // Filled by ct.IDE and catmods
            
        }
    }
    return Copy;
})();

(function ctTypeAddon(ct) {
    const onCreateModifier = function () {
        this.$chashes = ct.place.getHashes(this);
for (const hash of this.$chashes) {
    if (!(hash in ct.place.grid)) {
        ct.place.grid[hash] = [this];
    } else {
        ct.place.grid[hash].push(this);
    }
}
if ([false][0] && this instanceof ct.types.Copy) {
    this.$cDebugText = new PIXI.Text('Not initialized', {
        fill: 0xffffff,
        dropShadow: true,
        dropShadowDistance: 2,
        fontSize: [][0] || 16
    });
    this.$cDebugCollision = new PIXI.Graphics();
    this.addChild(this.$cDebugCollision, this.$cDebugText);
}

    };

    /**
     * An object with properties and methods for manipulating types and copies,
     * mainly for finding particular copies and creating new ones.
     * @namespace
     */
    ct.types = {
        Copy,
        Background,
        Tileset,
        /**
         * An object that contains arrays of copies of all types.
         * @type {Object.<string,Array<Copy>>}
         */
        list: {
            BACKGROUND: [],
            TILELAYER: []
        },
        /**
         * A map of all the templates of types exported from ct.IDE.
         * @type {object}
         */
        templates: { },
        /**
         * Creates a new copy of a given type.
         * @param {string} type The name of the type to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @param {PIXI.Container} [container] The container to which add the copy.
         * Defaults to the current room.
         * @returns {Copy} the created copy.
         * @alias ct.types.copy
         */
        make(type, x = 0, y = 0, exts, container) {
            // An advanced constructor. Returns a Copy
            if (exts instanceof PIXI.Container) {
                container = exts;
                exts = void 0;
            }
            const obj = new Copy(type, x, y, exts);
            if (container) {
                container.addChild(obj);
            } else {
                ct.room.addChild(obj);
            }
            ct.stack.push(obj);
            onCreateModifier.apply(obj);
            return obj;
        },
        /**
         * Calls `move` on a given copy, recalculating its position based on its speed.
         * @param {Copy} o The copy to move
         * @returns {void}
         * @deprecated
         */
        move(o) {
            o.move();
        },
        /**
         * Applies an acceleration to the copy, with a given additive speed and direction.
         * Technically, calls copy's `addSpeed(spd, dir)` method.
         * @param {any} o The copy to accelerate
         * @param {any} spd The speed to add
         * @param {any} dir The direction in which to push the copy
         * @returns {void}
         * @deprecated
         */
        addSpeed(o, spd, dir) {
            o.addSpeed(spd, dir);
        },
        /**
         * Applies a function to each copy in the current room
         * @param {Function} func The function to apply
         * @returns {void}
         */
        each(func) {
            for (const i in ct.stack) {
                func.apply(ct.stack[i], this);
            }
        },
        /*
         * Applies a function to a given object (e.g. to a copy)
         */
        'with'(obj, func) {
            func.apply(obj, this);
        },
        /**
         * Checks whether a given object exists in game's world.
         * Intended to be applied to copies, but may be used with other PIXI entities.
         * @param {Copy|Pixi.DisplayObject|any} obj The copy which existence needs to be checked.
         * @returns {boolean} Returns `true` if a copy exists; `false` otherwise.
         */
        exists(obj) {
            if (obj instanceof Copy) {
                return !obj.kill;
            }
            if (obj instanceof PIXI.DisplayObject) {
                return Boolean(obj.position);
            }
            return Boolean(obj);
        }
    };
    ct.types.copy = ct.types.make;
    ct.types.addSpd = ct.types.addSpeed;

    
ct.types.templates["alienBleu"] = {
    depth: -2,
    texture: "ALIEN_POUR_LE_JEU",
    onStep: function () {
        this.speed = 1+difficulte/3;
this.direction = ct.random.range(135, 225);
this.move();

if (this.x < 32 || this.y > 416) {
    this.kill = true;
};
this.move();
    },
    onDraw: function () {
        if (ct.mouse.pressed && ct.mouse.hovers(this)) {
        this.kill = true;
        ct.room.alienInHand++;
}
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['alienBleu'] = [];
ct.types.templates["alienRouge"] = {
    depth: -2,
    texture: "ALIEN_POUR_LE_JEU_2",
    onStep: function () {
        this.speed = 1+difficulte/3;
this.direction = ct.random.range(135, 225);
this.move();

if (this.x < 32 || this.y > 416) {
    this.kill = true;
};
this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['alienRouge'] = [];
ct.types.templates["alienJaune"] = {
    depth: -2,
    texture: "ALIEN_POUR_LE_JEU_3",
    onStep: function () {
        this.speed = 1+difficulte/3;
this.direction = ct.random.range(135, 225);
this.move();

if (this.x < 32 || this.y > 416) {
    this.kill = true;
};
this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['alienJaune'] = [];
ct.types.templates["alienBlanc"] = {
    depth: -2,
    texture: "ALIEN_POUR_LE_JEU_4",
    onStep: function () {
        this.speed = 1+difficulte/3;
this.direction = ct.random.range(135, 225);
this.move();

if (this.x < 32 || this.y > 416) {
    this.kill = true;
};
this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['alienBlanc'] = [];
ct.types.templates["alienNoir"] = {
    depth: -2,
    texture: "ALIEN_POUR_LE_JEU_5",
    onStep: function () {
        this.speed = 1+difficulte/3;
this.direction = ct.random.range(135, 225);
this.move();

if (this.x < 32 || this.y > 416) {
    this.kill = true;
};
this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['alienNoir'] = [];
ct.types.templates["fishingRodRight"] = {
    depth: 0,
    texture: "Canne_de_base",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['fishingRodRight'] = [];
ct.types.templates["fishingRodLeft"] = {
    depth: 0,
    texture: "Canne_pour_droitier",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        /*
if(ct.place.meet(this, 'ballonRed')){
    this.kill = true;
}
*/
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['fishingRodLeft'] = [];
ct.types.templates["fishingRodAlien"] = {
    depth: 2,
    texture: "Canne_avec_alien",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['fishingRodAlien'] = [];
ct.types.templates["alienBleu_dup"] = {
    depth: 0,
    texture: "ALIEN_POUR_LE_JEU",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.types.list['alienBleu_dup'] = [];
    

    ct.types.beforeStep = function beforeStep() {
        
    };
    ct.types.afterStep = function afterStep() {
        
    };
    ct.types.beforeDraw = function beforeDraw() {
        if ([false][0] && this instanceof ct.types.Copy) {
    this.$cDebugText.scale.x = this.$cDebugCollision.scale.x = 1 / this.scale.x;
    this.$cDebugText.scale.y = this.$cDebugCollision.scale.y = 1 / this.scale.y;
    this.$cDebugText.rotation = this.$cDebugCollision.rotation = -ct.u.degToRad(this.rotation);

    const newtext = `Partitions: ${this.$chashes.join(', ')}
Group: ${this.ctype}
Shape: ${this._shape && this._shape.__type}`;
    if (this.$cDebugText.text !== newtext) {
        this.$cDebugText.text = newtext;
    }
    this.$cDebugCollision
    .clear();
    ct.place.drawDebugGraphic.apply(this);
    this.$cHadCollision = false;
}

    };
    ct.types.afterDraw = function afterDraw() {
        /* eslint-disable no-underscore-dangle */
if ((this.transform && (this.transform._localID !== this.transform._currentLocalID)) || this.x !== this.xprev || this.y !== this.yprev) {
    delete this._shape;
    const oldHashes = this.$chashes || [];
    this.$chashes = ct.place.getHashes(this);
    for (const hash of oldHashes) {
        if (this.$chashes.indexOf(hash) === -1) {
            ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
        }
    }
    for (const hash of this.$chashes) {
        if (oldHashes.indexOf(hash) === -1) {
            if (!(hash in ct.place.grid)) {
                ct.place.grid[hash] = [this];
            } else {
                ct.place.grid[hash].push(this);
            }
        }
    }
}

    };
    ct.types.onDestroy = function onDestroy() {
        if (this.$chashes) {
    for (const hash of this.$chashes) {
        ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
    }
}

    };
})(ct);
/* eslint-disable no-unused-vars */
/**
 * This class represents a camera that is used by ct.js' cameras.
 * Usually you won't create new instances of it, but if you need, you can substitute
 * ct.camera with a new one.
 *
 * @extends {PIXI.DisplayObject}
 * @class
 *
 * @property {number} x The real x-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetX`
 * if the camera is in transition.
 * @property {number} y The real y-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetY`
 * if the camera is in transition.
 * @property {number} width The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.x to get a scaled version.
 * To change this value, see `ct.width` property.
 * @property {number} height The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.y to get a scaled version.
 * To change this value, see `ct.height` property.
 * @property {number} targetX The x-coordinate of the target location.
 * Moving it instead of just using the `x` parameter will trigger the drift effect.
 * @property {number} targetY The y-coordinate of the target location.
 * Moving it instead of just using the `y` parameter will trigger the drift effect.
 *
 * @property {Copy|false} follow If set, the camera will follow the given copy.
 * @property {boolean} followX Works if `follow` is set to a copy.
 * Enables following in X axis. Set it to `false` and followY to `true`
 * to limit automatic camera movement to vertical axis.
 * @property {boolean} followY Works if `follow` is set to a copy.
 * Enables following in Y axis. Set it to `false` and followX to `true`
 * to limit automatic camera movement to horizontal axis.
 * @property {number|null} borderX Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number|null} borderY Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number} shiftX Displaces the camera horizontally
 * but does not change x and y parameters.
 * @property {number} shiftY Displaces the camera vertically
 * but does not change x and y parameters.
 * @property {number} drift Works if `follow` is set to a copy.
 * If set to a value between 0 and 1, it will make camera movement smoother
 *
 * @property {number} shake The current power of a screen shake effect,
 * relative to the screen's max side (100 is 100% of screen shake).
 * If set to 0 or less, it, disables the effect.
 * @property {number} shakePhase The current phase of screen shake oscillation.
 * @property {number} shakeDecay The amount of `shake` units substracted in a second. Default is 5.
 * @property {number} shakeFrequency The base frequency of the screen shake effect. Default is 50.
 * @property {number} shakeX A multiplier applied to the horizontal screen shake effect.
 * Default is 1.
 * @property {number} shakeY A multiplier applied to the vertical screen shake effect.
 * Default is 1.
 * @property {number} shakeMax The maximum possible value for the `shake` property
 * to protect players from losing their monitor, in `shake` units. Default is 10.
 */
class Camera extends PIXI.DisplayObject {
    constructor(x, y, w, h) {
        super();
        this.follow = this.rotate = false;
        this.followX = this.followY = true;
        this.targetX = this.x = x;
        this.targetY = this.y = y;
        this.z = 500;
        this.width = w || 1920;
        this.height = h || 1080;
        this.shiftX = this.shiftY = this.interpolatedShiftX = this.interpolatedShiftY = 0;
        this.borderX = this.borderY = null;
        this.drift = 0;

        this.shake = 0;
        this.shakeDecay = 5;
        this.shakeX = this.shakeY = 1;
        this.shakeFrequency = 50;
        this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
        this.shakeMax = 10;

        this.getBounds = this.getBoundingBox;
    }

    get scale() {
        return this.transform.scale;
    }
    set scale(value) {
        if (typeof value === 'number') {
            value = {
                x: value,
                y: value
            };
        }
        this.transform.scale.copyFrom(value);
    }

    /**
     * Moves the camera to a new position. It will have a smooth transition
     * if a `drift` parameter is set.
     * @param {number} x New x coordinate
     * @param {number} y New y coordinate
     * @returns {void}
     */
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * Moves the camera to a new position. Ignores the `drift` value.
     * @param {number} x New x coordinate
     * @param {number} y New y coordinate
     * @returns {void}
     */
    teleportTo(x, y) {
        this.targetX = this.x = x;
        this.targetY = this.y = y;
        this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
        this.interpolatedShiftX = this.shiftX;
        this.interpolatedShiftY = this.shiftY;
    }

    /**
     * Updates the position of the camera
     * @param {number} delta A delta value between the last two frames. This is usually ct.delta.
     * @returns {void}
     */
    update(delta) {
        if (this.follow && this.follow.kill) {
            this.follow = false;
        }

        const sec = delta / (PIXI.Ticker.shared.maxFPS || 60);
        this.shake -= sec * this.shakeDecay;
        this.shake = Math.max(0, this.shake);
        if (this.shakeMax) {
            this.shake = Math.min(this.shake, this.shakeMax);
        }
        const phaseDelta = sec * this.shakeFrequency;
        this.shakePhase += phaseDelta;
        // no logic in these constants
        // They are used to desync fluctuations and remove repetitive circular movements
        this.shakePhaseX += phaseDelta * (1 + Math.sin(this.shakePhase * 0.1489) * 0.25);
        this.shakePhaseY += phaseDelta * (1 + Math.sin(this.shakePhase * 0.1734) * 0.25);

        // The speed of drift movement
        const speed = this.drift ? Math.min(1, (1 - this.drift) * delta) : 1;

        if (this.follow && ('x' in this.follow) && ('y' in this.follow)) {
            // eslint-disable-next-line max-len
            const bx = this.borderX === null ? this.width / 2 : Math.min(this.borderX, this.width / 2),
                  // eslint-disable-next-line max-len
                  by = this.borderY === null ? this.height / 2 : Math.min(this.borderY, this.height / 2);
            const tl = this.uiToGameCoord(bx, by),
                  br = this.uiToGameCoord(this.width - bx, this.height - by);

            if (this.followX) {
                if (this.follow.x < tl[0] - this.interpolatedShiftX) {
                    this.targetX = this.follow.x - bx + this.width / 2;
                } else if (this.follow.x > br[0] - this.interpolatedShiftX) {
                    this.targetX = this.follow.x + bx - this.width / 2;
                }
            }
            if (this.followY) {
                if (this.follow.y < tl[1] - this.interpolatedShiftY) {
                    this.targetY = this.follow.y - by + this.height / 2;
                } else if (this.follow.y > br[1] - this.interpolatedShiftY) {
                    this.targetY = this.follow.y + by - this.height / 2;
                }
            }
        }

        this.x = this.targetX * speed + this.x * (1 - speed);
        this.y = this.targetY * speed + this.y * (1 - speed);
        this.interpolatedShiftX = this.shiftX * speed + this.interpolatedShiftX * (1 - speed);
        this.interpolatedShiftY = this.shiftY * speed + this.interpolatedShiftY * (1 - speed);

        this.x = this.x || 0;
        this.y = this.y || 0;
    }

    /**
     * Returns the current camera position plus the screen shake effect.
     * @type {number}
     */
    get computedX() {
        const dx = (Math.sin(this.shakePhaseX) + Math.sin(this.shakePhaseX * 3.1846) * 0.25) / 1.25;
        const x = this.x + dx * this.shake * Math.max(this.width, this.height) / 100 * this.shakeX;
        return x + this.interpolatedShiftX;
    }
    /**
     * Returns the current camera position plus the screen shake effect.
     * @type {number}
     */
    get computedY() {
        const dy = (Math.sin(this.shakePhaseY) + Math.sin(this.shakePhaseY * 2.8948) * 0.25) / 1.25;
        const y = this.y + dy * this.shake * Math.max(this.width, this.height) / 100 * this.shakeY;
        return y + this.interpolatedShiftY;
    }

    /**
     * Returns the position of the left edge where the visible rectangle ends, in game coordinates.
     * This can be used for UI positioning in game coordinates.
     * This does not count for rotations, though.
     * For rotated and/or scaled viewports, see `getTopLeftCorner`
     * and `getBottomLeftCorner` methods.
     * @returns {number} The location of the left edge.
     * @type {number}
     * @readonly
     */
    get left() {
        return this.computedX - (this.width / 2) * this.scale.x;
    }
    /**
     * Returns the position of the top edge where the visible rectangle ends, in game coordinates.
     * This can be used for UI positioning in game coordinates.
     * This does not count for rotations, though.
     * For rotated and/or scaled viewports, see `getTopLeftCorner` and `getTopRightCorner` methods.
     * @returns {number} The location of the top edge.
     * @type {number}
     * @readonly
     */
    get top() {
        return this.computedY - (this.height / 2) * this.scale.y;
    }
    /**
     * Returns the position of the right edge where the visible rectangle ends, in game coordinates.
     * This can be used for UI positioning in game coordinates.
     * This does not count for rotations, though.
     * For rotated and/or scaled viewports, see `getTopRightCorner`
     * and `getBottomRightCorner` methods.
     * @returns {number} The location of the right edge.
     * @type {number}
     * @readonly
     */
    get right() {
        return this.computedX + (this.width / 2) * this.scale.x;
    }
    /**
     * Returns the position of the bottom edge where the visible rectangle ends,
     * in game coordinates. This can be used for UI positioning in game coordinates.
     * This does not count for rotations, though.
     * For rotated and/or scaled viewports, see `getBottomLeftCorner`
     * and `getBottomRightCorner` methods.
     * @returns {number} The location of the bottom edge.
     * @type {number}
     * @readonly
     */
    get bottom() {
        return this.computedY + (this.height / 2) * this.scale.y;
    }

    /**
     * Translates a point from UI space to game space.
     * @param {number} x The x coordinate in UI space.
     * @param {number} y The y coordinate in UI space.
     * @returns {Array<number>} A pair of new `x` and `y` coordinates.
     */
    uiToGameCoord(x, y) {
        const modx = (x - this.width / 2) * this.scale.x,
              mody = (y - this.height / 2) * this.scale.y;
        const result = ct.u.rotate(modx, mody, this.rotation);
        return [result[0] + this.computedX, result[1] + this.computedY];
    }

    /**
     * Translates a point from game space to UI space.
     * @param {number} x The x coordinate in game space.
     * @param {number} y The y coordinate in game space.
     * @returns {Array<number>} A pair of new `x` and `y` coordinates.
     */
    gameToUiCoord(x, y) {
        const relx = x - this.computedX,
              rely = y - this.computedY;
        const unrotated = ct.u.rotate(relx, rely, -this.rotation);
        return [
            unrotated[0] / this.scale.x + this.width / 2,
            unrotated[1] / this.scale.y + this.height / 2
        ];
    }
    /**
     * Gets the position of the top-left corner of the viewport in game coordinates.
     * This is useful for positioning UI elements in game coordinates,
     * especially with rotated viewports.
     * @returns {Array<number>} A pair of `x` and `y` coordinates.
     */
    getTopLeftCorner() {
        return this.uiToGameCoord(0, 0);
    }

    /**
     * Gets the position of the top-right corner of the viewport in game coordinates.
     * This is useful for positioning UI elements in game coordinates,
     * especially with rotated viewports.
     * @returns {Array<number>} A pair of `x` and `y` coordinates.
     */
    getTopRightCorner() {
        return this.uiToGameCoord(this.width, 0);
    }

    /**
     * Gets the position of the bottom-left corner of the viewport in game coordinates.
     * This is useful for positioning UI elements in game coordinates,
     * especially with rotated viewports.
     * @returns {Array<number>} A pair of `x` and `y` coordinates.
     */
    getBottomLeftCorner() {
        return this.uiToGameCoord(0, this.height);
    }

    /**
     * Gets the position of the bottom-right corner of the viewport in game coordinates.
     * This is useful for positioning UI elements in game coordinates,
     * especially with rotated viewports.
     * @returns {Array<number>} A pair of `x` and `y` coordinates.
     */
    getBottomRightCorner() {
        return this.uiToGameCoord(this.width, this.height);
    }

    /**
     * Returns the bounding box of the camera.
     * Useful for rotated viewports when something needs to be reliably covered by a rectangle.
     * @returns {PIXI.Rectangle} The bounding box of the camera.
     */
    getBoundingBox() {
        const bb = new PIXI.Bounds();
        const tl = this.getTopLeftCorner(),
              tr = this.getTopRightCorner(),
              bl = this.getBottomLeftCorner(),
              br = this.getBottomRightCorner();
        bb.addPoint(new PIXI.Point(tl[0], tl[1]));
        bb.addPoint(new PIXI.Point(tr[0], tr[1]));
        bb.addPoint(new PIXI.Point(bl[0], bl[1]));
        bb.addPoint(new PIXI.Point(br[0], br[1]));
        return bb.getRectangle();
    }

    get rotation() {
        return this.transform.rotation / Math.PI * -180;
    }
    /**
     * The rotation angle of a camera.
     * @param {number} value New rotation value
     * @type {number}
     */
    set rotation(value) {
        this.transform.rotation = value * Math.PI / -180;
        return value;
    }

    /**
     * Realigns all the copies in a room so that they distribute proportionally
     * to a new camera size based on their `xstart` and `ystart` coordinates.
     * Will throw an error if the given room is not in UI space (if `room.isUi` is not `true`).
     * You can skip the realignment for some copies
     * if you set their `skipRealign` parameter to `true`.
     * @param {Room} room The room which copies will be realigned.
     * @returns {void}
     */
    realign(room) {
        if (!room.isUi) {
            throw new Error('[ct.camera] An attempt to realing a room that is not in UI space. The room in question is', room);
        }
        const w = (ct.rooms.templates[room.name].width || 1),
              h = (ct.rooms.templates[room.name].height || 1);
        for (const copy of room.children) {
            if (!('xstart' in copy) || copy.skipRealign) {
                continue;
            }
            copy.x = copy.xstart / w * this.width;
            copy.y = copy.ystart / h * this.height;
        }
    }
    /**
     * This will align all non-UI layers in the game according to the camera's transforms.
     * This is automatically called internally, and you will hardly ever use it.
     * @returns {void}
     */
    manageStage() {
        const px = this.computedX,
              py = this.computedY,
              sx = 1 / (isNaN(this.scale.x) ? 1 : this.scale.x),
              sy = 1 / (isNaN(this.scale.y) ? 1 : this.scale.y);
        for (const item of ct.stage.children) {
            if (!item.isUi && item.pivot) {
                item.x = -this.width / 2;
                item.y = -this.height / 2;
                item.pivot.x = px;
                item.pivot.y = py;
                item.scale.x = sx;
                item.scale.y = sy;
                item.angle = -this.angle;
            }
        }
    }
}


if (!ct.sound) {
    /**
     * @namespace
     */
    ct.sound = {
        /**
         * Detects if a particular codec is supported in the system
         * @param {string} type Codec/MIME-type to look for
         * @returns {boolean} true/false
         */
        detect(type) {
            var au = document.createElement('audio');
            return Boolean(au.canPlayType && au.canPlayType(type).replace(/no/, ''));
        },
        /**
         * Creates a new Sound object and puts it in resource object
         *
         * @param {string} name Sound's name
         * @param {object} formats A collection of sound files of specified extension,
         * in format `extension: path`
         * @param {string} [formats.ogg] Local path to the sound in ogg format
         * @param {string} [formats.wav] Local path to the sound in wav format
         * @param {string} [formats.mp3] Local path to the sound in mp3 format
         * @param {number} [options] An options object
         *
         * @returns {object} Sound's object
         */
        init(name, formats, options) {
            var src = '';
            if (ct.sound.mp3 && formats.mp3) {
                src = formats.mp3;
            } else if (ct.sound.ogg && formats.ogg) {
                src = formats.ogg;
            } else if (ct.sound.wav && formats.wav) {
                src = formats.wav;
            }
            options = options || {};
            var audio = {
                src,
                direct: document.createElement('audio'),
                pool: [],
                poolSize: options.poolSize || 5
            };
            if (src !== '') {
                ct.res.soundsLoaded++;
                audio.direct.preload = options.music ? 'metadata' : 'auto';
                audio.direct.onerror = audio.direct.onabort = function onabort() {
                    console.error('[ct.sound] Oh no! We couldn\'t load ' + src + '!');
                    audio.buggy = true;
                    ct.res.soundsError++;
                    ct.res.soundsLoaded--;
                };
                audio.direct.src = src;
            } else {
                ct.res.soundsError++;
                audio.buggy = true;
                console.error('[ct.sound] We couldn\'t load sound named "' + name + '" because the browser doesn\'t support any of proposed formats.');
            }
            ct.res.sounds[name] = audio;
            return audio;
        },
        /**
         * Spawns a new sound and plays it.
         *
         * @param {string} name The name of sound to be played
         * @param {object} [opts] Options object that is applied to a newly created audio tag
         * @param {Function} [cb] A callback, which is called when the sound finishes playing
         *
         * @returns {HTMLTagAudio|Boolean} The created audio or `false` (if a sound wasn't created)
         */
        spawn(name, opts, cb) {
            opts = opts || {};
            if (typeof opts === 'function') {
                cb = opts;
            }
            var s = ct.res.sounds[name];
            if (s.pool.length < s.poolSize) {
                var a = document.createElement('audio');
                a.src = s.src;
                if (opts) {
                    ct.u.ext(a, opts);
                }
                s.pool.push(a);
                a.addEventListener('ended', function soundEnded(e) {
                    s.pool.splice(s.pool.indexOf(a), 1);
                    if (cb) {
                        cb(true, e);
                    }
                });

                a.play();
                return a;
            } else if (cb) {
                cb(false);
            }
            return false;
        },
        exists(name) {
            return (name in ct.res.sounds);
        }
    };

    // define sound types we can support
    ct.sound.wav = ct.sound.detect('audio/wav; codecs="1"');
    ct.sound.mp3 = ct.sound.detect('audio/mpeg;');
    ct.sound.ogg = ct.sound.detect('audio/ogg;');
}


(function timerAddon() {
    const ctTimerTime = Symbol('time');
    const ctTimerRoomName = Symbol('roomName');
    const ctTimerTimeLeftOriginal = Symbol('timeLeftOriginal');
    const promiseResolve = Symbol('promiseResolve');
    const promiseReject = Symbol('promiseReject');

    /**
     * @property {boolean} isUi Whether the timer uses ct.deltaUi or not.
     * @property {string|false} name The name of the timer
     */
    class CtTimer {
        /**
         * An object for holding a timer
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer
         * @param {boolean} [uiDelta=false] If `true`, it will use `ct.deltaUi` for counting time.
         * if `false`, it will use `ct.delta` for counting time.
         */
        constructor(timeMs, name = false, uiDelta = false) {
            this[ctTimerRoomName] = ct.room.name || '';
            this.name = name && name.toString();
            this.isUi = uiDelta;
            this[ctTimerTime] = 0;
            this[ctTimerTimeLeftOriginal] = timeMs;
            this.timeLeft = this[ctTimerTimeLeftOriginal];
            this.promise = new Promise((resolve, reject) => {
                this[promiseResolve] = resolve;
                this[promiseReject] = reject;
            });
            this.rejected = false;
            this.done = false;
            this.settled = false;
            ct.timer.timers.add(this);
        }

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         *
         * @param {Function} onfulfilled The callback to execute when the Promise is resolved.
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        then(...args) {
            return this.promise.then(...args);
        }
        /**
         * Attaches a callback for the rejection of the Promise.
         *
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        catch(onrejected) {
            return this.promise.catch(onrejected);
        }

        /**
         * The time passed on this timer, in seconds
         * @type {number}
         */
        get time() {
            return this[ctTimerTime] * 1000 / ct.speed;
        }
        set time(newTime) {
            this[ctTimerTime] = newTime / 1000 * ct.speed;
        }

        /**
         * Updates the timer. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        update() {
            // Not something that would normally happen,
            // but do check whether this timer was not automatically removed
            if (this.rejected === true || this.done === true) {
                this.remove();
                return;
            }
            this[ctTimerTime] += this.isUi ? ct.deltaUi : ct.delta;
            if (ct.room.name !== this[ctTimerRoomName] && this[ctTimerRoomName] !== '') {
                this.reject({
                    info: 'Room switch',
                    from: 'ct.timer'
                }); // Reject if the room was switched
            }

            // If the timer is supposed to end
            if (this.timeLeft !== 0) {
                this.timeLeft = this[ctTimerTimeLeftOriginal] - this.time;
                if (this.timeLeft <= 0) {
                    this.resolve();
                }
            }
        }

        /**
         * Instantly triggers the timer and calls the callbacks added through `then` method.
         * @returns {void}
         */
        resolve() {
            this.done = true;
            this.settled = true;
            this[promiseResolve]();
            this.remove();
        }
        /**
         * Stops the timer with a given message by rejecting a Promise object.
         * @param {any} message The value to pass to the `catch` callback
         * @returns {void}
         */
        reject(message) {
            this.rejected = true;
            this.settled = true;
            this[promiseReject](message);
            this.remove();
        }
        /**
         * Removes the timer from ct.js game loop. This timer will not trigger.
         * @returns {void}
         */
        remove() {
            ct.timer.timers.delete(this);
        }
    }
    window.CtTimer = CtTimer;

    /**
     * Timer utilities
     * @namespace
     */
    ct.timer = {
        /**
         * A set with all the active timers.
         * @type Set<CtTimer>
         */
        timers: new Set(),
        counter: 0,
        /**
         * Adds a new timer with a given name
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        add(timeMs, name = false) {
            return new CtTimer(timeMs, name, false);
        },
        /**
         * Adds a new timer with a given name that runs in a UI time scale
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        addUi(timeMs, name = false) {
            return new CtTimer(timeMs, name, true);
        },
        /**
         * Updates the timers. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        updateTimers() {
            for (const timer of this.timers) {
                timer.update();
            }
        }
    };
})();

if (document.fonts) { for (const font of document.fonts) { font.load(); }}