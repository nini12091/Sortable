function Data(_data){
	this.init(_data);

	// clone ... for filtered data
	this.current = this.origin.map(function(d){ return d; });

	// event emit
	this.dispatcher = d3.dispatch("sort", "highlight", "mouseover", "mouseout", "filter");
	this.on = (...args) => this.dispatcher.on(...args);
	this.call = (event, ...args) => this.dispatcher.call(event, this, ...args);

	// default sort method
	this.sort = this.sortRelative;
}

Data.prototype.el = {};

Data.prototype.init = function(data){
	var newFormat = {};
	// pick headers from first record
	var headers = {};
	var headerIds = {};

	d3.keys(data[0]).forEach(function(name, col){
		// header's format
		headers[name] = {
			col: col,
			name: name,
			sort: null // sort status
		};
		headerIds[name] = col;
		newFormat[name] = [];
	});
	data.forEach(function(d, row){
		// cell's format
		d3.keys(d).forEach(function(name){
			d[name] = {
				name: name,
				row: row,
				col: headerIds[name],
				value: headerIds[name] != 0 ? +d[name] : d[name], // parse as number except field "name"
				visible: true,
				active: false,
				color: null
			};
			newFormat[name].push(d[name]);
		});
	});
	this.headers = d3.values(headers);
	this.origin = d3.values(newFormat);
}

Data.prototype.reset = function(){
	this.current = this.origin.map(function(d){ return d; });
	this.call("reset");
}

Data.prototype.ascend = function(a, b){
	return (a.value > b.value ? true : a.value < b.value ? false : a.id > b.id) ^ true ? -1 : 1;
}

Data.prototype.descend = function(a, b){
	return (a.value > b.value ? true : a.value < b.value ? false : a.id > b.id) ^ false ? -1 : 1;
}

Data.prototype.sortRelative = function(header, order){
	var targetCol = this.current[header.col];
	this.current = this.current.map(function(column){
		return column.sort(function(a, b){
			return order(targetCol[a.row], targetCol[b.row]);
		});
	});
	this.headers.forEach(function(_header){
		header.sort = _header.col === header.col ? order : null;
	});
	this.call("sort", this.sortRelative, header, order);
}

Data.prototype.sortParallel = function(header, order){
	this.current[header.col].sort(order);

	header.sort = odrer;
	this.call("sort", this.sortParallel, header, order);
}

Data.prototype.pickColor = function(row){
	return d3.interpolateSinebow(row / this.origin.length);
}

Data.prototype.highlights = {};

Data.prototype.highlight = function(row){
	if(this.highlights[row]){
		this.highlights[row] = null;
	}else{
		this.highlights[row] = this.pickColor(row);
	}
	this.current.forEach((column) => {
		column.forEach((d) => {
			if(d.row === row) d.color = this.highlights[row];
		});
	});
	this.call("highlight", row, this.highlights[row]);
}

Data.prototype.mouseover = function(row, focused){
	this.call("mouseover", row);
}

Data.prototype.mouseout = function(row){
	this.call("mouseout", row);
}

Data.prototype.filter = function(rows){
	this.call("hide", rows);
}