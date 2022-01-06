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
    // focus on input
	  let input = document.querySelector('#search-input');
    setTimeout(() => {
      input.innerHTML = ''
      input.focus()
    }, 20);
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

// search related script
(function (window, document, undefined) {
  let bar = document.querySelector('#search-bar');
	let input = document.querySelector('#search-input');
	let resultList = document.querySelector('#search-results');

  // Make sure required content exists
	if (!bar || !input || !resultList || !searchIndex) return;

  input.oninput = () => {
    console.log(input.value)
    search(input.value)
  }

  let search = query => {
    if (query === '') {
      resultList.innerHTML = ''
      return
    }
    // Variables
    let reg = new RegExp(query, 'i');
    // priority1 stores posts whose title match
    let priority1 = [];
    // priority2 stores posts whose excerpt match
	  let priority2 = [];
    searchIndex.forEach(postInfo => {
      if (reg.test(postInfo.title)) {
        return priority1.push(postInfo)
      }
      if (reg.test(postInfo.excerpt)) {
        priority2.push(postInfo)
      }
    });
    // Combine the results into a single array
	  let results = [].concat(priority1, priority2);

    let createNoResultsHTML = () => {
      return '<p>No results found</p>';
    }

    let createResultsHTML = results => {
      console.log(results)
      let dom = []
      results.forEach(postInfo => {
        dom += "<li class='search-results-item'><a href='" + postInfo.url + "'>" + postInfo.title + '</a></li>'
      })
      return dom
    }

    resultList.innerHTML = results.length < 1 ? createNoResultsHTML() : createResultsHTML(results)
  }
})(window, document);
