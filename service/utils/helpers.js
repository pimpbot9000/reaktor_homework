Map.prototype.getOrElse = function(key, value) {
  return this.has(key) ? this.get(key) : value
}
