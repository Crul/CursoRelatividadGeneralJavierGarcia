var PLOT_POTENCIAL_CHART = true;
var INFINITESIMAL = 1e-9;
var E_THRESHOLD_TO_BE_CONSIDERED_ZERO = 1e-7;

var BISECTION_ERROR_THERSHOLD = 1e-7;
var BISECTION_MIN = 1e-9;
var BISECTION_MAX = 5e3;

var POTENTIAL_PLOT_RESOLUTION = 1e2;
var POTENTIAL_PLOT_MAX_X = 1e4;

var G = 6.674E-11;

var defaultInitialConditions = [
    {
        name: 'Velocidad de Escape (caso 1)',
        inputFormat: 'r-vr-vphi',
        siUnits: false,
        timeResolution: 0.1, simulationTime: 500,
        r: 16.0, phi: 0.0, vr: 2.0, vphi: 0.0
    },
    {
        name: 'Colisión (caso 2)',
        inputFormat: 'r-vr-vphi',
        siUnits: false,
        timeResolution: 0.1, simulationTime: 500,
        r: 16.0, phi: 0.0, vr: 0.0, vphi: 0.0
    },
    {
        name: 'Parábola (caso 3)',
        inputFormat: 'L-E-vphi',
        siUnits: false,
        timeResolution: 0.1, simulationTime: 5000,
        phi: 1.0, vphi: 0.001, vrSign: -1.0,
        L: 9.48, E: 0.0,
    },
    {
        name: 'Hipérbola (caso 4)',
        inputFormat: 'r-vr-vphi',
        siUnits: false,
        timeResolution: 0.1, simulationTime: 500,
        r: 16.0, phi: 0.0, vr: 0.0, vphi: 0.08,
    },
    {
        name: 'Órbita Elíptica (caso 5)',
        inputFormat: 'r-vr-vphi',
        siUnits: false,
        timeResolution: 0.1, simulationTime: 500,
        r: 8.0, phi: 0.0, vr: 0.0, vphi: 0.035
    },
    {
        name: 'Órbita Circular en SI (caso 6)',
        inputFormat: 'L-E-vr',
        timeResolution: 0.1, simulationTime: 500,
        siUnits: true,
        M: 5.97e+24, R: 6371000.0, m: 500.0,
        phi: 0.0, vr: 0.0,
        L: 26719623532036.336, E: -13897619421.33626,
    }
];

function range(start, end) {
  return Array(end - start + 1).fill().map(function(_, idx) { return start + idx; });
}
