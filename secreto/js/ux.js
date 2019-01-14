var currentVrSign = 1;
var currentPhysics = 'schwarzschild';
var lastManuallySetHash = '';
var MAX_POINTS_TO_PRINT = 200;
var MAX_STEPS = 5e5;

var physicsConfigs = {
    newton: {
        run: runNewton,
        fillMissingInitialConditions: fillMissingInitialConditionsNewton,
        plotPotentialChart: plotNewtonPotentialChart,
        siToAdim: siToBel,
        adimToSi: belToSi,
    },
    schwarzschild: {
        run: runSchwarzschild,
        fillMissingInitialConditions: fillMissingInitialConditionsSchwarzschild,
        plotPotentialChart: plotSchwarzschildPotentialChart,
        siToAdim: siToSchwarzschild,
        adimToSi: schwarzschildToSi,
    },
}

var fields = [
    'physics', 'inputFormat', 'units', 'stepsCount', 'M', 'R', 'm',
    'totalProperTimeAdim', 'rAdim', 'vrAdim', 'phiAdim', 'vphiAdim', 'LAdim', 'epsilonAdim',
    'totalProperTimeSi', 'rSi', 'vrSi', 'phiSi', 'vphiSi', 'LSi', 'epsilonSi',
    'vrSign',
];

$(document).ready(bootstrapApp);

function bootstrapApp() {
    var examplesOpts = defaultInitialConditions.map(function(data){
        return $('<option>').attr('value', data.name).html(data.name);
    });
    $('#examples').append(examplesOpts);

    $('#inputFormat').change(onInputFormatChange).change(handleInitialConditionsAndRun);
    $('#examples')
        .change(onExamplesChange)
        .change(handleInitialConditionsAndRun);

    $('.physics-btn').click(onPhysicsChange).click(handleInitialConditionsAndRun);
    
    $('.form-data-box input[type=radio]').change(onUnitsChange).change(handleInitialConditionsAndRun);
    
    $('#stepsCount').change(handleInitialConditionsAndRun);
    $('#M').change(handleInitialConditionsAndRun);
    $('#R').change(handleInitialConditionsAndRun);
    $('#m').change(handleInitialConditionsAndRun);

    $('.vr-sign-btn')
        .click(onVrSignChange)
        .click(handleInitialConditionsAndRun);
    
    $('#totalProperTimeAdim').change(handleInitialConditionsAndRun);
    $('#rAdim').change(handleInitialConditionsAndRun);
    $('#vrAdim').change(onVrChange).change(handleInitialConditionsAndRun);
    $('#phiAdim').change(handleInitialConditionsAndRun);
    $('#vphiAdim').change(handleInitialConditionsAndRun);
    $('#LAdim').change(handleInitialConditionsAndRun);
    $('#epsilonAdim').change(handleInitialConditionsAndRun);

    $('#totalProperTimeSi').change(handleInitialConditionsAndRun);
    $('#rSi').change(handleInitialConditionsAndRun);
    $('#vrSi').change(onVrChange).change(handleInitialConditionsAndRun);
    $('#phiSi').change(handleInitialConditionsAndRun);
    $('#vphiSi').change(handleInitialConditionsAndRun);
    $('#LSi').change(handleInitialConditionsAndRun);
    $('#epsilonSi').change(handleInitialConditionsAndRun);

    $('#floatingMenu li').click(onMenuClick);
    
    $('#helpBtn').click(function() { $('#helpContent').fadeIn(); });
    $('#closeHelpBtn').click(function() { $('#helpContent').fadeOut(); });
    
    $(window).bind('hashchange', onHashChange);
    
    onPhysicsChange();
    onInputFormatChange();
    if (window.location.hash) {
        onHashChange();
    } else {
        setFormData(defaultInitialConditions[0]);
        onExamplesChange();
        handleInitialConditionsAndRun();
    }
}

function run() {
    $('#loading').show();
    try {
        var steps = Number($('#stepsCount').val());
        if (steps > MAX_STEPS)
            throw InvalidInitialConditionsError('El máximo número de pasos es ' + MAX_STEPS);

        $('#pointsDataTableTitles').html('');
        $('#pointsDataTable').html('');
        $('#downloadData').hide();
        $('#downloadDataBtn').attr('href', '');
    
        var results = physicsConfigs[currentPhysics].run();
        console.debug('run', results);
    } catch(ex) {
        handleException(ex);
    }
    $('#loading').hide();
}

function handleException(ex) {
    if (ex.name != 'InvalidInitialConditionsError')
        throw ex;

    lastRunPoints = undefined;
    $('form input[readonly="readonly"]').val('');
    $('#trajectoryPlot').html('');
    $('#errorMsg').html(ex.message);
}

////////////////////////////////////////////////////// FORM DATA
function getFormData(data) {
    return {
        physics        : currentPhysics,
        inputFormat    : $('#inputFormat').val(),
        stepsCount     : getFormValue('stepsCount'),
        units          : getUnits(),
        siUnits        : getIsSiUnits(),

        M: getFormValue('M'),
        R: getFormValue('R'),
        m: getFormValue('m'),

        properTimeIncrementAdim: getFormValue('properTimeIncrementAdim'),
        totalProperTimeAdim    : getFormValue('totalProperTimeAdim'),
        rAdim      : getFormValue('rAdim'),
        vrAdim     : getFormValue('vrAdim'),
        phiAdim    : getFormValue('phiAdim'),
        vphiAdim   : getFormValue('vphiAdim'),
        LAdim      : getFormValue('LAdim'),
        epsilonAdim: getFormValue('epsilonAdim'),

        properTimeIncrementSi : getFormValue('properTimeIncrementSi'),
        totalProperTimeSi     : getFormValue('totalProperTimeSi'),
        rSi       : getFormValue('rSi'),
        vrSi      : getFormValue('vrSi'),
        phiSi     : getFormValue('phiSi'),
        vphiSi    : getFormValue('vphiSi'),
        LSi       : getFormValue('LSi'),
        epsilonSi : getFormValue('epsilonSi'),
        
        vrSign    : currentVrSign,
    }
}

function getFormValue(inputId) {
    var inputCtrl = $('#' + inputId);
    return inputCtrl.is('[readonly]') ? undefined : Number(inputCtrl.val())
}

function setFormData(data, doNotSetHash) {
    currentPhysics = data.physics;
    onPhysicsChange();
    $('#inputFormat').val(data.inputFormat);
    onInputFormatChange();
    $('input[name=units-type][value=' + data.units + ']').prop('checked', true);
    onUnitsChange();
    $('#stepsCount').val(data.stepsCount);
    $('#M').val(data.M || $('#M').val());
    $('#R').val(data.R || $('#R').val());
    $('#m').val(data.m || $('#m').val());

    $('#totalProperTimeAdim').val(data.totalProperTimeAdim);
    $('#rAdim').val(data.rAdim);
    $('#vrAdim').val(data.vrAdim);
    $('#phiAdim').val(data.phiAdim || 0);
    $('#vphiAdim').val(data.vphiAdim);
    $('#LAdim').val(data.LAdim);
    $('#epsilonAdim').val(data.epsilonAdim);
    
    $('#totalProperTimeSi').val(data.totalProperTimeSi);
    $('#rSi').val(data.rSi);
    $('#vrSi').val(data.vrSi);
    $('#phiSi').val(data.phiSi || 0);
    $('#vphiSi').val(data.vphiSi);
    $('#LSi').val(data.LSi);
    $('#epsilonSi').val(data.epsilonSi);

    onVrChange();
    setVrSign(data.vrSign);
    
    if (!doNotSetHash)
        setHash(data);
}
////////////////////////////////////////////////////// FORM DATA

////////////////////////////////////////////////////// HASH
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
    handleInitialConditionsAndRun();
}

function setHash(data) {
    lastManuallySetHash = fields
        .filter(function(name){ return data[name] !== undefined; })
        .map(function(name) { return getHashValue(data, name); })
        .join("&");

    window.location.hash = lastManuallySetHash;
}

function getHashValue(data, prop) {
    var value = data[prop];
    if (value == 'false') value = false;

    return prop + '=' + (value === undefined ? '' : value);
}
////////////////////////////////////////////////////// HASH

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

    $('#pointsDataTableTitles').html('').append(thead);
    $('#pointsDataTable').html('').append(tbody);
    
    var csvTitles = pointTypes.join(";");
    var csvData = range(0, Math.min(dataLength, MAX_POINTS_TO_PRINT))
        .map(function(i) {
            return pointTypes.map(function(pointType) { return points[pointType][i]; }).join(";")
        })
        .join("\n");
    
    var csv = csvTitles + "\n" + csvData;
    
    $('#downloadDataBtn')
        .attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv))
        .attr('download', 'simulation.csv');
        
    $('#downloadData').fadeIn();
    
}

function plotTrajectory(xPoints, yPoints, planetRadius, schwarzschildRadius) {
    var auxValues1 = [];
    var auxValues2 = [];
    if (planetRadius){
        auxValues1.push(planetRadius);
        auxValues2.push(-planetRadius);
    }
    if (schwarzschildRadius){
        auxValues1.push(schwarzschildRadius);
        auxValues2.push(-schwarzschildRadius);
    }
    
    var maxLimit = 0;
    if (xPoints.length) {
        maxLimit = TRAJECTORY_PLOT_MAXLIMIT_FACTOR * getMax(auxValues1.concat([xPoints[0], yPoints[0]]));
    }
    var xMin = Math.max(-maxLimit, getMin(xPoints.concat(auxValues2)));
    var xMax = Math.min(maxLimit, getMax(xPoints.concat(auxValues1)));
    var yMin = Math.max(-maxLimit, getMin(yPoints.concat(auxValues2)));
    var yMax = Math.min(maxLimit, getMax(yPoints.concat(auxValues1)));
    
    var xCenter = (xMax + xMin) / 2;
    var yCenter = (yMax + yMin) / 2;
    var maxRange = Math.max(xMax - xMin, yMax - yMin);
    var maxHalfRange = 1.05 * maxRange / 2;
    
    var xRange = [ xCenter - maxHalfRange, xCenter + maxHalfRange ];
    var yRange = [ yCenter - maxHalfRange, yCenter + maxHalfRange ];
    
    var shapes = [];
    if (planetRadius) {
        shapes.push({
            type: 'circle',
            xref: 'x', yref: 'y',
            x0: -planetRadius, y0: -planetRadius,
            x1:  planetRadius, y1:  planetRadius,
            fillcolor: '#f9a50355',
            line: { color: 'orange' }
        })
    }
    if (schwarzschildRadius) {
        shapes.push({
            type: 'circle',
            xref: 'x', yref: 'y',
            x0: -1, y0: -1,
            x1:  1, y1:  1,
            line: { color: 'red' }
        })
    }
        
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
      shapes: shapes,
      xaxis: {
        title: 'x',
        range: xRange,
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
      yaxis: {
        title: 'y',
        range: yRange,
        color: '#fff',
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      }
    };

    var trajectoryData = [{ x: xPoints, y: yPoints }];
    Plotly.newPlot($('#trajectoryPlot')[0], trajectoryData, layout);
}

function handleInitialConditionsAndRun() {
    $('#errorMsg').html('');
    $('#loading').show();
    setTimeout(function(){
        if (onInitialConditionsChange())
            run();
    }, 0);
}

function onMenuClick(ev) {
    var btnId = ev.currentTarget.id;
    switch(btnId) {
        case 'scrollToTop':
            $(window).scrollTop(0);
            break;
        case 'scrollToPlot':
            $(window).scrollTop($('#potentialPlot').offset().top);
            break;
        case 'scrollToData':
            $(window).scrollTop($('#pointsDataTableTitles').offset().top);
            break;
   }
}

function onInitialConditionsChange() {
    console.debug('onInitialConditionsChange');
    try {
        $('#potentialPlot').html('');
        var data = processInitialConditions(currentPhysics);
    
        $('#properTimeIncrementAdim').val(data.properTimeIncrementAdim);
        $('#totalProperTimeAdim').val(data.totalProperTimeAdim);
        $('#properTimeIncrementSi').val(data.properTimeIncrementSi);
        $('#totalProperTimeSi').val(data.totalProperTimeSi);
        setVrSign(data.vrSign);
        var isVrSignBtnActive = (
            !$('#vrAdim').is('[readonly]')
            || !$('#vrSi').is('[readonly]')
            || data.vrSi == 0
        )
        if (isVrSignBtnActive) {
            $('.vr-sign-btn').removeClass('inactive');
        } else {
            $('.vr-sign-btn').addClass('inactive');
        }

        var isSiUnits = getIsSiUnits();
        var val = $('#inputFormat').val();  
        switch (val) {
            case 'r-vr-vphi':
                $('#LAdim').val(data.LAdim);
                $('#epsilonAdim').val(data.epsilonAdim);
                $('#LSi').val(data.LSi);
                $('#epsilonSi').val(data.epsilonSi);
                if (isSiUnits) {
                    $('#rAdim').val(data.rAdim);
                    $('#vrAdim').val(data.vrAdim);
                    $('#phiAdim').val(data.phiAdim);
                    $('#vphiAdim').val(data.vphiAdim);
                } else {
                    $('#rSi').val(data.rSi);
                    $('#vrSi').val(data.vrSi);
                    $('#phiSi').val(data.phiSi);
                    $('#vphiSi').val(data.vphiSi);
                }
                break;
            case 'L-epsilon-r':
                $('#vrAdim').val(data.vrAdim);
                $('#vphiAdim').val(data.vphiAdim);
                $('#vrSi').val(data.vrSi);
                $('#vphiSi').val(data.vphiSi);
                if (isSiUnits) {
                    $('#rAdim').val(data.rAdim);
                    $('#phiAdim').val(data.phiAdim);
                    $('#LAdim').val(data.LAdim);
                    $('#epsilonAdim').val(data.epsilonAdim);
                } else {
                    $('#rSi').val(data.rSi);
                    $('#phiSi').val(data.phiSi);
                    $('#LSi').val(data.LSi);
                    $('#epsilonSi').val(data.epsilonSi);
                }
                break;
            case 'L-epsilon-vr':
                $('#rAdim').val(data.rAdim);
                $('#vphiAdim').val(data.vphiAdim);
                $('#rSi').val(data.rSi);
                $('#vphiSi').val(data.vphiSi);
                if (isSiUnits) {
                    $('#vrAdim').val(data.vrAdim);
                    $('#phiAdim').val(data.phiAdim);
                    $('#LAdim').val(data.LAdim);
                    $('#epsilonAdim').val(data.epsilonAdim);
                } else {
                    $('#vrSi').val(data.vrSi);
                    $('#phiSi').val(data.phiSi);
                    $('#LSi').val(data.LSi);
                    $('#epsilonSi').val(data.epsilonSi);
                }
                break;
            case 'L-epsilon-vphi':
                $('#rAdim').val(data.rAdim);
                $('#vrAdim').val(data.vrAdim);
                $('#rSi').val(data.rSi);
                $('#vrSi').val(data.vrSi);
                if (isSiUnits) {
                    $('#phiAdim').val(data.phiAdim);
                    $('#vphiAdim').val(data.vphiAdim);
                    $('#LAdim').val(data.LAdim);
                    $('#epsilonAdim').val(data.epsilonAdim);
                } else {
                    $('#vphiSi').val(data.vphiSi);
                    $('#phiSi').val(data.phiSi);
                    $('#LSi').val(data.LSi);
                    $('#epsilonSi').val(data.epsilonSi);
                }
                break;
            default:
                throw InvalidInitialConditionsError('Datos de Entrada (' + val + ') incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò');   
        }

        return true;

    } catch(ex) {
        handleException(ex);
    }
}

function onPhysicsChange(ev) {
    var prevPhysics = currentPhysics;
    if (ev)
        currentPhysics = ev.currentTarget.id.replace('Btn', '');

    var toBeReplaced, replaceWith;
    switch(currentPhysics) {
        case 'newton':
            toBeReplaced = 'ε';
            replaceWith = 'E';
            break;
        case 'schwarzschild':
            toBeReplaced = 'E';
            replaceWith = 'ε';            
            break;
    }
    $('#inputFormat option').each(function(idx, optionElem) { 
        $(optionElem).html($(optionElem).html().replace(toBeReplaced, replaceWith));
    });
    $('#epsilonAdimLabel').html(replaceWith);
    $('#epsilonAdim').attr('placeholder', replaceWith);
    $('#epsilonSiLabel').html(replaceWith);
    $('#epsilonSi').attr('placeholder', replaceWith);
    
    if (prevPhysics && prevPhysics != currentPhysics) {
        $('#inputFormat').val('r-vr-vphi');
        onInputFormatChange();
        $('input[name=units-type][value=si]').prop('checked', true);
        onUnitsChange();
    }
    
    $('.form-content')
        .removeClass('schwarzschild-content')
        .removeClass('newton-content')
        .addClass(currentPhysics + '-content');
}

function onUnitsChange() {
    var isSiUnits = getIsSiUnits();
    $('.adim-units').prop('readonly', isSiUnits);
    $('.si-units').prop('readonly', !isSiUnits);
    
    if (isSiUnits) {
        $('#adimensionalData').removeClass('active').addClass('inactive');
        $('#SystemeInternationalData').removeClass('inactive').addClass('active');
    } else {
        $('#adimensionalData').removeClass('inactive').addClass('active');
        $('#SystemeInternationalData').removeClass('active').addClass('inactive');
    }
    
    onInputFormatChange();
}

function onVrChange(ev) {
    if (ev) {
        vrInputControl = $(ev.currentTarget);
    } else {
        vrInputControl = $('#vr' + (getIsSiUnits() ? 'Si' : 'Adim' ));
    }
    var vr = Number(vrInputControl.val());
    var vrSign = (vr == 0 ? 1 : vr / Math.abs(vr))
    setVrSign(vrSign);
}

function onVrSignChange(ev) {
    if (!$(ev.currentTarget).hasClass('inactive'))
        setVrSign(-1 * currentVrSign);
}

function setVrSign(vrSign) {
    currentVrSign = vrSign || 1;
    var absVrAdim = Math.abs(Number($('#vrAdim').val()));
    var absVrSi = Math.abs(Number($('#vrSi').val()));
    var isNegative = (vrSign < 0);
    if (isNegative) {
        absVrAdim *= -1;
        absVrSi *= -1;
        $('.vr-sign-btn').addClass('negative');
        buttonText = '&mdash;';
    } else {
        $('.vr-sign-btn').removeClass('negative');
        buttonText = '+';
    }
    $('.vr-sign-btn span').html(buttonText);
    $('#vrAdim').val(absVrAdim);
    $('#vrSi').val(absVrSi);
}

function onInputFormatChange() {
    var inputIdSuffix;
    var inputSelectors = 'form input.';
    var isSiUnits = getIsSiUnits();
    if (isSiUnits) {
        inputIdSuffix = 'Si';
        inputSelectors += 'si-units';
    } else {
        inputIdSuffix = 'Adim';
        inputSelectors += 'adim-units';
    }
    $(inputSelectors).prop('readonly', false);

    var val = $('#inputFormat').val();
    switch (val) {
        case 'r-vr-vphi':
            $('#L' + inputIdSuffix).prop('readonly', true);
            $('#epsilon' + inputIdSuffix).prop('readonly', true);
            break;
        case 'L-epsilon-r':
            $('#vr' + inputIdSuffix).prop('readonly', true);
            $('#vphi' + inputIdSuffix).prop('readonly', true);
            break;
        case 'L-epsilon-vr':
            $('#r' + inputIdSuffix).prop('readonly', true);
            $('#vphi' + inputIdSuffix).prop('readonly', true);
            break;
        case 'L-epsilon-vphi':
            $('#r' + inputIdSuffix).prop('readonly', true);
            $('#vr' + inputIdSuffix).prop('readonly', true);
            break;
        default:
            alert('Datos de Entrada (' + val + ') incorrectos... ¿Cómo has conseguido que ocurra esto? Ó_ò');
    }
}

function onExamplesChange() {
    var initialConditionsName = $('#examples').val();
    if (!initialConditionsName)
        return;

    var filteredIC = defaultInitialConditions
        .filter(function(ic) { return ic.name == initialConditionsName });

    if (filteredIC.length != 1) {
        alert('ERROR: Condiciones iniciales no encontradas (' + initialConditionsName + ') ... ¿Cómo has conseguido que ocurra esto? Ó_ò');
        return;
    }

    setFormData(filteredIC[0]);
    handleInitialConditionsAndRun();
    //$('#examples').val('');
}

function getIsSiUnits() {
    var units = getUnits();
    var isSiUnits = (units == "si");

    return isSiUnits;    
}

function getUnits() {
    return $('input[name=units-type]:checked').val();
}

