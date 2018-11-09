var lastRunResult, lastRunPoints;
var move_point_by_method = {
    'euler': move_point_euler,
    'runge-kutta': move_point_runge_kutta,
}

function saveRun() {
    try {
        var initialConditions = getFormData();
        console.debug(initialConditions);
        var result = run(initialConditions);
        console.debug(result);
        
        return result;
    } catch(ex) {
        alert("¡Ups! Algo ha explotado: "+ ex);
    }
    
}

function run(initial_conditions) {
    $('#pointsDataTable').html('');
    
    var b;
    var R = initial_conditions.R;
    var isThereSiData = true;
    if (initial_conditions.siUnits) {
        check_initial_conditions_in_si(initial_conditions);
        setHash(initial_conditions);
        b = get_b(initial_conditions.M, R);
        si_to_bel(b, initial_conditions);
    } else {
        try {
            check_initial_conditions_in_si(initial_conditions);
        } catch(ex) {
            isThereSiData = false;
        }
        setHash(initial_conditions);
    }

    fill_missing_initial_conditions(initial_conditions);

    var r = initial_conditions.r;
    var phi = initial_conditions.phi;
    var vr = initial_conditions.vr;
    var L = initial_conditions.L;
    var E = initial_conditions.E;

    plot_potential_chart(L, E);
    var radiuses = get_radiuses(L, E);
    var step_data = initialize_step_data(r, vr, phi, radiuses);

    var method = initial_conditions.method;
    var dt     = initial_conditions.timeResolution;
    var steps  = initial_conditions.simulationTime / initial_conditions.timeResolution;
    var points = {
        t: [],
        x: [],
        y: [],
        phi: [],
        r: [],
    };
    if (isThereSiData) {
        points["x_si"] = [];
        points["y_si"] = [];
        points["phi_si"] = [];
        points["r_si"] = [];
    }

    for (var i=0; i < steps; i++) {
        move_point_by_method[method](radiuses, step_data, E, L, dt, get_newton_potential);

        var r = step_data.r;
        var r_step_value = r;
        points.t.push(i * dt);
        var x = r_step_value*Math.cos(step_data.phi);
        points.x.push(x);
        var y = r_step_value*Math.sin(step_data.phi);
        points.y.push(y);
        points.r.push(r_step_value);
        points.phi.push(step_data.phi);
        
        if (isThereSiData) {
            points.x_si.push(r_bel_to_r_si(R, x));
            points.y_si.push(r_bel_to_r_si(R, y));
            points.r_si.push(r_bel_to_r_si(R, r_step_value));
            points.phi_si.push(step_data.phi);
        }
        
    }

    plot_trajectory(points.x, points.y);
    if ($('#showPointsData').is(':checked'))
        print_points_data(points, steps);
    
    if (initial_conditions.siUnits) {
        radiuses = radiuses_bel_to_si(R, radiuses);
        bel_to_si(b, initial_conditions);
    }
    
    lastRunPoints = points;
    lastRunResult = {
        caso: get_caso(L, E),
        x: points.x,
        y: points.y,
        r: points.r,
        phi: points.phi,
        L: initial_conditions.L,
        E: initial_conditions.E,
        initial_r:    initial_conditions.r,
        initial_phi:  initial_conditions.phi,
        initial_vr:   initial_conditions.vr,
        initial_vphi: initial_conditions.vphi,
        radiuses: [radiuses.r1, radiuses.r2],
        analitic_radiuses: [radiuses.analitic_r1, radiuses.analitic_r2],
    };
    
    return lastRunResult;
}

function initialize_step_data(r, vr, phi, radiuses) {
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var vrSign = undefined;

    var is_there_any_radius = !(r1 === undefined && r2 === undefined);
    if (is_there_any_radius && vr == 0) {
        var is_closed_orbit = !(r1 === undefined || r2 === undefined);
        if (is_closed_orbit) { // casos 5, 6;
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

function fill_missing_initial_conditions(initial_conditions) {
    var method = initial_conditions.method || 'runge-kutta';
    var r = initial_conditions.r;
    var vr = initial_conditions.vr;
    var vrSign = initial_conditions.vrSign;
    var phi = initial_conditions.phi || 0.0;
    var vphi = initial_conditions.vphi;
    var L = initial_conditions.L;
    var E = initial_conditions.E;

    if (r !== undefined && vr !== undefined && vphi !== undefined) {
        if (L !== undefined) throw "ERROR: You cannot specify L if you specify r, vr and vphi";
        if (E !== undefined) throw "ERROR: You cannot specify E if you specify r, vr and vphi";
        if (vr != 0 && vrSign !== undefined) throw "ERROR: You cannot specify vrSign if you specify vr and is not 0";
        L = vphi * Math.pow(r, 2);
        E = (Math.pow(vr, 2) / 2) + get_newton_potential(r,L);
        vrSign = vr/Math.abs(vr);

    } else if (L !== undefined && E !== undefined) {

        if (r !== undefined) {
            if (vr !== undefined) throw "ERROR: You cannot specify vr if you specify L, E and r";
            if (Math.abs(vrSign) !== 1) throw "ERROR: vrSign should be 1.0 or -1.0";
            if (vphi !== undefined) throw "ERROR: You cannot specify vphi if you specify L, E and r";

            vphi = L/Math.pow(r, 2);
            var vr_abs_square = 2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vr_abs_square < 0) throw "ERROR: Condiciones iniciales incorrectas";
            vr = vrSign * Math.sqrt(vr_abs_square);

        } else if (vr !== undefined) {
            if (r !== undefined) throw "ERROR: You cannot specify r if you specify L, E and vr";
            if (vphi !== undefined) throw "ERROR: You cannot specify vphi if you specify L, E and vr";
            if (vr != 0 && vrSign !== undefined) throw "ERROR: You cannot specify vrSign if you specify vr and is not 0";

            var cuad_eq_a = (E - (Math.pow(vr, 2))/2);
            var cuad_eq_b = 1;
            var cuad_eq_c = - Math.pow(L, 2)/2;

            var cuad_eq_sol_b2_minus_4ac = (
                Math.pow(cuad_eq_b, 2)
                - (4 * cuad_eq_a * cuad_eq_c)
            );
            var r_1 = (
                (- cuad_eq_b + Math.sqrt(cuad_eq_sol_b2_minus_4ac))
                / ( 2 *cuad_eq_a )
            );
            var r_2 = (
                (- cuad_eq_b - Math.sqrt(cuad_eq_sol_b2_minus_4ac))
                / ( 2 *cuad_eq_a )
            );
            r = Math.max(r_1, r_2);
            vphi = L/Math.pow(r, 2);
            vrSign = vr/Math.abs(vr);

        } else if (vphi !== undefined) {
            if (r !== undefined) throw "ERROR: You cannot specify r if you specify L, E and vphi";
            if (vr !== undefined) throw "ERROR: You cannot specify vr if you specify L, E and vphi";
            if (Math.abs(vrSign) !== 1) throw "ERROR: vrSign should be 1.0 or -1.0";

            r = Math.sqrt(Math.abs(L / vphi));
            var vr_abs_square = 2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r);
            if (vr_abs_square < 0) throw "ERROR: Condiciones iniciales incorrectas";
            vr = vrSign * Math.sqrt(vr_abs_square);
        }

    } else {
        var error_msg = 'ERROR: Invalid Initial Conditions.' +
            ' You have to specify one of these sets of values:\n' +
            '    - r, vr, vphi\n' +
            '    - L, E, r\n' +
            '    - L, E, vr\n' +
            '    - L, E, vphi\n';

        throw error_msg

    }

    Object.assign(initial_conditions, {
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

function get_caso(L, E) {
    if (L==0) return (E >= 0 ? 1 : 2);

    var circular_orbit_E =  (L != 0 ? -1/(2*(Math.pow(L, 2))) : undefined);
    var is_circular_orbit = (E == circular_orbit_E);

    if (is_circular_orbit) return 6;

    if (E == 0) return 3;

    if (E > 0) return 4;

    // if (E < 0)
    return 5;
}

function get_radiuses(L, E) {
    var r1, r2, analitic_r1, analitic_r2;
    var circular_orbit_E =  (L != 0 ? -1/(2*(Math.pow(L, 2))) : undefined);
    var is_circular_orbit = (E == circular_orbit_E);

    if (is_circular_orbit) {  // caso 6: circular orbit;
        r1 = Math.pow(L, 2);
        r2 = Math.pow(L, 2);
        analitic_r1 = r1;
        analitic_r2 = r2;

    } else {                 // is NOT circular orbit;

        if (Math.abs(L) > 0) {     // ... casos 3, 4, 5;
            var a = BISECTION_MIN;
            var b = Math.pow(L, 2);
            r1 = bisection(a,b,L,E);

            if (Math.abs(E) < E_THRESHOLD_TO_BE_CONSIDERED_ZERO)
                analitic_r1 = (Math.pow(L, 2))/2;
            else
                analitic_r1 = (1/(2*E)) * ( -1 + Math.sqrt( 1+2*E*(Math.pow(L, 2)) )  );
        }
        if (E < 0) {          // ... casos 2, 5;
            var a = (Math.abs(L) > 0 ? Math.pow(L, 2) : BISECTION_MIN);
            var b = BISECTION_MAX;
            r2 = bisection(a,b,L,E);
            analitic_r2 = (1/(2*E)) * ( -1  -  Math.sqrt( 1+2*E*(Math.pow(L, 2)) )  );
        }
    }

    return { r1: r1, r2: r2, analitic_r1: analitic_r1, analitic_r2: analitic_r2 };
}

function get_newton_potential(r, L) {
    return -1/r + (Math.pow((L/r), 2))/2;
}

function plot_potential_chart(L, E) {
    if (!PLOT_POTENCIAL_CHART)
        return;

    var plot_potencial_eje_x = range(1, POTENTIAL_PLOT_MAX_X)
        .map(function(r) { return (r/POTENTIAL_PLOT_RESOLUTION) + INFINITESIMAL; });

    var plot_values = plot_potencial_eje_x
        .map(function(x) { return get_newton_potential(x,L); });

    var energy_values = plot_potencial_eje_x.map(function() { return E; });

    var potentialData = [
        { x: plot_potencial_eje_x, y: plot_values },
        { x: plot_potencial_eje_x, y: energy_values },
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

function plot_trajectory(x_points, y_points) {
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
    
    var trajectoryData = [{ x: x_points, y: y_points }];
    Plotly.newPlot($('#trajectoryPlot')[0], trajectoryData, layout);
}

function bisection(a,b,L,E) {
    var err_equal_to_prev_err_count = 0;
    var A = E - get_newton_potential(a,L);
    var B = E - get_newton_potential(b,L);

    if (A*B > 0)
        throw 'No aplicable!';

    var p = (a + b)/2;
    var f1;
    var f2 = E - get_newton_potential(p,L);
    var err = Math.abs(f2);
    var prev_err = err;
    while (err > BISECTION_ERROR_THERSHOLD) {
        f1 = E - get_newton_potential(a,L);
        f2 = E - get_newton_potential(p,L);
        if (f1*f2<0)
            b = p;
        else
            a = p;

        p = (a + b)/2;
        err = Math.abs(f2);
        if (err == prev_err) {
            err_equal_to_prev_err_count++;
            if (err_equal_to_prev_err_count > 1) {
                console.warn("\nWARNING: exiting bisection before err below threshold", err);
                break;
            }
        }

        prev_err = err;
    }

    return p;
}

function bel_to_si(b, initial_conditions) {
    var R = initial_conditions.R;
    var m = initial_conditions.m;
    var t = initial_conditions.t;
    var r = initial_conditions.r;
    var vr = initial_conditions.vr;
    var vphi = initial_conditions.vphi;
    var L = initial_conditions.L;
    var E = initial_conditions.E;

    var r_si = r_bel_to_r_si(R, r);
    var t_si =  (t * R) / (2 * b);
    var vr_si = vr * b;
    var vphi_si = vphi * ((2*b)/R);
    var L_si = 0.5 * L * m * b * R;
    var E_si = E * m * (Math.pow(b, 2));

    Object.assign(initial_conditions, {
        t: t_si,
        r: r_si,
        vr: vr_si,
        vphi: vphi_si,
        L: L_si,
        E: E_si,
    });
}

function r_bel_to_r_si(R, r) {
    if (r === undefined) return undefined;
    return r * (R/2);
}

function radiuses_bel_to_si(R, radiuses) {
    var r1 = r_bel_to_r_si(R, radiuses.r1);
    var r2 = r_bel_to_r_si(R, radiuses.r2);
    var analitic_r1 = r_bel_to_r_si(R, radiuses.analitic_r1);
    var analitic_r2 = r_bel_to_r_si(R, radiuses.analitic_r2);

    return { r1: r1, r2: r2, analitic_r1: analitic_r1, analitic_r2: analitic_r2 };
}

function si_to_bel(b, initial_conditions) {
    var R = initial_conditions.R;
    var m = initial_conditions.m;
    var t_si = initial_conditions.t;
    var r_si = initial_conditions.r;
    var vr_si = initial_conditions.vr;
    var vphi_si = initial_conditions.vphi;
    var L_si = initial_conditions.L;
    var E_si = initial_conditions.E;

    var r = (r_si !== undefined ? (r_si * (2/R)) : undefined);
    var t = t_si * (2 * b / R);
    var vr = (vr_si !== undefined ? (vr_si / b) : undefined);
    var vphi = (vphi_si !== undefined ? (vphi_si * (R/(2*b))) : undefined);
    var L = (L_si !== undefined ? (2 * L_si / (m * b * R)) : undefined);
    var E = (E_si !== undefined ? (E_si / (m * Math.pow(b, 2))) : undefined);

    Object.assign(initial_conditions, {
        t: t,
        r: r,
        vr: vr,
        vphi: vphi,
        L: L,
        E: E,
    });
}

function get_b(M, R) {
    return Math.sqrt(2*G*M/R);
}

function check_initial_conditions_in_si(initial_conditions) {
    var M = initial_conditions.M;
    var R = initial_conditions.R;
    var m = initial_conditions.m;
    if (!M || !R || !m) {
        throw "ERROR: M, R and m parameters are mandatory for SI units.";
    }
}

