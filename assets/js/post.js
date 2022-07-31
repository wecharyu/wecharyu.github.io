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

  // recover the scroll event for window after each scroll finished
  recoverScroll()

  // scroll match the toc
  $(window).bind('scroll', locateToc);

  // add click event for all toc
  clickToc()
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

function clickToc() {
  // all anchors of toc
  let toc_hs = $('.toc').find('a')
  for (let i = 0; i < toc_hs.length; ++i) {
    $(toc_hs[i]).click(() => {
      // cancel scroll event for window
      $(window).unbind('scroll')
      $(toc_hs).removeClass('active')
      $(toc_hs[i]).addClass('active')
    })
  }
}

/**
 * recover the scroll event for window after each scroll finished
 */
function recoverScroll() {
  var timer = null;
  window.addEventListener('scroll', function() {
    if(timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      // recover the scroll event for window
      $(window).bind('scroll', locateToc);
    }, 100);
  }, false);
}

function locateToc() {
  let headerHeight = document.getElementById('header').offsetHeight
  let scroll_height = $(window).scrollTop() + headerHeight + 1
  if (scrollToBottom(scroll_height)) {
    // already scroll to bottom
    return
  }
  // all anchors of this article
  let post_hs = $('.article :header')
  // all anchors of toc
  let toc_hs = $('.toc').find('a')
  $(toc_hs).removeClass('active')
  for (let i = 0; i < post_hs.length; i++) {
    let h_height = $(post_hs[i]).offset().top
    if (h_height < scroll_height) {
      $(toc_hs).removeClass('active')
      $(toc_hs[i]).addClass('active')
    }
  }
}

function scrollToBottom(scroll_height) {
  return scroll_height >= $('.article').height()
}
