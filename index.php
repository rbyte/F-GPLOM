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
	
	<table id="container">
		<tr>
			<td>
				<table id="yNames">
				</table>
			</td>
			<td>
				<svg id="viz"></svg>
			</td>
		</tr>
		<tr>
			<td></td>
			<td>
				<table><tr id="xNames">
				</tr></table>
			</td>
		</tr>
	</table>
	
</body>
</html>
