const XIVAPI = require('xivapi-js');


const xiv = new XIVAPI({
    language:"en",
    privateKey:null
});

const getCategories = async() =>{
    
    applyPrivateKey()
    let res = await xiv.market.categories();
    res.sort();
    return res;

};

const getItemsByCategory = async(categoryID) =>{

    applyPrivateKey()
    let res = await xiv.search({indexes:"item", filters:"ItemSearchCategory.ID=" + categoryID})
    console.log(res.Results);
    return res.Results;
   // /search?indexes=item&filters=ItemSearchCategory.ID>=9
};

const getItemPrice = async () => {
    //find item
    let res = await xiv.search('Stuffed Khloe')
  
    //use item ID for market query
    res = await xiv.market.get(res.Results[0].ID, {servers: 'Zodiark'})
    
    console.log(res.Prices[0].PricePerUnit);
    //return lowest price
    return res.Prices[0].PricePerUnit
  };


const getItemPrices = async(itemID, dcName) => {

    applyPrivateKey()
    let res = await xiv.market.get(itemID, {dc:dcName, max_history:"15"});
    console.log(res);
    return res;
};

const getItemPricesByServer = async(itemID, serverName)=> {

    applyPrivateKey()
    let res = await xiv.market.get(itemID, {server:serverName, max_history:"15"});
    console.log(res);
    return res;
}


const getDataCenterList = async() => {

    applyPrivateKey()
    let res = await xiv.data.get("servers", "dc");
    //console.log(res);
    var result = [];
    for(var i in res){
        if(i !== "Url" && i!== "Icon"){
            result.push(i);
        }
    }
    console.log(result);
    return result;
}


function applyPrivateKey(){
    db.findOne({ current: 0 }, function(err, doc) {  
        xiv.globalParams.privateKey = window.apiKey;
    });
}



