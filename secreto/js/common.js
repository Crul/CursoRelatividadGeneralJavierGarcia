var lastRunPoints;
var INFINITESIMAL = 1e-9;
var E_THRESHOLD_TO_BE_CONSIDERED_ZERO = 1e-7;

var BISECTION_ERROR_THERSHOLD = 1e-10;
var BISECTION_MIN = 1e-9;
var BISECTION_MAX = 5e3;

var POTENTIAL_PLOT_POINTS_COUNT = 1e5;
var TRAJECTORY_PLOT_MAXLIMIT_FACTOR = 10;
var TRAJECTORY_PLOT_MARGIN_FACTOR = 1.5;
var TRAJECTORY_PLOT_DRAW_OUTSIDE_ZOOM_FACTOR = 5;
var G = 6.674E-11;

var defaultInitialConditions = [
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Órbita circular de la Tierra [ r = 10 x Radio ] (L, epsilon, r)',
        inputFormat: 'L-epsilon-r',
        units: 'si',
        stepsCount: 100, totalProperTimeSi: 295861.4847384257,
        M: 5.9722e+24, R: 6371000.0, m: 500.0,
        rSi: 63710000, phiAdim: 0.0, vrSign: 1.0, LSi: 79677202911471.16, epsilonSi: -3128116684.7610626
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Órbita circular de la Tierra [ r = 10 x Radio ] (r, vr, vphi)',
        inputFormat: 'r-vr-vphi',
        units: 'si',
        stepsCount: 100, totalProperTimeSi: 295861.4847384257,
        M: 5.9722e+24, R: 6371000.0, m: 500.0,
        rSi: 63710000, phiAdim: 0.0, vrSi: 0.0, vrSign: 1.0, vphiSi: 0.00003925987071995594
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Órbita circular de la Tierra: r aleatorio (L, epsilon, r)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 7000, totalProperTimeAdim: 7e14,
        M: 5.9722e+24, R: 6371000.0, m: 500.0,
        rAdim: 1216577086.134062, phiAdim: 0.0, vrSign: 1.0, LAdim:24663.506316358, epsilonAdim: -4.1098910000000007e-10
    },
    {
        physics: 'newton',
        name: 'NEWTON - Colisión (caso 2)',
        inputFormat: 'r-vr-vphi',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+24, R: 6371000.0, m: 500.0,
        rAdim: 16.0, phiAdim: 0.0, vrAdim: 0.0, vphiAdim: 0.0
    },
    {
        physics: 'newton',
        name: 'NEWTON - Parábola (caso 3)',
        inputFormat: 'L-epsilon-vphi',
        units: 'adim',
        stepsCount: 500000, totalProperTimeAdim: 5000,
        M: 5.97e+24, R: 6371000.0, m: 500.0,
        phiAdim: 1.0, vphiAdim: 0.001, vrSign: -1.0,
        LAdim: 9.48, epsilonAdim: 0.0,
    },
    {
        physics: 'newton',
        name: 'NEWTON - Hipérbola (caso 4)',
        inputFormat: 'r-vr-vphi',
        units: 'adim',
        stepsCount: 10000, totalProperTimeAdim: 100,
        M: 5.97e+24, R: 6371000.0, m: 500.0,
        rAdim: 16.0, phiAdim: 0.0, vrAdim: 0.0, vphiAdim: 0.08,
    },
    {
        physics: 'newton',
        name: 'NEWTON - Órbita Elíptica (caso 5)',
        inputFormat: 'r-vr-vphi',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+24, R: 6371000.0, m: 500.0,
        rAdim: 8.0, phiAdim: 0.0, vrAdim: 0.0, vphiAdim: 0.035
    },
    {
        physics: 'newton',
        name: 'NEWTON - Órbita Circular en SI (caso 6)',
        inputFormat: 'L-epsilon-vr',
        units: 'si',
        stepsCount: 150000, totalProperTimeSi: 427245.410758225,
        M: 5.97e+24, R: 6371000.0, m: 500.0,
        phiSi: 0.0, vrSi: 0.0,
        LSi: 26719623532036.336, epsilonSi: -13897619421.33626,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 0 - Zona 0 (Escape)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 15,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 0, epsilonAdim: 1.9375, rAdim: 16.0,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 0 - Zona 0 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 0, epsilonAdim: 1.9375, rAdim: 16.0, vrSign: -1,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 1 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 500000, totalProperTimeAdim: 5000,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.1, epsilonAdim: -0.05, rAdim: 16.0,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 2 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.8, epsilonAdim: -0.08, rAdim: 7.0,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 3 (a) - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.9, epsilonAdim: -0.04735184287601163, rAdim: 1.5,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 3 (a) - Zona 2 (Órbita circular inestable)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.9, epsilonAdim: -0.04735184287601163, rAdim: 2.1260525615777355,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 3 (b) - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.9, epsilonAdim: -0.06, rAdim: 1.5,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 3 (b) - Zona 2 (Órbita elíptica)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.9, epsilonAdim: -0.06, rAdim: 10.0,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 3 (b) - Zona 2 (Órbita circular)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2, epsilonAdim: -0.074074074074074074, rAdim: 6.0,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 4 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.9, epsilonAdim: -0.08450000897584042, rAdim: 1.5,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 4 - Zona 2 (Órbita elíptica)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.9, epsilonAdim: -0.075, rAdim: 5.093947438422264,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 4 - Zona 2 (Órbita circular)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.9, epsilonAdim: -0.08450000897584042, rAdim: 5.093947438422264,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 5 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 1.8, epsilonAdim: -0.2, rAdim: 1.3,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 6 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: 0.1, rAdim: 1.5,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 6 - Zona 2 (Cometa que escapa)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 15000, totalProperTimeAdim: 200,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: 0.1, rAdim: 5, vrSign: -1,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 7 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: -0.05, rAdim: 1.2,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 7 - Zona 2 (Órbita elíptica)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: -0.05, rAdim: 5.406,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 8 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 15000, totalProperTimeAdim: 50,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: 0.10922213581784845, rAdim: 1.2, vrSign: 1,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 8 - Zona indefinida (Órbita circular inestable)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 15000, totalProperTimeAdim: 50,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: 0.10922213581784845, rAdim: 5.406, vrSign: -1,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 8 - Zona 2 (Cometa que escapa por los pelos)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 15000, totalProperTimeAdim: 150,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: 0.10922213581784844, rAdim: 10, vrSign: -1,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 9 - Zona 1 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: -0.058851765447478034, rAdim: 1.2,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 9 - Zona 2 (Órbita circular estable)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: -0.058851765447478034, rAdim: 7.824225192575119,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 10 (Colisión)',
        inputFormat: 'L-epsilon-r',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        LAdim: 2.2, epsilonAdim: -0.075, rAdim: 1.085,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 10 (Colisión) - r,vr,vphi',
        inputFormat: 'r-vr-vphi',
        units: 'adim',
        stepsCount: 150000, totalProperTimeAdim: 1500,
        M: 5.97e+30, R: 5e3, m: 500.0,
        rAdim: 1.3466314515085671, vrAdim: 0.0, vrSign: 1, vphiAdim: 1.1889547626874881,
    },
    {
        physics: 'schwarzschild',
        name: 'SCHWAR - Caso 10 (Colisión) - r,vr,vphi en SI',
        inputFormat: 'r-vr-vphi',
        units: 'si',
        M: 1e+27, R: 0.01, m: 500.0,
        stepsCount: 150000, totalProperTimeSi: 0.000007430967266796801,
        rSi: 1.9999702966941035, vrSi: 0.0, vrSign: 1, vphiSi: 240000000,
    },
];

function InvalidInitialConditionsError(message) {
    this.name = 'InvalidInitialConditionsError';
    this.message = (message || '');
    return this;
}
InvalidInitialConditionsError.prototype = Error.prototype;

function processInitialConditions(physics) {
    var initialConditions = getFormData();

    var physicsConfig = physicsConfigs[physics];
    if (initialConditions.siUnits) {
        checkInitialConditionsInSi(initialConditions);
        physicsConfig.siToAdim(initialConditions);
        physicsConfig.fillMissingInitialConditions(initialConditions);
    } else {
        physicsConfig.fillMissingInitialConditions(initialConditions);
        physicsConfig.adimToSi(initialConditions);
    }
    physicsConfig.plotPotentialChart(initialConditions);

    return initialConditions;
}

function checkInitialConditionsInSi(initialConditions) {
    var M = initialConditions.M;
    var R = initialConditions.R;
    var m = initialConditions.m;
    if (!M || !R || !m) {
        throw InvalidInitialConditionsError('Los parámetros M, R y m son obligatorios para usar unidades del SI.');
    }
}

// https://stackoverflow.com/questions/27176423/function-to-solve-cubic-equation-analytically
function cuberoot(x) {
    var y = Math.pow(Math.abs(x), 1/3);
    return x < 0 ? -y : y;
}

function solveCubic(a, b, c, d) {
    if (Math.abs(a) < 1e-8) { // Quadratic case, ax^2+bx+c=0
        a = b; b = c; c = d;
        if (Math.abs(a) < 1e-8) { // Linear case, ax+b=0
            a = b; b = c;
            if (Math.abs(a) < 1e-8) // Degenerate case
                return [];
            return [-b/a];
        }

        var D = b*b - 4*a*c;
        if (Math.abs(D) < 1e-8)
            return [-b/(2*a)];
        else if (D > 0)
            return [(-b+Math.sqrt(D))/(2*a), (-b-Math.sqrt(D))/(2*a)];
        return [];
    }

    // Convert to depressed cubic t^3+pt+q = 0 (subst x = t - b/3a)
    var p = (3*a*c - b*b)/(3*a*a);
    var q = (2*b*b*b - 9*a*b*c + 27*a*a*d)/(27*a*a*a);
    var roots;

    if (Math.abs(p) < 1e-8) { // p = 0 -> t^3 = -q -> t = -q^1/3
        roots = [cuberoot(-q)];
    } else if (Math.abs(q) < 1e-8) { // q = 0 -> t^3 + pt = 0 -> t(t^2+p)=0
        roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
    } else {
        var D = q*q/4 + p*p*p/27;
        if (Math.abs(D) < 1e-8) {       // D = 0 -> two roots
            roots = [-1.5*q/p, 3*q/p];
        } else if (D > 0) {             // Only one real root
            var u = cuberoot(-q/2 - Math.sqrt(D));
            roots = [u - p/(3*u)];
        } else {                        // D < 0, three roots, but needs to use complex numbers/trigonometric solution
            var u = 2*Math.sqrt(-p/3);
            var t = Math.acos(3*q/p/u)/3;  // D < 0 implies p < 0 and acos argument in [-1..1]
            var k = 2*Math.PI/3;
            roots = [u*Math.cos(t), u*Math.cos(t-k), u*Math.cos(t-2*k)];
        }
    }

    // Convert back from depressed cubic
    for (var i = 0; i < roots.length; i++)
        roots[i] -= b/(3*a);

    return roots;
}

function range(start, end) {
  return Array(end - start + 1).fill().map(function(_, idx) { return start + idx; });
}

function getMax(arr) {
    let len = arr.length;
    let max = -Infinity;

    while (len--) {
        max = arr[len] > max ? arr[len] : max;
    }
    return max;
}

function getMin(arr) {
    let len = arr.length;
    let min = Infinity;

    while (len--) {
        min = arr[len] < min ? arr[len] : min;
    }
    return min;
}