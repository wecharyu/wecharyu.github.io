function milliFormat(num) {
  return num && num.toString()
      .replace(/\d+/, function(s){
           return s.replace(/(\d)(?=(\d{3})+$)/g, '$1,')
       })
}

const SI_SYMBOLS = ["", "k", "M", "G", "T", "P", "E"];
function numberFormatWithUnit(num) {
  let sign = Math.sign(num);
  num = Math.abs(num)
  let unit = 0;
  while (num > 1e3) {
    unit = unit + 1;
    num = num / 1000;
  }
  return sign * parseFloat(num).toFixed(2) + SI_SYMBOLS[unit]
}
