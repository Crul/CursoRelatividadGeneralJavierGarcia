DELTA_ERROR = 1e-5
SCHWARZSCHILD_RADIUS = 1

function runSchwarzschildInaki() {
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

    var radiuses = getRadiuses(L, E);
    var stepData = initializeStepDataSchwarzschild(initialConditions);

    var dt     = initialConditions.timeResolution;
    var steps  = initialConditions.simulationTime / initialConditions.timeResolution;
    var points = {
        tau: [],
        t: [],
        x: [],
        y: [],
        phi: [],
        r: [],
    };
    var h = dt;

    for (var i=0; i < steps; i++) {
        var tau = i * dt;
        var r = stepData.r;
        var rStepValue = r;
        points.tau.push(tau);
        points.t.push(stepData.t);
        var x = rStepValue*Math.cos(stepData.phi);
        points.x.push(x);
        var y = rStepValue*Math.sin(stepData.phi);
        points.y.push(y);
        points.r.push(rStepValue);
        points.phi.push(stepData.phi);

        var k1 = multiplyStepData(h, fForSchwarzschild(stepData, tau));

        var k2 = multiplyStepData(h, fForSchwarzschild(
                addStepDatas(stepData, multiplyStepData(0.5, k1)),
                tau + 0.5 * h
            )
        );

        var k3 = multiplyStepData(h, fForSchwarzschild(
                addStepDatas(stepData, multiplyStepData(0.5, k2)),
                tau + 0.5 * h
            )
        );

        var k4 = multiplyStepData(h, fForSchwarzschild(addStepDatas(stepData, k3), tau + h));

        stepData = addStepDatas(
            stepData,
            multiplyStepData(
                1/6,
                addStepDatas(
                    k1,
                    addStepDatas(
                        multiplyStepData(2, k2),
                        addStepDatas(multiplyStepData(2, k3), k4)
                    )
                )
            )
        )

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
        radiuses: [radiuses.r1, radiuses.r2],
        analiticRadiuses: [radiuses.analiticR1, radiuses.analiticR2],
    };
}

function fForSchwarzschild(stepData, tau) {
    var vt = stepData.vt;
    var r = stepData.r;
    var vr = stepData.vr;
    var phi = stepData.phi;
    var vphi = stepData.vphi;
    var theta = stepData.theta;
    var vtheta = stepData.vtheta;

    var f_t = vt;
    var f_vt = SCHWARZSCHILD_RADIUS * vr * vt / (SCHWARZSCHILD_RADIUS * r - Math.pow(r, 2));
    var f_r = vr;
    var f_vr = (
        SCHWARZSCHILD_RADIUS*(SCHWARZSCHILD_RADIUS-r)*Math.pow(vt, 2)/(2*Math.pow(r,3))
        + (r-SCHWARZSCHILD_RADIUS)*Math.pow(vtheta, 2)
        + (r-SCHWARZSCHILD_RADIUS)*Math.pow(Math.sin(theta), 2)* Math.pow(vphi, 2)
        - SCHWARZSCHILD_RADIUS*Math.pow(vr,2)/(2*SCHWARZSCHILD_RADIUS*r-2*Math.pow(r,2))
    );
    var f_theta = vtheta;
    var f_vtheta = Math.cos(theta)*Math.sin(theta)*Math.pow(vphi, 2) - 2*vt*vtheta/r;
    var f_phi= vphi;
    var f_vphi = -2*vr*vphi/r - 2*vtheta*vphi/Math.tan(theta);

    return {
        t: f_t,
        vt: f_vt,
        r: f_r,
        vr: f_vr,
        phi: f_phi,
        vphi: f_vphi,
        theta: f_theta,
        vtheta: f_vtheta,
    };

}

function addStepDatas(stepData1, stepData2) {
    return {
        t: stepData1.t + stepData2.t,
        vt: stepData1.vt + stepData2.vt,
        r: stepData1.r + stepData2.r,
        vr: stepData1.vr + stepData2.vr,
        phi: stepData1.phi + stepData2.phi,
        vphi: stepData1.vphi + stepData2.vphi,
        theta: stepData1.theta + stepData2.theta,
        vtheta: stepData1.vtheta + stepData2.vtheta,
    };
}

function multiplyStepData(h, stepData) {
    return {
        t: h * stepData.t,
        vt: h * stepData.vt,
        r: h * stepData.r,
        vr: h * stepData.vr,
        phi: h * stepData.phi,
        vphi: h * stepData.vphi,
        theta: h * stepData.theta,
        vtheta: h * stepData.vtheta,
    };
}
