
var Chart = require('chart.js');
var Datastore = require('nedb'), db = new Datastore({ filename: 'src/main.db', autoload: true });
// You can issue commands right away
var dc = "";
var itemid = "";
var itemname = "";

function init(){
    
    popDataCenter();
    LoadSideBar();

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        var buttonSpan = $(this).find("span");
        if($("#sidebar").hasClass("active")){
            $(buttonSpan).text("Display menu");
        }else{
            $(buttonSpan).text("Hide menu");
        }
    });

    $("#btnSearch").on("click", function(){

        var inputVal = $("#searchVal").val();
        searchApi(inputVal);

    });
    window.setInterval(function(){
        //Refresh des status every min
        refreshDCstatus();
      }, 60000);
}


async function LoadSideBar(){

    var categoriesArray = await getCategories();
    var startingPoint = document.querySelector("p.startingPoint");

    for(var i = 0; i < categoriesArray.length; i++){
        
        var category = categoriesArray[i];
        var cateogryMinus = categoriesArray[i-1];
        var iterateHtml = $("<li id='"+category.ID+"'> <a href='#"+category.ID+"Submenu' data-toggle='collpse' id='"+category.ID+"' class='dropdown-toggle' onclick='LoadItemList(this.id)'>" + category.Name_en + " <img src='"+category.Icon+"' /> </a> <ul class='collapse list-unstyled' id='"+category.Name_en+"Submenu'> </ul></li>");
        
        //First entry after the starting point, other after the category index -1
        if(i == 0){
            $(iterateHtml).insertAfter($(startingPoint));
        }else{
            var previousEntry = document.querySelector("li[id='"+ cateogryMinus.ID +"']");
            $(iterateHtml).insertAfter($(previousEntry));
        }
    }
}

 async function LoadItemList(categoryID){
    
    
    $("li").removeClass("active");
    var clickedElement = document.querySelector("a[id='"+categoryID+"']").parentElement;
    $(clickedElement).addClass("active");
    const items = await getItemsByCategory(categoryID);
    var divToLoad = $("table tbody.items-container");
    $(divToLoad).html("");
    for(var i = 0; i < items.length; i++){
        var itemHtml = $("<tr onclick='GenerateChart(this.id, this.children[0].innerHTML)' id='"+items[i].ID+"'><td>"+items[i].Name+"</td><td><img src='"+items[i].Icon+"'/></td> </tr>");
        $(itemHtml).appendTo($(divToLoad));
    }
    //To the top
    $(window).scrollTop(0);
}

async function GenerateChart(itemID, itemName){

    var dcName = dc;
    itemid = itemID;
    itemname = itemName;
    $("canvas").remove();
    $("div.elfamosochart").append("<canvas id='chart' > </canvas>")
    var chart = document.getElementById("chart").getContext("2d");
    
    //Getting item info
    var itemInfo = await getItemPrices(itemID, dcName);
    var data = dataProcessing(itemInfo);
    var options = {
    title: {
    display: true,
    text: 'History prices of item ' + itemName + ' on Datacenter : ' + dcName + ""
    },
    scales: {
        yAxes: [{
            ticks: {
                beginAtZero: true,
            }
        }],
        },
}
    var zChart = new Chart(chart,{type:"line", data: data,options});
}



function dataProcessing(itemInfo){
    
    var data = {
        labels: [],
        datasets:[]
    };

    for(var i in itemInfo){

        var historyData = [];
        var timestampData = [];
        var isOnSale = itemInfo[i].Prices.length != 0;
        
        itemInfo[i].History.sort((a, b) => (a.Added > b.Added) ? 1 : -1)
        var finalData = isOnSale ? itemInfo[i].History.concat(itemInfo[i].Prices) : itemInfo[i].History;

        finalData.forEach(function(element){
            historyData.push(element.PricePerUnit);
            timestampData.push(new Date(element.Added * 1000).toLocaleString());
        });

        data.labels = timestampData;
        data.datasets.push({

            label:i,
            backgroundColor: random_rgba(),
            data: historyData

        });

    }
    return data;
    
}

function random_rgba() {

    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
}

async function popDataCenter(){

    var whereToInsert = $("button#sidebarCollapse");
    var datacenters = [];
    $.getJSON("http://is.xivup.com/indexdata",function(data){

        //var result = [];
        for(var i in data.DCs){
            if(i !== "logindc" && i!== "gatedc"){
                datacenters.push({dc:i, status:data.DCs[i]});
            }
        }
        for(var i = 0; i < datacenters.length; i++){
            
            var dc = datacenters[i].dc;
            var dcStatus = datacenters[i].status;

            //icon with status 
            var statusHtml = dcStatus == 1 ? "<i class='fas fa-check-circle'></i>" : "<i class='fas fa-times-circle'></i>";

            var html = $("<button id='"+dc+"' class='btn btn-dark dcs' onclick='applyDatacenter(this.id)'>"+dc+"<br>" +statusHtml+ "</button>");
            $(html).insertAfter($(whereToInsert));

        }
    }  
    
)}   


function applyDatacenter(dcName){
dc = dcName;
//Reload chart if already here
var currChart = document.getElementById("chart");
    if(currChart != undefined){
        GenerateChart(itemid, itemname);
    }
}

async function getSellableItemInformations(dcName){

    var itemsInfos = [];
    let itemIds = await getSellableItems(dcName);
    for(const id in itemIds){
        
        let itemInfo = await getItemPrices(id, dcName);
        itemsInfos.push(itemInfo);
    }
}


async function searchApi(value){
     
    if(value === ""){
        return;
    }
    $("li").removeClass("active");
    var infos = await searchThroughAPI(value);
    var divToLoad = $("table tbody.items-container");
    $(divToLoad).html("");
    for(var i = 0; i < infos.length; i++){
        var itemHtml = $("<tr onclick='GenerateChart(this.id, this.children[0].innerHTML)' id='"+infos[i].ID+"'><td>"+infos[i].Name+"</td><td><img src='"+infos[i].Icon+"'/></td> </tr>");
        $(itemHtml).appendTo($(divToLoad));
    }
    //To the top
    $(window).scrollTop(0);
}

function refreshDCstatus(){

    var dcs = [];
    //Find all dcs and match them with the button
    $.getJSON("http://is.xivup.com/indexdata", function(data){

        for(var i  in  data.DCs){
            if(i !== "logindc" && i!== "gatedc"){
                dcs.push({dc:i, status:data.DCs[i]});
            }
        }
        var unavailableStatus = "fas fa-times-circle";
        var availableStatus = "fas fa-check-circle";
        //Now we have all dcs status
        var buttonDCs = $("button.dcs");
        var sorted = $(buttonDCs).sort(SortById);

        if(dcs.length != 0){

            for(var i = 0; i < sorted.length; i++){

                if(dcs[i].dc === $(sorted)[i].id){
                    
                    var statusHtml = dcs[i].status == 1 ? availableStatus : unavailableStatus
                    var icon = $(buttonDCs)[i].children[1]; //Getting i tag
                    $(icon).removeClass(unavailableStatus);
                    $(icon).removeClass(availableStatus);
                    $(icon).addClass(statusHtml);
                }
            }
            
        }

    });

}
function SortById(a, b){
    var aName = a.id.toLowerCase();
    var bName = b.id.toLowerCase(); 
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
  }