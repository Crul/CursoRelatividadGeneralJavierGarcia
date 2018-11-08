var PLOT_POTENCIAL_CHART = true;
var INFINITESIMAL = 1e-6;
var E_THRESHOLD_TO_BE_CONSIDERED_ZERO = 1e-7;

var BISECTION_ERROR_THERSHOLD = 1e-7;
var BISECTION_MIN = 1e-9;
var BISECTION_MAX = 5e3;

var POTENTIAL_PLOT_RESOLUTION = 1e2;
var POTENTIAL_PLOT_MAX_X = 1e4;

var G = 6.674E-11;
var move_point_by_method = {
    'euler': move_point_euler,
    'runge-kutta': move_point_runge_kutta,
}

var defaultInitialConditions = [
    {
        name: 'Velocidad de Escape (caso 1)',
        input_format: 'r-vr-vphi',
        si_units: false,
        time_resolution: 0.1, simulation_time: 500,
        r: 16.0, phi: 0.0, vr: 2.0, vphi: 0.0
    },
    {
        name: 'Colisión (caso 2)',
        input_format: 'r-vr-vphi',
        si_units: false,
        time_resolution: 0.1, simulation_time: 500,
        r: 16.0, phi: 0.0, vr: 0.0, vphi: 0.0
    },
    {
        name: 'Parábola (caso 3)',
        input_format: 'L-E-vphi',
        si_units: false,
        time_resolution: 0.1, simulation_time: 5000,
        phi: 0.0, vphi: 0.01, vr_sign: 1.0,
        L: 9.48, E: 0.0,
    },
    {
        name: 'Hipérbola (caso 4)',
        input_format: 'r-vr-vphi',
        si_units: false,
        time_resolution: 0.1, simulation_time: 500,
        r: 16.0, phi: 0.0, vr: 0.0, vphi: 0.08,
    },
    {
        name: 'Órbita Elíptica (caso 5)',
        input_format: 'r-vr-vphi',
        si_units: false,
        time_resolution: 0.1, simulation_time: 500,
        r: 8.0, phi: 0.0, vr: 0.0, vphi: 0.035
    },
    {
        name: 'Órbita Circular en SI (caso 6)',
        input_format: 'L-E-vr',
        time_resolution: 0.1, simulation_time: 500,
        si_units: true,
        M: 5.97e+24, R: 6371000.0, m: 500.0,
        phi: 0.0, vr: 0.0,
        L: 26719623532036.336, E: -13897619421.33626,
    }
];

function run(initial_conditions) {
    var R, b;
    if (initial_conditions.si_units) {
        check_initial_conditions_in_si(initial_conditions);
        R = initial_conditions.R;
        b = get_b(initial_conditions.M, R);
        si_to_bel(b, initial_conditions);
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
    var dt     = initial_conditions.time_resolution;
    var steps  = initial_conditions.simulation_time / initial_conditions.time_resolution;
    var points = { x: [], y: [], phi: [], r: [] };

    for (var i=0; i < steps; i++) {
        move_point_by_method[method](radiuses, step_data, E, L, dt);

        var r = step_data.r;
        var r_step_value = r;
        if (initial_conditions.si_units)
            r_step_value = r_bel_to_r_si(R, r);

        points.x.push(r_step_value*Math.cos(step_data.phi));
        points.y.push(r_step_value*Math.sin(step_data.phi));
        points.r.push(r_step_value);
        points.phi.push(step_data.phi);
    }

    plot_trajectory(points.x, points.y);

    if (initial_conditions.si_units) {
        radiuses = radiuses_bel_to_si(R, radiuses);
        bel_to_si(b, initial_conditions);
    }
    
    return {
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
}

function move_point_euler(radiuses, step_data, E, L, dt) {
    // Euler
    // y_n+1 = y_n + h * f(t_n, y_n)
    var r = step_data.r;
    var vr_sign = step_data.vr_sign;
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var is_closed_orbit = !(r1 === undefined || r2 === undefined);
    
    step_data.vphi = L / (Math.pow(r, 2));
    var value_inside_sqrt_of_vr = 2*Math.abs(E - get_newton_potential(r,L));
    step_data.vr = vr_sign * Math.sqrt(value_inside_sqrt_of_vr);
    
    var is_r_below_minimum_radius = (r1 !== undefined) && (r <= r1);
    if (is_r_below_minimum_radius) { // There is a minimum radius and we are below;
        step_data.vr_sign = 1;
        step_data.r  = r + INFINITESIMAL;
        step_data.vr = Math.abs(step_data.vr);
        if (is_closed_orbit) {
            step_data.r   += step_data.vr * dt;
            step_data.phi += step_data.vphi * dt;
        }
    }

    var is_r_above_maximum_radius = (r2 !== undefined) && (r >= r2);
    if (is_r_above_maximum_radius) { // There is a maximum radius and we are below;
        step_data.vr_sign = -1;
        step_data.r  = r - INFINITESIMAL;
        step_data.vr = -Math.abs(step_data.vr);
        if (is_closed_orbit) {
            step_data.r   += step_data.vr * dt;
            step_data.phi += step_data.vphi * dt;
        }
    }

    var is_inside_ellipse_radiuses = is_closed_orbit && (r > r1 && r < r2);
    var is_open_trajectory_over_threshold = (!is_closed_orbit) && (r >= INFINITESIMAL);
    if (is_inside_ellipse_radiuses || is_open_trajectory_over_threshold) {
        step_data.r   += step_data.vr * dt;
        step_data.phi += step_data.vphi * dt;
    }
}

function move_point_runge_kutta(radiuses, step_data, E, L, dt) {
    /* Runge-Kutta
    k_1 = h * f(t_n, y_n)
    k_2 = h * f(t_n + h/2, y_n + k1/2)
    k_3 = h * f(t_n + h/2, y_n + k2/2)
    k_4 = h * f(t_n + h, y_n + k3)
    y_n+1 = y_n + (k1 + 2*k_2 + 2*k3 + k4)     */
    
    var r = step_data.r;
    var deltas = calc_runge_kutta(dt, r, step_data.vr_sign, E, L);
    
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var is_closed_orbit = !(r1 === undefined || r2 === undefined);
    
    var is_r_below_minimum_radius = (r1 !== undefined) && (r <= r1);
    if (is_r_below_minimum_radius) { // There is a minimum radius and we are below;
        step_data.vr_sign = 1;
        step_data.r  = r + 1e-9;
        if (is_closed_orbit) {
            deltas = calc_runge_kutta(dt, r, step_data.vr_sign, E, L);
            step_data.r   += deltas.r;
            step_data.phi += deltas.phi;
        }
    }

    var is_r_above_maximum_radius = (r2 !== undefined) && (r >= r2);
    if (is_r_above_maximum_radius) { // There is a maximum radius and we are below;
        step_data.vr_sign = -1;
        step_data.r  = r - 1e-9;
        if (is_closed_orbit) {
            deltas = calc_runge_kutta(dt, r, step_data.vr_sign, E, L);
            step_data.r   += deltas.r;
            step_data.phi += deltas.phi;
        }
    }
    
    var is_inside_ellipse_radiuses = is_closed_orbit && (r > r1 && r < r2);
    var is_open_trajectory_over_threshold = (!is_closed_orbit) && (r >= INFINITESIMAL);
    if (is_inside_ellipse_radiuses || is_open_trajectory_over_threshold) {
        step_data.r   += deltas.r;
        step_data.phi += deltas.phi;
    }
}

function calc_runge_kutta(dt, r, vr_sign, E, L) {
    var h = dt;
    var f_value_k1 = f_for_runge_kutta(r, vr_sign, E, L);
    var k1_vr = h * f_value_k1.vr;
    var k1_vphi = h * f_value_k1.vphi;
        
    var f_value_k2 = f_for_runge_kutta(r + k1_vr/2, vr_sign, E, L);
    var k2_vr = h * f_value_k2.vr;
    var k2_vphi = h * f_value_k2.vphi;
    
    var f_value_k3 = f_for_runge_kutta(r + k2_vr/2, vr_sign, E, L);
    var k3_vr = h * f_value_k3.vr;
    var k3_vphi = h * f_value_k3.vphi;
    
    var f_value_k4 = f_for_runge_kutta(r + k3_vr, vr_sign, E, L);
    var k4_vr = h * f_value_k4.vr;
    var k4_vphi = h * f_value_k4.vphi;
    
    var delta_r = get_value_from_runge_kutta_ks(k1_vr, k2_vr, k3_vr, k4_vr);
    var delta_phi = get_value_from_runge_kutta_ks(k1_vphi, k2_vphi, k3_vphi, k4_vphi);
    var deltas = { r: delta_r, phi: delta_phi };
    
    return deltas;
}

function f_for_runge_kutta(r, vr_sign, E, L) {
    var vphi = L / (Math.pow(r, 2));
    var value_inside_sqrt_of_vr = 2*Math.abs(E - get_newton_potential(r, L));
    var vr = vr_sign * Math.sqrt(value_inside_sqrt_of_vr);

    return { vphi: vphi, vr: vr };
}

function get_value_from_runge_kutta_ks(k1, k2, k3, k4) {
    return (k1 + 2*k2 + 2*k3 + k4) / 6;
}

function initialize_step_data(r, vr, phi, radiuses) {
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var vr_sign = undefined;

    var is_there_any_radius = !(r1 === undefined && r2 === undefined);
    if (is_there_any_radius && vr == 0) {
        var is_closed_orbit = !(r1 === undefined || r2 === undefined);
        if (is_closed_orbit) { // casos 5, 6;
            var d1 = Math.abs(r-r1);
            var d2 = Math.abs(r-r2);
            vr_sign = (d1 > d2 ? -1 : 1);
        } else {
            if (r1 === undefined)  // caso 2;
                vr_sign = -1;
            else  // caso 4;
                vr_sign = 1;
        }

        r = r + vr_sign * INFINITESIMAL;

    } else { // casos 1, 3;
        vr_sign = vr / Math.abs(vr);
    }

    return { r: r, phi: phi, vr_sign: vr_sign };
}

function fill_missing_initial_conditions(initial_conditions) {
    var method = initial_conditions.method || 'runge-kutta';
    var r = initial_conditions.r;
    var vr = initial_conditions.vr;
    var vr_sign = initial_conditions.vr_sign;
    var phi = initial_conditions.phi || 0.0;
    var vphi = initial_conditions.vphi;
    var L = initial_conditions.L;
    var E = initial_conditions.E;

    if (r !== undefined && vr !== undefined && vphi !== undefined) {
        if (L !== undefined) throw "ERROR: You cannot specify L if you specify r, vr and vphi";
        if (E !== undefined) throw "ERROR: You cannot specify E if you specify r, vr and vphi";
        if (vr != 0 && vr_sign !== undefined) throw "ERROR: You cannot specify vr_sign if you specify vr and is not 0";
        L = vphi * Math.pow(r, 2);
        E = (Math.pow(vr, 2) / 2) + get_newton_potential(r,L);
        vr_sign = vr/Math.abs(vr);

    } else if (L !== undefined && E !== undefined) {

        if (r !== undefined) {
            if (vr !== undefined) throw "ERROR: You cannot specify vr if you specify L, E and r";
            if (Math.abs(vr_sign) !== 1) throw "ERROR: vr_sign should be 1.0 or -1.0";
            if (vphi !== undefined) throw "ERROR: You cannot specify vphi if you specify L, E and r";

            vphi = L/Math.pow(r, 2);
            vr = vr_sign * Math.sqrt(Math.abs(2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r)));

        } else if (vr !== undefined) {
            if (r !== undefined) throw "ERROR: You cannot specify r if you specify L, E and vr";
            if (vphi !== undefined) throw "ERROR: You cannot specify vphi if you specify L, E and vr";
            if (vr != 0 && vr_sign !== undefined) throw "ERROR: You cannot specify vr_sign if you specify vr and is not 0";

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
            vr_sign = vr/Math.abs(vr);

        } else if (vphi !== undefined) {
            if (r !== undefined) throw "ERROR: You cannot specify r if you specify L, E and vphi";
            if (vr !== undefined) throw "ERROR: You cannot specify vr if you specify L, E and vphi";
            if (Math.abs(vr_sign) !== 1) throw "ERROR: vr_sign should be 1.0 or -1.0";

            r = Math.sqrt(Math.abs(L / vphi));
            vr = vr_sign * Math.sqrt(Math.abs(2 * (E - (Math.pow(L, 2))/(2*Math.pow(r, 2)) + 1/r)));
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
        vr_sign: vr_sign,
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

function range(start, end) {
  return Array(end - start + 1).fill().map(function(_, idx) { return start + idx; });
}


$(document).ready(bootstrapApp);

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

function bootstrapApp() {
    alert(
        "¿Qué haces aquí? Espero que seas uno de los Obi Four Kenobi.\n" +
        "En ese caso: di amigo (o haz click en OK) y entra :).\n" +
        "Si no lo eres: ESTAS NO SON LAS WEBS QUE ESTÁS BUSCANDO."
    );
    
    var defaultFormDataOpts = defaultInitialConditions.map(function(data){
        return $('<option>').attr('value', data.name).html(data.name);
    });
    $('#defaultFormData')
        .append(defaultFormDataOpts)
        .val(defaultInitialConditions[4].name);
    
    onDefaultFormDataChange();
    saveRun();
    onInputFormatChange();

    $('#inputFormat').change(onInputFormatChange);
    $('#defaultFormData').change(onDefaultFormDataChange);
    $('#vr').change(onVrChange);

    $("#runBtn").click(saveRun);
}

function setFormData(data) {
    $("#inputFormat").val(data.input_format);
    onInputFormatChange();
    $("#siUnits").prop("checked", data.si_units);
    $("#timeResolution").val(data.time_resolution);
    $("#simulationTime").val(data.simulation_time);
    $("#M").val(data.M);
    $("#R").val(data.R);
    $("#m").val(data.m);
    $("#r").val(data.r);
    $("#vr").val(data.vr);
    $("#vrSign").val(data.vr_sign);
    onVrChange();
    $("#phi").val(data.phi);
    $("#vphi").val(data.vphi);
    $("#L").val(data.L);
    $("#E").val(data.E);
}

function getFormData(data) {
    var inp = $('#inputFormat');
    var val = inp.val();
    var r, vr, vphi, L, E, vrSign;
    switch (val) {
        case "r-vr-vphi":
            r = Number($('#r').val());
            vr = Number($('#vr').val());
            vphi = Number($('#vphi').val());
            if (vr == 0)
                vrSign = Number($('#vrSign').val());
            break;
        case "L-E-r":
            L = Number($('#L').val());
            E = Number($('#E').val());
            r = Number($('#r').val());
            vrSign = Number($('#vrSign').val());
            break;
        case "L-E-vr":
            L = Number($('#L').val());
            E = Number($('#E').val());
            vr = Number($('#vr').val());
            if (vr == 0)
                vrSign = Number($('#vrSign').val());
            break;
        case "L-E-vphi":
            L = Number($('#L').val());
            E = Number($('#E').val());
            vphi = Number($('#vphi').val());
            vrSign = Number($('#vrSign').val());
            break;
        default:
            alert("Datos de Entrada (" + val + ") incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò");   
    }
    
    return {
        input_format    : $("#inputFormat").val(),
        si_units        : $("#siUnits").is(':checked'),
        time_resolution : Number($("#timeResolution").val()),
        simulation_time : Number($("#simulationTime").val()),
        M       : Number($("#M").val()),
        R       : Number($("#R").val()),
        m       : Number($("#m").val()),
        r       : r,
        vr      : vr,
        vr_sign : vrSign,
        phi     : Number($("#phi").val()),
        vphi    : vphi,
        L       : L,
        E       : E,
        method  : $("#method").val(),
    }
}

function onVrChange() {
    var inputFormat = $('#inputFormat').val();
    var vr = Number($('#vr').val());
    var isVrSignNeeded = (vr == 0 || inputFormat.indexOf("vr") < 0);
    var vrSignInput = $('#vrSign');
    vrSignInput.prop("disabled", !isVrSignNeeded);
    var vrSign = Number(vrSignInput.val());
    if (vrSign != 1 && vrSign != -1)
        vrSignInput.val(1);
}

function onInputFormatChange() {
    var val = $('#inputFormat').val();
    $('form input').prop("disabled", false);
    switch (val) {
        case "r-vr-vphi":
            $('#L').prop("disabled", true);
            $('#E').prop("disabled", true);
            $('#vrSign').prop("disabled", true);
            break;
        case "L-E-r":
            $('#vr').prop("disabled", true);
            $('#vphi').prop("disabled", true);
            break;
        case "L-E-vr":
            $('#r').prop("disabled", true);
            $('#vphi').prop("disabled", true);
            $('#vrSign').prop("disabled", true);
            break;
        case "L-E-vphi":
            $('#r').prop("disabled", true);
            $('#vr').prop("disabled", true);
            break;
        default:
            alert("Datos de Entrada (" + val + ") incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò");
        
    }
}

function onDefaultFormDataChange() {
    var initialConditionsName = $('#defaultFormData').val();
    
    var filteredIC = defaultInitialConditions
        .filter(function(ic) { return ic.name == initialConditionsName });

    if (filteredIC.length != 1) {
        alert("ERROR: Condiciones iniciales no encontradas (" + initialConditionsName + ") ... ¿Cómo has conseguido que ocurra esto? Ó_ò")
        return;
    }
    
    setFormData(filteredIC[0]);
    saveRun();
}
