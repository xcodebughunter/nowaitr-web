"use strict";

//=> Class definition
var jVectorMap = function () {

    //=> Init jVector
    var initjVector = function () {
        var $jVectorId = $("#vector-map");
        if($jVectorId.length === 0) {
            return;
        }

        var markerList = [{
            latLng: [21, 78],
            name: "India : 547",
            style: {
                fill: "#4b7bec"
            }
        }, {
            latLng: [-33, 151],
            name: "Australia : 1121",
            style: {
                fill: "#f368e0"
            }
        }, {
            latLng: [36.77, -119.41],
            name: "USA : 1654",
            style: {
                fill: "#fed330"
            }
        }, {
            latLng: [55.37, -3.41],
            name: "UK   : 645",
            style: {
                fill: "#6900ff"
            }
        }, {
            latLng: [25.2, 55.27],
            name: "UAE : 164",
            style: {
                fill: "#17a2b8"
            }
        }];

        $jVectorId.vectorMap({
            map: "world_mill_en",
            backgroundColor: "#fff",
            borderColor: "#6c757d",
            borderWidth: 1,
            zoomOnScroll: !1,
            color: "#6c757d",
            regionStyle: {
                initial: {
                    fill: "#fff",
                    "stroke-width": 1,
                    stroke: "#a6b7bf"
                }
            },
            markerStyle: {
                initial: {
                    r: 5,
                    fill: "#26c6da",
                    "fill-opacity": 1,
                    stroke: "#fff",
                    "stroke-width": 1,
                    "stroke-opacity": 1
                }
            },
            enableZoom: !0,
            hoverColor: "#79e580",
            markers: markerList,
            hoverOpacity: null,
            normalizeFunction: "linear",
            scaleColors: ["#fff", "#ccc"],
            selectedColor: "#c9dfaf",
            selectedRegions: [],
            showTooltip: !0,
            onRegionClick: function (e, o, l) {
                var t = 'You clicked "' + l + '" which has the code: ' + o.toUpperCase();
                alert(t)
            }
        });

    };

    return {
        //=> Init
        init: function () {
            initjVector();
        },
    };
}();

//=> Class Initialization
$(document).ready(function () {
    jVectorMap.init();
});