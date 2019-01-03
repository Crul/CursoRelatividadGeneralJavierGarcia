var SPEED_LIGHT = 299792458;
var SPEED_LIGHT_SQR = Math.pow(SPEED_LIGHT, 2);

function fillMissingInitialConditionsSchwarzschild(initialConditions) {
    var r = initialConditions.r;
    var vr = initialConditions.vr;
    var vrSign = initialConditions.vrSign;
    var phi = initialConditions.phi || 0.0;
    var vphi = initialConditions.vphi;
    var L = initialConditions.L;
    var E = initialConditions.E;

    if (r !== undefined && vr !== undefined && vphi !== undefined) {
        if (L !== undefined)
            throw InvalidInitialConditionsError('No puedes especificar L si has especificado r, vr y vphi');
        if (E !== undefined)
            throw InvalidInitialConditionsError('No puedes especificar E si has especificado r, vr y vphi');
        if (vr != 0 && vrSign !== undefined)
            throw InvalidInitialConditionsError('No puedes especificar el signo de vr si has especificado vr y es distinto de 0');

        L = vphi * Math.pow(r, 2);
        E = Math.pow(vr, 2) + getEinsteinPotential(r, L);
        if (vr != 0)
            vrSign = vr/Math.abs(vr);

    } else if (L !== undefined && E !== undefined) {

        if (r !== undefined) {
            if (vr !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, E y r');
            if (Math.abs(vrSign) !== 1)
                throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y r');

            vphi = L/Math.pow(r, 2);
            var vrAbsSquare = Math.abs(E - getEinsteinPotential(r, L));
            vr = vrSign * Math.sqrt(vrAbsSquare);

        } else if (vr !== undefined) {
            if (r !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, E y vr');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y vr');
            if (vr != 0 && vrSign !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar el signo de vr si has especificado vr y es distinto de 0');

            var rSolutions = solveCubic(Math.pow(vr, 2) - E, -1, Math.pow(L, 2), -Math.pow(L, 2));
            r = Math.max.apply(Math, rSolutions);
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
            var vrAbsSquare = Math.abs(E - getEinsteinPotential(r, L));
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

    schwarzschildToSi(
        Object.assign(
            initialConditions,
            {
                r: r,
                vr: vr,
                vrSign: vrSign,
                phi: phi,
                vphi: vphi,
                L: L,
                E: E,
            }
        )
    );
}

function siToSchwarzschild(initialConditions) {
    var M = initialConditions.M;
    var a = (2*G*M)/SPEED_LIGHT_SQR;
    var m = initialConditions.m;

    var tSi = initialConditions.tSi;
    var rSi = initialConditions.rSi;
    var vrSi = initialConditions.vrSi;
    var vrSignSi = initialConditions.vrSignSi;
    var phiSi = initialConditions.phiSi;
    var vphiSi = initialConditions.vphiSi;
    var LSi = initialConditions.LSi;
    var ESi = initialConditions.ESi;
    
    // https://crul.github.io/CursoRelatividadGeneralJavierGarcia/#capitulo-38 ??
    var t = SPEED_LIGHT * (tSi / a)
    var r = (rSi !== undefined ? (rSi / a) : undefined);
    var vr = (vrSi !== undefined ? (vrSi / SPEED_LIGHT) : undefined);
    var vrSign = vrSignSi;
    var phi = phiSi;
    var vphi = (vphiSi !== undefined ? (a * vphiSi / SPEED_LIGHT) : undefined);
    var L = (LSi !== undefined ? (LSi / (m * a * SPEED_LIGHT)) : undefined);
    var E = (ESi !== undefined ? (ESi / (m * SPEED_LIGHT_SQR)) : undefined);

    Object.assign(initialConditions, {
        t: t,
        r: r,
        vr: vr,
        vrSign: vrSign,
        phi: phi,
        vphi: vphi,
        L: L,
        E: E,
        a: a,
    });
}

function schwarzschildToSi(initialConditions) {
    var M = initialConditions.M;
    var a = (2*G*M)/SPEED_LIGHT_SQR;
    var m = initialConditions.m;

    var t = initialConditions.t;
    var r = initialConditions.r;
    var vr = initialConditions.vr;
    var vrSign = initialConditions.vrSign;
    var phi = initialConditions.phi;
    var vphi = initialConditions.vphi;
    var L = initialConditions.L;
    var E = initialConditions.E;
    
    // https://crul.github.io/CursoRelatividadGeneralJavierGarcia/#capitulo-38 ??
    var tSi = t * a / SPEED_LIGHT
    var rSi = (r !== undefined ? (r * a) : undefined);
    var vrSi = (vr !== undefined ? (vr * SPEED_LIGHT) : undefined);
    var vrSignSi = vrSign;
    var phiSi = phi;
    var vphiSi = (vphi !== undefined ? (SPEED_LIGHT * vphi / a) : undefined);
    var LSi = (L !== undefined ? (L * (m * a * SPEED_LIGHT)) : undefined);
    var ESi = (E !== undefined ? (E * (m * SPEED_LIGHT_SQR)) : undefined);

    Object.assign(initialConditions, {
        tSi: tSi,
        rSi: rSi,
        vrSi: vrSi,
        vrSignSi: vrSignSi,
        phiSi: phiSi,
        vphiSi: vphiSi,
        LSi: LSi,
        ESi: ESi,
        a: a,
    });
}

function rSchwarzschildToRSi(initialConditions, rSchwarzschild) {
    return rSchwarzschild * initialConditions.a;
}

function initializeStepDataSchwarzschild(initialConditions) {
    var r0 = initialConditions.r;
    var vr0 = initialConditions.vr;
    var vrSign = initialConditions.vrSign;
    var vphi0 = initialConditions.vphi;
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
        t: 0,
        vt: vt0,
        r: r0,
        vr: vr0,
        vrSign: vrSign,
        phi: initialConditions.phi,
        vphi: vphi0,
        theta: theta0,
        vtheta: vtheta0,
    };
}

function getEinsteinPotential(r, L) {
    return Math.pow(L/r, 2) - (1/r) - (Math.pow(L, 2)/Math.pow(r, 3));
}

function plotSchwarzschildPotentialChart(L, E) {
    if (!PLOT_POTENCIAL_CHART)
        return;

    var plotXValues = range(0, (POTENTIAL_PLOT_MAX_X/POTENTIAL_PLOT_RESOLUTION))
        .map(function(r) { return (r * POTENTIAL_PLOT_RESOLUTION) + INFINITESIMAL; });

    var plotYValues = plotXValues
        .map(function(x) { return getEinsteinPotential(x, L); });

    var energyValues = plotXValues.map(function() { return E; });

    var potentialData = [
        { x: plotXValues, y: plotYValues },
        { x: plotXValues, y: energyValues },
    ];
    var allPotentialDataValues = plotYValues.concat(energyValues);

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
        range: [
            Math.min(-1, Math.min.apply(energyValues)),
            Math.max.apply(Math, allPotentialDataValues) * 1.1
        ],
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      }
    };
    var plotElem = $('#potentialPlot')[0];
    Plotly.newPlot(plotElem, potentialData, layout).then(function(){
        //Plotly.relayout($('#potentialPlot')[0], { yaxis: { range: [-1,1] }});
    });

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