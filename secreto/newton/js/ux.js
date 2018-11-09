$(document).ready(bootstrapApp);

function bootstrapApp() {
    alert(
        "¿Qué haces aquí? Espero que seas uno de los Obi Four Kenobi.\n" +
        "En ese caso: di amigo (o haz click en OK) y entra :).\n" +
        "Si no lo eres: ESTAS NO SON LAS WEBS QUE ESTÁS BUSCANDO."
    );
    
    var defaultFormDataOpts = defaultInitialConditions.map(function(data){
        return $('<option>').attr('value', data.name).html(data.name);
    });
    $('#defaultFormData').append(defaultFormDataOpts);
    
    onInputFormatChange();
    if (window.location.hash) {
        onHashChange();
    } else {
        setFormData(defaultInitialConditions[4]);
    }
    saveRun();

    $('#inputFormat').change(onInputFormatChange);
    $('#defaultFormData').change(onDefaultFormDataChange);
    $('#vr').change(onVrChange);
    $('#showPointsData').change(onShowPointsDataChange);

    $("#runBtn").click(saveRun);
    
    $(window).bind('hashchange', onHashChange);
}

function setFormData(data, doNotSetHash) {
    $("#inputFormat").val(data.inputFormat);
    onInputFormatChange();
    $("#siUnits").prop("checked", data.siUnits || false);
    $("#timeResolution").val(data.timeResolution);
    $("#simulationTime").val(data.simulationTime);
    $("#M").val(data.M || $("#M").val());
    $("#R").val(data.R || $("#R").val());
    $("#m").val(data.m || $("#m").val());
    $("#r").val(data.r);
    $("#vr").val(data.vr);
    $("#vrSign").val(data.vrSign);
    onVrChange();
    $("#phi").val(data.phi);
    $("#vphi").val(data.vphi);
    $("#L").val(data.L);
    $("#E").val(data.E);
    
    if (!doNotSetHash)
        setHash(data);
}

function onHashChange() {
    if (!window.location.hash) return;

    var values = {};
    var hash = window.location.hash.substring(1);
    hash.split("&").forEach(function(token) {
        var tokenItems = token.split("=");
        var value = (tokenItems.length > 1 && tokenItems[1] != "" ? tokenItems[1] : undefined);
        if (value == "false") value = false;
    
        values[tokenItems[0]] = value;
    });
    setFormData(values, false);
}

function setHash(data) {
    window.location.hash = ""
        + getHashValue(data, "inputFormat")
        + "&" + getHashValue(data, "siUnits")
        + "&" + getHashValue(data, "timeResolution")
        + "&" + getHashValue(data, "simulationTime")
        + "&" + getHashValue(data, "M")
        + "&" + getHashValue(data, "R")
        + "&" + getHashValue(data, "m")
        + "&" + getHashValue(data, "r")
        + "&" + getHashValue(data, "vr")
        + "&" + getHashValue(data, "vrSign")
        + "&" + getHashValue(data, "phi")
        + "&" + getHashValue(data, "vphi")
        + "&" + getHashValue(data, "L")
        + "&" + getHashValue(data, "E")
        + "";
}

function getHashValue(data, prop) {
    var value = data[prop];
    if (value == "false") value = false;

    return prop + "=" + (value === undefined ? "" : value);
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
        inputFormat    : $("#inputFormat").val(),
        siUnits        : $("#siUnits").is(':checked'),
        timeResolution : Number($("#timeResolution").val()),
        simulationTime : Number($("#simulationTime").val()),
        M       : Number($("#M").val()),
        R       : Number($("#R").val()),
        m       : Number($("#m").val()),
        r       : r,
        vr      : vr,
        vrSign  : vrSign,
        phi     : Number($("#phi").val()),
        vphi    : vphi,
        L       : L,
        E       : E,
        method  : $("#method").val(),
    }
}

function print_points_data(points, dataLength) {
    var pointTypes = Object.keys(points);
    var theadCells = pointTypes.map(function(pointType) { return $('<td>').html(pointType); });
    var thead = $('<thead>').append($('<tr>').append(theadCells));
    
    var tbodyRows = range(0, dataLength).map(function(i) {
        return pointsRow = $('<tr>').append(
            pointTypes.map(function(pointType) {
                return $('<td>').html(points[pointType][i]);
            })
        );
            
        return pointsRow;
    });
    
    
    var tbody = $('<thead>').append(tbodyRows);
    
    $('#pointsDataTable').append(thead).append(tbody);
    $('#pointsDataTableDiv').fadeIn();
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
    $('#defaultFormData').val("");
    saveRun();
}

function onShowPointsDataChange() {
    var showPointsData = $('#showPointsData').is(":checked");
    if (!showPointsData) {
        $("#pointsDataTableDiv").fadeOut();
        return;
    }
    
    var isThereDataInTable = $("#pointsDataTable thead").length > 0;
    if (!isThereDataInTable && lastRunPoints) {
        print_points_data(lastRunPoints, lastRunPoints.x.length);
    }
    $("#pointsDataTableDiv").fadeIn();
}