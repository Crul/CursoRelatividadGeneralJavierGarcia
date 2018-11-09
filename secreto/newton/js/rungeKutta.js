function move_point_runge_kutta(radiuses, step_data, E, L, dt, get_potential_fn) {
    /* Runge-Kutta
    k_1 = h * f(t_n, y_n)
    k_2 = h * f(t_n + h/2, y_n + k1/2)
    k_3 = h * f(t_n + h/2, y_n + k2/2)
    k_4 = h * f(t_n + h, y_n + k3)
    y_n+1 = y_n + (k1 + 2*k_2 + 2*k3 + k4)     */
    
    var r = step_data.r;
    var deltas = calc_runge_kutta(dt, step_data.r, step_data.vrSign, E, L, get_potential_fn);
    
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var is_closed_orbit = !(r1 === undefined || r2 === undefined);
    
    var is_inside_ellipse_radiuses = is_closed_orbit && (r > r1 && r < r2);
    var is_open_trajectory_over_threshold = (!is_closed_orbit) && (r >= INFINITESIMAL);
    if (is_inside_ellipse_radiuses || is_open_trajectory_over_threshold) {
        step_data.r   += deltas.r;
        step_data.phi += deltas.phi;
    }

    var is_r_below_minimum_radius = (r1 !== undefined) && (r <= r1);
    if (is_r_below_minimum_radius) { // There is a minimum radius and we are below;
        step_data.vrSign = 1;
        step_data.r += INFINITESIMAL;
        if (is_closed_orbit) {
            deltas = calc_runge_kutta(dt, step_data.r, step_data.vrSign, E, L, get_potential_fn);
            step_data.r   += deltas.r;
            step_data.phi += deltas.phi;
        }
    }

    var is_r_above_maximum_radius = (r2 !== undefined) && (r >= r2);
    if (is_r_above_maximum_radius) { // There is a maximum radius and we are below;
        step_data.vrSign = -1;
        step_data.r -= INFINITESIMAL;
        if (is_closed_orbit) {
            deltas = calc_runge_kutta(dt, step_data.r, step_data.vrSign, E, L, get_potential_fn);
            step_data.r   += deltas.r;
            step_data.phi += deltas.phi;
        }
    }
}

function calc_runge_kutta(dt, r, vrSign, E, L, get_potential_fn) {
    var h = dt;
    var f_value_k1 = f_for_runge_kutta(r, vrSign, E, L, get_potential_fn);
    var k1_vr = h * f_value_k1.vr;
    var k1_vphi = h * f_value_k1.vphi;
        
    var f_value_k2 = f_for_runge_kutta(r + k1_vr/2, vrSign, E, L, get_potential_fn);
    var k2_vr = h * f_value_k2.vr;
    var k2_vphi = h * f_value_k2.vphi;
    
    var f_value_k3 = f_for_runge_kutta(r + k2_vr/2, vrSign, E, L, get_potential_fn);
    var k3_vr = h * f_value_k3.vr;
    var k3_vphi = h * f_value_k3.vphi;
    
    var f_value_k4 = f_for_runge_kutta(r + k3_vr, vrSign, E, L, get_potential_fn);
    var k4_vr = h * f_value_k4.vr;
    var k4_vphi = h * f_value_k4.vphi;
    
    var delta_r = get_value_from_runge_kutta_ks(k1_vr, k2_vr, k3_vr, k4_vr);
    var delta_phi = get_value_from_runge_kutta_ks(k1_vphi, k2_vphi, k3_vphi, k4_vphi);
    var deltas = { r: delta_r, phi: delta_phi };
    
    return deltas;
}

function f_for_runge_kutta(r, vrSign, E, L, get_potential_fn) {
    var vphi = L / (Math.pow(r, 2));
    var value_inside_sqrt_of_vr = 2*Math.abs(E - get_potential_fn(r, L));
    var vr = vrSign * Math.sqrt(value_inside_sqrt_of_vr);

    return { vphi: vphi, vr: vr };
}

function get_value_from_runge_kutta_ks(k1, k2, k3, k4) {
    return (k1 + 2*k2 + 2*k3 + k4) / 6;
}
