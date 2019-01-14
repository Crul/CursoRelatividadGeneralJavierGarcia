function runNewton() {
    var initialConditions = getFormData();

    var b;
    var R = initialConditions.R;
    var isThereSiData = true;
    if (initialConditions.siUnits) {
        checkInitialConditionsInSi(initialConditions);
        setHash(initialConditions);
        siToBel(initialConditions);
    } else {
        try {
            checkInitialConditionsInSi(initialConditions);
        } catch(ex) {
            isThereSiData = false;
        }
        setHash(initialConditions);
    }

    fillMissingInitialConditionsNewton(initialConditions);

    var r = initialConditions.rAdim;
    var phi = initialConditions.phiAdim;
    var vr = initialConditions.vrAdim;
    var L = initialConditions.LAdim;
    var epsilon = initialConditions.epsilonAdim;

    var radiuses = getNewtonRadiuses(L, epsilon);
    var stepData = initializeStepDataNewton(r, vr, phi, radiuses);

    var dt     = initialConditions.properTimeIncrementAdim;
    var steps  = initialConditions.stepsCount;
    var points = { 'paso': [] };
    var minR = 2;  // Bel radius
    if (initialConditions.siUnits) {
        points['tSi'] = [];
        points['xSi'] = [];
        points['ySi'] = [];
        points['rSi'] = [];
        points['phiSi'] = [];
    } else {
        points['t'] = [];
        points['x'] = [];
        points['y'] = [];
        points['r'] = [];
        points['phi'] = [];
    }

    for (var i=0; i < steps; i++) {
        movePointRungeKutta(radiuses, stepData, epsilon, L, dt, getNewtonPotential);

        var t = i * dt;
        var rStepValue = stepData.r;
        var x = rStepValue*Math.cos(stepData.phi);
        var y = rStepValue*Math.sin(stepData.phi);

        points.paso.push(i);
        if (initialConditions.siUnits) {
            points.tSi.push(tBelToTSi(R, initialConditions.b, t));
            points.xSi.push(rBelToRSi(R, x));
            points.ySi.push(rBelToRSi(R, y));
            points.rSi.push(rBelToRSi(R, rStepValue));
            points.phiSi.push(stepData.phi);
        } else {
            points.t.push(t);
            points.x.push(x);
            points.y.push(y);
            points.r.push(rStepValue);
            points.phi.push(stepData.phi);
        }

        if (stepData.r < minR) {
            for (pointsArray in points)
                points[pointsArray].pop();

            console.warn('Integrator skipped at r=%0.5frs, next iteration r=%0.5frs');
            break;
        }
    }

    if (initialConditions.siUnits) {
        plotTrajectory(points.xSi, points.ySi, R);
    } else {
        plotTrajectory(points.x, points.y, 2);
    }
    
    printPointsData(points, steps);
    lastRunPoints = points;

    return {
        caso: getCaso(L, epsilon),
        points: points,
        initialConditions: initialConditions,
        radiuses: [radiuses.r1, radiuses.r2],
        analiticRadiuses: [radiuses.analiticR1, radiuses.analiticR2],
    };
}

function fillMissingInitialConditionsNewton(initialConditions) {
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
            throw InvalidInitialConditionsError('No puedes especificar E si has especificado r, vr y vphi');
        if (vr != 0 && vrSign !== undefined && (vr * vrSign) < 0)
            throw InvalidInitialConditionsError('El signo de vr no es coherente con el valor de vr');

        L = vphi * Math.pow(r, 2);
        epsilon = (Math.pow(vr, 2) / 2) + getNewtonPotential(r, L);
        if (vr != 0)
            vrSign = vr/Math.abs(vr);

    } else if (L !== undefined && epsilon !== undefined) {

        if (r !== undefined) {
            if (vr !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, E y r');
            if (Math.abs(vrSign) !== 1)
                throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y r');

            vphi = L/Math.pow(r, 2);
            var vrAbsSquare = 2 * (epsilon - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vrAbsSquare < 0)
                throw InvalidInitialConditionsError('Valor dentro de la raíz de velocidad radial es negativo.');
            vr = vrSign * Math.sqrt(vrAbsSquare);

        } else if (vr !== undefined) {
            if (r !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, E y vr');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y vr');
            if (vr != 0 && vrSign !== undefined && (vr * vrSign) < 0)
                throw InvalidInitialConditionsError('El signo de vr no es coherente con el valor de vr');

            var cuadEqA = (epsilon - (Math.pow(vr, 2))/2);
            var cuadEqB = 1;
            var cuadEqC = - Math.pow(L, 2)/2;

            var cuadEqSolB2Minus4AC = (
                Math.pow(cuadEqB, 2)
                - (4 * cuadEqA * cuadEqC)
            );
            var r1 = (
                (- cuadEqB + Math.sqrt(cuadEqSolB2Minus4AC))
                / ( 2 *cuadEqA )
            );
            var r2 = (
                (- cuadEqB - Math.sqrt(cuadEqSolB2Minus4AC))
                / ( 2 *cuadEqA )
            );
            r = Math.max(r1, r2);
            vphi = L/Math.pow(r, 2);
            if (vr != 0)
                vrSign = vr/Math.abs(vr);

        } else if (vphi !== undefined) {
            if (r !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, E y vphi');
            if (vr !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, E y vphi');
            if (Math.abs(vrSign) !== 1)
                throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');

            r = Math.sqrt(Math.abs(L / vphi));
            var vrAbsSquare = 2 * (epsilon - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vrAbsSquare < 0)
                throw InvalidInitialConditionsError('Valor dentro de la raíz de velocidad radial es negativo.');
            vr = vrSign * Math.sqrt(vrAbsSquare);
        }

    } else {
        var errorMsg = 'Condiciones iniciales incorrectas.' +
            ' Es obligatorio especificar uno de estos grupos de valores:<br/>' +
            '    - r, vr, vphi<br/>' +
            '    - L, E, r<br/>' +
            '    - L, E, vr<br/>' +
            '    - L, E, vphi<br/>';

        throw InvalidInitialConditionsError(errorMsg);
    }

    belToSi(
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

function initializeStepDataNewton(r, vr, phi, radiuses) {
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var vrSign = undefined;

    var isThereAnyRadius = !(r1 === undefined && r2 === undefined);
    if (isThereAnyRadius && vr == 0) {
        var isClosedOrbit = !(r1 === undefined || r2 === undefined);
        if (isClosedOrbit) { // casos 5, 6;
            var d1 = Math.abs(r-r1);
            var d2 = Math.abs(r-r2);
            vrSign = (d1 > d2 ? -1 : 1);
        } else {
            if (r1 === undefined)  // caso 2;
                vrSign = -1;
            else  // caso 4;
                vrSign = 1;
        }

        r = r + vrSign * INFINITESIMAL;

    } else { // casos 1, 3;
        vrSign = vr / Math.abs(vr);
    }

    return { r: r, phi: phi, vrSign: vrSign };
}

function plotNewtonPotentialChart(initialConditions) {
    var L = initialConditions.LAdim;
    var epsilon = initialConditions.epsilonAdim;
    var radiuses = getNewtonRadiuses(L, epsilon); // DRY
    
    var maxXRange = Math.max(radiuses.analiticR1, radiuses.analiticR2);
    if (isNaN(maxXRange)) {
        maxXRange = (radiuses.analiticR1 || radiuses.analiticR2);
        if (!radiuses.analiticR2) {
            maxXRange *= 5;
        }
    }
    maxXRange *= (TRAJECTORY_PLOT_DRAW_OUTSIDE_ZOOM_FACTOR * TRAJECTORY_PLOT_MARGIN_FACTOR);

    var xRange = [0, maxXRange/TRAJECTORY_PLOT_DRAW_OUTSIDE_ZOOM_FACTOR];

    var potential_plot_resolution = (maxXRange / POTENTIAL_PLOT_POINTS_COUNT);
    var plotXValues = range(0, POTENTIAL_PLOT_POINTS_COUNT)
        .map(function(r) { return (r * potential_plot_resolution) + INFINITESIMAL; });

    var plotYValues = plotXValues
        .map(function(x) { return getNewtonPotential(x, L); });

    var energyValues = plotXValues.map(function() { return epsilon; });

    var potentialData = [
        { x: plotXValues, y: plotYValues },
        { x: plotXValues, y: energyValues },
    ];

    var minL = Math.abs(getMin(plotYValues));
    var maxL = Math.abs(getMax(plotYValues));
    var minLExtremeValue = Math.min(minL, maxL);
    var yRangeValue = Math.max(minLExtremeValue, Math.abs(epsilon));
    yRangeValue *= TRAJECTORY_PLOT_MARGIN_FACTOR;
    
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
    Plotly.newPlot($('#potentialPlot')[0], potentialData, layout);
}

function siToBel(initialConditions) {
    var M = initialConditions.M;
    var R = initialConditions.R;
    var b = getBBel(M, R);
    var m = initialConditions.m;

    var totalProperTimeSi = initialConditions.totalProperTimeSi;
    var properTimeIncrementSi = initialConditions.properTimeIncrementSi;
    var rSi = initialConditions.rSi;
    var vrSi = initialConditions.vrSi;
    var phiSi = initialConditions.phiSi;
    var vphiSi = initialConditions.vphiSi;
    var LSi = initialConditions.LSi;
    var epsilonSi = initialConditions.epsilonSi;
    
    var totalProperTime = tSiToTBel(R, b, totalProperTimeSi);
    var properTimeIncrement = tSiToTBel(R, b, properTimeIncrementSi);
    var r = rSiToRBel(R, rSi);
    var vr = (vrSi !== undefined ? (vrSi / b) : undefined);
    var phi = phiSi;
    var vphi = (vphiSi !== undefined ? (vphiSi * (R/(2*b))) : undefined);
    var L = (LSi !== undefined ? (2 * LSi / (m * b * R)) : undefined);
    var epsilon = epsilonSiToEpsilonBel(m, b, epsilonSi);

    Object.assign(initialConditions, {
        totalProperTimeAdim: totalProperTime,
        properTimeIncrementAdim: properTimeIncrement,
        rAdim      : r,
        vrAdim     : vr,
        phiAdim    : phi,
        vphiAdim   : vphi,
        LAdim      : L,
        epsilonAdim: epsilon,
        b          : b,
    });
}

function belToSi(initialConditions) {
    var M = initialConditions.M;
    var R = initialConditions.R;
    var b = getBBel(M, R);
    var m = initialConditions.m;
    
    var totalProperTime = initialConditions.totalProperTimeAdim;
    var properTimeIncrement = initialConditions.properTimeIncrementAdim;
    var r = initialConditions.rAdim;
    var vr = initialConditions.vrAdim;
    var phi = initialConditions.phiAdim;
    var vphi = initialConditions.vphiAdim;
    var L = initialConditions.LAdim;
    var epsilon = initialConditions.epsilonAdim;

    var totalProperTimeSi = tBelToTSi(R, b, totalProperTime);
    var properTimeIncrementSi = tBelToTSi(R, b, properTimeIncrement);
    var rSi = rBelToRSi(R, r);
    var vrSi = (vr !== undefined ? (vr * b) : undefined);
    var phiSi = phi;
    var vphiSi = (vphi !== undefined ? (vphi * ((2*b)/R)) : undefined);
    var LSi = (L !== undefined ? (L * (m * b * R) / 2) : undefined);
    var epsilonSi = epsilonBelToEpsilonSi(m, b, epsilon);

    Object.assign(initialConditions, {
        totalProperTimeSi: totalProperTimeSi,
        properTimeIncrementSi: properTimeIncrementSi,
        rSi      : rSi,
        vrSi     : vrSi,
        phiSi    : phiSi,
        vphiSi   : vphiSi,
        LSi      : LSi,
        epsilonSi: epsilonSi,
        b        : b,
    });
}

function getBBel(M, R) {
    return Math.sqrt(2*G*M/R);
}

function tSiToTBel(R, b, t) {
    return (t === undefined ? undefined : t * (2 * b / R));
}

function rSiToRBel(R, r) {
    return (r === undefined ? undefined : r * (2/R));
}

function tBelToTSi(R, b, t) {
    return (t === undefined ? undefined : (R * t) / (2 * b));
}

function rBelToRSi(R, r) {
    return (r === undefined ? undefined : r * (R/2));
}

function epsilonSiToEpsilonBel(m, b, epsilon) {
    return (epsilon !== undefined ? (epsilon / (m * Math.pow(b, 2))) : undefined)
}

function epsilonBelToEpsilonSi(m, b, epsilon) {
    return (epsilon !== undefined ? (epsilon * m * Math.pow(b, 2)) : undefined)
}

function radiusesBelToSi(R, radiuses) {
    var r1 = rBelToRSi(R, radiuses.r1);
    var r2 = rBelToRSi(R, radiuses.r2);
    var analiticR1 = rBelToRSi(R, radiuses.analiticR1);
    var analiticR2 = rBelToRSi(R, radiuses.analiticR2);

    return { r1: r1, r2: r2, analiticR1: analiticR1, analiticR2: analiticR2 };
}

function getNewtonPotential(r, L) {
    return -1/r + (Math.pow((L/r), 2))/2;
}

function getNewtonRadiuses(L, epsilon) {
    var r1, r2, analiticR1, analiticR2;
    var circularOrbitE =  (L != 0 ? -1/(2*(Math.pow(L, 2))) : undefined);
    var isCircularOrbit = (epsilon == circularOrbitE);

    if (isCircularOrbit) {  // caso 6: circular orbit;
        r1 = Math.pow(L, 2);
        r2 = Math.pow(L, 2);
        analiticR1 = r1;
        analiticR2 = r2;

    } else {                 // is NOT circular orbit;

        if (Math.abs(L) > 0) {     // ... casos 3, 4, 5;
            var a = BISECTION_MIN;
            var b = Math.pow(L, 2);
            r1 = bisection(a, b, L, epsilon);

            if (Math.abs(epsilon) < E_THRESHOLD_TO_BE_CONSIDERED_ZERO)
                analiticR1 = (Math.pow(L, 2))/2;
            else
                analiticR1 = (1/(2*epsilon)) * ( -1 + Math.sqrt( 1+2*epsilon*(Math.pow(L, 2)) )  );
        }
        if (epsilon < 0) {          // ... casos 2, 5;
            var a = (Math.abs(L) > 0 ? Math.pow(L, 2) : BISECTION_MIN);
            var b = BISECTION_MAX;
            r2 = bisection(a, b, L, epsilon);
            analiticR2 = (1/(2*epsilon)) * ( -1  -  Math.sqrt( 1+2*epsilon*(Math.pow(L, 2)) )  );
        }
    }

    return { r1: r1, r2: r2, analiticR1: analiticR1, analiticR2: analiticR2 };
}

function getCaso(L, epsilon) {
    if (L==0) return (epsilon >= 0 ? 1 : 2);

    var circularOrbitE =  (L != 0 ? -1/(2*(Math.pow(L, 2))) : undefined);
    var isCircularOrbit = (epsilon == circularOrbitE);

    if (isCircularOrbit) return 6;

    if (epsilon == 0) return 3;

    if (epsilon > 0) return 4;

    // if (epsilon < 0)
    return 5;
}

function movePointRungeKutta(radiuses, stepData, epsilon, L, dt, getPotentialFn) {
    /* Runge-Kutta
    k_1 = h * f(t_n, y_n)
    k_2 = h * f(t_n + h/2, y_n + k1/2)
    k_3 = h * f(t_n + h/2, y_n + k2/2)
    k_4 = h * f(t_n + h, y_n + k3)
    y_n+1 = y_n + (k1 + 2*k_2 + 2*k3 + k4)     */

    var r = stepData.r;
    var deltas = calcRungeKutta(dt, stepData.r, stepData.vrSign, epsilon, L, getPotentialFn);

    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var isClosedOrbit = !(r1 === undefined || r2 === undefined);

    var isInsideEllipseRadiuses = isClosedOrbit && (r > r1 && r < r2);
    var isOpenTrajectoryOverThreshold = (!isClosedOrbit) && (r >= INFINITESIMAL);
    if (isInsideEllipseRadiuses || isOpenTrajectoryOverThreshold) {
        stepData.r   += deltas.r;
        stepData.phi += deltas.phi;
    }

    var isRBelowMinimumRadius = (r1 !== undefined) && (r <= r1);
    if (isRBelowMinimumRadius) { // There is a minimum radius and we are below;
        stepData.vrSign = 1;
        stepData.r += INFINITESIMAL;
        if (isClosedOrbit) {
            deltas = calcRungeKutta(dt, stepData.r, stepData.vrSign, epsilon, L, getPotentialFn);
            stepData.r   += deltas.r;
            stepData.phi += deltas.phi;
        }
    }

    var isRAboveMaximumRadius = (r2 !== undefined) && (r >= r2);
    if (isRAboveMaximumRadius) { // There is a maximum radius and we are below;
        stepData.vrSign = -1;
        stepData.r -= INFINITESIMAL;
        if (isClosedOrbit) {
            deltas = calcRungeKutta(dt, stepData.r, stepData.vrSign, epsilon, L, getPotentialFn);
            stepData.r   += deltas.r;
            stepData.phi += deltas.phi;
        }
    }
}

function calcRungeKutta(dt, r, vrSign, epsilon, L, getPotentialFn) {
    var h = dt;
    var fValueK1 = fForRungeKutta(r, vrSign, epsilon, L, getPotentialFn);
    var k1Vr = h * fValueK1.vr;
    var k1Vphi = h * fValueK1.vphi;

    var fValueK2 = fForRungeKutta(r + k1Vr/2, vrSign, epsilon, L, getPotentialFn);
    var k2Vr = h * fValueK2.vr;
    var k2Vphi = h * fValueK2.vphi;

    var fValueK3 = fForRungeKutta(r + k2Vr/2, vrSign, epsilon, L, getPotentialFn);
    var k3Vr = h * fValueK3.vr;
    var k3Vphi = h * fValueK3.vphi;

    var fValueK4 = fForRungeKutta(r + k3Vr, vrSign, epsilon, L, getPotentialFn);
    var k4Vr = h * fValueK4.vr;
    var k4Vphi = h * fValueK4.vphi;

    var deltaR = getValueFromRungeKuttaKs(k1Vr, k2Vr, k3Vr, k4Vr);
    var deltaPhi = getValueFromRungeKuttaKs(k1Vphi, k2Vphi, k3Vphi, k4Vphi);
    var deltas = { r: deltaR, phi: deltaPhi };

    return deltas;
}

function fForRungeKutta(r, vrSign, epsilon, L, getPotentialFn) {
    var vphi = L / (Math.pow(r, 2));
    var valueInsideSqrtOfVr = 2*Math.abs(epsilon - getPotentialFn(r, L));
    var vr = vrSign * Math.sqrt(valueInsideSqrtOfVr);

    return { vphi: vphi, vr: vr };
}

function getValueFromRungeKuttaKs(k1, k2, k3, k4) {
    return (k1 + 2*k2 + 2*k3 + k4) / 6;
}

function bisection(a, b, L, epsilon) {
    var errEqualToPrevErrCount = 0;
    var A = epsilon - getNewtonPotential(a, L);
    var B = epsilon - getNewtonPotential(b, L);

    if (A*B > 0)
        throw InvalidInitialConditionsError('Bisección no aplicable');

    var p = (a + b)/2;
    var f1;
    var f2 = epsilon - getNewtonPotential(p, L);
    var err = Math.abs(f2);
    var prevErr = err;
    while (err > BISECTION_ERROR_THERSHOLD) {
        f1 = epsilon - getNewtonPotential(a, L);
        f2 = epsilon - getNewtonPotential(p, L);
        if (f1*f2<0)
            b = p;
        else
            a = p;

        p = (a + b)/2;
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
