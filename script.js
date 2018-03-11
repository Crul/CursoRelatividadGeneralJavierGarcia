// https://github.com/Khan/KaTeX
var katexOptions = { displayMode: true };
var closeSymbol = '&#128449;';
var openSymbol = '&#128448;';
var gotoTopSymbol = '&uarr;';
var toggleFormulasCssClass = 'toggle-formulas-btn';

var gotoTopBtn = $('<a>')
  .attr('href', '#top')
  .html(gotoTopSymbol + ' Menú')
  .addClass('goto-top-btn');

var toggleFormulasBtnElems;
var toggleFormulasBtn = $('<span>')
  .html(closeSymbol)
  .addClass(toggleFormulasCssClass);

var formulasElems = $('.formulas').hide();

$(document).ready(bootstrap);

function bootstrap() {
  $('.formula').each(renderFormula);
  formulasElems.fadeIn();

  toggleFormulasBtnElems = $('h2')
    .each(addGotoTopBtn)
    .map(addToggleBtn);

  $('#menu li')
    .each(addUnfoldEvent)
    .each(addVideoLink);

  $('.formulas-title').mousedown(unfoldTarget);

  $("#foldAllBtn").click(foldAll);
  $("#unfoldAllBtn").click(unfoldAll);

  $('.spoiler-btn').click(showSpoiler);

  $('html, body').css('min-height', 0);
  var hash = location.hash;
  location.hash = '';
  location.hash = hash;
}

function renderFormula(i, elem) {
  katex.render(elem.innerText, elem, katexOptions);
}

function addGotoTopBtn(index, h2Elem) {
  $(h2Elem).prepend(gotoTopBtn.clone());
}

function addToggleBtn(index, h2Elem) {
   return toggleFormulasBtn
    .clone()
    .click(toggleFolding)
    .prependTo(h2Elem)[0];
}

function addUnfoldEvent(index, menuOptElem) {
  var formulasLink = $(menuOptElem).find('a')[0];
  $(formulasLink).mousedown(unfoldTarget);
}

function addVideoLink(index, menuOptElem) {
  var menuLinks = $(menuOptElem).find('a');
  var videoLink = $(menuLinks[1]).clone().addClass('view-video-btn');
  var capituloId = getIdFromHref(menuLinks[0]);
  $('#' + capituloId).append(videoLink);
}

function foldAll() {
  formulasElems.slideUp();
  toggleFormulasBtnElems.html(openSymbol);
}

function unfoldAll() {
  formulasElems.slideDown();
  toggleFormulasBtnElems.html(closeSymbol);
}

function unfoldTarget(ev) {
  var formulasId = getIdFromHref(ev.currentTarget);
  var formulasElem = $('.' + formulasId);
  if (!formulasElem.is(':visible')) {
    formulasElem.show();
    $('#' + formulasId)
      .find('.' + toggleFormulasCssClass)
      .html(closeSymbol);
  }
}

function toggleFolding(ev) {
  var formulasElem = $('.' + ev.currentTarget.parentElement.id);
  var isHiding = formulasElem.is(':visible');
  formulasElem.slideToggle();
  $(ev.currentTarget).html(isHiding ? openSymbol : closeSymbol);
}

function showSpoiler(ev) {
  $(ev.currentTarget).hide();
  $(ev.currentTarget.parentElement).find('.spoiler').fadeIn();
}

function getIdFromHref(elem) {
  return elem.href.match(/#(.*)/)[1];
}
