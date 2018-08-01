function Table(table, data, controller){
	this.el.root = d3.select(table);
	this.data = data;
	this.controller = controller;

	// this.el.head.select("tr")
	// 	.selectAll("th")
	// 		.data(this.data.headers.map(function(header){ return {
	// 			field: header.field,
	// 			col: Data.headerIds[header.field],
	// 			ascending: true
	// 		}; }))
	// 	.enter().append("th");

	// this.el.headers = this.el.head.select("tr")
	// 	.selectAll("th")
	// 		// .data(function(field){ return { field: field, col: Data.headerIds[field], ascending: true }; })
	// 		.attr("class", function(d){ return "header header-col-" + d.col + " noselect"; })
	// 		.style("text-align", function(d, i){ return i == 0 ? "left" : "center"; }) // align center except first field "name"
	// 		.text(function(d){ return d.field; })
	// 		.on("mouseover", function(d){
	// 			d3.selectAll(".cell-col-" + d.col).classed("cell-hover", true);
	// 		})
	// 		.on("mouseout", function(d){
	// 			d3.selectAll(".cell-col-" + d.col).classed("cell-hover", false);
	// 		})
	// 		.on("click", (d) => {
	// 			// toggle ascend or descend
	// 			d.ascending = !d.ascending;
	// 			this.data.sort(d.field, d.ascending ? this.data.ascend : this.data.descend);

	// 			// process sort buttons (toggle status)
	// 			var field = d.field, ascending = d.ascending;
	// 			d3.selectAll(".cell-sort").attr("class", function(d){
	// 				if(d.field == field){
	// 					return "cell-sort fa fa-angle-" + (ascending ? "up" : "down") + " text-success";
	// 				}
	// 				d.ascending = true;
	// 				return "cell-sort fa fa-angle-up";
	// 			});
	// 		});

	// this.el.headers.append("i")
	// 		.style("font-weight", "bolder")
	// 		.attr("class", "cell-sort fa fa-angle-up");

	this.el.columns = this.el.root
			.selectAll("div")
			.data(this.data.current)
		.enter().append("div")
			.style("display", "inline-block")
			.style("width", "100px");

	this.el.cells = this.el.columns
			.selectAll("div")
			.data(function(d){ return d; })
		.enter().append("div")
			.style("display", function(d){ return d.visible ? "block" : "none" })
			.attr("class", function(d){ return "cell cell-col-" + d.col + " cell-row-" + d.row; })
			.style("text-align", "center")
			.style("background-color", function(d){ return d.color; })
			.style("border-color", "lightgray")
			.style("border-style", "solid")
			.style("border-width", "1px")
			.style("white-space", "nowrap")
			.style("text-overflow", "clip")
			.style("height", "1.8em")
			.on("mouseover", (d) => {
				this.data.mouseover(d.row);
			})
			.on("mouseout", (d) => {
				this.data.mouseout(d.row);
			})
			.on("click", (d) => {
				this.data.highlight(d.row);
			})
			.text(function(d){ return d.value; });

	// this.data.on("sort", function(...args){ this.onSort(...args); });
	// this.data.on("highlight", function(...args){ this.onHighlight(...args); });
	// this.data.on("mouseover", function(...args){ this.onMouseOver(...args); });
	// this.data.on("mouseout", function(...args){ this.onMouseOut(...args); });

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
		this.el.root.style("width", width + "px");
		this.el.columns.style("width", (1 / this.data.headers.length * 100) + "%");
	}
	else return this._width;
}

Table.prototype.height = function(height){
	if(height){
		this._height = height;
		this.el.root.style("height", height + "px");
	}
	else return this._height;
}

Table.prototype.onSort = function(sort, header, order){

}

Table.prototype.onHighlight = function(row, color){
	this.el.columns.selectAll(".cell-row-" + row)
		.style("background-color", color)
		.classed("cell-active", !!color);
}

Table.prototype.onMouseOver = function(row){
	this.el.columns.selectAll(".cell-row-" + row)
		.classed("cell-hover", true);
}

Table.prototype.onMouseOut = function(row){
	this.el.columns.selectAll(".cell-row-" + row)
		.classed("cell-hover", false);
}

Table.prototype.onFilter = function(rows){
	this.el.cells.style("display", "block");
	rows.forEach(row => this.el.columns.selectAll(".cell-row-" + row).style("display", "none"));
}