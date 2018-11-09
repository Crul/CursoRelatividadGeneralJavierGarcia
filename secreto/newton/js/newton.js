var lastRunResult, lastRunPoints;
var movePointFnByMethod = {
    'euler': movePointEuler,
    'runge-kutta': movePointRungeKutta,
}

function InvalidInitialConditionsError(message) {
    this.name = 'InvalidInitialConditionsError';
    this.message = (message || '');
    return this;
}
InvalidInitialConditionsError.prototype = Error.prototype;

function processInitialConditions() {
    var initialConditions = getFormData();
    if (initialConditions.siUnits) {
        var R = initialConditions.R;
        checkInitialConditionsInSi(initialConditions);
        setHash(initialConditions);
        var b = getB(initialConditions.M, R);
        siToBel(b, initialConditions);
    } else {
        setHash(initialConditions);
    }

    fillMissingInitialConditions(initialConditions);

    var L = initialConditions.L;
    var E = initialConditions.E;

    plotPotentialChart(L, E);
    
    return initialConditions;
}

function run(initialConditions) {
    var initialConditions = getFormData();
    $('#pointsDataTable').html('');

    var b;
    var R = initialConditions.R;
    var isThereSiData = true;
    if (initialConditions.siUnits) {
        checkInitialConditionsInSi(initialConditions);
        setHash(initialConditions);
        b = getB(initialConditions.M, R);
        siToBel(b, initialConditions);
    } else {
        try {
            checkInitialConditionsInSi(initialConditions);
        } catch(ex) {
            isThereSiData = false;
        }
        setHash(initialConditions);
    }

    fillMissingInitialConditions(initialConditions);

    var r = initialConditions.r;
    var phi = initialConditions.phi;
    var vr = initialConditions.vr;
    var L = initialConditions.L;
    var E = initialConditions.E;

    plotPotentialChart(L, E);
    var radiuses = getRadiuses(L, E);
    var stepData = initializeStepData(r, vr, phi, radiuses);

    var method = initialConditions.method;
    var dt     = initialConditions.timeResolution;
    var steps  = initialConditions.simulationTime / initialConditions.timeResolution;
    var points = {
        t: [],
        x: [],
        y: [],
        phi: [],
        r: [],
    };
    if (isThereSiData) {
        points['xSi'] = [];
        points['ySi'] = [];
        points['phiSi'] = [];
        points['rSi'] = [];
    }

    for (var i=0; i < steps; i++) {
        movePointFnByMethod[method](radiuses, stepData, E, L, dt, getNewtonPotential);

        var r = stepData.r;
        var rStepValue = r;
        points.t.push(i * dt);
        var x = rStepValue*Math.cos(stepData.phi);
        points.x.push(x);
        var y = rStepValue*Math.sin(stepData.phi);
        points.y.push(y);
        points.r.push(rStepValue);
        points.phi.push(stepData.phi);

        if (isThereSiData) {
            points.xSi.push(rBelToRSi(R, x));
            points.ySi.push(rBelToRSi(R, y));
            points.rSi.push(rBelToRSi(R, rStepValue));
            points.phiSi.push(stepData.phi);
        }

    }

    plotTrajectory(points.x, points.y);
    if ($('#showPointsData').is(':checked'))
        printPointsData(points, steps);

    if (initialConditions.siUnits) {
        radiuses = radiusesBelToSi(R, radiuses);
        belToSi(b, initialConditions);
    }

    lastRunPoints = points;
    lastRunResult = {
        caso: getCaso(L, E),
        x: points.x,
        y: points.y,
        r: points.r,
        phi: points.phi,
        L: initialConditions.L,
        E: initialConditions.E,
        initialR:    initialConditions.r,
        initialPhi:  initialConditions.phi,
        initialVr:   initialConditions.vr,
        initialVphi: initialConditions.vphi,
        radiuses: [radiuses.r1, radiuses.r2],
        analiticRadiuses: [radiuses.analiticR1, radiuses.analiticR2],
    };

    return lastRunResult;
}

function initializeStepData(r, vr, phi, radiuses) {
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

function fillMissingInitialConditions(initialConditions) {
    var method = initialConditions.method || 'runge-kutta';
    var r = initialConditions.r;
    var vr = initialConditions.vr;
    var vrSign = initialConditions.vrSign;
    var phi = initialConditions.phi || 0.0;
    var vphi = initialConditions.vphi;
    var L = initialConditions.L;
    var E = initialConditions.E;

    if (r !== undefined && vr !== undefined && vphi !== undefined) {
        if (L !== undefined) throw InvalidInitialConditionsError('No puedes especificar L si has especificado r, vr y vphi');
        if (E !== undefined) throw InvalidInitialConditionsError('No puedes especificar E si has especificado r, vr y vphi');
        if (vr != 0 && vrSign !== undefined) throw InvalidInitialConditionsError('No puedes especificar el signo de vr si has especificado vr y es distinto de 0');

        L = vphi * Math.pow(r, 2);
        E = (Math.pow(vr, 2) / 2) + getNewtonPotential(r, L);
        vrSign = vr/Math.abs(vr);

    } else if (L !== undefined && E !== undefined) {

        if (r !== undefined) {
            if (vr !== undefined) throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, E y r');
            if (Math.abs(vrSign) !== 1) throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');
            if (vphi !== undefined) throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y r');

            vphi = L/Math.pow(r, 2);
            var vrAbsSquare = 2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vrAbsSquare < 0) throw InvalidInitialConditionsError('Valor dentro de la raíz de velocidad radial es negativo.');
            vr = vrSign * Math.sqrt(vrAbsSquare);

        } else if (vr !== undefined) {
            if (r !== undefined) throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, E y vr');
            if (vphi !== undefined) throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y vr');
            if (vr != 0 && vrSign !== undefined) throw InvalidInitialConditionsError('No puedes especificar el signo de vr si has especificado vr y es distinto de 0');

            var cuadEqA = (E - (Math.pow(vr, 2))/2);
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
            vrSign = vr/Math.abs(vr);

        } else if (vphi !== undefined) {
            if (r !== undefined) throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, E y vphi');
            if (vr !== undefined) throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, E y vphi');
            if (Math.abs(vrSign) !== 1) throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');

            r = Math.sqrt(Math.abs(L / vphi));
            var vrAbsSquare = 2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vrAbsSquare < 0) throw InvalidInitialConditionsError('Valor dentro de la raíz de velocidad radial es negativo.');
            vr = vrSign * Math.sqrt(vrAbsSquare);
        }

    } else {
        var errorMsg = 'Condiciones iniciales incorrectas.' +
            ' Es obligatorio especifical uno de estos grupos de valores:\n' +
            '    - r, vr, vphi\n' +
            '    - L, E, r\n' +
            '    - L, E, vr\n' +
            '    - L, E, vphi\n';

        throw InvalidInitialConditionsError(errorMsg);
    }

    Object.assign(initialConditions, {
        method: method,
        r: r,
        vr: vr,
        vrSign: vrSign,
        phi: phi,
        vphi: vphi,
        L: L,
        E: E,
    });
}

function getCaso(L, E) {
    if (L==0) return (E >= 0 ? 1 : 2);

    var circularOrbitE =  (L != 0 ? -1/(2*(Math.pow(L, 2))) : undefined);
    var isCircularOrbit = (E == circularOrbitE);

    if (isCircularOrbit) return 6;

    if (E == 0) return 3;

    if (E > 0) return 4;

    // if (E < 0)
    return 5;
}

function getRadiuses(L, E) {
    var r1, r2, analiticR1, analiticR2;
    var circularOrbitE =  (L != 0 ? -1/(2*(Math.pow(L, 2))) : undefined);
    var isCircularOrbit = (E == circularOrbitE);

    if (isCircularOrbit) {  // caso 6: circular orbit;
        r1 = Math.pow(L, 2);
        r2 = Math.pow(L, 2);
        analiticR1 = r1;
        analiticR2 = r2;

    } else {                 // is NOT circular orbit;

        if (Math.abs(L) > 0) {     // ... casos 3, 4, 5;
            var a = BISECTION_MIN;
            var b = Math.pow(L, 2);
            r1 = bisection(a, b, L, E);

            if (Math.abs(E) < E_THRESHOLD_TO_BE_CONSIDERED_ZERO)
                analiticR1 = (Math.pow(L, 2))/2;
            else
                analiticR1 = (1/(2*E)) * ( -1 + Math.sqrt( 1+2*E*(Math.pow(L, 2)) )  );
        }
        if (E < 0) {          // ... casos 2, 5;
            var a = (Math.abs(L) > 0 ? Math.pow(L, 2) : BISECTION_MIN);
            var b = BISECTION_MAX;
            r2 = bisection(a, b, L, E);
            analiticR2 = (1/(2*E)) * ( -1  -  Math.sqrt( 1+2*E*(Math.pow(L, 2)) )  );
        }
    }

    return { r1: r1, r2: r2, analiticR1: analiticR1, analiticR2: analiticR2 };
}

function getNewtonPotential(r, L) {
    return -1/r + (Math.pow((L/r), 2))/2;
}

function plotPotentialChart(L, E) {
    if (!PLOT_POTENCIAL_CHART)
        return;

    var plotXValues = range(1, POTENTIAL_PLOT_MAX_X)
        .map(function(r) { return (r/POTENTIAL_PLOT_RESOLUTION) + INFINITESIMAL; });

    var plotYValues = plotXValues
        .map(function(x) { return getNewtonPotential(x, L); });

    var energyValues = plotXValues.map(function() { return E; });

    var potentialData = [
        { x: plotXValues, y: plotYValues },
        { x: plotXValues, y: energyValues },
    ];

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
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
      yaxis: {
        title: 'Energía Potencial',
        range: [-1, 2],
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

function plotTrajectory(xPoints, yPoints) {
    var layout = {
      title: 'Trayectoria',
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
        title: 'x',
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
      yaxis: {
        title: 'y',
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      }
    };

    var trajectoryData = [{ x: xPoints, y: yPoints }];
    Plotly.newPlot($('#trajectoryPlot')[0], trajectoryData, layout);
}

function bisection(a, b, L, E) {
    var errEqualToPrevErrCount = 0;
    var A = E - getNewtonPotential(a, L);
    var B = E - getNewtonPotential(b, L);

    if (A*B > 0)
        throw InvalidInitialConditionsError('Bisección no aplicable');

    var p = (a + b)/2;
    var f1;
    var f2 = E - getNewtonPotential(p, L);
    var err = Math.abs(f2);
    var prevErr = err;
    while (err > BISECTION_ERROR_THERSHOLD) {
        f1 = E - getNewtonPotential(a, L);
        f2 = E - getNewtonPotential(p, L);
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

function belToSi(b, initialConditions) {
    var R = initialConditions.R;
    var m = initialConditions.m;
    var t = initialConditions.t;
    var r = initialConditions.r;
    var vr = initialConditions.vr;
    var vphi = initialConditions.vphi;
    var L = initialConditions.L;
    var E = initialConditions.E;

    var rSi = rBelToRSi(R, r);
    var tSi =  (t * R) / (2 * b);
    var vrSi = vr * b;
    var vphiSi = vphi * ((2*b)/R);
    var LSi = 0.5 * L * m * b * R;
    var ESi = E * m * (Math.pow(b, 2));

    Object.assign(initialConditions, {
        t: tSi,
        r: rSi,
        vr: vrSi,
        vphi: vphiSi,
        L: LSi,
        E: ESi,
    });
}

function rBelToRSi(R, r) {
    if (r === undefined) return undefined;
    return r * (R/2);
}

function radiusesBelToSi(R, radiuses) {
    var r1 = rBelToRSi(R, radiuses.r1);
    var r2 = rBelToRSi(R, radiuses.r2);
    var analiticR1 = rBelToRSi(R, radiuses.analiticR1);
    var analiticR2 = rBelToRSi(R, radiuses.analiticR2);

    return { r1: r1, r2: r2, analiticR1: analiticR1, analiticR2: analiticR2 };
}

function siToBel(b, initialConditions) {
    var R = initialConditions.R;
    var m = initialConditions.m;
    var tSi = initialConditions.t;
    var rSi = initialConditions.r;
    var vrSi = initialConditions.vr;
    var vphiSi = initialConditions.vphi;
    var LSi = initialConditions.L;
    var ESi = initialConditions.E;

    var r = (rSi !== undefined ? (rSi * (2/R)) : undefined);
    var t = tSi * (2 * b / R);
    var vr = (vrSi !== undefined ? (vrSi / b) : undefined);
    var vphi = (vphiSi !== undefined ? (vphiSi * (R/(2*b))) : undefined);
    var L = (LSi !== undefined ? (2 * LSi / (m * b * R)) : undefined);
    var E = (ESi !== undefined ? (ESi / (m * Math.pow(b, 2))) : undefined);

    Object.assign(initialConditions, {
        t: t,
        r: r,
        vr: vr,
        vphi: vphi,
        L: L,
        E: E,
    });
}

function getB(M, R) {
    return Math.sqrt(2*G*M/R);
}

function checkInitialConditionsInSi(initialConditions) {
    var M = initialConditions.M;
    var R = initialConditions.R;
    var m = initialConditions.m;
    if (!M || !R || !m) {
        throw Error('Los parámetros M, R son obligatorios para usar unidades del SI.');
    }
}

