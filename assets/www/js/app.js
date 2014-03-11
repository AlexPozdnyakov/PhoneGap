var map;
var set_img_marker = "";
var last_id_marker = 0;
var global_i = 0;
var quest_object = [];
var my_pos = new Object();
var vectorLayer;
var serverLink = "http://nauchilsya.ru/game";
var selectControl;
var before_icon = "";
var add_markers = false;
var point;

//Функция заменяющая background у выбранного при создании маркера
function selectIcon(id, name)
{
	document.getElementById(id).style.background = "#fc9a3c";
	if (before_icon != "")
	{
		document.getElementById(before_icon).style.background = "none";
		before_icon = id;
		set_img_marker = name;
	}
	else
	{
		before_icon = id;
		set_img_marker = name;
		document.getElementById("icon_1").style.background = "none";
	}
}

//Ajax передача с исопльзованием JSONP
function requestToServer(url, success, myObjects) 
{
	$.ajax({
		type: "GET",
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		dataType: 'jsonp',
		jsonp: 'jsonp_callback',
		url: url,
		data: "arrObjects=" + JSON.stringify(myObjects),
		success: function(data)
		{
			success(data);
		},
		error: function()
		{
			alert('Server connection error!!!');
		}
	});
}

//Выход из приложения
function exit()
{
	navigator.app.exitApp();
}

//Закрытие окна описания маркера
function close_description()
{
	document.getElementById("marker_desc").style.display = "none";
}

//Получение значения свойства value у объекта по id
function getElementValue(id)
{
	return document.getElementById(id).value;
}

//Функция отмения добавления маркера
function cancel_add()
{
	document.getElementById("title").value = "";
	document.getElementById("msg").value = "";
	document.getElementById("marker_add_form").style.display = "none";
}

//Функция подтверждающая добавление маркера
function ok_add()
{
	var feature = new OpenLayers.Feature.Vector(
	   new OpenLayers.Geometry.Point(point.lon,point.lat),
	   {some:'data'},
	   {externalGraphic: "./markers/" + set_img_marker, graphicHeight: 21, graphicWidth: 25});
	var point_new = point.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
	feature.marker_id = "marker_"+last_id_marker;
	quest_object[global_i] = new Object(); //создаем объект описания маркера
	quest_object[global_i].lon = point_new.lon;
	quest_object[global_i].lat = point_new.lat;
	quest_object[global_i].icon = set_img_marker;
	quest_object[global_i].marker_id = "marker_"+last_id_marker;
	vectorLayer.addFeatures(feature); //добавляем маркер на слой
	quest_object[last_id_marker].title = getElementValue("title");
	quest_object[last_id_marker].msg = getElementValue("msg");
	requestToServer(serverLink+"/server2/ajax.save_marker.php",save_ok, quest_object[last_id_marker]);
	
}

//Функция, обрабатывающая ответ от сервера при сохранении маркера
function save_ok(data)
{
	if (!data.success)
	{
		alert("Ошибка сохранения!");
	}
	else
	{
		//Создаем веркотрный элемент
		document.getElementById("title").value = "";
		document.getElementById("msg").value = "";
		document.getElementById("marker_add_form").style.display = "none";
		if (before_icon != "")
		{
			document.getElementById(before_icon).style.background = "none";
			before_icon = "";
		}
		document.getElementById('add_marker_img').src='./css/img/btn_search_marker_from_game.png';
		last_id_marker++;
		global_i++;
	}
}

//Функция выводит ошибку при неудачном получении координат местоположения мобильного устройства
function geo_error(error)
{
	//alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
	document.getElementById('find_itself_img').src='./css/img/btn_search_user_from_game.png';
	alert('Ошибка получения координат!');
}

//Получение позиции мобильного устройства
function get_my_position(position)
{
	map.setCenter(new OpenLayers.LonLat(position.coords.longitude,position.coords.latitude).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),5);
	
	var point_2 = new OpenLayers.LonLat(position.coords.longitude,position.coords.latitude).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
	
	my_pos.lon = position.coords.longitude;
	my_pos.lat = position.coords.latitude;
	
	
	var feature = new OpenLayers.Feature.Vector(
	   new OpenLayers.Geometry.Point(point_2.lon,point_2.lat),
	   {some:'data'},
	   {externalGraphic: "./markers/target.png", graphicHeight: 21, graphicWidth: 25});
			
	feature.marker_id = "my_position";
	vectorLayer.addFeatures(feature);
	document.getElementById('find_itself_img').src='./css/img/btn_search_user_from_game.png';
}

//Загрузка всех маркеров
function load_markers()
{
	requestToServer(serverLink+"/server2/ajax.load_markers.php", load_ok, "");
}

//Функция размещения всех маркеров на карте, которые были получены с сервера
function load_ok(data)
{
	quest_object = null;
	quest_object = [];
	
	vectorLayer.removeAllFeatures();
	
	if (data.success)
	{
		for(var i=0; i<data.markers.length; i++)
		{
			quest_object[i] = new Object();
			quest_object[i].lon = data.markers[i].lon;
			quest_object[i].lat = data.markers[i].lat;
			quest_object[i].title = data.markers[i].title;
			quest_object[i].msg = data.markers[i].msg;
			quest_object[i].icon = data.markers[i].icon;
			quest_object[i].marker_id = "marker_" + i;
			
			point = new OpenLayers.LonLat(quest_object[i].lon,quest_object[i].lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
			
			var feature = new OpenLayers.Feature.Vector(
			   new OpenLayers.Geometry.Point(point.lon,point.lat),
			   {some:'data'},
			   {externalGraphic: "./markers/" + quest_object[i].icon, graphicHeight: 21, graphicWidth: 25});
			
			feature.marker_id = "marker_"+i;
			vectorLayer.addFeatures(feature);
		}
		last_id_marker = data.markers.length;
		global_i = data.markers.length;
	}
}

//Получение координат положения с мобильного устройства
function my_position()
{
	navigator.geolocation.getCurrentPosition(get_my_position,
		geo_error, { maximumAge: 0, timeout: 130000, enableHighAccuracy: false});
}

//Описание переменных, как кнопок в приложении
var btn_add_marker;
var btn_find_itself;
var btn_exit;
var btn_plus;
var btn_minus;

//Добавление событий для кнопок
function add_events()
{
	btn_add_marker = document.getElementById('add_marker');
	btn_find_itself = document.getElementById('find_itself');
	btn_exit = document.getElementById('exit');
	btn_plus = document.getElementById('btn_plus');
	btn_minus = document.getElementById('btn_minus');

	btn_add_marker.addEventListener('touchstart', function(event) {
            event.preventDefault();
			add_markers = true;
            document.getElementById('add_marker_img').src='./css/img/btn_search_marker_from_game_active.png';
        }, false);
	
	
	btn_add_marker.addEventListener('touchend', function(event) {
            event.preventDefault();
        }, false);
		
		
	btn_add_marker.addEventListener('touchstart', function(event) {
            event.preventDefault();
			add_marker();
            document.getElementById('add_marker_img').src='./css/img/btn_search_marker_from_game_active.png';
        }, false);
	
	btn_add_marker.addEventListener('touchend', function(event) {
            event.preventDefault();
        }, false);
	
	btn_find_itself.addEventListener('touchstart', function(event) {
            event.preventDefault();
            document.getElementById('find_itself_img').src='./css/img/btn_search_user_from_game_active.png';
        }, false);
	
	btn_find_itself.addEventListener('touchend', function(event) {
            event.preventDefault();
			my_position();
        }, false);
	
	btn_exit.addEventListener('touchstart', function(event) {
            event.preventDefault();
            document.getElementById('exit_img').src='./css/img/btn_exit_from_game_active.png';
        }, false);
	
	btn_exit.addEventListener('touchend', function(event) {
            event.preventDefault();
			setTimeout("exit();", 100);
        }, false);
}

//Инициализация и отображение карты. Добавление события для карты
function map_init()
{
	map =new OpenLayers.Map({
		div: "megamap",
		layers: [new OpenLayers.Layer.OSM()],
		controls: [
			new OpenLayers.Control.Navigation({
				dragPanOptions: {
					enableKinetic: true
				}
			}),
			new OpenLayers.Control.Zoom({
				zoomInId: "customZoomIn",
				zoomOutId: "customZoomOut"
			})
		]
	});
	
	map.setCenter(new OpenLayers.LonLat(45,50)
		.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		0);
		
	
	
	vectorLayer = new OpenLayers.Layer.Vector('Vectors');

	
	//событие выбора маркера
	function onPopupFeatureSelect(feature) 
	{
		
		//alert(feature.marker_id);
		feature_active = feature;
		if (feature.marker_id == undefined)
		{
			return;
		}
		else if (feature.marker_id != "my_position")
		{
			num_marker = feature.marker_id.slice(7);
		}
		else
		{
			alert("Наше местоположение!");
			return;
		}
		
		document.getElementById("title_marker").innerHTML = quest_object[num_marker].title;
		document.getElementById("msg_marker").innerHTML = quest_object[num_marker].msg;
		document.getElementById("marker_desc").style.display = "block";
	}
	
	//снятие активности с маркера
	function onPopupFeatureUnselect(feature) 
	{
		close_description();
	}
	
	
	
	//Добовляем управляющий Control, отвечающий за выделения и снятие выделения с маркера
	selectControl = new OpenLayers.Control.SelectFeature(vectorLayer,
	{
		onSelect: onPopupFeatureSelect,
		onUnselect: onPopupFeatureUnselect 
	});
	
	
	map.addControl(selectControl);
	selectControl.activate();
	
	map.addLayer(vectorLayer);
	
	//Добавляем событие на карту
	map.events.register('touchend', map, function (e) { 
		if	(add_markers)
		{
			add_markers = false;
			point = map.getLonLatFromViewPortPx(e.xy);
			document.getElementById("icon_1").style.background = "#fc9a3c";
			set_img_marker = "1.png";
			document.getElementById("marker_add_form").style.display = "block";
		}
	});
}


		
window.addEventListener('DOMContentLoaded', function() {
	add_events();
	map_init(); 
	load_markers();
}, false);

