function Table(options){
	var bindto = options.bindto;
	var data = options.data;
	var width = options.width || 960;
	var height = options.height || 540;

	this.el.root = d3.select(bindto).append("svg");
	this.data = data;
	this._width = width;
	this._height = height;
	this.cellHeight = 20;

	this.el.columns = this.el.root.append("g")
			.selectAll("g")
			.data(this.data.current)
		.enter().append("g");

	this.el.cells = this.el.columns
			.selectAll("g")
			.data(function(d){ return d; })
		.enter().append("g")
			.on("mouseover", (d) => {
				this.data.mouseover(d.row);
			})
			.on("mouseout", (d) => {
				this.data.mouseout(d.row);
			})
			.on("click", (d) => {
				this.data.highlight(d.row);
			});

	this.el.cells.append("rect")
		.attr("height", this.cellHeight);

	this.el.cells.append("text");

	this.updateSize();
	this.updateCells();

	this.data.on("sort.table", (...args) => this.onSort(...args));
	this.data.on("highlight.table", (...args) => this.onHighlight(...args));
	this.data.on("mouseover.table", (...args) => this.onMouseOver(...args));
	this.data.on("mouseout.table", (...args) => this.onMouseOut(...args));
	this.data.on("filter.table", (...args) => this.onFilter(...args));
}

Table.prototype.el = {};

Table.prototype.width = function(width){
	if(width){
		this._width = width;
		this.updateSize();
	}
	else return this._width;
}

Table.prototype.height = function(height){
	if(height){
		this._height = height;
		this.updateSize();
	}
	else return this._height;
}

Table.prototype.updateCells = function(){
	this.updateSize();

	this.el.cells
		.attr("class", function(d){ return "cell cell-col-" + d.col + " cell-row-" + d.row; })
		.each(function(d){
			var cell = d3.select(this)
				.attr("class", function(d){ return "cell cell-col-" + d.col + " cell-row-" + d.row; });
			
			cell.select("rect").style("fill", function(d){ return d.color; });
			cell.select("text").text(function(d){ return d.value; });
		});
}

Table.prototype.updateSize = function(){
	var width = this._width, height = this._height;
	if(width === undefined || height === undefined) return;

	this.el.root
		.attr("width", width)
		.attr("height", height);
		
	this.el.cells.selectAll("rect")
		.attr("width", function(d){ return d.header.width; });

	this.el.cells.selectAll("text")
		.attr("x", function(d){ return d.header.width / 2; })
		.attr("y", this.cellHeight / 2);

	var cellHeight = this.cellHeight;
	var finalHeight;

	this.el.columns
		.each(function(column){
			var nestedHeight = 0;
			d3.select(this).selectAll("g")
				.each(function(d){
					var cell = d3.select(this);
					cell.style("display", d.visible ? null : "none");
					if(d.visible){
						cell.attr("transform", "translate(" + d.header.x + "," + nestedHeight + ")");
						nestedHeight += cellHeight;
					}
				});

			finalHeight = nestedHeight;
		});

	this.el.root
		.attr("height", finalHeight);
}

Table.prototype.onSort = function(sort, header, order){
	this.el.columns.data(this.data.current);
	this.el.cells.data(function(d){ return d; });

	this.updateCells();
}

Table.prototype.onHighlight = function(row, color){
	this.el.cells.filter(".cell-row-" + row)
			.classed("cell-active", !!color)
		.selectAll("rect")
			.style("fill", color);
}

Table.prototype.onMouseOver = function(row){
	this.el.cells.filter(".cell-row-" + row)
		.classed("cell-hover", true);
}

Table.prototype.onMouseOut = function(row){
	this.el.cells.filter(".cell-row-" + row)
		.classed("cell-hover", false);
}

Table.prototype.onFilter = function(rows){
	this.updateCells();
}