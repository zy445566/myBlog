http(function(req,resp){

    console.log("req:",JSON.stringify(req),"\r\n")
    
    resp.headers.TestHeader = "test header";
    resp.body = "<h1>Welcome to zy_node server!</h1>";
    
    console.log("resp:",JSON.stringify(resp),"\r\n")
    
}).listen(4000);