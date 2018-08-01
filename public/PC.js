/**
 * Parallel Coordinates
 */
function PC(svg, data, controller){
	this.el.root = d3.select(svg);
	this.data = data;
	this.controller = controller;

	this._width = this.el.root.attr("width") - this.margin.left - this.margin.right;
	this._height = this.el.root.attr("height") - this.margin.top - this.margin.bottom;

	this.el.g = this.el.root.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

	this.headers = this.data.headers.filter(function(header){ return header.col !== 0; }); // except first field "name"

	this.x = d3.scaleBand().domain(this.headers.map(function(header){ return header.col; })).range([0, this.width()]);
	this.y = {};

	this.headers.forEach((header) => {
		this.y[header.col] = d3.scaleLinear()
			.domain(d3.extent(this.data.origin[header.col], function(d){ return +d.value; }))
			.range([this.height(), 0])
			.nice();
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
			.attr("class", function(row){ return "line-row-" + row; });

	var self = this;
	this.el.axis = this.el.g.selectAll(".header")
			.data(this.headers)
		.enter().append("g")
			.attr("class", "header")
			.call(d3.drag()
				.subject(() => { return d3.select(this); })
				.on("start", (header) => {
					this.dragging[header.col] = this.x(header.col);
					this.el.background.attr("visibility", "hidden");
				})
				.on("drag", (header) => {
					this.dragging[header.col] = Math.min(this.width(), Math.max(-1, d3.event.x));
					this.el.foreground.attr("d", (d) => this.path(d));

					// Update headers order
					this.data.headers = [this.data.headers[0]].concat(this.headers.sort((a, b) => { return this.position(a) - this.position(b); }));

					this.x.domain(this.headers.map(function(header){ return header.col; }));
					this.el.axis.attr("transform", (header) => { return "translate(" + this.position(header) + ")"; });
				})
				.on("end", function(header){
					delete self.dragging[header.col];
					d3.select(this).transition().attr("transform", "translate(" + self.x(header.col) + ")");
					self.el.foreground.transition().attr("d", (d) => self.path(d));
					self.el.background
							.attr("d", (d) => self.path(d))
						.transition()
							.delay(500)
							.duration(0)
							.attr("visibility", null);
				}));

	this.el.axis.append("g")
			.attr("class", "axis")
			.each(function(header){
				d3.select(this).call(self.axis.scale(self.y[header.col]));
			})
		.append("text")
			.style("text-anchor", "middle")
			.style("font-size", "1.5em")
			.attr("fill", "black")
			.attr("y", -9)
			.text(function(header){ return header.name; });

	this.el.brush = this.el.axis.append("g")
		.attr("class", "brush")
		.each(function(header){
			d3.select(this)
				.call(self.y[header.col].brush = d3.brushY().extent([[-12, 0], [12, self.height()]]).on("brush", self.brush(header)));
		});

	this.updateLines();

	// this.data.on("sort", (...args) => this.onSort(...args));
	this.data.on("highlight.pc", (...args) => this.onHighlight(...args));
	this.data.on("mouseover.pc", (...args) => this.onMouseOver(...args));
	this.data.on("mouseout.pc", (...args) => this.onMouseOut(...args));
	// this.data.on("filter", (...args) => this.onFilter(...args));
}

PC.prototype.el = {};

PC.prototype.margin = { top: 40, right: 10, bottom: 20, left: 20 };

PC.prototype.dragging = {}; // currently dragging axis

PC.prototype.axis = d3.axisLeft();

PC.prototype.line = d3.line();

PC.prototype.path = function(row){
	return this.line(this.headers.map(header => [this.position(header), this.y[header.col](this.data.origin[header.col][row].value)]));
}

// position contains dragging
PC.prototype.position = function(header){
	return header.col in this.dragging ? this.dragging[header.col] : this.x(header.col);
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
		this.data.call("filter", rows);
	};
}

PC.prototype.reset = function(){
	var self = this;
	this.el.brush.each(function(header){
		d3.select(this).call(self.y[header.col].brush.move, null);
	});
}

PC.prototype.updateLines = function(){
	this.el.background.attr("d", (d) => this.path(d));
	this.el.foreground.attr("d", (d) => this.path(d));

	this.el.axis.attr("transform", (header) => {
		console.log(header);
		return "translate(" + this.x(header.col) + ")";
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
	this.el.root.attr("width", width).attr("height", height);
	width = width - this.margin.left - this.margin.right;
	height = height - this.margin.top - this.margin.bottom;

	this.x.range([0, width]);
	d3.values(this.y).forEach((y) => { y.range([0, height]); });

	this.updateLines();

	var self = this;
	this.el.axis.each(function(header){
		d3.select(this).call(self.axis.scale(self.y[header.col]));
	});
	
	this.el.brush.each(function(header){
		d3.select(this).call(self.y[header.col].brush.extent([[-12, 0], [12, height]]));
	});
}

PC.prototype.onHighlight = function(row, color){
	this.el.foreground.filter(".line-row-" + row)
		.style("stroke", color)
		.classed("line-active", !!color);
}

PC.prototype.onMouseOver = function(row){
	this.el.foreground.filter(".line-row-" + row)
		.classed("line-hover", true);
}

PC.prototype.onMouseOut = function(row){
	this.el.foreground.filter(".line-row-" + row)
		.classed("line-hover", false);
}