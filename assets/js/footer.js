$(document).ready(() => {
  intervalPv = setInterval(fixPvCount, 100);
  function fixPvCount() {
    if ($('#busuanzi_container_site_pv').css("display") != "none") {
      let site_pv = $('#busuanzi_value_site_pv').html()
      if (site_pv !== '') {
        $('#busuanzi_value_site_pv').html(milliFormat(parseInt(site_pv)))
        clearInterval(intervalPv)
      }
    }
  }

  intervalUv = setInterval(fixUvCount, 100);
  function fixUvCount() {
    if ($('#busuanzi_container_site_uv').css("display") != "none") {
      uv = $('#busuanzi_value_site_uv').html()
      if (uv !== '') {
        $('#busuanzi_value_site_uv').html(milliFormat(parseInt(uv)))
        clearInterval(intervalUv)
      }
    }
  }
})
