function Data(_data){
	this.init(_data);

	// clone ... for filtered data
	this.current = this.safeClone();

	// event emit
	this.dispatcher = d3.dispatch("sort", "highlight", "mouseover", "mouseout", "filter", "reset");
	this.on = (...args) => this.dispatcher.on(...args);
	this.call = (event, ...args) => this.dispatcher.call(event, this, ...args);

	// default sort method
	this.sort = this.sortParallel;
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
			order: null, // sort order status
			isNumericData: name !== "name",
			weight: 1,
			width: 0,
			x: 0
		};
		headerIds[name] = col;
		newFormat[name] = [];
	});
	data.forEach(function(d, row){
		// cell's format
		d3.keys(d).forEach(function(name){
			var header = headers[name];
			d[name] = {
				name: name,
				header: header,
				row: row,
				col: header.col,
				value: header.isNumericData ? +d[name] : d[name],
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

Data.prototype.safeClone = function(initialCallback){
	if(initialCallback) return this.origin.map(column => column.map(d => initialCallback(d)));
	return this.origin.map(column => column.map(d => d));
}

Data.prototype.reset = function(){
	this.current = this.safeClone(d => {
		d.visible = true;
		d.active = false;
		d.color = null;
		return d;
	});
	this.highlights = {};
	this.colors = this.colorsOrigin.map(d => d);
	this.headers.forEach(header => {
		header.order = null;
	});
	this.call("reset");
}

Data.prototype.ascend = function(a, b){
	return a.value > b.value ? 1 : a.value < b.value ? -1 : a.row > b.row ? 1 : -1;
}

Data.prototype.descend = function(a, b){
	return a.value < b.value ? 1 : a.value > b.value ? -1 : a.row < b.row ? 1 : -1;
}

Data.prototype.sortRelative = function(header, order){
	var targetCol = this.origin[header.col];
	this.current = this.current.map(function(column){
		return column.sort(function(a, b){
			return order(targetCol[a.row], targetCol[b.row]);
		});
	});
	this.headers.forEach(function(header){
		header.order = null;
	});
	header.order = order;

	this.call("sort", this.sortRelative, header, order);
}

Data.prototype.sortParallel = function(header, order){
	this.current[header.col].sort(order);

	header.order = order;
	this.call("sort", this.sortParallel, header, order);
}

Data.prototype.colorsOrigin = d3.schemeCategory10.map(function(d){ return d; });
Data.prototype.colors = d3.schemeCategory10.map(function(d){ return d; });
Data.prototype.colorIndex = 0;

Data.prototype.highlights = {};

Data.prototype.highlight = function(row){
	if(this.highlights[row]){
		this.colors.unshift(this.highlights[row]);
		this.highlights[row] = null;
	}else{
		if(this.colors.length === 0) return alert("선택할 수 있는 최대치를 초과하였습니다!! (최대 10개)");

		this.highlights[row] = this.colors.shift();
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
	var r = {};
	rows.forEach(function(row){ r[row] = true; });
	this.current.forEach((column) => {
		column.forEach((d) => {
			d.visible = !(d.row in r);
		});
	});
	this.call("filter", rows);
}