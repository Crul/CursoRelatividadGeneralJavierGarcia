var MAX_POINTS_TO_PRINT = 200;

var runFnByPhysics = {
    'newton-euler': function() { return runNewton(movePointEuler); },
    'newton-runge-kutta': function() { return runNewton(movePointRungeKutta); },
    'schwarzschild-inaki': runSchwarzschildInaki,
    'schwarzschild-javier': runSchwarzschildJavier,
};

var fillMissingInitialConditionsFnByPhysics = {
    'newton-euler': fillMissingInitialConditionsNewton,
    'newton-runge-kutta': fillMissingInitialConditionsNewton,
    'schwarzschild-inaki': fillMissingInitialConditionsSchwarzschild,
    'schwarzschild-javier': fillMissingInitialConditionsSchwarzschild,
};

var plotPotentialChartFnByPhysics = {
    'newton-euler': plotNewtonPotentialChart,
    'newton-runge-kutta': plotNewtonPotentialChart,
    'schwarzschild-inaki': plotSchwarzschildPotentialChart,
    'schwarzschild-javier': plotSchwarzschildPotentialChart,
};

$(document).ready(bootstrapApp);

function run() {
    try {
        onInitialConditionsChange(true);
        var physics = $('#physics').val();
        var results = runFnByPhysics[physics]();
        console.debug(results);
    } catch(ex) {
        handleException(ex);
    }   
}

var lastManuallySetHash = '';
function bootstrapApp() {
    alert(
        '¿Qué haces aquí? Espero que seas uno de los Obi Four Kenobi.\n' +
        'En ese caso: di amigo (o haz click en OK) y entra :).\n' +
        'Si no lo eres: ESTAS NO SON LAS WEBS QUE ESTÁS BUSCANDO.'
    );

    var defaultFormDataOpts = defaultInitialConditions.map(function(data){
        return $('<option>').attr('value', data.name).html(data.name);
    });
    $('#defaultFormData').append(defaultFormDataOpts);

    onInputFormatChange();
    if (window.location.hash) {
        onHashChange();
    } else {
        setFormData(defaultInitialConditions[0]);
        onDefaultFormDataChange();
        onInitialConditionsChange();
    }

    $('#inputFormat').change(onInputFormatChange).change(onInitialConditionsChange);
    $('#defaultFormData')
        .change(onDefaultFormDataChange)
        .change(onInitialConditionsChange)
        .change(run);

    $('#siUnits').change(onSiUnitsChane).change(onInitialConditionsChange);
    $('#showPointsData').change(onShowPointsDataChange);
    
    $('#r').change(onInitialConditionsChange);
    $('#vr').change(onVrChange).change(onInitialConditionsChange);
    $('#vrSign').change(onInitialConditionsChange);
    $('#phi').change(onInitialConditionsChange);
    $('#vphi').change(onInitialConditionsChange);
    $('#L').change(onInitialConditionsChange);
    $('#E').change(onInitialConditionsChange);

    $('#rSi').change(onInitialConditionsChange);
    $('#vrSi').change(onVrChange).change(onInitialConditionsChange);
    $('#vrSignSi').change(onInitialConditionsChange);
    $('#phiSi').change(onInitialConditionsChange);
    $('#vphiSi').change(onInitialConditionsChange);
    $('#LSi').change(onInitialConditionsChange);
    $('#ESi').change(onInitialConditionsChange);

    $('#runBtn').click(run);

    $(window).bind('hashchange', onHashChange);
}

function setFormData(data, doNotSetHash) {
    $('#physics').val(data.physics);
    $('#inputFormat').val(data.inputFormat);
    onInputFormatChange(true);
    $('#siUnits').prop('checked', data.siUnits || false);
    onSiUnitsChane();
    $('#timeResolution').val(data.timeResolution);
    $('#simulationTime').val(data.simulationTime);
    $('#M').val(data.M || $('#M').val());
    $('#R').val(data.R || $('#R').val());
    $('#m').val(data.m || $('#m').val());
    
    $('#r').val(data.r);
    $('#vr').val(data.vr);
    $('#vrSign').val(data.vrSign);
    $('#phi').val(data.phi || 0);
    $('#vphi').val(data.vphi);
    $('#L').val(data.L);
    $('#E').val(data.E);
    
    $('#rSi').val(data.rSi);
    $('#vrSi').val(data.vrSi);
    $('#vrSignSi').val(data.vrSignSi);
    $('#phiSi').val(data.phiSi || 0);
    $('#vphiSi').val(data.vphiSi);
    $('#LSi').val(data.LSi);
    $('#ESi').val(data.ESi);

    onVrChange();
    onInitialConditionsChange();
    
    $('#showPointsData').prop('checked', data.showPointsData);

    if (!doNotSetHash)
        setHash(data);
}

function onHashChange() {
    if (!window.location.hash) return;

    var values = {};
    var hash = window.location.hash.substring(1);
    if (lastManuallySetHash == hash) return;

    hash.split('&').forEach(function(token) {
        var tokenItems = token.split('=');
        var value = (tokenItems.length > 1 && tokenItems[1] != '' ? tokenItems[1] : undefined);
        if (value == 'false') value = false;

        values[tokenItems[0]] = value;
    });
    setFormData(values, false);
    onInitialConditionsChange();
}

function setHash(data) {
    lastManuallySetHash = ''
        + getHashValue(data, 'inputFormat')
        + '&' + getHashValue(data, 'siUnits')
        + '&' + getHashValue(data, 'timeResolution')
        + '&' + getHashValue(data, 'simulationTime')
        + '&' + getHashValue(data, 'M')
        + '&' + getHashValue(data, 'R')
        + '&' + getHashValue(data, 'm')

        + '&' + getHashValue(data, 'r')
        + '&' + getHashValue(data, 'vr')
        + '&' + getHashValue(data, 'vrSign')
        + '&' + getHashValue(data, 'phi')
        + '&' + getHashValue(data, 'vphi')
        + '&' + getHashValue(data, 'L')
        + '&' + getHashValue(data, 'E')

        + '&' + getHashValue(data, 'rSi')
        + '&' + getHashValue(data, 'vrSi')
        + '&' + getHashValue(data, 'vrSignSi')
        + '&' + getHashValue(data, 'phiSi')
        + '&' + getHashValue(data, 'vphiSi')
        + '&' + getHashValue(data, 'LSi')
        + '&' + getHashValue(data, 'ESi')

        + '&' + getHashValue(data, 'physics')
        + '&' + getHashValue(data, 'showPointsData')
        + '';

    window.location.hash = lastManuallySetHash;
}

function getHashValue(data, prop) {
    var value = data[prop];
    if (value == 'false') value = false;

    return prop + '=' + (value === undefined ? '' : value);
}

function getFormData(data) {
    var r, phi, vr, vrSign, vphi, L, E,
        rSi, phiSi, vrSi, vrSignSi, vphiSi, LSi, ESi;

    var isSiUnits = $('#siUnits').is(':checked');
    var val = $('#inputFormat').val();
    if (isSiUnits) {
        phiSi = Number($('#phiSi').val());
        switch (val) {
        case 'r-vr-vphi':
            rSi = Number($('#rSi').val());
            vrSi = Number($('#vrSi').val());
            vphiSi = Number($('#vphiSi').val());
            if (vrSi == 0)
                vrSignSi = Number($('#vrSignSi').val());
            break;
        case 'L-E-r':
            LSi = Number($('#LSi').val());
            ESi = Number($('#ESi').val());
            rSi = Number($('#rSi').val());
            vrSignSi = Number($('#vrSignSi').val());
            break;
        case 'L-E-vr':
            LSi = Number($('#LSi').val());
            ESi = Number($('#ESi').val());
            vrSi = Number($('#vrSi').val());
            if (vrSi == 0)
                vrSignSi = Number($('#vrSignSi').val());
            break;
        case 'L-E-vphi':
            LSi = Number($('#LSi').val());
            ESi = Number($('#ESi').val());
            vphiSi = Number($('#vphiSi').val());
            vrSignSi = Number($('#vrSignSi').val());
            break;
        default:
            alert('Datos de Entrada (' + val + ') incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò');   
        }
    } else {
        phi = Number($('#phi').val());
        switch (val) {
        case 'r-vr-vphi':
            r = Number($('#r').val());
            vr = Number($('#vr').val());
            vphi = Number($('#vphi').val());
            if (vr == 0)
                vrSign = Number($('#vrSign').val());
            break;
        case 'L-E-r':
            L = Number($('#L').val());
            E = Number($('#E').val());
            r = Number($('#r').val());
            vrSign = Number($('#vrSign').val());
            break;
        case 'L-E-vr':
            L = Number($('#L').val());
            E = Number($('#E').val());
            vr = Number($('#vr').val());
            if (vr == 0)
                vrSign = Number($('#vrSign').val());
            break;
        case 'L-E-vphi':
            L = Number($('#L').val());
            E = Number($('#E').val());
            vphi = Number($('#vphi').val());
            vrSign = Number($('#vrSign').val());
            break;
        default:
            alert('Datos de Entrada (' + val + ') incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò');   
        }
    }

    return {
        physics        : $('#physics').val(),
        inputFormat    : $('#inputFormat').val(),
        siUnits        : $('#siUnits').is(':checked'),
        timeResolution : Number($('#timeResolution').val()),
        simulationTime : Number($('#simulationTime').val()),
        showPointsData : Number($('#showPointsData').is(':checked')),
        M       : Number($('#M').val()),
        R       : Number($('#R').val()),
        m       : Number($('#m').val()),

        r       : r,
        vr      : vr,
        vrSign  : vrSign,
        phi     : phi,
        vphi    : vphi,
        L       : L,
        E       : E,

        rSi     : rSi,
        vrSi    : vrSi,
        vrSignSi: vrSignSi,
        phiSi   : phiSi,
        vphiSi  : vphiSi,
        LSi     : LSi,
        ESi     : ESi,

    }
}

function printPointsData(points, dataLength) {
    var pointTypes = Object.keys(points);
    var theadCells = pointTypes.map(function(pointType) { return $('<td>').html(pointType); });
    var thead = $('<thead>').append($('<tr>').append(theadCells));

    var tbodyRows = range(0, Math.min(dataLength, MAX_POINTS_TO_PRINT)).map(function(i) {
        return pointsRow = $('<tr>').append(
            pointTypes.map(function(pointType) {
                return $('<td>').html(points[pointType][i]);
            })
        );

        return pointsRow;
    });

    var tbody = $('<tbody>').append(tbodyRows);

    if (dataLength > MAX_POINTS_TO_PRINT) {
        tbody.append(
            $('<tr>').append(
                $('<td>')
                    .prop('colspan', pointTypes.length)
                    .addClass('not-all-data-printed-msg')
                    .append('Sólo se muestran los primeros ' + MAX_POINTS_TO_PRINT + ' valores')
            )
        );
    }

    $('#pointsDataTable').append(thead).append(tbody);
    $('#pointsDataTableDiv').fadeIn();
}

function onInitialConditionsChange(ev) {
    try {
        $('#runBtn').prop('disabled', true);
        $('#trajectoryPlot').html('');
        $('#potentialPlot').html('');
        var data = processInitialConditions();

        var isSiUnits = $('#siUnits').is(':checked');
        var val = $('#inputFormat').val();
        switch (val) {
            case 'r-vr-vphi':
                $('#L').val(data.L);
                $('#E').val(data.E);
                $('#LSi').val(data.LSi);
                $('#ESi').val(data.ESi);
                if (isSiUnits) {
                    $('#r').val(data.r);
                    $('#vr').val(data.vr);
                    $('#vrSign').val(data.vrSign);
                    $('#phi').val(data.phi);
                    $('#vphi').val(data.vphi);
                } else {
                    $('#rSi').val(data.rSi);
                    $('#vrSi').val(data.vrSi);
                    $('#vrSignSi').val(data.vrSignSi);
                    $('#phiSi').val(data.phiSi);
                    $('#vphiSi').val(data.vphiSi);
                }
                break;
            case 'L-E-r':
                $('#vr').val(data.vr);
                $('#vphi').val(data.vphi);
                $('#vrSi').val(data.vrSi);
                $('#vphiSi').val(data.vphiSi);
                if (isSiUnits) {
                    $('#r').val(data.r);
                    $('#vrSign').val(data.vrSign);
                    $('#phi').val(data.phi);
                    $('#L').val(data.L);
                    $('#E').val(data.E);
                } else {
                    $('#rSi').val(data.rSi);
                    $('#vrSignSi').val(data.vrSignSi);
                    $('#phiSi').val(data.phiSi);
                    $('#LSi').val(data.LSi);
                    $('#ESi').val(data.ESi);
                }
                break;
            case 'L-E-vr':
                $('#r').val(data.r);
                $('#vphi').val(data.vphi);
                $('#rSi').val(data.rSi);
                $('#vphiSi').val(data.vphiSi);
                if (isSiUnits) {
                    $('#vr').val(data.vr);
                    $('#vrSign').val(data.vrSign);
                    $('#phi').val(data.phi);
                    $('#L').val(data.L);
                    $('#E').val(data.E);
                } else {
                    $('#vrSi').val(data.vrSi);
                    $('#vrSignSi').val(data.vrSignSi);
                    $('#phiSi').val(data.phiSi);
                    $('#LSi').val(data.LSi);
                    $('#ESi').val(data.ESi);
                }
                break;
            case 'L-E-vphi':
                $('#r').val(data.r);
                $('#vr').val(data.vr);
                $('#rSi').val(data.rSi);
                $('#vrSi').val(data.vrSi);
                if (isSiUnits) {
                    $('#vrSign').val(data.vrSign);
                    $('#phi').val(data.phi);
                    $('#vphi').val(data.vphi);
                    $('#L').val(data.L);
                    $('#E').val(data.E);
                } else {
                    $('#vphiSi').val(data.vphiSi);
                    $('#vrSignSi').val(data.vrSignSi);
                    $('#phiSi').val(data.phiSi);
                    $('#LSi').val(data.LSi);
                    $('#ESi').val(data.ESi);
                }
                break;
            default:
                throw InvalidInitialConditionsError('Datos de Entrada (' + val + ') incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò');   
        }
        $('#runBtn').prop('disabled', false);

        if (!ev) run();
    } catch(ex) {
        handleException(ex);
    }
}

function onSiUnitsChane() {
    var isSiUnits = $('#siUnits').is(':checked');
    $('.adim-units').prop('readonly', isSiUnits);
    $('.si-units').prop('readonly', !isSiUnits);
    onInputFormatChange();
    onVrChange();
}

function onVrChange() {
    var vrInputId = "#vr";
    var vrInputSignId = "#vrSign";
    var isSiUnits = $('#siUnits').is(':checked');
    if (isSiUnits) {
        vrInputId += "Si";
        vrInputSignId += "Si";
    }

    var inputFormat = $('#inputFormat').val();
    var vr = Number($(vrInputId).val());
    var isVrSignNeeded = (vr == 0 || inputFormat.indexOf('vr') < 0);
    var vrSignInput = $(vrInputSignId);
    vrSignInput.prop('readonly', !isVrSignNeeded);
    var vrSign = Number(vrSignInput.val());
    if (vrSign != 1 && vrSign != -1)
        vrSignInput.val(1);
    
}

function onInputFormatChange() {
    var inputIdSuffix = '';
    var inputSelectors = 'form input.';
    var isSiUnits = $('#siUnits').is(':checked');
    if (isSiUnits) {
        inputIdSuffix = 'Si';
        inputSelectors += 'si-units';
    } else {
        inputSelectors += 'adim-units';
    }
    $(inputSelectors).prop('readonly', false);

    var val = $('#inputFormat').val();
    switch (val) {
        case 'r-vr-vphi':
            $('#L' + inputIdSuffix).prop('readonly', true);
            $('#E' + inputIdSuffix).prop('readonly', true);
            $('#vrSign' + inputIdSuffix).prop('readonly', true);
            break;
        case 'L-E-r':
            $('#vr' + inputIdSuffix).prop('readonly', true);
            $('#vphi' + inputIdSuffix).prop('readonly', true);
            break;
        case 'L-E-vr':
            $('#r' + inputIdSuffix).prop('readonly', true);
            $('#vphi' + inputIdSuffix).prop('readonly', true);
            $('#vrSign' + inputIdSuffix).prop('readonly', true);
            break;
        case 'L-E-vphi':
            $('#r' + inputIdSuffix).prop('readonly', true);
            $('#vr' + inputIdSuffix).prop('readonly', true);
            break;
        default:
            alert('Datos de Entrada (' + val + ') incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò');
    }
}

function onDefaultFormDataChange() {
    var initialConditionsName = $('#defaultFormData').val();
    if (!initialConditionsName)
        return;

    var filteredIC = defaultInitialConditions
        .filter(function(ic) { return ic.name == initialConditionsName });

    if (filteredIC.length != 1) {
        alert('ERROR: Condiciones iniciales no encontradas (' + initialConditionsName + ') ... ¿Cómo has conseguido que ocurra esto? Ó_ò');
        return;
    }

    setFormData(filteredIC[0]);
    $('#defaultFormData').val('');
}

function onShowPointsDataChange() {
    var doNotRun = true;
    onInitialConditionsChange(doNotRun);

    var showPointsData = $('#showPointsData').is(':checked');
    if (!showPointsData) {
        $('#pointsDataTableDiv').fadeOut();
        return;
    }

    var isThereDataInTable = $('#pointsDataTable thead').length > 0;
    if (!isThereDataInTable && lastRunPoints) {
        printPointsData(lastRunPoints, lastRunPoints.x.length);
    }
    $('#pointsDataTableDiv').fadeIn();
}

function handleException(ex) {
    if (ex.name != 'InvalidInitialConditionsError')
        throw ex;

    $('form input[readonly="readonly"]').val('');
    $('#trajectoryPlot').html('');
    $('#trajectoryPlot').append($('<div>').addClass('error-msg').html(ex.message));
}
