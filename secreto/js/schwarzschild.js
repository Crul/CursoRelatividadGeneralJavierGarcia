var DELTA_ERROR = 1e-5;
var SCHWARZSCHILD_RADIUS = 1;
var INFINITESIMAL_FOR_RADIUSES = 1e-3;;
var MIN_RADIUSES_FOR_BISECTION = [1e-3, 1e-6, 1e-9, 1e-12, 1e-15, 1e-20, 1e-25, 1e-30, 1e-40];
var MAX_RADIUSES_FOR_BISECTION = [1e3, 1e6, 1e9, 1e12, 1e15, 1e20, 1e25, 1e30, 1e40];
var MAX_RADIUS = 1e40;
var SPEED_LIGHT = 299792458;
var SPEED_LIGHT_SQR = Math.pow(SPEED_LIGHT, 2);

function runSchwarzschild() {
    var initialConditions = getFormData();

    var isThereSiData = true;
    if (initialConditions.siUnits) {
        checkInitialConditionsInSi(initialConditions);
        siToSchwarzschild(initialConditions);
    } else {
        try {
            checkInitialConditionsInSi(initialConditions);
            var a = (2*G*initialConditions.M)/SPEED_LIGHT_SQR;
            initialConditions.a = a;
        } catch(ex) {
            isThereSiData = false;
        }
    }
    fillMissingInitialConditionsSchwarzschild(initialConditions);

    var R       = initialConditions.R;
    var r       = initialConditions.rAdim;
    var phi     = initialConditions.phiAdim;
    var vr      = initialConditions.vrAdim;
    var L       = initialConditions.LAdim;
    var epsilon = initialConditions.epsilonAdim;
    var a       = initialConditions.a;

    var radiuses = getSchwarzschildRadiuses(initialConditions);
    var allowedRanges = [ { min: 1, max: MAX_RADIUS }];
    if (radiuses.r0)
        allowedRanges[0].max = radiuses.r0;

    if (radiuses.r1)
        allowedRanges.push({ min: radiuses.r1, max: MAX_RADIUS })

    if (radiuses.r2)
        allowedRanges[1].max = radiuses.r2;

    var validRange = allowedRanges.filter(function(range) {
        return (r + INFINITESIMAL_FOR_RADIUSES) >= range.min && (r - INFINITESIMAL_FOR_RADIUSES) <= range.max;
    });
    if (!validRange.length) {
        var allowedRangesStr = allowedRanges
            .map(function(range) { return "<br/>[ " + range.min + " , " + range.max + " ]"; })
            .join("");

        throw InvalidInitialConditionsError('El valor de r no es válido. Ha de estar en los intervalos: ' + allowedRangesStr);
    }

    var stepData = initializeStepDataSchwarzschild(initialConditions);
    var steps  = initialConditions.stepsCount;
    var dtau   = initialConditions.totalProperTimeAdim / steps;
    var points = { 'paso': [] };
    var RAdim;
    var minR = SCHWARZSCHILD_RADIUS;
    if (initialConditions.siUnits) {
        points['tauSi'] = [];
        points['tSi']   = [];
        points['xSi'] = [];
        points['ySi'] = [];
        points['rSi'] = [];
        points['phiSi'] = [];
        RAdim = rSiToRSchwarzschild(initialConditions.a, R);
        minR = Math.max(minR, RAdim);
    } else {
        points['tau'] = [];
        points['t'] = [];
        points['x'] = [];
        points['y'] = [];
        points['r'] = [];
        points['phi'] = [];
    }
    minR += DELTA_ERROR;
    
    for (var i=0; i < steps; i++) {
        var tau = i * dtau;
        var E = Math.sqrt(1 + initialConditions.epsilonAdim)
        var t = (E / (1 - (1/stepData.r))) * tau;
        var x = stepData.r*Math.cos(stepData.phi);
        var y = stepData.r*Math.sin(stepData.phi);
        
        points.paso.push(i);
        if (initialConditions.siUnits) {
            points.xSi.push(rSchwarzschildToRSi(initialConditions.a, x));
            points.ySi.push(rSchwarzschildToRSi(initialConditions.a, y));
            points.rSi.push(rSchwarzschildToRSi(initialConditions.a, stepData.r));
            points.phiSi.push(stepData.phi);
            points.tauSi.push(tSchwarzschildToTSi(a, tau));
            points.tSi.push(tSchwarzschildToTSi(a, t));
        } else {
            points.tau.push(tau);
            points.t.push(t);
            points.x.push(x);
            points.y.push(y);
            points.r.push(stepData.r);
            points.phi.push(stepData.phi);
        }

        var valueInsideSqrt = Math.abs(epsilon - getEinsteinPotential(stepData.r, L));
        var nextVr = Math.sqrt(valueInsideSqrt);
        var nextR = stepData.r + (stepData.vrSign * nextVr * dtau);
        var nextVphi = L / Math.pow(nextR, 2);
        var nextPhi = stepData.phi + (nextVphi * dtau);
        var nextVrSign = stepData.vrSign;

        var recalculateBecauseRadius = false;
        if (stepData.r != nextR || nextVr != 0) {

            if (radiuses.r0 && stepData.r <= radiuses.r0 && nextR > radiuses.r0) {
                nextR = radiuses.r0;
                nextVrSign = -1;
                recalculateBecauseRadius = true;
            }

            if (radiuses.r1 && stepData.r >= radiuses.r1 && nextR < radiuses.r1) {
                nextR = radiuses.r1;
                if (radiuses.r1 != radiuses.r2) {
                    nextVrSign = 1;
                    recalculateBecauseRadius = true;
                }
            }

            if (radiuses.r2 && stepData.r <= radiuses.r2 && nextR > radiuses.r2) {
                nextR = radiuses.r2;
                if (radiuses.r1 != radiuses.r2) {
                    nextVrSign = -1;
                    recalculateBecauseRadius = true;
                }
            }

        }
        
        if (nextVr == 0) {
            if (radiuses.r0 && Math.abs(nextR - radiuses.r0) <= INFINITESIMAL_FOR_RADIUSES && nextVrSign == 1) {
                nextR = radiuses.r0 - INFINITESIMAL;
                nextVrSign = -1;
                recalculateBecauseRadius = true;
            }

            if (radiuses.r1 && Math.abs(nextR - radiuses.r1) <= INFINITESIMAL_FOR_RADIUSES && nextVrSign == -1) {
                nextR = radiuses.r1 + INFINITESIMAL;
                nextVrSign = 1;
                recalculateBecauseRadius = true;
            }

            if (radiuses.r2 && Math.abs(nextR - radiuses.r2) <= INFINITESIMAL_FOR_RADIUSES && nextVrSign == 1) {
                nextR = radiuses.r2 - INFINITESIMAL;
                nextVrSign = -1;
                recalculateBecauseRadius = true;
            }
        }
        
        if (recalculateBecauseRadius) {
            valueInsideSqrt = Math.abs(epsilon - getEinsteinPotential(nextR, L));
            nextVr = Math.sqrt(valueInsideSqrt);
            nextR = nextR + (nextVrSign * nextVr * dtau);
            nextVphi = L / Math.pow(nextR, 2);
            nextPhi = stepData.phi + (nextVphi * dtau);
        }

        stepData.r = nextR;
        stepData.vr = nextVr;
        stepData.vrSign = nextVrSign;
        stepData.phi = nextPhi;
        stepData.vphi = nextVphi;

        if (stepData.r < minR) {
            for (pointsArray in points)
                points[pointsArray].pop();

            console.warn('Integrator skipped at r=%0.5frs, next iteration r=%0.5frs');
            break;
        }
    }

    if (initialConditions.siUnits) {
        plotTrajectory(points.xSi, points.ySi, R, rSchwarzschildToRSi(initialConditions.a, 1));
    } else {
        plotTrajectory(points.x, points.y, RAdim, 1);
    }
    
    printPointsData(points, steps);
    lastRunPoints = points;
    
    return {
        caso: radiuses.caso,
        points: points,
        initialConditions: initialConditions,
        radiuses: [radiuses.r0, radiuses.r1, radiuses.r2],
        analiticRadiuses: [radiuses.rc1, radiuses.rc2],
    };
}

function fillMissingInitialConditionsSchwarzschild(initialConditions) {
    var r = initialConditions.rAdim;
    var vr = initialConditions.vrAdim;
    var vrSign = initialConditions.vrSign;
    var phi = initialConditions.phiAdim || 0.0;
    var vphi = initialConditions.vphiAdim;
    var L = initialConditions.LAdim;
    var epsilon = initialConditions.epsilonAdim;
    var properTimeIncrementAdim = initialConditions.totalProperTimeAdim / initialConditions.stepsCount;

    if (r !== undefined && vr !== undefined && vphi !== undefined) {
        if (L !== undefined)
            throw InvalidInitialConditionsError('No puedes especificar L si has especificado r, vr y vphi');
        if (epsilon !== undefined)
            throw InvalidInitialConditionsError('No puedes especificar epsilon si has especificado r, vr y vphi');
        if (vr != 0 && vrSign !== undefined && (vr * vrSign) < 0)
            throw InvalidInitialConditionsError('El signo de vr no es coherente con el valor de vr');

        L = vphi * Math.pow(r, 2);
        epsilon = Math.pow(vr, 2) + getEinsteinPotential(r, L);
        if (vr != 0)
            vrSign = vr/Math.abs(vr);

    } else if (L !== undefined && epsilon !== undefined) {

        if (r !== undefined) {
            if (vr !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, epsilon y r');
            if (Math.abs(vrSign) !== 1)
                throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, epsilon y r');

            vphi = L/Math.pow(r, 2);
            var vrAbsSquare = Math.abs(epsilon - getEinsteinPotential(r, L));
            vr = vrSign * Math.sqrt(vrAbsSquare);

        } else if (vr !== undefined) {
            if (r !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, epsilon y vr');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, epsilon y vr');
            if (vr != 0 && vrSign !== undefined && (vr * vrSign) < 0)
                throw InvalidInitialConditionsError('El signo de vr no es coherente con el valor de vr');

            var rSolutions = solveCubic(Math.pow(vr, 2) - epsilon, -1, Math.pow(L, 2), -Math.pow(L, 2));
            r = getMax(rSolutions);
            vphi = L/Math.pow(r, 2);
            if (vr != 0)
                vrSign = vr/Math.abs(vr);

        } else if (vphi !== undefined) {
            if (r !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, epsilon y vphi');
            if (vr !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, epsilon y vphi');
            if (Math.abs(vrSign) !== 1)
                throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');

            r = Math.sqrt(Math.abs(L / vphi));
            var vrAbsSquare = Math.abs(epsilon - getEinsteinPotential(r, L));
            vr = vrSign * Math.sqrt(vrAbsSquare);
        }
    } else {
        var errorMsg = 'Condiciones iniciales incorrectas.' +
            ' Es obligatorio especificar uno de estos grupos de valores:<br/>' +
            '    - r, vr, vphi<br/>' +
            '    - L, epsilon, r<br/>' +
            '    - L, epsilon, vr<br/>' +
            '    - L, epsilon, vphi';

        throw InvalidInitialConditionsError(errorMsg);
    }

    schwarzschildToSi(
        Object.assign(
            initialConditions,
            {
                properTimeIncrementAdim: properTimeIncrementAdim,
                rAdim      : r,
                vrAdim     : vr,
                vrSign     : vrSign,
                phiAdim    : phi,
                vphiAdim   : vphi,
                LAdim      : L,
                epsilonAdim: epsilon,
            }
        )
    );
}

function initializeStepDataSchwarzschild(initialConditions) {
    var r0 = initialConditions.rAdim;
    var vr0 = initialConditions.vrAdim;
    var vrSign = initialConditions.vrSign;
    var phi0 = initialConditions.phiAdim;
    var vphi0 = initialConditions.vphiAdim;
    var theta0 =  Math.PI/2;
    var vtheta0 = 0.0;
    vt0 = Math.sqrt(
        1 / (1 - SCHWARZSCHILD_RADIUS/r0) * (
            1 
            + 1/(1-SCHWARZSCHILD_RADIUS/r0) * Math.pow(vr0,2)
            + Math.pow(vtheta0,2) * Math.pow(r0,2)
            + Math.pow(vphi0,2) * Math.pow(Math.sin(theta0) * r0, 2)
        )
    );

    return {
        vt    : vt0,
        r     : r0,
        vr    : vr0,
        vrSign: vrSign,
        phi   : phi0,
        vphi  : vphi0,
        theta : theta0,
        vtheta: vtheta0,
    };
}

function plotSchwarzschildPotentialChart(initialConditions) {
    var L = initialConditions.LAdim;
    var epsilon = initialConditions.epsilonAdim;

    var radiuses = getSchwarzschildRadiuses(initialConditions);
    var definedRadiuses = [ radiuses.r0, radiuses.r1, radiuses.r2 ]
        .filter(function(r) { return r !== undefined; });

    if (definedRadiuses.length == 0) {
        definedRadiuses = [5 * initialConditions.rAdim];
    }
    
    var maxXRange = (TRAJECTORY_PLOT_DRAW_OUTSIDE_ZOOM_FACTOR * TRAJECTORY_PLOT_MARGIN_FACTOR * getMax(definedRadiuses));
    if (!radiuses.r2 || radiuses.r1 == radiuses.r2)
        maxXRange *= 5;

    var xRange = [0, maxXRange/TRAJECTORY_PLOT_DRAW_OUTSIDE_ZOOM_FACTOR];

    var potential_plot_resolution = (maxXRange / POTENTIAL_PLOT_POINTS_COUNT);
    var plotXValues = range(0, POTENTIAL_PLOT_POINTS_COUNT)
        .map(function(r) { return (r * potential_plot_resolution) + INFINITESIMAL; });

    var plotYValues = plotXValues
        .map(function(x) { return getEinsteinPotential(x, L); });

    var energyValues = plotXValues.map(function() { return epsilon; });

    var potentialData = [
        { x: plotXValues, y: plotYValues },
        { x: plotXValues, y: energyValues },
    ];
    
    // var minL = Math.abs(getMin(plotYValues));
    // var maxL = Math.abs(getMax(plotYValues));
    // var minLExtremeValue = Math.min(minL, maxL);
    // var yRangeValue = Math.max(minLExtremeValue, Math.abs(epsilon));
    // yRangeValue *= TRAJECTORY_PLOT_MARGIN_FACTOR;
    
    yRangeValue = TRAJECTORY_PLOT_MARGIN_FACTOR * Math.abs(epsilon);
    var yRange = [ -yRangeValue, yRangeValue ];
    
    var layout = {
      title: 'Energía Potencial',
      paper_bgcolor: '#000',
      plot_bgcolor: '#000',
      showlegend: false,
      font: {
          color: '#fff',
      },
      titlefont: {
          color: '#fff',
      },
      xaxis: {
        title: 'Radio',
        range: xRange,
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
      yaxis: {
        title: 'Energía Potencial',
        range: yRange,
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      }
    };
    var plotElem = $('#potentialPlot')[0];
    Plotly.newPlot(plotElem, potentialData, layout);

}

function siToSchwarzschild(initialConditions) {
    var M = initialConditions.M;
    var a = (2*G*M)/SPEED_LIGHT_SQR;
    var m = initialConditions.m;

    var totalProperTimeSi = initialConditions.totalProperTimeSi;
    var properTimeIncrementSi = initialConditions.properTimeIncrementSi;
    var rSi = initialConditions.rSi;
    var vrSi = initialConditions.vrSi;
    var phiSi = initialConditions.phiSi;
    var vphiSi = initialConditions.vphiSi;
    var LSi = initialConditions.LSi;
    var epsilonSi = initialConditions.epsilonSi;
    
    // https://crul.github.io/CursoRelatividadGeneralJavierGarcia/#capitulo-38 ??
    var totalProperTime = tSiToTSchwarzschild(a, totalProperTimeSi);
    var properTimeIncrement = tSiToTSchwarzschild(a, properTimeIncrementSi);
    var r = rSiToRSchwarzschild(a, rSi);
    var vr = (vrSi !== undefined ? (vrSi / SPEED_LIGHT) : undefined);
    var phi = phiSi;
    var vphi = (vphiSi !== undefined ? (a * vphiSi / SPEED_LIGHT) : undefined);
    var L = (LSi !== undefined ? (LSi / (m * a * SPEED_LIGHT)) : undefined);
    var epsilon = epsilonSiToEpsilonSchwarzschild(m, epsilonSi);

    Object.assign(initialConditions, {
        totalProperTimeAdim: totalProperTime,
        properTimeIncrementAdim: properTimeIncrement,
        rAdim      : r,
        vrAdim     : vr,
        phiAdim    : phi,
        vphiAdim   : vphi,
        LAdim      : L,
        epsilonAdim: epsilon,
        a          : a,
    });
}

function schwarzschildToSi(initialConditions) {
    var M = initialConditions.M;
    var a = (2*G*M)/SPEED_LIGHT_SQR;
    var m = initialConditions.m;

    var totalProperTime = initialConditions.totalProperTimeAdim;
    var properTimeIncrement = initialConditions.properTimeIncrementAdim;
    var r = initialConditions.rAdim;
    var vr = initialConditions.vrAdim;
    var vrSign = initialConditions.vrSign;
    var phi = initialConditions.phiAdim;
    var vphi = initialConditions.vphiAdim;
    var L = initialConditions.LAdim;
    var epsilon = initialConditions.epsilonAdim;
    
    // https://crul.github.io/CursoRelatividadGeneralJavierGarcia/#capitulo-38 ??
    var totalProperTimeSi = tSchwarzschildToTSi(a, totalProperTime);
    var properTimeIncrementSi = tSchwarzschildToTSi(a, properTimeIncrement);
    var rSi = rSchwarzschildToRSi(a, r);
    var vrSi = (vr !== undefined ? (vr * SPEED_LIGHT) : undefined);
    var phiSi = phi;
    var vphiSi = (vphi !== undefined ? (SPEED_LIGHT * vphi / a) : undefined);
    var LSi = (L !== undefined ? (L * (m * a * SPEED_LIGHT)) : undefined);
    var epsilonSi = epsilonSchwarzschildToEpsilonSi(m, epsilon);

    Object.assign(initialConditions, {
        totalProperTimeSi: totalProperTimeSi,
        properTimeIncrementSi: properTimeIncrementSi,
        rSi      : rSi,
        vrSi     : vrSi,
        phiSi    : phiSi,
        vphiSi   : vphiSi,
        LSi      : LSi,
        epsilonSi: epsilonSi,
        a        : a,
    });
}

function tSiToTSchwarzschild(a, t) {
    return (t == undefined ? undefined : SPEED_LIGHT * (t / a));
}

function rSiToRSchwarzschild(a, r) {
    return (r == undefined ? undefined :r / a);
}

function tSchwarzschildToTSi(a, t) {
    return (t == undefined ? undefined : t * a / SPEED_LIGHT);
}

function rSchwarzschildToRSi(a, r) {
    return (r == undefined ? undefined : r * a);
}

function epsilonSiToEpsilonSchwarzschild(m, epsilon) {
    return (epsilon !== undefined ? (epsilon / (m * SPEED_LIGHT_SQR)) : undefined);
}

function epsilonSchwarzschildToEpsilonSi(m, epsilon) {
    return (epsilon !== undefined ? (epsilon * m * SPEED_LIGHT_SQR) : undefined);
}

function getEinsteinPotential(r, L) {
    return Math.pow(L/r, 2) - (1/r) - (Math.pow(L, 2)/Math.pow(r, 3));
}

function getSchwarzschildRadiuses(initialConditions) {
    var L = initialConditions.LAdim;
    var LSquare = Math.pow(L, 2);
    var epsilon = initialConditions.epsilonAdim;
    var r = initialConditions.rAdim;
    var r0, r1, r2;
    var caso = 0;

    if (LSquare <= 3) {         // L <= 3
        if (epsilon < 0) {      //   epsilon < 0
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            caso = 1;
        }
    } else if (LSquare <= 4) {  // 3 < L <= 4
        var rc1 = L * (L - Math.sqrt(LSquare - 3));
        var rc2 = L * (L + Math.sqrt(LSquare - 3));
        var minimumPotential = getEinsteinPotential(rc2, L);
        var maximumPotential = getEinsteinPotential(rc1, L);

        if (epsilon < minimumPotential - INFINITESIMAL_FOR_RADIUSES) {
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            caso = 5;

        } else if (Math.abs(epsilon - minimumPotential) < INFINITESIMAL_FOR_RADIUSES) {
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            r1 = rc2;
            r2 = rc2;
            caso = 4;

        } else if (epsilon > minimumPotential && epsilon < maximumPotential) {
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, rc1, L, epsilon);
            r1 = einsteinianBisection(rc1, rc2, L, epsilon);
            r2 = einsteinianBisection(rc2, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            caso = 3; // 3b

        } else if (Math.abs(epsilon - maximumPotential) < INFINITESIMAL_FOR_RADIUSES) {
            r0 = rc1;
            r1 = rc1;
            r2 = einsteinianBisection(rc2, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            caso = 3; // 3a

        } else if (epsilon > maximumPotential && epsilon < 0) {
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            caso = 2;
        }

    } else {                    // L > 4
        var rc1 = L * (L - Math.sqrt(LSquare - 3));
        var rc2 = L * (L + Math.sqrt(LSquare - 3));
        var minimumPotential = getEinsteinPotential(rc2, L);
        var maximumPotential = getEinsteinPotential(rc1, L);

        if (epsilon < minimumPotential) {
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            caso = 10;

        } else if (Math.abs(epsilon - minimumPotential) < INFINITESIMAL_FOR_RADIUSES) {
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            r1 = rc2;
            r2 = rc2;
            caso = 9;

        } else if (Math.abs(epsilon - maximumPotential) < INFINITESIMAL_FOR_RADIUSES) {
            r0 = rc1;
            r1 = rc1;
            caso = 8;

        } else if (epsilon < 0 && epsilon >= minimumPotential){
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, rc1, L, epsilon);
            r1 = einsteinianBisection(rc1, rc2, L, epsilon);
            r2 = einsteinianBisection(rc2, MAX_RADIUSES_FOR_BISECTION, L, epsilon);
            caso = 7;

        } else if (epsilon >= 0 && epsilon <= maximumPotential){
            r0 = einsteinianBisection(MIN_RADIUSES_FOR_BISECTION, rc1, L, epsilon);
            r1 = einsteinianBisection(rc1, rc2, L, epsilon);
            caso = 6;
        }
    }

    return { r0: r0, r1: r1, r2: r2, rc1: rc1, rc2: rc2, caso: caso };
}

function einsteinianBisection(a, b, L, epsilon) {
    if (!a.length) a = [a];
    if (!b.length) b = [b];
    
    var isThereAnyError = false;
    for (var aIdx in a) {
        var aElem = a[aIdx];
        for (var bIdx in b) {
            var bElem = b[bIdx];
            try {
                var candidate = executeEinsteinianBisection(aElem, bElem, L, epsilon);
                if (candidate != aElem && candidate != bElem)
                    return candidate;   
            } catch {
                isThereAnyError = true;
            }
        }
    }

    if (isThereAnyError)
        throw InvalidInitialConditionsError('Bisección no aplicable');
}

function executeEinsteinianBisection(a, b, L, epsilon) {
    var errEqualToPrevErrCount = 0;
    var A = epsilon - getEinsteinPotential(a, L);
    var B = epsilon - getEinsteinPotential(b, L);

    if (A*B > 0) {
        throw InvalidInitialConditionsError('Bisección no aplicable');
    }
    
    var p = (a + b) / 2;
    var f1;
    var f2 = epsilon - getEinsteinPotential(p, L);
    var err = Math.abs(f2);
    var prevErr = err;
    while (err > BISECTION_ERROR_THERSHOLD) {
        f1 = epsilon - getEinsteinPotential(a, L);
        f2 = epsilon - getEinsteinPotential(p, L);
        if (f1 * f2 < 0)
            b = p;
        else
            a = p;

        p = (a + b) / 2;
        err = Math.abs(f2);
        if (err == prevErr) {
            errEqualToPrevErrCount++;
            if (errEqualToPrevErrCount > 1) {
                console.warn('\nWARNING: exiting bisection before err below threshold', err);
                break;
            }
        }

        prevErr = err;
    }

    return p;
}
