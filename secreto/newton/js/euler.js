function movePointEuler(radiuses, stepData, E, L, dt, getPotentialFn) {
    // Euler
    // y_n+1 = y_n + h * f(t_n, y_n)
    var r = stepData.r;
    var vrSign = stepData.vrSign;
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var isClosedOrbit = !(r1 === undefined || r2 === undefined);

    stepData.vphi = L / (Math.pow(r, 2));
    var valueInsideSqrtOfVr = 2*Math.abs(E - getPotentialFn(r, L));
    stepData.vr = vrSign * Math.sqrt(valueInsideSqrtOfVr);

    var isRBelowMinimumRadius = (r1 !== undefined) && (r <= r1);
    if (isRBelowMinimumRadius) { // There is a minimum radius and we are below;
        stepData.vrSign = 1;
        stepData.r  = r + INFINITESIMAL;
        stepData.vr = Math.abs(stepData.vr);
        if (isClosedOrbit) {
            stepData.r   += stepData.vr * dt;
            stepData.phi += stepData.vphi * dt;
        }
    }

    var isRAboveMaximumRadius = (r2 !== undefined) && (r >= r2);
    if (isRAboveMaximumRadius) { // There is a maximum radius and we are below;
        stepData.vrSign = -1;
        stepData.r  = r - INFINITESIMAL;
        stepData.vr = -Math.abs(stepData.vr);
        if (isClosedOrbit) {
            stepData.r   += stepData.vr * dt;
            stepData.phi += stepData.vphi * dt;
        }
    }

    var isInsideEllipseRadiuses = isClosedOrbit && (r > r1 && r < r2);
    var isOpenTrajectoryOverThreshold = (!isClosedOrbit) && (r >= INFINITESIMAL);
    if (isInsideEllipseRadiuses || isOpenTrajectoryOverThreshold) {
        stepData.r   += stepData.vr * dt;
        stepData.phi += stepData.vphi * dt;
    }
}
