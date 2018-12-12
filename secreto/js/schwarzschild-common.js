// TODO fillMissingInitialConditionsSchwarzschild
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
/*
        L = vphi * Math.pow(r, 2);
        E = (Math.pow(vr, 2) / 2) + getNewtonPotential(r, L);
        if (vr != 0)
            vrSign = vr/Math.abs(vr);
*/
    } else if (L !== undefined && E !== undefined) {

        if (r !== undefined) {
            if (vr !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, E y r');
            if (Math.abs(vrSign) !== 1)
                throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y r');
/*
            vphi = L/Math.pow(r, 2);
            var vrAbsSquare = 2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vrAbsSquare < 0)
                throw InvalidInitialConditionsError('Valor dentro de la raíz de velocidad radial es negativo.');
            vr = vrSign * Math.sqrt(vrAbsSquare);
*/
        } else if (vr !== undefined) {
            if (r !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, E y vr');
            if (vphi !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vphi si has especificado L, E y vr');
            if (vr != 0 && vrSign !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar el signo de vr si has especificado vr y es distinto de 0');
/*
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
            if (vr != 0)
                vrSign = vr/Math.abs(vr);
*/
        } else if (vphi !== undefined) {
            if (r !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar r si has especificado L, E y vphi');
            if (vr !== undefined)
                throw InvalidInitialConditionsError('No puedes especificar vr si has especificado L, E y vphi');
            if (Math.abs(vrSign) !== 1)
                throw InvalidInitialConditionsError('El signo de vr sólo puede ser 1.0 o -1.0');
/*
            r = Math.sqrt(Math.abs(L / vphi));
            var vrAbsSquare = 2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vrAbsSquare < 0)
                throw InvalidInitialConditionsError('Valor dentro de la raíz de velocidad radial es negativo.');
            vr = vrSign * Math.sqrt(vrAbsSquare);
*/
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
        r: r,
        vr: vr,
        vrSign: vrSign,
        phi: phi,
        vphi: vphi,
        L: L,
        E: E,
    });
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

function plotSchwarzschildPotentialChart(L, E) {
    if (!PLOT_POTENCIAL_CHART)
        return;

    var plotXValues = range(1, POTENTIAL_PLOT_MAX_X)
        .map(function(r) { return (r/POTENTIAL_PLOT_RESOLUTION) + INFINITESIMAL; });

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
    Plotly.newPlot($('#potentialPlot')[0], potentialData, layout);

}