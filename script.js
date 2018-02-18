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

$('.formulas').hide();
$(document).ready(bootstrap);

function bootstrap() {
  $('.formula').each(renderFormula);
  $('.formulas').fadeIn();
  $('h2').each(addButton);
  $('#menu li').each(openFormulasOnClick);
  $('#menu li').each(addVideoLink);
  $('#capitulo10SpoilerBtn').click(showCapitulo10);
  $('html, body').css('min-height', 0);
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

function openFormulasOnClick(index, menuOptElem) {
  var formulasLink = $(menuOptElem).find('a')[0];
  $(formulasLink).mousedown(openFormulas);
}

function addVideoLink(index, menuOptElem) {
  var menuLinks = $(menuOptElem).find('a');
  var videoLink = $(menuLinks[1]).clone();
  var capitulo = menuLinks[0].href.match(/#(.*)/)[1];
  $('#' + capitulo).append(' - ').append(videoLink);
}

function showCapitulo10() {
  $('#capitulo10SpoilerBtn').hide();
  $('.capitulo-10 .spoiler').fadeIn();
}

function openFormulas(ev) {
  var formulasId = ev.currentTarget.href.match(/#(.*)/)[1];
  var formulasElem = $('.' + formulasId);
  if (!formulasElem.is(':visible')) {
    formulasElem.show();
    $('#' + formulasId)
      .find('.toggle-formulas-btn')
      .html(closeSymbol);
  }
}

function toggleFormulas(ev) {
  var formulasElem = $('.' + ev.currentTarget.parentElement.id);
  var isHiding = formulasElem.is(':visible');
  formulasElem.slideToggle();
  $(ev.currentTarget).html(isHiding ? openSymbol : closeSymbol);
}
