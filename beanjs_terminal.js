var vscode = require("vscode");

var terminal={
    isConnected:false,
    renderer:undefined,
    driver:undefined,
}

var beanjsCmds={
    env:"print(process.env)"
}

vscode.window.onDidCloseTerminal((tml) => {
    if(terminal.renderer&&terminal.renderer.terminal){
        terminal.renderer=undefined;
        
        if(terminal.driver&&terminal.driver.close){
            terminal.driver.close()
        }
    }
})

function terminal_request(code,done){
    if(terminal.isConnected){
        terminal.request_done=done;
        terminal.driver.write(code);
        terminal.driver.write("\n");
    }
}

module.exports = {
    isOpened: () => {
        return terminal.isConnected;
    },
    open: (dev, driver) => {

        terminal.request_data="";

        driver.on("open", () => {
            terminal.renderer = vscode.window.createTerminalRenderer("beanjs terminal");

            terminal.renderer.onDidAcceptInput((input) => {
                driver.write(input);
            });

            terminal.driver = driver;
            terminal.renderer.terminal.show(true);
            terminal.isConnected = true;

            terminal_request(beanjsCmds.env, (response) => {
                console.log({response:response})
                var env_index = response.indexOf(beanjsCmds.env);
                if (env_index >= 0) {
                    response = response.substr(env_index + beanjsCmds.env.length);
                }
                env_index = response.indexOf("=undefined");
                if (env_index > 0) {
                    response = response.substr(0, env_index);
                }
                try {
                    var json = JSON.parse(response);

                    if (typeof json == "object") {
                        terminal.env = json;
                    }
                } catch (e) {
                    terminal.env = {
                        MODULES: ""
                    };
                }
                terminal_request("\n",(response)=>{
                    if(response!=""){
                        terminal.renderer.write(response);
                        vscode.window.showInformationMessage("Connect Successed");
                    }else{
                        vscode.window.showInformationMessage("Connect Failed");
                    }
                })
            })
        })

        driver.on("close", () => {
            terminal.isConnected = false;
            terminal.driver = undefined;
            if (terminal.renderer) {
                terminal.renderer.terminal.dispose();
                terminal.renderer = undefined;
                vscode.window.showErrorMessage("Board Disconnect...")
            }
        })

        driver.on("data", (d) => {
            if (terminal.request_done) {

                if (terminal.request_tmr) {
                    clearTimeout(terminal.request_tmr);
                    terminal.request_tmr=undefined;
                }

                terminal.request_data += d.toString();

                terminal.request_tmr = setTimeout(() => {
                    var _callback = terminal.request_done;
                    terminal.request_done = undefined;
                    _callback(terminal.request_data);
                    terminal.request_data = "";
                }, 500);
            } else {
                terminal.renderer.write(d.toString());
            }
        })

        driver.open(dev);

    },
    down: (code) => {
        if (terminal.isConnected == false || terminal.driver == undefined) {
            return;
        }

        vscode.window.withProgress({
            cancellable: false,
            title: "downloading... ",
            location: vscode.ProgressLocation.Window
        }, (process, token) => {

            return new Promise((resolve) => {

                function download_prepare(done) {

                    process.report({ increment: 0, message: "reset device" });

                    terminal_request("reset()", (response) => {

                        terminal.renderer.write(response);
                       
                        done();
                    })
                }

                function download_working(done){
                    
                    process.report({ increment: 0, message: "download code" });

                    let new_code = code.substr(0, code.length);
                    let down_code = "";
                    let max_len=32;

                    let inc = new_code.length / max_len;
                    if (new_code.length % max_len != 0) {
                        inc++;
                    }
                    inc = 100 / inc;

                    terminal.driver.write("echo(0)\r\n");

                    function send_code(){
                        if (new_code.length > 0) {
                            if (new_code.length > max_len) {
                                down_code = new_code.substr(0, max_len);
                                new_code = new_code.substr(max_len);
                            } else {
                                down_code = new_code;
                                new_code = "";
                            }

                            terminal.driver.write(down_code);
                            terminal.driver.write("\r\n");

                            process.report({ increment: inc });

                            setTimeout(send_code,100);
                        }else{

                            setTimeout(()=>{
                                terminal.driver.write("echo(1)\r\n");
                                done()
                            },100);

                        }
                    }
                    
                    send_code();
                }

                download_prepare(()=>{
                    download_working(()=>{
                        resolve();
                    })
                });

                // var matches = code.match(/require\(('|"){1}\w*('|")\)/g);

                // var _modules = [];

                // if (matches != null) {

                //     matches.forEach((match) => {
                //         match = match.replace("require(", "(")
                //         match = match.replace("('", "");
                //         match = match.replace("')", "");
                //         match = match.replace("(\"", "");
                //         match = match.replace("\")", "");

                //         if (terminal.driver.env.MODULES.indexOf(match) == -1) {
                //             _modules.push(match);
                //         }
                //     })
                // }

                // if (_modules.length > 0) {
                //     //process.report({increment:0,message:"loading... modules"});
                //     vscode.window.showErrorMessage("no moudles:" + JSON.stringify(_modules)).then(resolve);
                // } else {
                
                // }
            })
        })
    },
    show: () => {
        if (terminal.isConnected) {
            terminal.renderer.terminal.show(true);
        }
    }
}


