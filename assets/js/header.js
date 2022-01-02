$(document).ready(() => {
  // header height changed by header width
  checkHeaderWidth()
  window.onresize = () => {
    checkHeaderWidth()
  }

  // header toggle-button config
  $("#nav-toggle").on('click', () => {
    $('#nav-toggle').toggleClass('open')
    $('#toggle-menu').toggleClass('hidden')
  })

  $('#search-button').click(() => {
    $('#search-button').toggleClass('open')
    $('#search-bar').toggleClass('hidden')
  })
});

function checkHeaderWidth() {
  // init status
  $('#nav-menu').removeClass()
  $('#nav-menu').addClass('visible-links')
  $('#nav-toggle').addClass('hidden');
  $('#toggle-menu').addClass('hidden');

  let placeholderWidth = document.getElementById('nav-placeholder').offsetWidth
  if (placeholderWidth === 0) {
    $('#nav-menu').removeClass()
    $('#nav-menu').addClass('hidden')
    $('#nav-toggle').removeClass('hidden');
  }
  // change height of header-placeholder
  let headerHeight = document.getElementById('header').offsetHeight
  document.getElementById('header-placeholder').style.height = headerHeight+"px"
  $('html').css('scroll-padding-top', headerHeight+'px')
}
