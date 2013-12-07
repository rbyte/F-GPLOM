var vars
var filter = []
// for each data row, counts how many column filters filter one of its row cells
var filterMask = []
var svg
var sliderColor = 200

function interfaceInit() {
	console.log("hi console :)")
//	scatter()
//	histTest()
//	heatmapTest()
	main()
}

function main() {
	var afterParsingDo = function() {
		console.log("parsing data done")
		var dataTypesCount = []
		var dataTypes = ["ordinal", "metric", "dichotomous", "nominal"]
		
		if (false) {
			for (var k=0; k<dataTypes.length; k++)
				dataTypesCount.push(0)

			for (var i=0; i<vars.length; i++)
				for (var k=0; k<dataTypes.length; k++)
					if (vars[i].dataType === dataTypes[k]) {
						dataTypesCount[k]++
						break
					}

			for (var k=0; k<dataTypes.length; k++) {
				console.log(dataTypes[k]+": "+dataTypesCount[k])
				for (var i=0; i<vars.length; i++)
					if (vars[i].dataType === dataTypes[k]) {
						console.log("\t"+vars[i].name+", "+vars[i].data.length+", "+vars[i].detail+", "+vars[i].dictionary)
					}
			}
			
			document.write(JSON.stringify(vars))
		}
		
		var numberOfVarsToDraw = 10
		if (vars.length > numberOfVarsToDraw)
			vars.splice(numberOfVarsToDraw, vars.length-numberOfVarsToDraw)
		
		for (var k=0; k<vars[0].data.length; k++)
			filterMask.push(0)
		
		
		// find min & max in metric data
		for (var i=0; i<vars.length; i++) {
			if (vars[i].dataType === "metric") {
				var max = Number.NEGATIVE_INFINITY
				var min = Number.POSITIVE_INFINITY
				for (var k=0; k<vars[i].data.length; k++) {
					var v = vars[i].data[k]
					if (typeof v !== "string" && !isNaN(v) && v !== undefined) {
						if (v > max) max = v
						if (v < min) min = v
					}
				}
				if (max < min) { // no metric data found
					min = 0
					max = 1
				}
				if (max-min < 0.0001) { // same as scatterplot border
					max += 1
					min -= 1
				}
				vars[i].max = max
				vars[i].min = min
				console.log(i+": "+min+", "+max)
			}
		}
		
		
		draw()
		
		console.log("done!")
	}
	
//	parseData("data/SHIP_2012_D_S2_20121129.json", afterParsingDo)
	parseDataFast("data/SHIP_2012_D_S2_20121129_improved.json", afterParsingDo)
	
//	createTestData(100)
}

function draw() {
	width = 1100
	height = 830
//	var width = 4000, height = 4000
	
	svg = d3.select("#viz").append("svg")
		.attr("width", width)
		.attr("height", height)
	
	if (false) svg
		.append("rect")
		.attr("x", 0).attr("y", 0)
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("fill", "rgb(0,0,0)")
		.attr("fill-opacity", "0.03")
	
	defineGradients(svg)
	padding = 20
	createGplomMatrix(svg, padding, padding, width-2*padding, height-2*padding)
	
//	stream(svg)
}

function parseData(filename, callback) {
	vars = []
	var purgeDictEntriesNotFoundInData = true
	d3.json(filename, function(jsonData) {
		var varId = 0
		for (var key in jsonData) {
			var jsonDataKey = jsonData[key]
			console.assert(jsonDataKey.hasOwnProperty("name"))
			console.assert(jsonDataKey.hasOwnProperty("data"))
			console.assert(jsonDataKey.hasOwnProperty("description"))
			
			var desc = jsonDataKey.description
			console.assert(desc.hasOwnProperty("name"))
			console.assert(desc.hasOwnProperty("dataType"))
			console.assert(desc.hasOwnProperty("detail"))
			var isMetric = desc.dataType === "metric"
			var hasDict = desc.hasOwnProperty("dictionary")
			
			// filter
			if (key === "zz_nr")
				continue
			
			if (isMetric || hasDict) {
				vars.push(desc)
				vars[varId]["data"] = new Array(jsonDataKey.data.length)
			} else {
				// I dont know how to interpret that
				console.log("skipping: "+desc.name)
				continue
			}
			
			if (hasDict) {
				var newDict = []
				var oldToNewDictTranslation = {}
				if (!purgeDictEntriesNotFoundInData)
					for (var dictKey in desc.dictionary) {
						newDict.push(desc.dictionary[dictKey])
					}
				
				for (var i=0; i<vars[varId].data.length; i++) {
					var val = jsonDataKey.data[i]
//					console.assert(typeof val === "string")
					if (!isMetric) {
						console.assert(desc.dictionary.hasOwnProperty(val))
					}

					if (purgeDictEntriesNotFoundInData
						&& oldToNewDictTranslation[val] === undefined
						&& desc.dictionary[val] !== undefined) {
							oldToNewDictTranslation[val] = "x" // check
							newDict.push(desc.dictionary[val])
					}
					
					for (var k=0; k<newDict.length; k++)
						if (desc.dictionary[val] === newDict[k])
							vars[varId].data[i] = isMetric ? ""+k : k
					
					if (isMetric && vars[varId].data[i] === undefined)
						vars[varId].data[i] = convertStrToNumber(val)
				}
//				console.log(newDict)
				vars[varId].dictionary = newDict
			} else {
				if (desc.dataType === "metric") {
					for (var i=0; i<vars[varId].data.length; i++)
						vars[varId].data[i] = convertStrToNumber(jsonDataKey.data[i])
				}
			}
			varId++
		}
		callback()
	})
}

function parseDataFast(filename, callback) {
	d3.json(filename, function(jsonData) {
		vars = jsonData
		callback()
	})
}

function defineGradients(svg) {
	var defs = svg.append("defs")
	
	var lgrad = defs.append("linearGradient")
		.attr("id", "lg1")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "0%")
	
	lgrad
		.append("stop")
		.attr("stop-color", "rgb(200,200,200)")
		.attr("offset", "0%")
	
	lgrad
		.append("stop")
		.attr("stop-color", "rgb(240,240,240)")
		.attr("offset", "100%")
	
	var lgradBlue = defs.append("linearGradient")
		.attr("id", "lgBlue")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "0%")
	
	lgradBlue
		.append("stop")
		.attr("stop-color", "rgb(150,150,255)")
		.attr("offset", "0%")
	
	lgradBlue
		.append("stop")
		.attr("stop-color", "rgb(220,220,255)")
		.attr("offset", "100%")
		
	var rgrad = defs.append("radialGradient")
		.attr("id", "g1")
		.attr("cx", "50%")
		.attr("cy", "50%")
		.attr("r", "50%")
	
	rgrad
		.append("stop")
		.attr("stop-color", "rgb(0,0,0)")
		.attr("stop-opacity", "0.5")
		.attr("offset", "0%")
	
	rgrad
		.append("stop")
		.attr("stop-color", "rgb(0,0,0)")
		.attr("stop-opacity", "0")
		.attr("offset", "100%")
}


























function createGplomMatrix(svg, xGlobal, yGlobal, wGlobal, hGlobal) {
	wGlobal -= 5
	hGlobal -= 5
	var marginToTotal = 0.2
	var cardinalityWidthCap = 8
	var vccc = getTotalCardinalityFrom(cardinalityWidthCap)
//	var numberOfCatVars = vccc[0]
//	var totalCardinality = vccc[1]
//	var totalCardinalityMinusFirst = vccc[2]
	var wMargin = wGlobal*marginToTotal/(vars.length-2)
	var hMargin = hGlobal*marginToTotal/(vars.length-2)
	
	var barWidth = wGlobal*(1-marginToTotal)/(vars.length-1)
//		*numberOfCatVars/totalCardinality
	var barHeight = hGlobal*(1-marginToTotal)/(vars.length-1)
//		*(numberOfCatVars-1)/totalCardinalityMinusFirst
	
	var x = xGlobal, y = yGlobal
	// on the y-axis, we start with cat no 2
	var metricIdX, catIdX, metricIdY, catIdY = nextCat()
	var xTextDiv = d3.select("#xNames")
	var yTextDiv = d3.select("#yNames")
	var xStyle = "width: "+round(wGlobal/(vars.length-1))+"px"
	var yStyle = "height: "+round(hGlobal/(vars.length-1))+"px"
	
	// row iteration (y-axis)
	for (var i=0; i<vars.length-1; i++) {
		catIdY = nextCat(catIdY)
		var h = barHeight
		if (catIdY !== -1) { // heatmaps
//			h = vars[catIdY].dictionary.length * barHeight
		} else {
//			h = wGlobal*(1-marginToTotal)/vars.length
			metricIdY = nextMetric(metricIdY)
			console.assert(metricIdY !== -1)
		}
		// column iteration (x-axis)
		for (var k=0; k<i+1; k++) {
			catIdX = nextCat(catIdX)
			var w = barWidth
			if (catIdX !== -1) {
				var cardinality = vars[catIdX].dictionary.length
//				w = (cardinality > cardinalityWidthCap
//					? cardinalityWidthCap
//					: cardinality) * barWidth
			}
			if (catIdY !== -1) { // heatmap
				console.assert(catIdX !== -1 && catIdX !== catIdY)
				drawHeatmap(svg.append("g").attr("class", "heatmap"), x, y, w, h,
					getHeatmapDataFromVars(catIdX, catIdY))
			} else {
				if (catIdX !== -1) { // histogram
					drawHistogram(svg, x, y, w, h, catIdX, metricIdY)
						
						
					if (false) {
					// create new stream from each category
						var catBuckets = []
						for (var m=0; m<vars[catIdX].dictionary.length; m++)
							catBuckets.push([])
						for (var m=0; m<vars[metricIdY].data.length; m++)
							catBuckets[vars[catIdX].data[m]].push(vars[metricIdY].data[m])
						for (var m=0; m<vars[catIdX].dictionary.length; m++)
							drawKDE(svg.append("g"), x, y, w, h, catBuckets[m])
					}
				} else { // scatterplot
					metricIdX = nextMetric(metricIdX)
					console.assert(metricIdX !== -1)
					
//					if (false)
					drawScatterplotFormat(svg.append("g").attr("class", "scatterplot"), x, y, w, h,
						metricIdX, metricIdY)
				}
			}
			var curVar = catIdX === undefined || catIdX < 0 ? metricIdX : catIdX
			if (i === vars.length-2) {
				drawFilterX(svg, x, y, w, h, curVar)
			}
			if (k === i) {
				xTextDiv.append("td").attr("style", xStyle).text(vars[curVar].name)
			}
			x += w + wMargin
		}
		yTextDiv.append("tr").append("td").attr("style", yStyle).text(vars[
			(catIdY === undefined || catIdY < 0 ? metricIdY : catIdY)
		].name)
		x = xGlobal
		drawFilterY(svg, x, y, w, h, (catIdY === undefined || catIdY < 0 ? metricIdY : catIdY))
		y += h + hMargin
		metricIdX = undefined
		catIdX = undefined
	}
}

function nextMetric(current) {
	return next(current, true)
}

function nextCat(current) {
	return next(current, false)
}

function next(current, findMetric) {
	if (current == -1)
		return -1
	if (current === undefined || current === null)
		current = -1
	while (++current < vars.length) {
		var typeIsMetric = vars[current].dataType === "metric"
		if ((findMetric && typeIsMetric) || (!findMetric && !typeIsMetric))
			return current
	}
	return -1
}

function getTotalCardinalityFrom(cardinalityWidthCap) {
	var current = undefined
	var cc = 0
	var cc0 = 0
	var vc = 0
	while ((current = nextCat(current)) !== -1) {
		vc++
		var cardinality = vars[current].dictionary.length
		cc += (cardinality > cardinalityWidthCap
			? cardinalityWidthCap
			: cardinality)
		if (vc === 1)
			cc0 = cc
	}
	return [vc, cc, cc-cc0]
}

function getFilterRangeFor(varId, aOrB) {
	for (var i=0; i<filter.length; i++) {
		if (filter[i].varId === varId)
			return filter[i][aOrB]
	}
	return aOrB === "a"
		? (vars[varId].dataType === "metric"
			? vars[varId].min
			: 0)
		: (vars[varId].dataType === "metric"
			? vars[varId].max
			: (vars[varId].dictionary.length-1))
}

function updateFilterMask(varId, plus, newToBeF, aOrB) {
	if (vars[varId].dataType === "metric") {
		for (var i=0; i<filterMask.length; i++) {
			if (typeof vars[varId].data[i] !== "string") {
				// intricate difference: range max or min included ?
				if (plus) {
					if (newToBeF.min <= vars[varId].data[i]
					   && newToBeF.max > vars[varId].data[i])
					   filterMask[i] += 1
				} else {
					if (newToBeF.min < vars[varId].data[i]
					   && newToBeF.max >= vars[varId].data[i])
					   filterMask[i] -= 1
				}
				console.assert(filterMask[i] >= 0)
				if (filterMask[i] < 0)
					filterMask[i] = 0
			}
		}
	} else {
		for (var i=0; i<filterMask.length; i++) {
			// filter: [min, max)
			for (var k=newToBeF.min; k<newToBeF.max; k++) {
				if (vars[varId].data[i] === k) {
					filterMask[i] += (plus ? 1 : -1)
					console.assert(filterMask[i] >= 0)
				}
			}
		}
	}
}

function setFilterRangeFor(varId, aOrB, val) {
	var isMetric = vars[varId].dataType === "metric"
	var low = isMetric ? vars[varId].min : 0
	var high = isMetric ? vars[varId].max : vars[varId].dictionary.length-1
	console.assert(val <= high && val >= low)
	
	var newToBeF = []
	for (var i=0; i<filter.length; i++) {
		if (filter[i].varId === varId) {
			var oldVal = filter[i][aOrB]
			filter[i][aOrB] = val
			if (filter[i].a === low && filter[i].b === high) {
				filter.splice(i, 1)
			}
			newToBeF.min = Math.min(oldVal, val) + (!isMetric && aOrB === "b" ? 1: 0)
			newToBeF.max = Math.max(oldVal, val) + (!isMetric && aOrB === "b" ? 1: 0)
			updateFilterMask(varId, aOrB === "a" ? oldVal < val : val < oldVal, newToBeF, aOrB)
			return
		}
	}
	// create new
	
	
	if ((aOrB === "a" && val !== low) || (aOrB === "b" && val !== high)) {
		var a = aOrB === "a" ? val : low
		var b = aOrB === "b" ? val : high
		
		filter.push({
			varId: varId,
			a: a,
			b: b
		})
		
		// filter: [min, max)
		newToBeF.min = aOrB === "a" ? low : b+(isMetric ? 0 : 1)
		newToBeF.max = aOrB === "a" ? a : high+(isMetric ? 0 : 1)
		updateFilterMask(varId, true, newToBeF, aOrB)
	}
}

var ondrag = d3.behavior.drag().on("drag", function() {
	// if a === b then the sliders are one width apart!
	// thus, bSlider pos is actually at b+1!
	var mouseX = d3.event.x
	var mouseY = d3.event.y
	var d3obj = d3.select(this)
	var tDelay = 200
	var x = parseFloat(d3obj.attr("_x"))
	var y = parseFloat(d3obj.attr("_y"))
	var w = parseFloat(d3obj.attr("_w"))
	var h = parseFloat(d3obj.attr("_h"))
	var xOrY = d3obj.attr("xOrY")
	var isX = xOrY === "x"
	
	var varId = parseInt(d3obj.attr("_varId"))
	var aOrB = d3obj.attr("aOrB")
	var c = getFilterRangeFor(varId, aOrB)
	var NaOrB = aOrB === "a" ? "b" : "a"
	var Nc = getFilterRangeFor(varId, NaOrB)
	

	if (vars[varId].dataType !== "metric") {
		var numberOfCat = vars[varId].dictionary.length
		var barX = w/numberOfCat
		var barY = h/numberOfCat
		function transform(trL, aOrB) {
			d3.select("#fsx"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate("+trL*barX+", 0)")
			d3.select("#fsy"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate(0, "+trL*barY+")")
		}
		var barSize = isX ? barX : barY
		var pos = (isX ? x : y)+(c+(aOrB === "b" ? 1 : 0))*barSize
		var p = ((isX ? mouseX : mouseY)-pos)/barSize
//		console.log(id+", "+dxr)
		if (p >= 0.5 && ((aOrB === "a" && c < numberOfCat-1) || (aOrB === "b" && c < numberOfCat-1))) {
			setFilterRangeFor(varId, aOrB, c+1)
			transform((c+1+ (aOrB === "b" ? 1 : 0)), aOrB)
			// a must < b
			if (aOrB === "a" && c+1 >= Nc) {
				setFilterRangeFor(varId, NaOrB, c+1)
				transform(c+2, NaOrB)
			}
			updateSVG()
		}
		if (p <= -0.5 && ((aOrB === "a" && c > 0) || (aOrB === "b" && c > 0))) {
			setFilterRangeFor(varId, aOrB, c-1)
			transform((c-1+ (aOrB === "b" ? 1 : 0)), aOrB)
			// a must < b
			if (aOrB === "b" && c-1 <= Nc) {
				setFilterRangeFor(varId, NaOrB, c-1)
				transform(c-1, NaOrB)
			}
			updateSVG()
		}
	} else {
		var p = isX ? (mouseX-x)/w : (mouseY-y)/h
		p = Math.min(1, p)
		p = Math.max(0, p)
		var newFilterVal = vars[varId].min + p* (vars[varId].max - vars[varId].min)
		setFilterRangeFor(varId, aOrB, newFilterVal)
		function transform(aOrB) {
			d3.select("#fsx"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate("+(p*w)+", 0)")
			d3.select("#fsy"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate(0, "+(p*h)+")")
		}
		transform(aOrB)
		if ((aOrB === "a" && newFilterVal > Nc) || (aOrB === "b" && newFilterVal < Nc)) {
			setFilterRangeFor(varId, NaOrB, newFilterVal)
			transform(NaOrB)
		}

		updateSVG()
	}
})
.on("dragstart", function() {
	this.isDragged = true
	d3.select(this).attr("fill", "red")
})
.on("dragend", function() {
	this.isDragged = false
	d3.select(this).attr("fill", "rgb("+sliderColor+","+sliderColor+","+sliderColor+")")
})

function drawFilterY(svg, x, y, w, h, varId) {
	var size = 10
	var fss = new Array()
	fss.push(svg
		.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsya"+varId)
		.attr("aOrB", "a")
		.attr("xOrY", "y")
		.attr("d", "M"+x+","+y+" L"+(x-size)+","+y+" L"+(x-size)+","+(y - size)+" Z")
	)
	fss.push(svg.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsyb"+varId)
		.attr("aOrB", "b")
		.attr("xOrY", "y")
		.attr("d", "M"+x+","+y+" L"+(x-size)+","+y+" L"+(x-size)+","+(y + size)+" Z")
		.attr("transform", "translate(0, "+h+")")
	)
	commonSliders(svg, x, y, w, h, varId, fss)
}

function drawFilterX(svg, x, y, w, h, varId) {
	var size = 10
	
	var fss = new Array()
	fss.push(svg
		.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsxa"+varId)
		.attr("aOrB", "a")
		.attr("xOrY", "x")
		.attr("d", "M"+x+","+(y+h)+" L"+x+","+(y+h+size)+" L"+(x - size)+","+(y+h+size)+" Z")
	)
	fss.push(svg.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsxb"+varId)
		.attr("aOrB", "b")
		.attr("xOrY", "x")
		.attr("d", "M"+x+","+(y+h)+" L"+x+","+(y+h+size)+" L"+(x + size)+","+(y+h+size)+" Z")
		.attr("transform", "translate("+w+", 0)")
	)
	commonSliders(svg, x, y, w, h, varId, fss)
}

function commonSliders(svg, x, y, w, h, varId, fss) {
	for (var i=0; i<fss.length; i++)
		fss[i]
		.attr("_x", x)
		.attr("_y", y)
		.attr("_w", w)
		.attr("_h", h)
		.attr("_varId", varId)
		.attr("fill", "rgb("+sliderColor+","+sliderColor+","+sliderColor+")")
		.on("mouseover", function() {
			if (!this.isDragged)
				d3.select(this).attr("fill", "red")
		})
		.on("mouseout", function() {
			if (!this.isDragged)
				d3.select(this).attr("fill", "rgb("+sliderColor+","+sliderColor+","+sliderColor+")")
		})
		.call(ondrag)
}

function getHistogramDataFromVars(catId, metricId, filtered) {
	var result = new Array(vars[catId].dictionary.length)
	for (var i=0; i<result.length; i++)
		result[i] = 0
	
//	filterMask
	for (var i=0; i<vars[catId].data.length; i++)
		if (typeof vars[metricId].data[i] !== "string") {
			if (!filtered) {
				result[vars[catId].data[i]] += vars[metricId].data[i]
			} else {
				if (filterMask[i] === 0)
					result[vars[catId].data[i]] += vars[metricId].data[i]
			}
		}
	
	if (false)
	for (var i=0; i<vars[catId].data.length; i++)
		if (typeof vars[metricId].data[i] !== "string") {
			if (!filtered) {
				result[vars[catId].data[i]] += vars[metricId].data[i]
			} else {
				var isFiltered = false
				for (var f=0; f<filter.length; f++) {
					var filteredVar = vars[filter[f].varId]
					var val = filteredVar.data[i]
					if (filteredVar.dataType !== "metric") {
						if (val < filter[f].a || val > filter[f].b) {
							isFiltered = true
							break
						}
					} else {
						// TODO
					}
				}
				if (!isFiltered) {
					console.assert(!isNaN(vars[metricId].data[i]))
					result[vars[catId].data[i]] += vars[metricId].data[i]
				}
			}
		}
	return result
}

function histTest() {
	var svg = d3.select("#viz")
		.attr("width", 960)
		.attr("height", 500)
	
	var input = []
	for (var i=0; i<10; i++)
		input.push(Math.random())
	
	drawHistogram(svg, 10, 10, 300, 200, input, false)
}

function drawHistogram(svg, x, y, w, h, catIdX, metricIdY) {
	var input = getHistogramDataFromVars(catIdX, metricIdY, false)
	var inputFiltered = getHistogramDataFromVars(catIdX, metricIdY, true)
	
	var minMax = getMinMax(input), min = minMax[0], max = minMax[1]
	console.assert(min >= 0)
	if (max === 0) {
		max += 1
	}
	
	var baseline = 0
	
	var histG = svg.append("g")
		.attr("class", "histogram")
		.attr("catIdX", catIdX)
		.attr("metricIdY", metricIdY)
		.attr("_x", round(x))
		.attr("_y", round(y))
		.attr("_w", round(w))
		.attr("_h", round(h))
		.attr("_max", max)
		.attr("_min", min)
	
	histG
		.append("line")
		.attr("x1", x).attr("y1", y+h)
		.attr("x2", x+w).attr("y2", y+h)
		.attr("stroke", "gray")
		.attr("stroke-width", "3")
	
	var ww = 1/input.length*w
	for (var i=0; i<input.length; i++) {
		var barHeight = h*(input[i]-baseline)/(max-baseline)
		var xx = x+i/input.length*w
		var yy = y+(h-barHeight)
		
		histG
			.append("rect")
			.attr("x", round(xx))
			.attr("y", round(yy))
			.attr("width", round(ww))
			.attr("height", round(barHeight))
			.attr("fill", "url(#lg1)")
		
		histG
			.append("line")
			.attr("x1", xx).attr("y1", yy)
			.attr("x2", xx+ww).attr("y2", yy)
			.attr("stroke", "black")
			.attr("stroke-width", "1")
			
		// FILTERED
		if (inputFiltered !== undefined) {
			var barHeightFiltered = h*(inputFiltered[i]-baseline)/(max-baseline)
			var yyF = y+(h-barHeightFiltered)
			histG
				.append("rect")
				.attr("id", "hist"+catIdX+"x"+metricIdY+"bar"+i)
				.attr("x", round(xx))
				.attr("y", round(yyF))
				.attr("width", round(ww))
				.attr("height", round(barHeightFiltered))
				.attr("fill", "url(#lgBlue)")

			histG
				.append("line")
				.attr("id", "hist"+catIdX+"x"+metricIdY+"barStroke"+i)
				.attr("x1", xx).attr("y1", yyF)
				.attr("x2", xx+ww).attr("y2", yyF)
				.attr("stroke", "black")
				.attr("stroke-width", "1")
		}
	}
	
	var numberOfRulers = 3
	for (var i=1; i<(numberOfRulers+1); i++) {
		var yy = y+h-i/(numberOfRulers+1)*h
		histG
			.append("line")
			.attr("x1", round(x)).attr("y1", round(yy))
			.attr("x2", round(x+w)).attr("y2", round(yy))
			.attr("stroke", "rgb(255,255,255)")
			.attr("stroke-opacity", "0.5")
			.attr("stroke-width", "1")
	}
}

function updateSVG() {
//	console.log(filter)
	
	d3.selectAll(".histogram").each(function(d, i) {
		var hist = d3.select(this)
		var catIdX = hist.attr("catIdX")
		var metricIdY = hist.attr("metricIdY")
		
		var y = parseFloat(hist.attr("_y"))
		var h = parseFloat(hist.attr("_h"))
		var max = parseFloat(hist.attr("_max"))
		
		console.assert(!(isNaN(y) || isNaN(h) || isNaN(max) || typeof y === "string" || typeof h === "string" || typeof max === "string"))
		
		var baseline = 0
		var inputFiltered = getHistogramDataFromVars(catIdX, metricIdY, true)
		
		for (var i=0; i<inputFiltered.length; i++) {
			console.assert(!isNaN(inputFiltered[i]))
			var barHeightFiltered = h*(inputFiltered[i]-baseline)/(max-baseline)
			var yyF = y+(h-barHeightFiltered)
//			console.log(barHeightFiltered+", "+yyF)
			
			d3.select("#hist"+catIdX+"x"+metricIdY+"bar"+i)
				.transition()
				.duration(300)
				.attr("y", round(yyF))
				.attr("height", round(barHeightFiltered))
				
			d3.select("#hist"+catIdX+"x"+metricIdY+"barStroke"+i)
				.transition()
				.duration(300)
				.attr("y1", yyF)
				.attr("y2", yyF)
		}
	})
}

function drawKDE(svg, x, y, w, h, input) {
	var scaleX = d3.scale.linear()
		.domain(getMinMax(input))
		.range([x, x+w])
		
	var scaleY = d3.scale.linear()
		.domain([0, .1])
		.range([y+h, y])

	var kde = kernelDensityEstimator(epanechnikovKernel(7), scaleX.ticks(100))
	
	var line = d3.svg.line()
		.x(function(d) { return scaleX(d[0]) })
		.y(function(d) { return scaleY(d[1]) })

	svg.append("path")
		.datum(kde(input))
		.attr("class", "line")
		.attr("d", line)
		.attr("fill", "transparent")
		.attr("stroke", "gray")
		.attr("stroke-width", "3")
}

function heatmapTest() {
	var svg = d3.select("#viz")
		.attr("width", 960)
		.attr("height", 500)

	var input = []
	for (var i=0; i<10; i++) {
		var inside = []
		for (var k=0; k<10; k++)
			inside.push(Math.random())
		input.push(inside)
	}
	
	drawHeatmap(svg, 10, 10, 300, 200, input)
}

function getHeatmapDataFromVars(v1id, v2id) {
	// init 2D map with count=0
	var result = new Array(vars[v1id].dictionary.length)
	for (var i=0; i<result.length; i++) {
		var inside = new Array(vars[v2id].dictionary.length)
		for (var k=0; k<inside.length; k++) {
			inside[k] = 0
		}
		result[i] = inside
	}
	
	for (var i=0; i<vars[v1id].data.length; i++)
		if (typeof vars[v1id].data[i] !== "string" && typeof vars[v2id].data[i] !== "string")
			result[vars[v1id].data[i]][vars[v2id].data[i]]++
	return result
}

function drawHeatmap(svg, x, y, w, h, input) {
	console.assert(input.length > 0 && input[0].length > 0)
	var max = input[0][0]
	var min = input[0][0]
	var innerLength = input[0].length
	for (var i=0; i<input.length; i++) {
		console.assert(innerLength === input[i].length)
		for (var k=0; k<innerLength; k++) {
			if (input[i][k] > max) max = input[i][k]
			if (input[i][k] < min) min = input[i][k]
		}
	}
	
	var ww = w/input.length
	var hh = h/input[0].length
	for (var i=0; i<input.length; i++) {
		for (var k=0; k<innerLength; k++) {
			var color = 255-Math.round(input[i][k]/max*255)
			if (color !== 255)
			svg
				.append("rect")
				.attr("x", round(x+i*ww))
				.attr("y", round(y+k*hh))
				.attr("width", round(ww))
				.attr("height", round(hh))
				.attr("fill", "rgb("+color+","+color+","+color+")")
		}
	}
}

function scatter() {
	var svg = d3.select("#viz")
		.attr("width", 960)
		.attr("height", 500)
	
	var dataX = [], dataY = []
	for (var i=0; i<200; i++) {
		dataX.push(Math.random())
		dataY.push(Math.random())
	}
	
	// TODO deprecated
//	drawScatterplotFormat(svg, 10, 10, 100, 200, dataX, dataY)
}

function drawScatterplotFormat(svg, x, y, w, h, id0, id1) {
	svg
		.append("rect")
		.attr("x", x).attr("y", y)
		.attr("width", w)
		.attr("height", h)
		.attr("fill", "rgb(0,0,0)")
		.attr("fill-opacity", "0")
		.attr("stroke", "rgb(0,0,0)")
		.attr("stroke-opacity", "0.4")
		.attr("stroke-width", "1")
	
	var maxPointsDisplayed = 50
	console.assert(vars[id0].data.length === vars[id1].data.length)
	
	var vX = []
	var vY = []
	// cleanup metric data pair
	for (var i=0; i<Math.max(vars[id0].data.length, vars[id1].data.length); i++) {
		if (	typeof vars[id0].data[i] !== "string"
			&&	typeof vars[id1].data[i] !== "string"
			&& !isNaN(vars[id0].data[i])
			&& !isNaN(vars[id1].data[i])
			&& vars[id0].data[i] !== undefined
			&& vars[id1].data[i] !== undefined) {
				vX.push(vars[id0].data[i])
				vY.push(vars[id1].data[i])
		}
	}
	
	var length = vX.length
	// min & max have to be calc individually for every metric pair
	var minMax = getMinMax(vX), Xmin = minMax[0], Xmax = minMax[1]
	var minMax = getMinMax(vY), Ymin = minMax[0], Ymax = minMax[1]
	
	if (Xmax-Xmin < 0.0001) {
		Xmax += 1
		Xmin -= 1
	}
	if (Ymax-Ymin < 0.0001) {
		Ymax += 1
		Ymin -= 1
	}
	if (length > maxPointsDisplayed)
		var randomId = uniqueRandomNumbersArray(maxPointsDisplayed, length-1)
	
	for (var i=0; i<maxPointsDisplayed && i<length; i++) {
		var idx = length > maxPointsDisplayed ? randomId[i] : i
		svg
		.append("circle")
		.attr("fill", "url(#g1)")
		.attr("r", 4)
		.attr("cx", round(x+w*((vX[idx]-Xmin)/(Xmax-Xmin))))
		.attr("cy", round(y+h*(1-(vY[idx]-Ymin)/(Ymax-Ymin))))
	}
}

function stream(svg) {
	var faithful1 = [1,2,3,4,5,6]
	var faithful2 = [4,3,5,1,2,0]
	var f1xy = faithful1.map(function(d, i) {
		return {x: i, y: d}
	})
	var f2xy = faithful2.map(function(d, i) {
		return {x: i, y: d}
	})
	
	console.log([f1xy, f2xy])
	var stack = d3.layout.stack().offset("wiggle"), // zero, wiggle, expand
		layers0 = stack([f1xy, f2xy])
		
	
	var x = d3.scale.linear()
		.domain([0, 7])
		.range([0, 500])

	var y = d3.scale.linear()
		.domain([0, 7])
		.range([300, 0])

	var color = d3.scale.linear()
		.range(["#aad", "#556"])

	var area = d3.svg.area()
		.x(function(d) { return x(d.x) })
		.y0(function(d) { return y(d.y0) })
		.y1(function(d) { return y(d.y0 + d.y) })
	
	svg.selectAll("path")
		.data(layers0)
	  .enter().append("path")
		.attr("d", area)
		.attr("fill", function() { return color(Math.random()) })
}

function kernelDensityEstimator(kernel, x) {
	return function(sample) {
		return x.map(function(x) {
			return [x, d3.mean(sample, function(v) { return kernel(x - v) })]
		})
	}
}

function epanechnikovKernel(scale) {
	return function(u) {
		return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0
	}
}






















function getMinMax(input) {
	if (input.length === 0)
		return [0,0]
	var max = input[0]
	var min = input[0]
	for (var i=1; i<input.length; i++) {
		if (input[i] > max) max = input[i]
		if (input[i] < min) min = input[i]
	}
	return [min, max]
}

function flowText(svg, x, y, w, h, text) {
	// does not work. if I put the same svg block into the html, it works. do not know why.
	var switchObj = svg.append("switch")
	switchObj
		.append("foreignObject")
//		.attr("x", x).attr("y", y)
		.attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
		.attr("width", w).attr("height", h)
		.append("p")
		.attr("xmlns", "http://www.w3.org/1999/xhtml")
		.text("Text goes here ok so i have along line of text and i expect it to be wrapped now")
}

function convertStrToNumber(val) {
	var number = parseInt(val)
	if (isNaN(number))
		number = parseFloat(val)
	if (isNaN(number) || number === undefined)
		console.log("could not parse: "+val)
	return number
}

function uniqueRandomNumbersArray(length, rangeMax) {
	console.assert(length <= rangeMax)
	var randomId = []
	while (randomId.length < length) {
		var randomnumber=Math.ceil(Math.random()*rangeMax)
		var found = false
		for (var i=0; i<randomId.length; i++) {
			if(randomId[i] === randomnumber) {
				found=true
				break
			}
		}
		if (!found)
			randomId[randomId.length] = randomnumber
	}
	return randomId
}

function round(number) {
//	if (typeof number === "")

	return Number(number.toFixed(1))
}


function createTestData(numberOfRows) {
	vars = [
		{name:"v1", dataType:"metric", dictionary:[30, 50], data:[]},
		{name:"v2", dataType:"ordinal", dictionary:[3,5,7,9], data:[]},
		{name:"v3", dataType:"nominal", dictionary:["yes", "no", "kA"], data:[]},
		{name:"v4", dataType:"ordinal", dictionary:["1-3", "3-10", "10-100"], data:[]},
		{name:"v5", dataType:"metric", dictionary:[0, 100], data:[]}
	]
	
	for (var i=0; i<vars.length; i++) {
		var row = []
		for (var k=0; k<numberOfRows; k++) {
			if (vars[i].dataType === "metric") {
				var min = vars[i].dictionary[0]
				var max = vars[i].dictionary[1]
				row.push(Math.random() * (max - min) + min)
			} else { // get random category
				// push id of category
				row.push(Math.floor(Math.random()*vars[i].dictionary.length))
			}
		}
		vars[i].data = row
	}
}

