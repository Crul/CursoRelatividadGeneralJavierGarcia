function movePointRungeKutta(radiuses, stepData, E, L, dt, getPotentialFn) {
    /* Runge-Kutta
    k_1 = h * f(t_n, y_n)
    k_2 = h * f(t_n + h/2, y_n + k1/2)
    k_3 = h * f(t_n + h/2, y_n + k2/2)
    k_4 = h * f(t_n + h, y_n + k3)
    y_n+1 = y_n + (k1 + 2*k_2 + 2*k3 + k4)     */

    var r = stepData.r;
    var deltas = calcRungeKutta(dt, stepData.r, stepData.vrSign, E, L, getPotentialFn);

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
            deltas = calcRungeKutta(dt, stepData.r, stepData.vrSign, E, L, getPotentialFn);
            stepData.r   += deltas.r;
            stepData.phi += deltas.phi;
        }
    }

    var isRAboveMaximumRadius = (r2 !== undefined) && (r >= r2);
    if (isRAboveMaximumRadius) { // There is a maximum radius and we are below;
        stepData.vrSign = -1;
        stepData.r -= INFINITESIMAL;
        if (isClosedOrbit) {
            deltas = calcRungeKutta(dt, stepData.r, stepData.vrSign, E, L, getPotentialFn);
            stepData.r   += deltas.r;
            stepData.phi += deltas.phi;
        }
    }
}

function calcRungeKutta(dt, r, vrSign, E, L, getPotentialFn) {
    var h = dt;
    var fValueK1 = fForRungeKutta(r, vrSign, E, L, getPotentialFn);
    var k1Vr = h * fValueK1.vr;
    var k1Vphi = h * fValueK1.vphi;

    var fValueK2 = fForRungeKutta(r + k1Vr/2, vrSign, E, L, getPotentialFn);
    var k2Vr = h * fValueK2.vr;
    var k2Vphi = h * fValueK2.vphi;

    var fValueK3 = fForRungeKutta(r + k2Vr/2, vrSign, E, L, getPotentialFn);
    var k3Vr = h * fValueK3.vr;
    var k3Vphi = h * fValueK3.vphi;

    var fValueK4 = fForRungeKutta(r + k3Vr, vrSign, E, L, getPotentialFn);
    var k4Vr = h * fValueK4.vr;
    var k4Vphi = h * fValueK4.vphi;

    var deltaR = getValueFromRungeKuttaKs(k1Vr, k2Vr, k3Vr, k4Vr);
    var deltaPhi = getValueFromRungeKuttaKs(k1Vphi, k2Vphi, k3Vphi, k4Vphi);
    var deltas = { r: deltaR, phi: deltaPhi };

    return deltas;
}

function fForRungeKutta(r, vrSign, E, L, getPotentialFn) {
    var vphi = L / (Math.pow(r, 2));
    var valueInsideSqrtOfVr = 2*Math.abs(E - getPotentialFn(r, L));
    var vr = vrSign * Math.sqrt(valueInsideSqrtOfVr);

    return { vphi: vphi, vr: vr };
}

function getValueFromRungeKuttaKs(k1, k2, k3, k4) {
    return (k1 + 2*k2 + 2*k3 + k4) / 6;
}
