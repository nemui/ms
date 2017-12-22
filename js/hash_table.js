// very slow, very convenient
MS.HashTable = function() {
    this.table = {};
};

MS.HashTable.prototype.put = function(key, value) {
    this.table[JSON.stringify(key)] = value;
};

MS.HashTable.prototype.putRaw = function(key, value) {
    this.table[key] = value;
};

MS.HashTable.prototype.remove = function(key) {
    delete this.table[JSON.stringify(key)];
};

MS.HashTable.prototype.get = function(key) {
    return this.table[JSON.stringify(key)];
};

MS.HashTable.prototype.getRaw = function(key) {
    return this.table[key];
};

MS.HashTable.prototype.contains = function(key) {
    return this.table.hasOwnProperty(JSON.stringify(key));
};

MS.HashTable.prototype.getTable = function() {
    return this.table;
};