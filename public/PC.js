/**
 * Parallel Coordinates
 */
function PC(options){
	var bindto = options.bindto;
	var data = options.data;
	var width = options.width || 960;
	var height = options.height || 540;
	var margin = options.margin || { top: 10, right: 0, bottom: 10, left: 0 };

	this.el.root = d3.select(bindto).append("svg");
	this.data = data;
	this._width = width;
	this._height = height;
	this.margin = margin;

	// this._width = this._width - this.margin.left - this.margin.right;
	// this._height = this._height - this.margin.top - this.margin.bottom;

	this.el.g = this.el.root.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

	this.headers = this.data.headers.filter(function(header){ return header.isNumericData; }); // only numeric data

	this.x = d3.scaleBand().domain(this.headers.map(function(header){ return header.col; })).range([0, this.width()]);
	this.y = {};

	this.headers.forEach((header) => {
		this.y[header.col] = d3.scaleLinear()
			.domain(d3.extent(this.data.origin[header.col], function(d){ return +d.value; }))
			.range([this.height(), 0])
			.nice();

		this.y[header.col].header = header;
	});

	this.el.background = this.el.g.append("g")
			.attr("class", "background")
			.selectAll("path")
			.data(this.data.origin[0].map(d => d.row))
		.enter().append("path");

	this.el.foreground = this.el.g.append("g")
			.attr("class", "foreground")
			.selectAll("path")
			.data(this.data.origin[0].map(d => d.row))
		.enter().append("path")
			.attr("class", function(row){ return "line-row-" + row; })
			.on("mouseover", (row) => {
				this.data.mouseover(row);
			})
			.on("mouseout", (row) => {
				this.data.mouseout(row);
			})
			.on("click", (row) => {
				this.data.highlight(row);
			});

	var self = this;
	this.el.axis = this.el.g.selectAll(".header")
			.data(this.headers)
		.enter().append("g")
			.attr("class", "header");

	this.el.axis.append("g")
			.attr("class", "axis")
			.each(function(header){
				d3.select(this).call(self.axis.scale(self.y[header.col]));
			});
		// .append("text")
		// 	.style("text-anchor", "middle")
		// 	.style("font-size", "1.5em")
		// 	.attr("fill", "black")
		// 	.attr("y", -9)
		// 	.text(function(header){ return header.name; });

	this.el.brush = this.el.axis.append("g")
		.attr("class", "brush")
		.each(function(header){
			d3.select(this)
				.call(self.y[header.col].brush = d3.brushY().extent([[-12, 0], [12, self.height()]]).on("brush", self.brush(header)));
		});

	this.updateLines();

	this.el.tooltip = d3.select("body").append("div")
			.attr("class", "tooltip");

	this.el.root.on("mouseover", () => {
		this.el.tooltip.style("display", null);
	});

	this.el.root.on("mouseout", () => {
		this.el.tooltip.style("display", "none");
	});

	this.el.root.on("mousemove", () => {
		this.el.tooltip
			.style("top", d3.event.pageY + "px")
			.style("left", d3.event.pageX + "px");
	})

	this.data.on("sort.pc", (...args) => this.onSort(...args));
	this.data.on("highlight.pc", (...args) => this.onHighlight(...args));
	this.data.on("mouseover.pc", (...args) => this.onMouseOver(...args));
	this.data.on("mouseout.pc", (...args) => this.onMouseOut(...args));
	this.data.on("reset.pc", (...args) => this.onReset(...args));
}

PC.prototype.el = {};

PC.prototype.axis = d3.axisLeft();

PC.prototype.line = d3.line();

PC.prototype.path = function(row){
	return this.line(this.headers.map(header => [this.position(header), this.y[header.col](this.data.origin[header.col][row].value)]));
}

// position contains dragging
PC.prototype.position = function(header){
	return header.x + header.width / 2;
}

PC.prototype.brush = function(header){
	return () => {
		this.y[header.col].selection = d3.event.selection;
		var actives = this.headers.filter((header) => { return this.y[header.col].selection; });

		var rows = [];
		this.el.foreground.style("display", (row) => {
			var visible = actives.every((header, i) => {
				var mid = this.y[header.col](this.data.origin[header.col][row].value);

				var inRange = this.y[header.col].selection[0] <= mid && mid <= this.y[header.col].selection[1];

				return inRange;
			}) ? null : "none";
			if(visible) rows.push(row);
			return visible;
		});
		this.data.filter(rows);
	};
}

PC.prototype.updateLines = function(){
	this.el.background.attr("d", (d) => this.path(d));
	this.el.foreground.attr("d", (d) => this.path(d));

	this.el.axis.attr("transform", (header) => {
		return "translate(" + (header.x + header.width / 2) + ")";
	});
}

PC.prototype.width = function(width){
	if(width){
		this._width = width - this.margin.left - this.margin.right;
		this.updateSize();
	}
	else return this._width;
}

PC.prototype.height = function(height){
	if(height){
		this._height = height - this.margin.top - this.margin.bottom;
		this.updateSize();
	}
	else return this._height;
}

PC.prototype.updateSize = function(){
	var width = this._width, height = this._height;
	if(width === undefined || height === undefined) return;

	this.el.root
		.attr("width", width)
		.attr("height", height);

	width = width - this.margin.left - this.margin.right;
	height = height - this.margin.top - this.margin.bottom;

	this.x.range([0, width]);
	d3.values(this.y).forEach((y) => {
		var order = y.header.order;
		y.range(order === this.data.ascend ? [0, height]
			: order === this.data.descend ? [height, 0]
			: [0, height]);
	});

	this.updateLines();

	var self = this;
	this.el.axis.each(function(header){
		d3.select(this).call(self.axis.scale(self.y[header.col]));
	});
	
	this.el.brush.each(function(header){
		d3.select(this).call(self.y[header.col].brush.extent([[-12, 0], [12, height]]));
	});
}

PC.prototype.onSort = function(sort, header, order){
	// if(!header.isNumericData) return; // ignore non-numeric data

	var ascend = function(a, b){ return a - b; }, descend = function(a, b){ return b - a; };

	if(sort === this.data.sortRelative){
		this.headers.forEach((header) => {
			var y = this.y[header.col];
			y.range(y.range().sort(ascend));
		});
	}
	if(header.isNumericData){
		var y = this.y[header.col];
		y.range(y.range().sort(order === this.data.ascend ? ascend : descend));
	}

	var self = this;
	this.el.axis.each(function(header){
		d3.select(this).call(self.axis.scale(self.y[header.col]));
	});
	this.updateLines();
}

PC.prototype.onHighlight = function(row, color){
	this.el.foreground.filter(".line-row-" + row)
		.style("stroke", color)
		.classed("line-active", !!color);
}

PC.prototype.onMouseOver = function(row){
	this.el.foreground.filter(".line-row-" + row)
		.classed("line-hover", true);

	var fields = this.el.tooltip.style("opacity", 0.7)
			.selectAll("div")
			.data(this.data.origin.map(column => column[row]));

	fields.enter().append("div");

	fields.attr("class", "tooltip-field")
			.text(function(d){ return d.header.name + ": " + d.value; });

	fields.exit().remove();
}

PC.prototype.onMouseOut = function(row){
	this.el.foreground.filter(".line-row-" + row)
		.classed("line-hover", false);

	this.el.tooltip.style("opacity", 0);
}

PC.prototype.onReset = function(){
	var self = this;
	this.el.foreground
		.style("stroke", null)
		.classed("line-active", false);

	this.el.brush.each(function(header){
		d3.select(this).call(self.y[header.col].brush.move, null);
	});

	var height = this._height - this.margin.top - this.margin.bottom;

	d3.values(this.y).forEach((y) => {
		var order = y.header.order;
		y.range(order === this.data.ascend ? [0, height]
			: order === this.data.descend ? [height, 0]
			: [0, height]);
	});

	this.updateLines();

	var self = this;
	this.el.axis.each(function(header){
		d3.select(this).call(self.axis.scale(self.y[header.col]));
	});
}