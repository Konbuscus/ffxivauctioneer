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

    var fullres = [];
    
    applyPrivateKey()
    let res = await xiv.search({indexes:"item", filters:"ItemSearchCategory.ID=" + categoryID});
    if(res.Pagination.PageTotal > 1){

        for(var i = 0; i < res.Pagination.PageTotal; i++){

            var params = {indexes:"item", filters:"ItemSearchCategory.ID=" + categoryID, page:(i+1)};
           //For each page we get the content and return it all in once.
            var tmp = await xiv.search(params);
            console.log(tmp.Results);
            fullres.push(tmp.Results);
        }
        return fullres.flat();
    }
    return res.Results;
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
    //, max_history:"7"
    let res = await xiv.market.get(itemID, {dc:dcName});
    console.log(res);
    return res;
};

const getItemPricesByServer = async(itemID, serverName)=> {

    applyPrivateKey()
    //,max_history:"7"
    let res = await xiv.market.get(itemID, {server:serverName});
    console.log(res);
    return res;
}

const getSellableItems = async(dcName) => {
    $.get('https://xivapi.com/market/ids').done(function(data){
        console.log(data);
        return data;
    });
}


const searchThroughAPI = async(value) => {

    if(value === ""){
        return;
    }
    
    var fullRes = [];
    applyPrivateKey();
    let res =  await xiv.search(value, {indexes:"item"});
    if(res.Pagination.PageTotal > 1){

        for(var i = 0; i< res.Pagination.PageTotal;i++){

            let tmp = await xiv.search(value, {indexes:"item", page:(i+1)});
            console.log(tmp);
            fullRes.push(tmp.Results);
        }
        return fullRes.flat();
    }
    console.log(res);
    return res.Results;
}

function applyPrivateKey(){
    db.findOne({ current: 0 }, function(err, doc) {  
        xiv.globalParams.privateKey = window.apiKey;
    });
}



