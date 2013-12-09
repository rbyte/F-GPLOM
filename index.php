<?php

?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>D3 Sandkasten</title>
	<link rel="stylesheet" type="text/css" href="css/main.css"/>
	<script type='text/javascript' src='js/d3.v3.min.js'></script>
	<script type='text/javascript' src='js/gplom.js'></script>
</head>

<body onload="interfaceInit()">
	
	<svg id="viz"></svg>
	<ul id="filter"></ul>
	<div id="varSelection">
		<span class="helperSpanToAlignImageVertically"></span>+
		<ul id="varSelectionUL"></ul>
	</div>
	
</body>
</html>
