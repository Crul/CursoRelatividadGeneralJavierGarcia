// https://github.com/Khan/KaTeX
var katexOptions = { displayMode: true };
var closeSymbol = '&#128449;';
var openSymbol = '&#128448;';
var gotoTopSymbol = '&uarr;';

var gotoTopBtn = $('<a>')
  .attr('href', '#top')
  .html(gotoTopSymbol)
  .addClass('goto-top-btn');

var toggleFormulasBtn = $('<span>')
  .html(closeSymbol)
  .addClass('toggle-formulas-btn');

$(document).ready(bootstrap);

function bootstrap() {
  $('.formula').each(renderFormula);
  $('h2').each(addButton);
  $('#menu li').each(addVideoLink);
  $('#capitulo10SpoilerBtn').click(showCapitulo10);
}

function renderFormula(i, elem) {
  katex.render(elem.innerText, elem, katexOptions);
}

function addButton(index, h2Elem) {
  toggleFormulasBtn.clone()
    .click(toggleFormulas)
    .prependTo(h2Elem);

  $(h2Elem).prepend(gotoTopBtn.clone());
}

function addVideoLink(index, menuOptElem) {
  var menuLinks = $(menuOptElem).find('a');
  var videoLink = $(menuLinks[1]).clone();
  var capitulo = menuLinks[0].href.match(/#(.*)/)[1];
  $('#' + capitulo).append(' - ').append(videoLink);
}

function showCapitulo10() {
  $('#capitulo10SpoilerBtn').hide();
  $('.capitulo-10 .spoiler').show();
}

function toggleFormulas(ev) {
  var formulasElem = $('.' + ev.currentTarget.parentElement.id);
  var isHiding = formulasElem.is(':visible');
  formulasElem.toggle();
  $(ev.currentTarget).html(isHiding ? openSymbol : closeSymbol);
}
