var vars

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
		
//		for (var k=0; k<dataTypes.length; k++)
//			dataTypesCount.push(0)
//		
//		for (var i=0; i<vars.length; i++)
//			for (var k=0; k<dataTypes.length; k++)
//				if (vars[i].dataType === dataTypes[k]) {
//					dataTypesCount[k]++
//					break
//				}
//		
//		for (var k=0; k<dataTypes.length; k++) {
//			console.log(dataTypes[k]+": "+dataTypesCount[k])
//			for (var i=0; i<vars.length; i++)
//				if (vars[i].dataType === dataTypes[k]) {
//					console.log("\t"+vars[i].name+", "+vars[i].data.length+", "+vars[i].detail+", "+vars[i].dictionary)
//				}
//		}
		
//		document.write(JSON.stringify(vars))
		
		var numberOfVarsToDraw = 10
		if (vars.length > numberOfVarsToDraw)
			vars.splice(numberOfVarsToDraw, vars.length-numberOfVarsToDraw)
		draw()
		
		console.log("done!")
	}
	
//	parseData("data/SHIP_2012_D_S2_20121129.json", afterParsingDo)
	parseDataFast("data/SHIP_2012_D_S2_20121129_improved.json", afterParsingDo)
	
//	createTestData(100)
}

function draw() {
	var width = 1100, height = 830
//	var width = 4000, height = 4000
	
	var svg = d3.select("#viz")
		.attr("width", width)
		.attr("height", height)
	
//	svg
//		.append("rect")
//		.attr("x", 0).attr("y", 0)
//		.attr("width", "100%")
//		.attr("height", "100%")
//		.attr("fill", "rgb(0,0,0)")
//		.attr("fill-opacity", "0.03")
	
	definedGradients(svg)
	createGplomMatrix(svg, 0, 0, width, height)
	
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

function definedGradients(svg) {
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
		
	var rgrad = defs.append("radialGradient")
		.attr("id", "g1")
		.attr("cx", "50%")
		.attr("cy", "50%")
		.attr("r", "50%")
	
	rgrad
		.append("stop")
		.attr("stop-color", "rgb(0,0,0)")
		.attr("stop-opacity", "0.7")
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
				drawHeatmap(svg.append("g"), x, y, w, h,
					getHeatmapDataFromVars(catIdX, catIdY))
			} else {
				if (catIdX !== -1) { // histogram
					drawHistogram(svg.append("g"), x, y, w, h,
						getHistogramDataFromVars(catIdX, metricIdY))
					// create new stream from each category
					if (false) {
						
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
					drawScatterplotFormat(svg.append("g"), x, y, w, h, vars[metricIdX].data, vars[metricIdY].data)
				}
			}
			if (k === i) {
				xTextDiv.append("td").attr("style", xStyle).text(vars[
					(catIdX === undefined || catIdX < 0 ? metricIdX : catIdX)
				].name)
			}
			x += w + wMargin
		}
		yTextDiv.append("tr").append("td").attr("style", yStyle).text(vars[
			(catIdY === undefined || catIdY < 0 ? metricIdY : catIdY)
		].name)
		x = xGlobal
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

function getHistogramDataFromVars(catId, metricId) {
	var result = new Array(vars[catId].dictionary.length)
	for (var i=0; i<result.length; i++)
		result[i] = 0
	for (var i=0; i<vars[catId].data.length; i++)
		if (typeof vars[metricId].data[i] !== "string")
			result[vars[catId].data[i]] += vars[metricId].data[i]
	return result
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
				.attr("y", round(y+(h-(k+1)*hh)))
				.attr("width", round(ww))
				.attr("height", round(hh))
				.attr("fill", "rgb("+color+","+color+","+color+")")
		}
	}
}

function round(number) {
	return Number(number.toFixed(1))
}

function histTest() {
	var svg = d3.select("#viz")
		.attr("width", 960)
		.attr("height", 500)
	
	var input = []
	for (var i=0; i<10; i++)
		input.push(Math.random())
	
	drawHistogram(svg, 10, 10, 300, 200, input)
}

function drawHistogram(svg, x, y, w, h, input) {
	var minMax = getMinMax(input), min = minMax[0], max = minMax[1]
	console.assert(min >= 0)
	if (max === 0) {
		max += 1
	}
	var baseline = 0
	
	svg
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
		svg
			.append("rect")
			.attr("x", round(xx))
			.attr("y", round(yy))
			.attr("width", round(ww))
			.attr("height", round(barHeight))
			.attr("fill", "url(#lg1)")
		
		svg
			.append("line")
			.attr("x1", xx).attr("y1", yy)
			.attr("x2", xx+ww).attr("y2", yy)
			.attr("stroke", "black")
			.attr("stroke-width", "1")
	}
	
	var numberOfRulers = 3
	for (var i=1; i<(numberOfRulers+1); i++) {
		var yy = y+h-i/(numberOfRulers+1)*h
		svg
			.append("line")
			.attr("x1", round(x)).attr("y1", round(yy))
			.attr("x2", round(x+w)).attr("y2", round(yy))
			.attr("stroke", "rgb(255,255,255)")
			.attr("stroke-opacity", "0.5")
			.attr("stroke-width", "1")
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
	
	drawScatterplotFormat(svg, 10, 10, 100, 200, dataX, dataY)
}

function drawScatterplotFormat(svg, x, y, w, h, vX, vY) {
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
	console.assert(vX.length === vY.length)
	
	for (var i=0; i<Math.max(vX.length,vY.length); i++) {
		if (typeof vX[i] === "string" || typeof vY[i] === "string"
			|| isNaN(vY[i]) || isNaN(vX[i])
			|| vY[i] === undefined || vX[i] === undefined) {
			vX.splice(i, 1)
			vY.splice(i, 1)
		}
	}
	var minLength = Math.min(vX.length,vY.length)
	
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
	if (minLength > maxPointsDisplayed)
		var randomId = uniqueRandomNumbersArray(maxPointsDisplayed, minLength-1)
	
	for (var i=0; i<maxPointsDisplayed && i<minLength; i++) {
		var idx = minLength > maxPointsDisplayed ? randomId[i] : i
		svg
		.append("circle")
		.attr("fill", "url(#g1)")
		.attr("r", 4)
		.attr("cx", round(x+w*((vX[idx]-Xmin)/(Xmax-Xmin))))
		.attr("cy", round(y+h*(1-(vY[idx]-Ymin)/(Ymax-Ymin))))
	}
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
