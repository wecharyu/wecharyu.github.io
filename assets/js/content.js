$(document).ready(function () {
  if ($('.content-container').outerHeight() < window.innerHeight) {
    $('.back-to-top-wrapper').addClass('hidden')
  } else if ($('#content').innerWidth() >= 64 * Number(getComputedStyle(document.body,null).fontSize.replace(/[^\d]/g, ''))) {
    right = window.innerWidth / 2 - $('#content').innerWidth() / 2 + 210;
    console.log('right: ' + right)
    $('.back-to-top-wrapper').css('right', right + 'px');
  }
});
