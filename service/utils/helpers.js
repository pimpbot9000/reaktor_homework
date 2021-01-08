Map.prototype.getOrElse = function(key, value) {
  return this.has(key) ? this.get(key) : value
}

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

/** 
 * Flattens array of arrays into one array
 */
const flattenArrays = (arrays) => {

  const reducer = (accumulator, currentValue) => accumulator.concat(currentValue);
  return arrays.reduce(reducer, [])

}

module.exports = {
  zip, flattenArrays
}

