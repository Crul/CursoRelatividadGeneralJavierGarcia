function move_point_euler(radiuses, step_data, E, L, dt, get_potential_fn) {
    // Euler
    // y_n+1 = y_n + h * f(t_n, y_n)
    var r = step_data.r;
    var vrSign = step_data.vrSign;
    var r1 = radiuses.r1;
    var r2 = radiuses.r2;
    var is_closed_orbit = !(r1 === undefined || r2 === undefined);
    
    step_data.vphi = L / (Math.pow(r, 2));
    var value_inside_sqrt_of_vr = 2*Math.abs(E - get_potential_fn(r,L));
    step_data.vr = vrSign * Math.sqrt(value_inside_sqrt_of_vr);
    
    var is_r_below_minimum_radius = (r1 !== undefined) && (r <= r1);
    if (is_r_below_minimum_radius) { // There is a minimum radius and we are below;
        step_data.vrSign = 1;
        step_data.r  = r + INFINITESIMAL;
        step_data.vr = Math.abs(step_data.vr);
        if (is_closed_orbit) {
            step_data.r   += step_data.vr * dt;
            step_data.phi += step_data.vphi * dt;
        }
    }

    var is_r_above_maximum_radius = (r2 !== undefined) && (r >= r2);
    if (is_r_above_maximum_radius) { // There is a maximum radius and we are below;
        step_data.vrSign = -1;
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
