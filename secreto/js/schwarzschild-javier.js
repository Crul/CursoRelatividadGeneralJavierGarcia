// file:///C:/workspace/JavierGarcia/obi-four-kenobi/src/html/index.html#inputFormat=L-E-r&siUnits=false&timeResolution=0.1&simulationTime=500&M=5.97e+24&R=6371000&m=500&r=4.121816307401945&vr=&vrSign=1&phi=0&vphi=&L=1.9&E=-0.08&physics=schwarzschild-javier

DELTA_ERROR = 1e-5
SCHWARZSCHILD_RADIUS = 1
MAX_RADIUS = 2e3
INFINITESIMAL_JAVIER = 1e-11;
INFINITESIMAL_JAVIER_RADIUSES = 1e-3;

function runSchwarzschildJavier() {
    var initialConditions = getFormData();
    $('#pointsDataTable').html('');

    var isThereSiData = true;
    if (initialConditions.siUnits) {
        checkInitialConditionsInSi(initialConditions);
        setHash(initialConditions);
        siToSchwarzschild(initialConditions);
    } else {
        try {
            checkInitialConditionsInSi(initialConditions);
            var a = (2*G*initialConditions.M)/SPEED_LIGHT_SQR;
            initialConditions.a = a;
        } catch(ex) {
            isThereSiData = false;
        }
        setHash(initialConditions);
    }

    fillMissingInitialConditionsSchwarzschild(initialConditions);

    var R = initialConditions.R;
    var r = initialConditions.r;
    var phi = initialConditions.phi;
    var vr = initialConditions.vr;
    var L = initialConditions.L;
    var E = initialConditions.E;
    var a = initialConditions.a;

    var radiuses = getJavierRadiuses(initialConditions);
    var allowedRanges = [ { min: 1, max: MAX_RADIUS }];
    if (radiuses.r0)
        allowedRanges[0].max = radiuses.r0;

    if (radiuses.r1)
        allowedRanges.push({ min: radiuses.r1, max: MAX_RADIUS })

    if (radiuses.r2)
        allowedRanges[1].max = radiuses.r2;

    var validRange = allowedRanges.filter(function(range) {
        return (r + INFINITESIMAL) >= range.min && (r - INFINITESIMAL) <= range.max;
    });
    if (!validRange.length) {
        var allowedRangesStr = allowedRanges
            .map(function(range) { return range.min + "-" + range.max; })
            .join(", ");

        throw InvalidInitialConditionsError('El valor de r no es válido. Ha de estar en los intervalos: ' + allowedRangesStr);
    }

    var stepData = initializeStepDataSchwarzschild(initialConditions);
    var zona = 0; // TODO get zona
    // TODO check zona based on radiuses definitions

    var dtau   = initialConditions.timeResolution;
    var steps  = initialConditions.simulationTime / initialConditions.timeResolution;
    var points = {
        tau: [],
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
        points['tauSi'] = [];
        points['tSi'] = [];
    }

    for (var i=0; i < steps; i++) {
        var tau = i * dtau;
        points.tau.push(tau);
        var Everdadera = Math.sqrt(1 + initialConditions.E)
        var t = (Everdadera / (1 - (1/stepData.r))) * tau;
        points.t.push(t);
        var x = stepData.r*Math.cos(stepData.phi);
        points.x.push(x);
        var y = stepData.r*Math.sin(stepData.phi);
        points.y.push(y);
        points.r.push(stepData.r);
        points.phi.push(stepData.phi);
        
        if (isThereSiData) {
            points.xSi.push(rSchwarzschildToRSi(initialConditions, x));
            points.ySi.push(rSchwarzschildToRSi(initialConditions, y));
            points.rSi.push(rSchwarzschildToRSi(initialConditions, stepData.r));
            points.phiSi.push(stepData.phi);
            var tauSi = a * (tau / SPEED_LIGHT);
            points.tauSi.push(tauSi);
            var tSi = a * (t / SPEED_LIGHT);
            points.tSi.push(tSi);
        }

        var valueInsideSqrt = Math.abs(E - getEinsteinPotential(stepData.r, L));
        var nextVr = Math.sqrt(valueInsideSqrt);
        var nextR = stepData.r + (stepData.vrSign * nextVr * dtau);
        var nextVphi = L / Math.pow(nextR, 2);
        var nextPhi = stepData.phi + (nextVphi * dtau);
        var nextVrSign = stepData.vrSign;

        var recalculateBecauseRadius = false;
        // TODO ¿if radiuses.r0 == radiuses.r1 ... random?

        if (radiuses.r0 && Math.abs(nextR - radiuses.r0) <= INFINITESIMAL_JAVIER_RADIUSES && nextVrSign == 1) {
            nextR = radiuses.r0 - INFINITESIMAL;
            nextVrSign = -1;
            recalculateBecauseRadius = true;
        }

        if (radiuses.r1 && Math.abs(nextR - radiuses.r1) <= INFINITESIMAL_JAVIER_RADIUSES && nextVrSign == -1) {
            nextR = radiuses.r1 + INFINITESIMAL;
            nextVrSign = 1;
            recalculateBecauseRadius = true;
        }

        if (radiuses.r2 && Math.abs(nextR - radiuses.r2) <= INFINITESIMAL_JAVIER_RADIUSES && nextVrSign == 1) {
            nextR = radiuses.r2 - INFINITESIMAL;
            nextVrSign = -1;
            recalculateBecauseRadius = true;
        }

        if (recalculateBecauseRadius) {
            valueInsideSqrt = Math.abs(E - getEinsteinPotential(nextR, L));
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

        if (stepData.r < SCHWARZSCHILD_RADIUS + DELTA_ERROR) {
            console.warn('Integrator skipped at r=%0.5frs, next iteration r=%0.5frs'); // TODO %(r_points[-1],x[1]));
            break;
        }
    }

    plotTrajectory(points.x, points.y);
    if ($('#showPointsData').is(':checked'))
        printPointsData(points, steps);

    return {
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
        radiuses: [radiuses.r0, radiuses.r1, radiuses.r2],
        analiticRadiuses: [radiuses.rc1, radiuses.rc2],
        caso: radiuses.caso,
    };
}

function getJavierRadiuses(initialConditions) {
    var L = initialConditions.L;
    var LSquare = Math.pow(L, 2);
    var epsilon = initialConditions.E;
    var r = initialConditions.r;
    var r0, r1, r2;
    var caso = 0;

    if (LSquare <= 3) {         // L <= 3
        if (epsilon < 0) {      //   epsilon < 0
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, MAX_RADIUS, L, epsilon);
            caso = 1;
        }
    } else if (LSquare <= 4) {  // 3 < L <= 4
        var rc1 = L * (L - Math.sqrt(LSquare - 3));
        var rc2 = L * (L + Math.sqrt(LSquare - 3));
        var minimumPotential = getEinsteinPotential(rc2, L);
        var maximumPotential = getEinsteinPotential(rc1, L);

        if (epsilon < minimumPotential - INFINITESIMAL_JAVIER_RADIUSES) {
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, MAX_RADIUS, L, epsilon);
            caso = 5;

        } else if (Math.abs(epsilon - minimumPotential) < INFINITESIMAL_JAVIER_RADIUSES) {
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, MAX_RADIUS, L, epsilon);
            r1 = rc2;
            r2 = rc2;
            caso = 4;

        } else if (epsilon > minimumPotential && epsilon < maximumPotential) {
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, rc1, L, epsilon);
            r1 = einsteinianBisection(rc1, rc2, L, epsilon);
            r2 = einsteinianBisection(rc2, MAX_RADIUS, L, epsilon);
            caso = 3; // 3b

        } else if (Math.abs(epsilon - maximumPotential) < INFINITESIMAL_JAVIER_RADIUSES) {
            r0 = rc1;
            r1 = rc1;
            r2 = einsteinianBisection(rc2, MAX_RADIUS, L, epsilon);
            caso = 3; // 3a

        } else if (epsilon > maximumPotential && epsilon < 0) {
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, MAX_RADIUS, L, epsilon);
            caso = 2;
        }

    } else {                    // L > 4
        var rc1 = L * (L - Math.sqrt(LSquare - 3));
        var rc2 = L * (L + Math.sqrt(LSquare - 3));
        var minimumPotential = getEinsteinPotential(rc2, L);
        var maximumPotential = getEinsteinPotential(rc1, L);

        if (epsilon < minimumPotential) {
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, MAX_RADIUS, L, epsilon);
            caso = 10;

        } else if (Math.abs(epsilon - minimumPotential) < INFINITESIMAL_JAVIER_RADIUSES) {
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, MAX_RADIUS, L, epsilon);
            r1 = rc2;
            r2 = rc2;
            caso = 9;

        } else if (Math.abs(epsilon - maximumPotential) < INFINITESIMAL_JAVIER_RADIUSES) {
            r0 = rc1;
            r1 = rc1;
            caso = 8;

        } else if (epsilon < 0 && epsilon >= minimumPotential){
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, rc1, L, epsilon);
            r1 = einsteinianBisection(rc1, rc2, L, epsilon);
            r2 = einsteinianBisection(rc2, MAX_RADIUS, L, epsilon);
            caso = 7;

        } else if (epsilon >= 0 && epsilon <= maximumPotential){
            r0 = einsteinianBisection(INFINITESIMAL_JAVIER, rc1, L, epsilon);
            r1 = einsteinianBisection(rc1, rc2, L, epsilon);
            caso = 6;
        }
    }

    return { r0: r0, r1: r1, r2: r2, rc1: rc1, rc2: rc2, caso: caso };
}

function einsteinianBisection(a, b, L, epsilon) {
    var errEqualToPrevErrCount = 0;
    var A = epsilon - getEinsteinPotential(a, L);
    var B = epsilon - getEinsteinPotential(b, L);

    if (A*B > 0)
        throw InvalidInitialConditionsError('Bisección no aplicable');

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
