$(document).ready(() => {
  intervalPage = setInterval(fixPageCount, 100);
  function fixPageCount() {
    if ($('#busuanzi_container_page_pv').css("display") != "none") {
      let pv = $('#busuanzi_value_page_pv').html()
      if (pv !== '') {
        $('#busuanzi_value_page_pv').html(numberFormatWithUnit(parseInt(pv)))
        clearInterval(intervalPage)
      }
    }
  }

  // estimate read minutes
  readMinutes()
})

function readMinutes() {
  let text = $('.post-content').text().length
  let readTime = Math.round(text / 400)
  if (readTime > 1) {
    $('#read-minutes').text(readTime + ' min')
  } else {
    $('#read-minutes').text('less than ' + 1 + ' min')
  }
}
